import { create } from "zustand";
import { persist } from "zustand/middleware";

// Favoritos / wishlist (mejora F4) — solo ids, anónimo, en localStorage. La
// vista mapea cada id al catálogo. skipHydration como el carrito: el HTML del
// servidor pinta vacío y se rehidrata tras montar (en el Header) para no romper
// la hidratación de React.
type EstadoFavoritos = {
  ids: string[];
  alternar: (id: string) => void;
};

export const useFavoritos = create<EstadoFavoritos>()(
  persist(
    (set) => ({
      ids: [],
      alternar: (id) =>
        set((s) => ({
          ids: s.ids.includes(id)
            ? s.ids.filter((x) => x !== id)
            : [id, ...s.ids],
        })),
    }),
    {
      name: "cbs-favoritos",
      skipHydration: true,
      partialize: (s) => ({ ids: s.ids }),
    },
  ),
);

export function contarFavoritos(estado: EstadoFavoritos): number {
  return estado.ids.length;
}
