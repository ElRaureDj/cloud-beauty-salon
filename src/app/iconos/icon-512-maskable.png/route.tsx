import { ImageResponse } from "next/og";
import { comoDataUri, iconoNubeSvg } from "@/lib/marca-svg";

// Variante "maskable" (Android recorta en círculo): el signo ocupa solo el 64% del
// lado para quedar dentro de la zona segura.
// El dibujo no depende de la petición: se prerenderiza en el build y se sirve
// como asset estático desde el CDN (los route handlers no se cachean por
// defecto y esto se invocaría en cada instalación de la PWA).
export const dynamic = "force-static";
export const contentType = "image/png";

export function GET() {
  return new ImageResponse(
    (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={comoDataUri(iconoNubeSvg(512, 0.64))} width={512} height={512} alt="" />
    ),
    { width: 512, height: 512 },
  );
}
