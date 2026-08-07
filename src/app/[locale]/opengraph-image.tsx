import { ImageResponse } from "next/og";
import { getT, resolverLocale, LOCALES } from "@/lib/i18n";
import { comoDataUri, nubeSvg } from "@/lib/marca-svg";

// Imagen de compartir por defecto (§ bloque 4): marca + tagline sobre el
// degradado de marca. Generada por idioma; las fichas la sobrescriben con su
// packshot. 1200×630 = ratio estándar de Open Graph / Twitter card.
export const alt = "Cloud Beauty Salon";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Solo existen /es/opengraph-image y /en/opengraph-image; cualquier otro
// segmento (p.ej. /xx/opengraph-image) devuelve 404 en vez de la imagen en
// español (la exclusión del proxy dejaba pasar esas rutas).
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { t } = getT(resolverLocale(locale));
  const marca = t("marca.nombre");
  const tagline = t("hero.tagline");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "80px",
          background:
            "radial-gradient(120% 90% at 50% 12%, #34222b 0%, #171012 70%)",
          color: "#f3ece7",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={comoDataUri(nubeSvg(240))} width={240} height={150} alt="" />
        <div
          style={{
            fontSize: 30,
            letterSpacing: 14,
            textTransform: "uppercase",
            color: "#c9bab3",
            marginTop: 24,
          }}
        >
          {marca}
        </div>
        <div
          style={{
            fontSize: 74,
            fontWeight: 600,
            marginTop: 22,
            maxWidth: 920,
            lineHeight: 1.05,
          }}
        >
          {tagline}
        </div>
      </div>
    ),
    size,
  );
}
