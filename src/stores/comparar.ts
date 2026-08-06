import { create } from "zustand";

// Selección para el comparador (mejora L3). EN MEMORIA a propósito (sin
// persist): comparar es una acción puntual de la visita, no un estado que
// deba resucitar días después. Máximo 3 productos.
export const MAX_COMPARAR = 3;

type EstadoComparar = {
  ids: string[];
  alternar: (id: string) => void;
  limpiar: () => void;
};

export const useComparar = create<EstadoComparar>()((set) => ({
  ids: [],
  alternar: (id) =>
    set((s) => ({
      ids: s.ids.includes(id)
        ? s.ids.filter((x) => x !== id)
        : s.ids.length >= MAX_COMPARAR
          ? s.ids
          : [...s.ids, id],
    })),
  limpiar: () => set({ ids: [] }),
}));
