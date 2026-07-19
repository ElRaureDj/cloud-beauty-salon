import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

// §5.4 — Captura de la lista de espera (peluquería / manicura / pedicura).
// TODO(guion §9.4): destino provisional decidido por Raul el 2026-07-19:
// archivo local datos/waitlist.jsonl. Cambiar aquí a Google Sheet / Resend /
// DB cuando se decida el destino definitivo (en despliegues serverless el
// disco es efímero: no salir a producción sin resolverlo).

const INTERESES_VALIDOS = new Set(["peluqueria", "manicura", "pedicura"]);
const CUERPO_MAXIMO_BYTES = 10_000; // un registro legítimo pesa < 1 KB

// Control de abuso mínimo proporcional a v1 (una sola instancia, igual que el
// archivo local): goteo por IP en memoria.
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

// Sin saltos de línea ni caracteres de control: cada registro debe ocupar
// exactamente una línea del JSONL.
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
  // falso sin escribir nada.
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

  const carpeta = path.join(process.cwd(), "datos");
  await mkdir(carpeta, { recursive: true });
  await appendFile(
    path.join(carpeta, "waitlist.jsonl"),
    JSON.stringify({ ...registro, fecha: new Date().toISOString() }) + "\n",
    "utf8",
  );

  return Response.json({ ok: true }, { status: 201 });
}
