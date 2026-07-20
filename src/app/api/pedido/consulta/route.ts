import { sql } from "@/lib/db";
import { consultarPedido } from "@/lib/pedidos";

// Consulta de estado de un pedido (mejora H3): la clienta introduce su número de
// pedido (session_id de Stripe) y su email; solo si AMBOS coinciden se devuelve
// el estado. Respuesta uniforme 200 con `encontrado` (no 404) para no revelar si
// un id existe. Goteo por IP contra fuerza bruta; tope de cuerpo.
const CUERPO_MAXIMO_BYTES = 2_000;
const POR_HORA = 15;
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
  const { pedido, email } = cuerpo as Record<string, unknown>;
  const idLimpio = typeof pedido === "string" ? pedido.trim() : "";
  const emailLimpio =
    typeof email === "string" ? email.trim().toLowerCase() : "";
  if (idLimpio.length < 8 || idLimpio.length > 200 || !emailValido(emailLimpio)) {
    return Response.json({ ok: false }, { status: 400 });
  }

  if (!sql) {
    return Response.json({ ok: false, configurado: false }, { status: 503 });
  }

  let pub;
  try {
    pub = await consultarPedido(idLimpio, emailLimpio);
  } catch (error) {
    console.error("consulta de pedido falló", error);
    return Response.json({ ok: false }, { status: 500 });
  }

  return Response.json({ ok: true, encontrado: Boolean(pub), pedido: pub });
}
