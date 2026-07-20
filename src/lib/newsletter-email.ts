import { enviarCorreo, escaparHtml } from "@/lib/email";
import { getT, resolverLocale } from "@/lib/i18n";

// Correo de bienvenida al boletín (mejora M2): al confirmar se envía UNA sola
// vez un cupón de descuento. El código sale de NEWSLETTER_CUPON (un "promotion
// code" que Raul crea en Stripe); sin esa env NO se manda correo. Devuelve true
// solo si el correo se envió: quien llama (tras reclamarCupon) libera la
// reclamación si devuelve false, para reintentar. Nunca lanza.
export async function enviarBienvenidaNewsletter(
  email: string,
  locale: string,
): Promise<boolean> {
  const cupon = process.env.NEWSLETTER_CUPON?.trim();
  if (!cupon) return false;

  const { t } = getT(resolverLocale(locale));
  const marca = t("marca.nombre");
  try {
    const resultado = await enviarCorreo({
      to: email,
      subject: t("news.bienvenida.asunto"),
      html:
        `<h2>${escaparHtml(marca)}</h2>` +
        `<p>${escaparHtml(t("news.bienvenida.intro"))}</p>` +
        `<p style="margin:24px 0"><span style="display:inline-block;background:#221306;color:#d99a63;padding:14px 26px;border-radius:12px;font-size:22px;font-weight:700;letter-spacing:3px;font-family:monospace">${escaparHtml(cupon)}</span></p>` +
        `<p>${escaparHtml(t("news.bienvenida.instru"))}</p>`,
    });
    if (resultado !== "enviado") {
      console.warn(`newsletter: bienvenida no enviada (${resultado})`);
      return false;
    }
    return true;
  } catch (error) {
    console.warn("newsletter: bienvenida falló", error);
    return false;
  }
}
