"use client";

import { useT } from "@/lib/i18n/client";
import { DESCUENTO_BUNDLE } from "@/lib/formato";
import { useTienda } from "@/stores/carrito";
import { useExperiencia } from "@/stores/experiencia";

// Añade un kit al carrito (mejora G1): mete sus productos (los de precio>0, sin
// duplicar) y los marca como bundle → el carrito y el checkout aplican el 10%.
export type ItemKit = {
  id: string;
  nombre: string;
  precio: number;
  imagen?: string;
};

export default function AnadirKit({ items }: { items: ItemKit[] }) {
  const { tf } = useT();
  const agregar = useTienda((s) => s.agregar);
  const marcarBundle = useTienda((s) => s.marcarBundle);
  const abrirOverlay = useExperiencia((s) => s.abrirOverlay);

  const conPrecio = items.filter((i) => i.precio > 0);
  if (conPrecio.length < 2) return null;

  const total = conPrecio.reduce((s, i) => s + i.precio, 0);
  const conDescuento = total * (1 - DESCUENTO_BUNDLE);

  const anadir = () => {
    const enCarrito = new Set(useTienda.getState().carrito.map((l) => l.id));
    for (const i of conPrecio) {
      if (!enCarrito.has(i.id)) {
        agregar({ id: i.id, nombre: i.nombre, precio: i.precio, imagen: i.imagen });
      }
    }
    // Marca el kit como bundle → descuento del 10% (§5.3).
    marcarBundle(conPrecio.map((i) => i.id));
    abrirOverlay("carrito");
  };

  return (
    <button
      type="button"
      onClick={anadir}
      className="boton-primario mt-4 w-full"
    >
      {tf("kits.anadir", { total: `$${conDescuento.toFixed(2)}` })}
    </button>
  );
}
