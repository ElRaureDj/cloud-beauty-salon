import { productoPorId } from "@/lib/catalogo";
import { sql } from "@/lib/db";
import { crearResena } from "@/lib/resenas";
import { compraVerificada } from "@/lib/pedidos";
import { enviarCorreo, escaparHtml } from "@/lib/email";

// Envío de reseñas (bloque 3). Mismo endurecimiento que /api/waitlist: tope de
// cuerpo, goteo por IP, honeypot, saneado de caracteres de control. La reseña
// entra SIN aprobar (aprobada=false) y se avisa al salón para moderarla en
// /admin/resenas — nada se publica sin aprobación. Sin BD → 503.

const CUERPO_MAXIMO_BYTES = 10_000;
const RESENAS_POR_HORA = 5;
const porIp = new Map<string, number[]>();

function superaGoteo(ip: string): boolean {
  const ahora = Date.now();
  const recientes = (porIp.get(ip) ?? []).filter(
    (marca) => ahora - marca < 60 * 60 * 1000,
  );
  if (recientes.length >= RESENAS_POR_HORA) {
    porIp.set(ip, recientes);
    return true;
  }
  recientes.push(ahora);
  porIp.set(ip, recientes);
  return false;
}

// Reemplaza caracteres de control por espacios. `conservaSalto` mantiene el \n
// (código 10) para textos multilínea. Sin regex con literales de control.
function sinControl(valor: string, conservaSalto: boolean): string {
  let out = "";
  for (const ch of valor) {
    const c = ch.charCodeAt(0);
    if (c < 0x20 || c === 0x7f) {
      out += conservaSalto && c === 0x0a ? "\n" : " ";
    } else {
      out += ch;
    }
  }
  return out;
}

function limpiarLinea(valor: string, max: number): string {
  return sinControl(valor, false).trim().slice(0, max);
}
function limpiarTexto(valor: string, max: number): string {
  return sinControl(valor.replace(/\r\n/g, "\n"), true).trim().slice(0, max);
}

type Entrada = {
  producto_id: string;
  autor: string;
  rating: number;
  texto: string;
  email: string | null; // solo para "compra verificada"; no se publica
  foto_url: string | null;
};

function emailValido(valor: string): boolean {
  if (valor.length > 254) return false;
  for (const ch of valor) {
    const c = ch.charCodeAt(0);
    if (c < 0x21 || c === 0x7f) return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor);
}

// La foto debe ser una URL de Vercel Blob (la subió nuestro endpoint): evita que
// se inyecte una URL arbitraria de un tercero como si fuera de una reseña.
function fotoValida(url: unknown): string | null {
  if (typeof url !== "string" || url.length === 0 || url.length > 600) return null;
  try {
    const u = new URL(url);
    if (
      u.protocol === "https:" &&
      u.hostname.endsWith(".public.blob.vercel-storage.com")
    ) {
      return url;
    }
  } catch {
    // no es URL
  }
  return null;
}

function validar(cuerpo: unknown): Entrada | null {
  if (typeof cuerpo !== "object" || cuerpo === null) return null;
  const { producto, autor, rating, texto, email, foto } = cuerpo as Record<
    string,
    unknown
  >;
  if (typeof producto !== "string" || !productoPorId(producto)) return null;
  if (typeof autor !== "string" || limpiarLinea(autor, 60).length < 2) return null;
  if (
    typeof rating !== "number" ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    return null;
  }
  if (typeof texto !== "string" || limpiarTexto(texto, 1000).length < 3) return null;
  const emailLimpio =
    typeof email === "string" ? email.trim().toLowerCase() : "";
  return {
    producto_id: producto,
    autor: limpiarLinea(autor, 60),
    rating,
    texto: limpiarTexto(texto, 1000),
    email: emailValido(emailLimpio) ? emailLimpio : null,
    foto_url: fotoValida(foto),
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

  // Honeypot: campo "web" invisible; si viene relleno, éxito falso sin guardar.
  if (typeof cuerpo === "object" && cuerpo !== null) {
    const miel = (cuerpo as Record<string, unknown>).web;
    if (typeof miel === "string" && miel.length > 0) {
      return Response.json({ ok: true }, { status: 201 });
    }
  }

  const entrada = validar(cuerpo);
  if (!entrada) {
    return Response.json({ ok: false }, { status: 400 });
  }

  if (!sql) {
    console.warn("resenas 503: sin base de datos (DATABASE_URL)");
    return Response.json({ ok: false, configurado: false }, { status: 503 });
  }

  // Compra verificada (mejora I2): si dio email y ese email compró este producto
  // en un pedido pagado, se marca. Best-effort: un fallo no bloquea la reseña.
  let verificada = false;
  if (entrada.email) {
    verificada = await compraVerificada(entrada.email, entrada.producto_id);
  }

  let id: number | null;
  try {
    id = await crearResena({ ...entrada, verificada });
  } catch (error) {
    console.error("resenas: insert falló", error);
    return Response.json({ ok: false }, { status: 500 });
  }

  // Aviso al salón para moderar. Se AWAITA (como en waitlist): en serverless un
  // envío "fire-and-forget" tras responder puede no completarse. Best-effort:
  // un fallo del correo no invalida la reseña ya guardada.
  const destino = process.env.ORDER_TO ?? process.env.WAITLIST_TO;
  if (destino) {
    const producto = productoPorId(entrada.producto_id);
    try {
      await enviarCorreo({
        to: destino,
        subject: `Reseña pendiente · ${producto?.nombre ?? entrada.producto_id} (${entrada.rating}★)`,
        html:
          `<h2>Nueva reseña pendiente de aprobación</h2>` +
          `<p><strong>Producto:</strong> ${escaparHtml(producto?.nombre ?? entrada.producto_id)}</p>` +
          `<p><strong>Autor:</strong> ${escaparHtml(entrada.autor)} — ${entrada.rating}★</p>` +
          `<p>${escaparHtml(entrada.texto)}</p>` +
          `<p style="color:#888">Reseña #${id ?? "?"} — apruébala o elimínala en /admin/resenas.</p>`,
      });
    } catch (error) {
      console.warn("resenas: aviso admin no enviado", error);
    }
  }

  return Response.json({ ok: true }, { status: 201 });
}
