import { NextResponse, type NextRequest } from "next/server";

// Enrutado bilingüe (§9). El español es el idioma por defecto y va SIN prefijo
// ("/tienda"); el inglés vive bajo "/en/tienda". Reescribimos internamente las
// rutas sin prefijo a /es (la URL visible no cambia) para que el segmento
// [locale] siempre reciba un idioma. /es explícito redirige a la versión limpia
// para no duplicar contenido.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // El panel /admin vive FUERA de [locale] (herramienta interna, sin idioma):
  // dejarlo pasar tal cual — reescribirlo a /es/admin lo rompería (no existe).
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return NextResponse.next();
  }

  // Imágenes de metadatos generadas por Next (og, twitter, icon): viven bajo
  // [locale] y se sirven por su ruta real (/es/opengraph-image). NO redirigir
  // /es/* aquí o los scrapers sociales reciben un 307 en vez de la imagen.
  if (/\/(opengraph-image|twitter-image|icon|apple-icon)(\/|$)/.test(pathname)) {
    return NextResponse.next();
  }

  // Inglés: dejar pasar tal cual → [locale] = "en".
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    return NextResponse.next();
  }

  // /es explícito → redirigir a la ruta sin prefijo (español canónico).
  // Clonamos nextUrl para conservar la query (?categoria=…): construir la URL a
  // partir de un pathname absoluto la descartaría.
  if (pathname === "/es" || pathname.startsWith("/es/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice("/es".length) || "/";
    return NextResponse.redirect(url);
  }

  // Resto (sin prefijo) → reescribir a /es internamente. [locale] = "es". Igual
  // que arriba: clonar nextUrl preserva la query, imprescindible para los
  // filtros de /tienda (viven solo en el query string).
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? "/es" : `/es${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Ejecuta solo en rutas de página: excluye /api, assets de _next y cualquier
  // ruta con extensión (robots.txt, sitemap.xml, favicon.ico, .webp, .glb…).
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
