import type { MetadataRoute } from "next";

// PWA (mejora K4): manifest para "añadir a inicio" — la tienda como app en el
// teléfono. Sin service worker a propósito: un SW mal invalidado puede servir
// una tienda vieja (precios/stock) y el beneficio offline no compensa el
// riesgo en un e-commerce pequeño. Instalable igualmente en Android/desktop;
// en iOS manda el apple-icon (src/app/apple-icon.png).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cloud Beauty Salon",
    short_name: "Cloud Beauty",
    description:
      "Cosmética capilar profesional TRUSS, diagnóstico capilar y rutinas a tu medida.",
    start_url: "/",
    display: "standalone",
    background_color: "#171012",
    theme_color: "#171012",
    icons: [
      { src: "/iconos/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/iconos/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/iconos/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
