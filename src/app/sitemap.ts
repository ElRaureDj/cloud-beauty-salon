import type { MetadataRoute } from "next";
import { CATALOGO } from "@/lib/catalogo";
import { rutasPorIdioma } from "@/lib/i18n/rutas";

// §9.5: dominio real; en previews puede sobrescribirse con NEXT_PUBLIC_SITE_URL.
const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cloudbeautysalon.com";

// Una entrada por página canónica, con la URL en español (idioma por defecto,
// sin prefijo) y los alternates hreflang por idioma (§9 bilingüe). Google lee
// languages para servir la versión correcta a cada usuario.
function entrada(path: string, priority: number): MetadataRoute.Sitemap[number] {
  const porIdioma = rutasPorIdioma(path);
  const languages = Object.fromEntries(
    Object.entries(porIdioma).map(([l, ruta]) => [l, `${BASE}${ruta}`]),
  );
  return {
    url: `${BASE}${porIdioma.es}`,
    alternates: { languages },
    priority,
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    entrada("/", 1),
    entrada("/tienda", 0.9),
    entrada("/kits", 0.6),
    ...CATALOGO.map((p) => entrada(`/producto/${p.id}`, 0.7)),
    entrada("/nosotros", 0.4),
    entrada("/faq", 0.4),
    entrada("/contacto", 0.3),
    entrada("/legal/envios", 0.3),
    entrada("/legal/privacidad", 0.2),
    entrada("/legal/terminos", 0.2),
  ];
}
