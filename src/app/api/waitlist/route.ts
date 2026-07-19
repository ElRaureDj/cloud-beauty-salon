// §5.4 — Captura de la lista de espera (peluquería / manicura / pedicura).
// §9.4 RESUELTO (2026-07-19): en producción (Vercel serverless el disco es
// efímero/solo-lectura) cada registro se envía por email vía Resend al buzón
// del salón. Se activa con RESEND_API_KEY + WAITLIST_TO en el entorno; sin
// configurar responde 503 y la UI lo explica sin romper (igual que checkout).

const INTERESES_VALIDOS = new Set(["peluqueria", "manicura", "pedicura"]);
const CUERPO_MAXIMO_BYTES = 10_000; // un registro legítimo pesa < 1 KB

// Control de abuso mínimo: goteo por IP en memoria (por instancia).
const REGISTROS_POR_HORA = 5;
const registrosPorIp = new Map<string, number[]>();

function superaGoteo(ip: string): boolean {
  const ahora = Date.now();
  const recientes = (registrosPorIp.get(ip) ?? []).filter(
    (marca) => ahora - marca < 60 * 60 * 1000,
  );
  if (recientes.length >= REGISTROS_POR_HORA) {
    registrosPorIp.set(ip, recientes);
    return true;
  }
  recientes.push(ahora);
  registrosPorIp.set(ip, recientes);
  return false;
}

type Registro = {
  nombre: string;
  contacto: string;
  intereses: string[];
};

// Sin saltos de línea ni caracteres de control.
function limpiar(valor: string): string {
  return valor.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, 120);
}

function validar(cuerpo: unknown): Registro | null {
  if (typeof cuerpo !== "object" || cuerpo === null) return null;
  const { nombre, contacto, intereses } = cuerpo as Record<string, unknown>;
  if (typeof nombre !== "string" || limpiar(nombre).length < 2) return null;
  if (typeof contacto !== "string") return null;
  const contactoLimpio = limpiar(contacto);
  const esEmail = contactoLimpio.includes("@") && contactoLimpio.includes(".");
  const esTelefono = contactoLimpio.replace(/\D/g, "").length >= 7;
  if (!esEmail && !esTelefono) return null;
  if (
    !Array.isArray(intereses) ||
    intereses.length === 0 ||
    !intereses.every((i) => typeof i === "string" && INTERESES_VALIDOS.has(i))
  ) {
    return null;
  }
  return {
    nombre: limpiar(nombre),
    contacto: contactoLimpio,
    intereses: [...new Set(intereses as string[])],
  };
}

// Escapa el contenido del registro antes de meterlo en el HTML del correo:
// nombre y contacto son datos de usuario, nunca se inyectan crudos.
function escaparHtml(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function avisarPorEmail(registro: Registro): Promise<boolean> {
  const clave = process.env.RESEND_API_KEY;
  const destino = process.env.WAITLIST_TO;
  // Remitente: un buzón del dominio verificado en Resend. Con dominio sin
  // verificar aún, el sandbox de Resend permite onboarding@resend.dev.
  const remitente = process.env.WAITLIST_FROM ?? "onboarding@resend.dev";
  if (!clave || !destino) {
    console.warn("waitlist 503: falta RESEND_API_KEY o WAITLIST_TO");
    return false;
  }

  const asunto = `Nueva lista de espera · ${registro.intereses.join(", ")}`;
  const html =
    `<h2>Nueva persona en la lista de espera</h2>` +
    `<p><strong>Nombre:</strong> ${escaparHtml(registro.nombre)}</p>` +
    `<p><strong>Contacto:</strong> ${escaparHtml(registro.contacto)}</p>` +
    `<p><strong>Interesada en:</strong> ${escaparHtml(registro.intereses.join(", "))}</p>`;

  const respuesta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${clave}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Cloud Beauty Salon <${remitente}>`,
      to: [destino],
      reply_to: registro.contacto.includes("@") ? registro.contacto : undefined,
      subject: asunto,
      html,
    }),
  });

  if (!respuesta.ok) {
    console.warn(`waitlist: Resend respondió ${respuesta.status}`);
    return false;
  }
  return true;
}

export async function POST(request: Request) {
  const tamano = Number(request.headers.get("content-length") ?? 0);
  if (!tamano || tamano > CUERPO_MAXIMO_BYTES) {
    return Response.json({ ok: false }, { status: 413 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (superaGoteo(ip)) {
    return Response.json({ ok: false }, { status: 429 });
  }

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  // Honeypot: los humanos no ven el campo "web"; si viene relleno, éxito
  // falso sin enviar nada.
  if (typeof cuerpo === "object" && cuerpo !== null) {
    const miel = (cuerpo as Record<string, unknown>).web;
    if (typeof miel === "string" && miel.length > 0) {
      return Response.json({ ok: true }, { status: 201 });
    }
  }

  const registro = validar(cuerpo);
  if (!registro) {
    return Response.json({ ok: false }, { status: 400 });
  }

  // Sin backend configurado → 503 (no perdemos el lead en silencio: la UI
  // pide reintentar). Con Resend caído → 502.
  const clave = process.env.RESEND_API_KEY;
  const destino = process.env.WAITLIST_TO;
  if (!clave || !destino) {
    console.warn("waitlist 503: falta RESEND_API_KEY o WAITLIST_TO");
    return Response.json({ ok: false, configurado: false }, { status: 503 });
  }

  let enviado = false;
  try {
    enviado = await avisarPorEmail(registro);
  } catch (error) {
    console.warn("waitlist: error enviando el email", error);
  }
  if (!enviado) {
    return Response.json({ ok: false }, { status: 502 });
  }

  return Response.json({ ok: true }, { status: 201 });
}
