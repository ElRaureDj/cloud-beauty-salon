import { create } from "zustand";
import { persist } from "zustand/middleware";

// Esquema alineado con §5.2 (el catálogo productos.json llega en Fase 2).
export type LineaCarrito = {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen?: string;
};

export type RespuestasQuiz = Record<string, string | string[]>;

type EstadoTienda = {
  carrito: LineaCarrito[];
  respuestasQuiz: RespuestasQuiz | null; // §5.1 — se rellena en Fase 2
  // Las acciones de carrito (agregar, quitar, bundle del quiz) llegan en Fase 2.
};

// Carrito y respuestas persisten en localStorage (GUION §2). skipHydration:
// el HTML del servidor siempre pinta el estado vacío; rehidratamos tras montar
// (Header) para no romper la hidratación de React cuando haya carrito guardado.
const estadoInicial: EstadoTienda = {
  carrito: [],
  respuestasQuiz: null,
};

export const useTienda = create<EstadoTienda>()(
  persist(() => estadoInicial, { name: "cbs-tienda", skipHydration: true }),
);

export function contarArticulos(estado: EstadoTienda): number {
  return estado.carrito.reduce((total, linea) => total + linea.cantidad, 0);
}
