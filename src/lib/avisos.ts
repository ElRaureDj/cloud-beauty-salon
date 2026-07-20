import { sql } from "@/lib/db";
import { productoPorId } from "@/lib/catalogo";
import { enviarCorreo, escaparHtml } from "@/lib/email";
import { getT, resolverLocale } from "@/lib/i18n";
import { rutaLocalizada } from "@/lib/i18n/rutas";

// "Avísame cuando vuelva" (mejora F2). Una persona deja su email en un producto
// agotado; cuando el stock vuelve a subir de 0 (desde /admin) se le avisa UNA
// vez. Solo servidor. Sin BD → no-op (la UI degrada: no muestra el formulario).

// Alta (o re-alta) de un aviso. `unique(producto_id, email)` evita duplicados;
// re-suscribirse tras haber sido avisado rearma el aviso (avisado=false).
export async function crearAviso(
  producto_id: string,
  email: string,
  locale: string,
): Promise<void> {
  if (!sql) return;
  await sql`
    insert into avisos_stock (producto_id, email, locale)
    values (${producto_id}, ${email}, ${locale})
    on conflict (producto_id, email) do update set
      avisado = false, locale = excluded.locale, creada_en = now()
  `;
}

// Notifica a quien esperaba un producto que ha vuelto al stock. Best-effort:
// marca `avisado` SOLO en los correos que se enviaron (los fallidos siguen
// pendientes para un futuro reabastecimiento). Se llama desde el panel admin
// vía after() cuando el stock pasa de 0 a positivo.
export async function notificarReposicion(producto_id: string): Promise<void> {
  if (!sql) return;
  const pendientes = (await sql`
    select email, locale from avisos_stock
    where producto_id = ${producto_id} and not avisado
    limit 2000
  `) as { email: string; locale: string }[];
  if (pendientes.length === 0) return;

  const producto = productoPorId(producto_id);
  if (!producto) return;
  const origen = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  for (const p of pendientes) {
    const loc = resolverLocale(p.locale);
    const { t, tf } = getT(loc);
    const url = `${origen}${rutaLocalizada(loc, `/producto/${producto_id}`)}`;
    const html =
      `<h2>${escaparHtml(t("marca.nombre"))}</h2>` +
      `<p>${escaparHtml(tf("aviso.email.intro", { producto: producto.nombre }))}</p>` +
      `<p><a href="${escaparHtml(url)}" style="display:inline-block;background:#d99a63;color:#221306;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">${escaparHtml(t("aviso.email.boton"))}</a></p>`;
    const resultado = await enviarCorreo({
      to: p.email,
      subject: t("aviso.email.asunto"),
      html,
    });
    if (resultado === "enviado") {
      await sql`
        update avisos_stock set avisado = true
        where producto_id = ${producto_id} and email = ${p.email}
      `;
    } else {
      console.warn(`avisos: reposición no enviada a ${p.email} (${resultado})`);
    }
  }
}
