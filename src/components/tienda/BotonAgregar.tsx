"use client";

import { t } from "@/lib/i18n/es";
import type { Producto } from "@/lib/catalogo";
import { useTienda } from "@/stores/carrito";
import { useExperiencia } from "@/stores/experiencia";

// §3: los botones dicen exactamente lo que hacen. Si el producto ya está en
// el carrito, el botón pasa a "Ver el carrito" y NO agrega otra unidad.
export default function BotonAgregar({ producto }: { producto: Producto }) {
  const agregar = useTienda((s) => s.agregar);
  const enCarrito = useTienda((s) => s.carrito.some((l) => l.id === producto.id));
  const abrirOverlay = useExperiencia((s) => s.abrirOverlay);

  const alPulsar = () => {
    if (!enCarrito) {
      agregar({
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        imagen: producto.imagen,
      });
    }
    abrirOverlay("carrito");
  };

  return (
    <button type="button" onClick={alPulsar} className="boton-primario w-full sm:w-auto">
      {enCarrito ? t("producto.verCarrito") : t("producto.agregar")}
    </button>
  );
}
