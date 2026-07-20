import Stripe from "stripe";
import { defaultLocale, getT, isLocale, type Locale } from "@/lib/i18n";
import { rutaLocalizada } from "@/lib/i18n/rutas";

// Compra de una tarjeta regalo (mejora I1). Crea una sesión de Stripe con un
// único artículo "Tarjeta regalo" del importe elegido (sin envío ni impuestos);
// al pagar, el webhook genera un código canjeable y lo envía al destinatario.
const CUERPO_MAXIMO_BYTES = 3_000;
const MIN_DOLARES = 10;
const MAX_DOLARES = 500;
const POR_HORA = 5;
const porIp = new Map<string, number[]>();

function superaGoteo(ip: string): boolean {
  const ahora = Date.now();
  const recientes = (porIp.get(ip) ?? []).filter((m) => ahora - m < 3_600_000);
  if (recientes.length >= POR_HORA) {
    porIp.set(ip, recientes);
    return true;
  }
  recientes.push(ahora);
  porIp.set(ip, recientes);
  return false;
}

function emailValido(valor: string): boolean {
  if (valor.length > 254) return false;
  for (const ch of valor) {
    const c = ch.charCodeAt(0);
    if (c < 0x21 || c === 0x7f) return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor);
}

// Quita caracteres de control de un texto (por código, sin literales de control).
function sinControl(valor: string): string {
  let out = "";
  for (const ch of valor) {
    const c = ch.charCodeAt(0);
    out += c < 0x20 || c === 0x7f ? " " : ch;
  }
  return out;
}

export async function POST(request: Request) {
  const clave = process.env.STRIPE_SECRET_KEY;
  if (!clave) {
    return Response.json({ ok: false, configurado: false }, { status: 503 });
  }
  const tamano = Number(request.headers.get("content-length") ?? 0);
  if (!tamano || tamano > CUERPO_MAXIMO_BYTES) {
    return Response.json({ ok: false }, { status: 413 });
  }
  const ip =
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local";
  if (superaGoteo(ip)) return Response.json({ ok: false }, { status: 429 });

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  const { importe, destinatario, comprador, mensaje, locale } =
    (cuerpo as Record<string, unknown>) ?? {};

  const dolares = typeof importe === "number" ? Math.round(importe) : NaN;
  if (!Number.isFinite(dolares) || dolares < MIN_DOLARES || dolares > MAX_DOLARES) {
    return Response.json({ ok: false }, { status: 400 });
  }
  const destino =
    typeof destinatario === "string" ? destinatario.trim().toLowerCase() : "";
  const compra = typeof comprador === "string" ? comprador.trim().toLowerCase() : "";
  if (!emailValido(destino) || !emailValido(compra)) {
    return Response.json({ ok: false }, { status: 400 });
  }
  const nota =
    typeof mensaje === "string" ? sinControl(mensaje).trim().slice(0, 200) : "";
  const loc: Locale = isLocale(locale) ? locale : defaultLocale;
  const { t } = getT(loc);

  const origen = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const stripe = new Stripe(clave);

  const sesion = await stripe.checkout.sessions.create({
    mode: "payment",
    locale: loc,
    customer_email: compra,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: dolares * 100,
          product_data: { name: t("regalo.producto") },
        },
        quantity: 1,
      },
    ],
    // Los datos del regalo viajan en la metadata; el webhook genera el código.
    metadata: {
      tipo: "regalo",
      destinatario: destino,
      comprador: compra,
      mensaje: nota,
      importe_centavos: String(dolares * 100),
      locale: loc,
    },
    success_url: `${origen}${rutaLocalizada(loc, "/compra/exito")}?session_id={CHECKOUT_SESSION_ID}&regalo=1`,
    cancel_url: `${origen}${rutaLocalizada(loc, "/regalo")}`,
  });

  return Response.json({ ok: true, url: sesion.url }, { status: 200 });
}
