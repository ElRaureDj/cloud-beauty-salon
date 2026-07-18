// Claves i18n desde el día 1 (GUION §7). Español primero; en Fase 2 esto se
// conecta a next-intl (o similar) sin refactor: las claves son el contrato.
export const es = {
  "hero.tagline": "Tu pelo, versión profesional.", // TODO(guion): validar tagline (§4 Cap. 0)
  "hero.desliza": "Desliza",
  "copy.pelo.intro": "Todo empieza por tu pelo.",
  "cap2.productos": "Productos",
  "cap2.peluqueria": "Peluquería",
  "cap2.muyPronto": "Muy pronto",
  "cap2.verTienda": "Ver toda la tienda",
  "cap2.hacerDiagnostico": "Hacer mi diagnóstico",
  "header.tienda": "Tienda",
  "header.carrito": "Abrir el carrito",
  "tienda.titulo": "Tienda",
  "tienda.volver": "← Volver a la experiencia",
  "copy.marca.trust":
    "Distribuidor autorizado Trust · Cosmética profesional brasileña", // §4 Cap. 3 — se reutiliza en Fase 3
  "carrito.titulo": "Tu carrito",
  "carrito.vacio": "Tu carrito está listo para su primer producto.",
  "carrito.irTienda": "Ir a la tienda",
  "quiz.titulo": "Diagnóstico capilar",
  "comun.cerrar": "Cerrar",
  "cargando.experiencia": "Cargando la experiencia",
} as const;

export type ClaveI18n = keyof typeof es;

export function t(clave: ClaveI18n): string {
  return es[clave];
}
