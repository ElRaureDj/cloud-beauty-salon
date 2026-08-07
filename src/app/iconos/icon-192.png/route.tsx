import { ImageResponse } from "next/og";
import { comoDataUri, iconoNubeSvg } from "@/lib/marca-svg";

// Icono PWA 192 generado en servidor (antes eran PNG estáticos del monograma
// "CB"; ahora es la nube de marca). Ruta estable: /iconos/icon-192.png.
// El dibujo no depende de la petición: se prerenderiza en el build y se sirve
// como asset estático desde el CDN (los route handlers no se cachean por
// defecto y esto se invocaría en cada instalación de la PWA).
export const dynamic = "force-static";
export const contentType = "image/png";

export function GET() {
  return new ImageResponse(
    (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={comoDataUri(iconoNubeSvg(192))} width={192} height={192} alt="" />
    ),
    { width: 192, height: 192 },
  );
}
