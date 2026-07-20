import { create } from "zustand";
import { persist } from "zustand/middleware";

// Productos vistos recientemente (mejora H2) — solo ids, en localStorage. Se
// registra al abrir una ficha; la vista mapea al catálogo. skipHydration como
// el resto de stores: el HTML del servidor pinta vacío y se rehidrata tras
// montar (Header).
const MAXIMO = 12;

type EstadoVistos = {
  ids: string[];
  registrar: (id: string) => void;
};

export const useVistos = create<EstadoVistos>()(
  persist(
    (set) => ({
      ids: [],
      registrar: (id) =>
        set((s) => ({
          ids: [id, ...s.ids.filter((x) => x !== id)].slice(0, MAXIMO),
        })),
    }),
    {
      name: "cbs-vistos",
      skipHydration: true,
      partialize: (s) => ({ ids: s.ids }),
    },
  ),
);
