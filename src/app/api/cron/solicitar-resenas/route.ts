import { productoPorId } from "@/lib/catalogo";
import { enviarCorreo, escaparHtml } from "@/lib/email";
import { getT, resolverLocale } from "@/lib/i18n";
import { rutaLocalizada } from "@/lib/i18n/rutas";
import {
  pedidosParaSolicitarResena,
  reclamarSolicitudResena,
} from "@/lib/pedidos";

// Cron diario (mejora L2): pide reseña de los pedidos ENVIADOS hace ≥7 días.
// Un solo correo por pedido (claim-first), en el idioma de la compra, con
// enlaces a las fichas de lo comprado. Protegido: Vercel Cron manda
// `Authorization: Bearer ${CRON_SECRET}` si la env existe; sin ella, 503
// (nunca se ejecuta sin autenticación).
const DIAS_TRAS_ENVIO = 7;
const LOTE = 20;

export async function GET(request: Request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto) {
    return Response.json({ ok: false, configurado: false }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secreto}`) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const pendientes = await pedidosParaSolicitarResena(DIAS_TRAS_ENVIO, LOTE);
  const origen = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cloudbeautysalon.com";
  let enviados = 0;

  for (const pedido of pendientes) {
    // Reclamar ANTES de enviar: máx. 1 correo por pedido aunque el cron se
    // solape o reintente.
    const primera = await reclamarSolicitudResena(pedido.session_id);
    if (!primera) continue;

    const loc = resolverLocale(pedido.locale);
    const { t } = getT(loc);
    // Solo líneas con id de catálogo (los regalos u otros no llevan ficha).
    const productos = (pedido.lineas ?? [])
      .map((l) => (l.id ? productoPorId(l.id) : undefined))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
    if (productos.length === 0) continue;

    const enlaces = productos
      .map(
        (p) =>
          `<li style="margin:6px 0"><a href="${escaparHtml(`${origen}${rutaLocalizada(loc, `/producto/${p.id}`)}`)}" style="color:#d99a63">${escaparHtml(p.nombre)}</a></li>`,
      )
      .join("");
    const html =
      `<h2>${escaparHtml(t("marca.nombre"))}</h2>` +
      `<p>${escaparHtml(t("solicitud.intro"))}</p>` +
      `<ul style="padding-left:18px">${enlaces}</ul>` +
      `<p>${escaparHtml(t("solicitud.verificada"))}</p>` +
      `<p style="color:#888">${escaparHtml(t("solicitud.gracias"))}</p>`;

    const resultado = await enviarCorreo({
      to: pedido.email,
      subject: t("solicitud.asunto"),
      html,
    });
    if (resultado === "enviado") enviados += 1;
    else console.warn(`cron reseñas: no enviado a ${pedido.email} (${resultado})`);
  }

  return Response.json({ ok: true, candidatos: pendientes.length, enviados });
}
