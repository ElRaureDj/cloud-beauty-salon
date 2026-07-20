import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LineaCarrito = {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen?: string;
};

// Respuestas del quiz capilar (§5.1) — anónimas, persistidas en localStorage.
export type RespuestasQuiz = {
  patron?: string; // "1A".."4C"
  grosor?: "fino" | "medio" | "grueso";
  porosidad?: "baja" | "media" | "alta";
  cuero?: "graso" | "normal" | "seco" | "sensible" | "caspa";
  quimica?: string[]; // tinte, decoloracion, alisado, permanente, ninguna
  colorOriginal?: string;
  colorActual?: string;
  largo?: "corto" | "medio" | "largo" | "extra";
  calor?: "nunca" | "aveces" | "diario";
  lavado?: "diario" | "interdiario" | "semanal";
  objetivos?: string[]; // máx. 2 (§5.1)
};

// Mismo tope que valida /api/checkout: los límites cliente/servidor van a la par.
export const CANTIDAD_MAXIMA = 20;

type EstadoTienda = {
  carrito: LineaCarrito[];
  respuestasQuiz: RespuestasQuiz | null;
  // Ids del último bundle recomendado agregado desde el quiz (§5.3: la línea
  // de bundle lleva descuento si viene del quiz).
  bundleIds: string[];
  agregar: (linea: Omit<LineaCarrito, "cantidad">, cantidad?: number) => void;
  quitar: (id: string) => void;
  setCantidad: (id: string, cantidad: number) => void;
  vaciar: () => void;
  setRespuestasQuiz: (respuestas: RespuestasQuiz) => void;
  marcarBundle: (ids: string[]) => void;
};

const estadoInicial = {
  carrito: [] as LineaCarrito[],
  respuestasQuiz: null as RespuestasQuiz | null,
  bundleIds: [] as string[],
};

// Carrito y respuestas persisten en localStorage (GUION §2). skipHydration:
// el HTML del servidor siempre pinta el estado vacío; rehidratamos tras montar
// (Header) para no romper la hidratación de React cuando haya carrito guardado.
export const useTienda = create<EstadoTienda>()(
  persist(
    (set) => ({
      ...estadoInicial,
      agregar: (linea, cantidad = 1) =>
        set((s) => {
          const existente = s.carrito.find((l) => l.id === linea.id);
          if (existente) {
            return {
              carrito: s.carrito.map((l) =>
                l.id === linea.id
                  ? { ...l, cantidad: Math.min(CANTIDAD_MAXIMA, l.cantidad + cantidad) }
                  : l,
              ),
            };
          }
          return {
            carrito: [
              ...s.carrito,
              { ...linea, cantidad: Math.min(CANTIDAD_MAXIMA, cantidad) },
            ],
          };
        }),
      // No tocamos bundleIds: si falta una línea del bundle, bundleActivo()
      // debe fallar — mismo comportamiento que bajar la cantidad a 0.
      quitar: (id) =>
        set((s) => ({
          carrito: s.carrito.filter((l) => l.id !== id),
        })),
      setCantidad: (id, cantidad) =>
        set((s) => ({
          carrito:
            cantidad <= 0
              ? s.carrito.filter((l) => l.id !== id)
              : s.carrito.map((l) =>
                  l.id === id
                    ? { ...l, cantidad: Math.min(CANTIDAD_MAXIMA, cantidad) }
                    : l,
                ),
        })),
      vaciar: () => set({ carrito: [], bundleIds: [] }),
      setRespuestasQuiz: (respuestas) => set({ respuestasQuiz: respuestas }),
      // Fusiona el nuevo bundle (quiz o kit) con el que ya hubiera, en vez de
      // pisarlo: así añadir un kit no borra en silencio el descuento del quiz o
      // de otro kit. Se podan los ids que ya no están en el carrito para no
      // arrastrar "descuentos fantasma".
      marcarBundle: (ids) =>
        set((s) => {
          const enCarrito = new Set(s.carrito.map((l) => l.id));
          const vivos = s.bundleIds.filter((id) => enCarrito.has(id));
          return { bundleIds: [...new Set([...vivos, ...ids])] };
        }),
    }),
    {
      name: "cbs-tienda",
      skipHydration: true,
      partialize: (s) => ({
        carrito: s.carrito,
        respuestasQuiz: s.respuestasQuiz,
        bundleIds: s.bundleIds,
      }),
    },
  ),
);

export function contarArticulos(estado: EstadoTienda): number {
  return estado.carrito.reduce((total, linea) => total + linea.cantidad, 0);
}

export function subtotalCarrito(estado: EstadoTienda): number {
  return estado.carrito.reduce((total, l) => total + l.precio * l.cantidad, 0);
}

// True si al menos un producto del bundle sigue en el carrito. Cart-aware
// (antes era todo-o-nada): coincide con el checkout, que descuenta los ids del
// bundle presentes en el carrito — quitar uno resta solo su parte, no todo.
export function bundleActivo(estado: EstadoTienda): boolean {
  return estado.bundleIds.some((id) =>
    estado.carrito.some((l) => l.id === id),
  );
}

// §5.3: el descuento pertenece al bundle — 1 unidad por producto del bundle
// PRESENTE en el carrito, nunca al resto ni a unidades extra.
export function valorBundle(estado: EstadoTienda): number {
  return estado.bundleIds.reduce((total, id) => {
    const linea = estado.carrito.find((l) => l.id === id);
    return total + (linea?.precio ?? 0);
  }, 0);
}
