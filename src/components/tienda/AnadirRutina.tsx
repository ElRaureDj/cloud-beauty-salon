"use client";

import { useT } from "@/lib/i18n/client";
import { useTienda } from "@/stores/carrito";
import { useExperiencia } from "@/stores/experiencia";

// "Completa tu rutina" (mejora F1): añade de una vez el producto + sus
// complementarios (cronograma capilar) al carrito. Solo cuenta los que ya tienen
// precio (los "por confirmar" no se pueden cobrar); si quedan menos de 2, no hay
// rutina que ofrecer y no se muestra el botón.
export type ItemRutina = {
  id: string;
  nombre: string;
  precio: number;
  imagen?: string;
};

export default function AnadirRutina({ items }: { items: ItemRutina[] }) {
  const { tf } = useT();
  const agregar = useTienda((s) => s.agregar);
  const abrirOverlay = useExperiencia((s) => s.abrirOverlay);

  const conPrecio = items.filter((i) => i.precio > 0);
  if (conPrecio.length < 2) return null;

  const total = conPrecio.reduce((s, i) => s + i.precio, 0);

  const anadir = () => {
    // No duplicar: solo agrega los que aún no están en el carrito.
    const enCarrito = new Set(useTienda.getState().carrito.map((l) => l.id));
    for (const i of conPrecio) {
      if (!enCarrito.has(i.id)) {
        agregar({ id: i.id, nombre: i.nombre, precio: i.precio, imagen: i.imagen });
      }
    }
    abrirOverlay("carrito");
  };

  return (
    <button
      type="button"
      onClick={anadir}
      className="boton-primario mt-5 w-full sm:w-auto"
    >
      {tf("producto.rutina.anadir", {
        n: conPrecio.length,
        total: `$${total.toFixed(2)}`,
      })}
    </button>
  );
}
