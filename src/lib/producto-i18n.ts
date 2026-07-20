import type { Producto } from "@/lib/catalogo";
import type { Locale } from "@/lib/i18n";
import { DESC_EN, MODO_EN } from "@/lib/data/traducciones-en";

// Texto del catálogo (descripción / modo de uso) en el idioma pedido. El
// catálogo base está en español; en inglés se sustituye por la traducción si
// existe, y si falta alguna cae al español (nunca se queda vacío).
export function descripcionProducto(p: Producto, loc: Locale): string {
  if (loc === "en") return DESC_EN[p.descripcion] ?? p.descripcion;
  return p.descripcion;
}

export function modoDeUsoProducto(p: Producto, loc: Locale): string {
  if (loc === "en") return MODO_EN[p.modoDeUso] ?? p.modoDeUso;
  return p.modoDeUso;
}
