import { after } from "next/server";
import { sql } from "@/lib/db";
import { enviarCorreo, escaparHtml } from "@/lib/email";
import { defaultLocale, getT, isLocale, type Locale } from "@/lib/i18n";
import { rutaLocalizada } from "@/lib/i18n/rutas";
import { altaNewsletter, marcarEnvio } from "@/lib/newsletter";

// Alta al boletín (bloque 4), con DOBLE OPT-IN: guardamos la fila sin confirmar
// y enviamos un correo de confirmación a la interesada; nadie queda suscrito
// sin pulsar su enlace. Mismo endurecimiento que waitlist/reseñas: tope de
// cuerpo, goteo por IP, honeypot y saneado. Sin BD → 503 (la UI pide reintentar).
//
// Anti-abuso del correo (el alta manda un email a una dirección que escribe un
// tercero): además del goteo por IP, un throttle POR EMAIL persistido en BD
// (ultimo_envio) — re-altas del mismo email no re-mandan el correo hasta pasado
// el intervalo. Y la respuesta es SIEMPRE 201 con el envío fuera del camino de
// respuesta (after()): el timing no delata si un email está o no confirmado.

const CUERPO_MAXIMO_BYTES = 5_000;
const ALTAS_POR_HORA = 5;
const REENVIO_MINUTOS = 15;
const porIp = new Map<string, number[]>();

function superaGoteo(ip: string): boolean {
  const ahora = Date.now();
  const recientes = (porIp.get(ip) ?? []).filter(
    (marca) => ahora - marca < 60 * 60 * 1000,
  );
  if (recientes.length >= ALTAS_POR_HORA) {
    porIp.set(ip, recientes);
    return true;
  }
  recientes.push(ahora);
  porIp.set(ip, recientes);
  return false;
}

// Validación pragmática: algo@algo.algo, sin espacios ni caracteres de
// control (comprobados por código de carácter — sin literales en el fuente).
function emailValido(valor: string): boolean {
  if (valor.length > 254) return false;
  for (const ch of valor) {
    const c = ch.charCodeAt(0);
    if (c < 0x21 || c === 0x7f) return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor);
}

// El correo de confirmación NO lleva enlace de baja: antes de confirmar,
// "ignora este correo" ya es la baja, y un enlace de baja aquí permitiría a los
// escáneres de correo (que detonan todos los enlaces) borrar el alta antes del
// clic humano. El enlace de baja va en los envíos a suscriptoras confirmadas.
function correoDeConfirmacion(locale: Locale, urlConfirmar: string) {
  const { t } = getT(locale);
  const marca = t("marca.nombre");
  return {
    asunto: t("news.email.asunto"),
    html:
      `<h2>${escaparHtml(marca)}</h2>` +
      `<p>${escaparHtml(t("news.email.intro"))}</p>` +
      `<p><a href="${escaparHtml(urlConfirmar)}" style="display:inline-block;background:#d99a63;color:#221306;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">${escaparHtml(t("news.email.boton"))}</a></p>` +
      `<p style="color:#888">${escaparHtml(t("news.email.ignorar"))}</p>`,
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
  if (typeof cuerpo !== "object" || cuerpo === null) {
    return Response.json({ ok: false }, { status: 400 });
  }
  const { email, locale, web } = cuerpo as Record<string, unknown>;

  // Honeypot: éxito falso sin guardar nada.
  if (typeof web === "string" && web.length > 0) {
    return Response.json({ ok: true }, { status: 201 });
  }

  const emailLimpio =
    typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!emailValido(emailLimpio)) {
    return Response.json({ ok: false }, { status: 400 });
  }
  const loc: Locale = isLocale(locale) ? locale : defaultLocale;

  if (!sql) {
    console.warn("newsletter 503: sin base de datos (DATABASE_URL)");
    return Response.json({ ok: false, configurado: false }, { status: 503 });
  }

  let alta;
  try {
    alta = await altaNewsletter(emailLimpio, loc);
  } catch (error) {
    console.error("newsletter: alta falló", error);
    return Response.json({ ok: false }, { status: 500 });
  }
  if (!alta) return Response.json({ ok: false }, { status: 500 });

  // Respuesta uniforme (201) en TODAS las ramas de éxito, y el envío fuera del
  // camino de respuesta: ni el código ni el timing delatan si un email ya está
  // confirmado o pendiente (anti-enumeración).
  const reciente =
    alta.ultimoEnvio !== null &&
    Date.now() - alta.ultimoEnvio.getTime() < REENVIO_MINUTOS * 60 * 1000;

  if (!alta.yaConfirmado && !reciente) {
    // Sellar ANTES de responder: dos altas simultáneas no doblan el correo.
    try {
      await marcarEnvio(emailLimpio);
    } catch (error) {
      console.error("newsletter: marcarEnvio falló", error);
      return Response.json({ ok: false }, { status: 500 });
    }
    const origen = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const urlConfirmar = `${origen}${rutaLocalizada(loc, "/newsletter/confirmar")}?token=${alta.token}`;
    const { asunto, html } = correoDeConfirmacion(loc, urlConfirmar);
    after(async () => {
      const resultado = await enviarCorreo({
        to: emailLimpio,
        subject: asunto,
        html,
      });
      if (resultado !== "enviado") {
        // La fila queda pendiente; pasado el throttle, re-enviar el formulario
        // vuelve a mandar el correo.
        console.warn(`newsletter: confirmación no enviada (${resultado})`);
      }
    });
  }

  return Response.json({ ok: true }, { status: 201 });
}
