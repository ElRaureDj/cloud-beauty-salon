import type { Categoria, Etapa } from "@/lib/catalogo";
import { t, type ClaveI18n } from "@/lib/i18n/es";

// Helpers de presentación SIN importar el catálogo JSON: este módulo puede
// viajar en el bundle cliente compartido (Header/CarritoDrawer) sin arrastrar
// los productos.

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

export function nombreEtapa(etapa: Etapa): string {
  return t(CLAVE_ETAPA[etapa]);
}

export function nombreCategoria(categoria: Categoria): string {
  return t(CLAVE_CATEGORIA[categoria]);
}

export function textoPrecio(precio: number): string {
  return precio > 0 ? `$${precio.toFixed(2)}` : t("precio.porConfirmar");
}

// §5.3: la línea de bundle lleva descuento si viene del quiz.
// TODO(guion): validar el % de descuento del bundle (decisión de negocio).
export const DESCUENTO_BUNDLE = 0.1;
