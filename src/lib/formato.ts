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

// Envío (§9.3). Fuente ÚNICA compartida por el checkout (servidor), la barra de
// "envío gratis" del carrito (cliente) y /legal/envios: deben ir siempre a la
// par. Céntimos para no arrastrar decimales.
export const ENVIO_CENTAVOS = 800;
export const ENVIO_GRATIS_DESDE_CENTAVOS = 7500;

// Por debajo de este umbral se muestra "Últimas N" para crear urgencia honesta.
export const UMBRAL_STOCK_BAJO = 5;

// Presentación del estado de stock (bloque 3). `unidades` null = desconocido
// (sin BD o producto sin fila) → no se muestra nada ni se bloquea la venta.
export type EstadoStock = { agotado: boolean; texto: string | null };

export function etiquetaStock(
  unidades: number | null,
  { t, tf }: Traductor,
): EstadoStock {
  if (unidades === null) return { agotado: false, texto: null };
  if (unidades <= 0) return { agotado: true, texto: t("producto.agotado") };
  if (unidades <= UMBRAL_STOCK_BAJO)
    return { agotado: false, texto: tf("producto.ultimasUnidades", { n: unidades }) };
  return { agotado: false, texto: null };
}
