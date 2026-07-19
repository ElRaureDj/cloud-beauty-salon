import { defaultLocale, LOCALES, type Locale } from ".";

// Href de una ruta interna para el idioma dado (§9 bilingüe). El español (por
// defecto) va SIN prefijo ("/tienda"); el inglés bajo "/en/tienda". `path`
// empieza siempre por "/". Se usa en servidor (con el locale de params) y en
// cliente (hook useRuta en ./client). typedRoutes está desactivado porque este
// patrón no encaja con el tipado de href de Next (ver next.config.ts).
export function rutaLocalizada(locale: Locale, path: string): string {
  if (locale === defaultLocale) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

// Mapa idioma → ruta para una subruta canónica (empieza por "/"). Base de los
// alternates hreflang, tanto en el sitemap como en el <head> de cada página.
export function rutasPorIdioma(path: string): Record<Locale, string> {
  return Object.fromEntries(
    LOCALES.map((l) => [l, rutaLocalizada(l, path)]),
  ) as Record<Locale, string>;
}

// Bloque `alternates` de Metadata para una página (§9 SEO): canónica en el
// idioma actual + un hreflang por idioma + x-default al español. Rutas
// relativas; Next las resuelve contra metadataBase.
export function alternatesDeRuta(loc: Locale, path: string): {
  canonical: string;
  languages: Record<string, string>;
} {
  const porIdioma = rutasPorIdioma(path);
  return {
    canonical: porIdioma[loc],
    languages: { ...porIdioma, "x-default": porIdioma[defaultLocale] },
  };
}

// Ruta equivalente en el OTRO idioma, conservando la subruta actual. Para el
// selector de idioma del header: de "/tienda" (es) a "/en/tienda" (en) y
// viceversa. `pathnameActual` es el path visible (usePathname), sin query.
export function rutaEnOtroIdioma(
  destino: Locale,
  pathnameActual: string,
): string {
  // Quita el prefijo /en si lo hubiera → subruta canónica sin idioma.
  const sinPrefijo =
    pathnameActual === "/en"
      ? "/"
      : pathnameActual.startsWith("/en/")
        ? pathnameActual.slice("/en".length)
        : pathnameActual;
  return rutaLocalizada(destino, sinPrefijo);
}
