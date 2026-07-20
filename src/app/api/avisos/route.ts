import { sql } from "@/lib/db";
import { productoPorId } from "@/lib/catalogo";
import { crearAviso } from "@/lib/avisos";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n";

// "Avísame cuando vuelva" (mejora F2): guarda un email para un producto agotado.
// Mismo endurecimiento que waitlist/newsletter: tope de cuerpo, goteo por IP,
// honeypot y saneado. Sin BD → 503 (la UI lo trata como error y pide reintentar).

const CUERPO_MAXIMO_BYTES = 3_000;
const POR_HORA = 5;
const porIp = new Map<string, number[]>();

function superaGoteo(ip: string): boolean {
  const ahora = Date.now();
  const recientes = (porIp.get(ip) ?? []).filter(
    (marca) => ahora - marca < 60 * 60 * 1000,
  );
  if (recientes.length >= POR_HORA) {
    porIp.set(ip, recientes);
    return true;
  }
  recientes.push(ahora);
  porIp.set(ip, recientes);
  return false;
}

// algo@algo.algo, sin espacios ni caracteres de control (por código de carácter,
// sin literales de control en el fuente).
function emailValido(valor: string): boolean {
  if (valor.length > 254) return false;
  for (const ch of valor) {
    const c = ch.charCodeAt(0);
    if (c < 0x21 || c === 0x7f) return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor);
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
  const { producto, email, locale, web } = cuerpo as Record<string, unknown>;

  // Honeypot: éxito falso sin guardar nada.
  if (typeof web === "string" && web.length > 0) {
    return Response.json({ ok: true }, { status: 201 });
  }

  // El producto debe existir en el catálogo real.
  if (typeof producto !== "string" || !productoPorId(producto)) {
    return Response.json({ ok: false }, { status: 400 });
  }
  const emailLimpio =
    typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!emailValido(emailLimpio)) {
    return Response.json({ ok: false }, { status: 400 });
  }
  const loc: Locale = isLocale(locale) ? locale : defaultLocale;

  if (!sql) {
    return Response.json({ ok: false, configurado: false }, { status: 503 });
  }

  try {
    await crearAviso(producto, emailLimpio, loc);
  } catch (error) {
    console.error("avisos: alta falló", error);
    return Response.json({ ok: false }, { status: 500 });
  }

  return Response.json({ ok: true }, { status: 201 });
}
