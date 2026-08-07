import { ImageResponse } from "next/og";
import { comoDataUri, iconoNubeSvg } from "@/lib/marca-svg";

// Icono de iOS ("añadir a inicio"). 180×180 es el tamaño que pide Apple.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
       
      <img src={comoDataUri(iconoNubeSvg(180))} width={180} height={180} alt="" />
    ),
    size,
  );
}
