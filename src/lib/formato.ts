import type { Categoria, Etapa } from "@/lib/catalogo";
import type { ClaveI18n, Traductor } from "@/lib/i18n";

// Helpers de presentación SIN importar el catálogo JSON: este módulo puede
// viajar en el bundle cliente compartido (Header/CarritoDrawer) sin arrastrar
// los productos. Reciben el traductor (§9 bilingüe) — no importan un idioma
// fijo — para que el mismo helper sirva en /es y en /en.

export const ETAPAS: Etapa[] = ["hidratacion", "nutricion", "reconstruccion"];

export const CATEGORIAS: Categoria[] = [
  "champu",
  "acondicionador",
  "mascara",
  "leave-in",
  "booster",
];

const CLAVE_ETAPA: Record<Etapa, ClaveI18n> = {
  hidratacion: "etapa.hidratacion",
  nutricion: "etapa.nutricion",
  reconstruccion: "etapa.reconstruccion",
};

const CLAVE_CATEGORIA: Record<Categoria, ClaveI18n> = {
  champu: "categoria.champu",
  acondicionador: "categoria.acondicionador",
  mascara: "categoria.mascara",
  "leave-in": "categoria.leave-in",
  booster: "categoria.booster",
};

export function nombreEtapa(etapa: Etapa, { t }: Traductor): string {
  return t(CLAVE_ETAPA[etapa]);
}

export function nombreCategoria(categoria: Categoria, { t }: Traductor): string {
  return t(CLAVE_CATEGORIA[categoria]);
}

export function textoPrecio(precio: number, { t }: Traductor): string {
  return precio > 0 ? `$${precio.toFixed(2)}` : t("precio.porConfirmar");
}

// §5.3: la línea de bundle lleva descuento si viene del quiz.
// TODO(guion): validar el % de descuento del bundle (decisión de negocio).
export const DESCUENTO_BUNDLE = 0.1;
