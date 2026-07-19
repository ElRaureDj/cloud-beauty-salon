import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // typedRoutes desactivado a propósito (§9 bilingüe): con el español sin
  // prefijo ("/tienda") y el inglés bajo "/en", los href se generan con un
  // helper locale-aware (src/lib/i18n/rutas.ts) y no encajan con el tipado de
  // rutas de Next, que exigiría el segmento [locale] en cada enlace.
};

export default nextConfig;
