import type { MetadataRoute } from "next";

// PWA (mejora K4): manifest para "añadir a inicio" — la tienda como app en el
// teléfono. Sin service worker a propósito: un SW mal invalidado puede servir
// una tienda vieja (precios/stock) y el beneficio offline no compensa el
// riesgo en un e-commerce pequeño. Instalable igualmente en Android/desktop;
// en iOS manda el apple-icon (src/app/apple-icon.tsx).
//
// Los iconos ya no son PNG estáticos: se generan en servidor desde el mismo
// isotipo que el resto de la marca (src/lib/marca-svg.ts), así el logo vive en
// un único sitio. Las rutas /iconos/*.png son route handlers con next/og.
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
