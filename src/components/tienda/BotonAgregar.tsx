"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";
import type { Producto } from "@/lib/catalogo";
import { CANTIDAD_MAXIMA, useTienda } from "@/stores/carrito";
import { useExperiencia } from "@/stores/experiencia";

// §3: los botones dicen exactamente lo que hacen. En la ficha se puede elegir la
// cantidad antes de añadir (mejora I3). Si el producto ya está en el carrito, el
// botón pasa a "Ver el carrito" y NO agrega otra unidad.
export default function BotonAgregar({
  producto,
  agotado = false,
}: {
  producto: Producto;
  agotado?: boolean;
}) {
  const { t } = useT();
  const agregar = useTienda((s) => s.agregar);
  const enCarrito = useTienda((s) => s.carrito.some((l) => l.id === producto.id));
  const abrirOverlay = useExperiencia((s) => s.abrirOverlay);
  const [cantidad, setCantidad] = useState(1);

  if (agotado && !enCarrito) {
    return (
      <button type="button" disabled className="boton-primario w-full opacity-40 sm:w-auto">
        {t("producto.agotado")}
      </button>
    );
  }

  if (enCarrito) {
    return (
      <button
        type="button"
        onClick={() => abrirOverlay("carrito")}
        className="boton-primario w-full sm:w-auto"
      >
        {t("producto.verCarrito")}
      </button>
    );
  }

  const agregarAhora = () => {
    agregar(
      {
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        imagen: producto.imagen,
      },
      cantidad,
    );
    setCantidad(1); // no arrastrar la cantidad si luego se quita del carrito
    abrirOverlay("carrito");
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1" role="group" aria-label={t("producto.cantidad")}>
        <button
          type="button"
          aria-label={t("producto.cantidad.menos")}
          onClick={() => setCantidad((c) => Math.max(1, c - 1))}
          disabled={cantidad <= 1}
          className="grid h-9 w-9 place-items-center rounded-full border border-tinta-suave/30 hover:border-tinta-suave disabled:opacity-30"
        >
          −
        </button>
        <span className="w-8 text-center tabular-nums" aria-live="polite">
          {cantidad}
        </span>
        <button
          type="button"
          aria-label={t("producto.cantidad.mas")}
          onClick={() => setCantidad((c) => Math.min(CANTIDAD_MAXIMA, c + 1))}
          disabled={cantidad >= CANTIDAD_MAXIMA}
          className="grid h-9 w-9 place-items-center rounded-full border border-tinta-suave/30 hover:border-tinta-suave disabled:opacity-30"
        >
          +
        </button>
      </div>
      <button type="button" onClick={agregarAhora} className="boton-primario w-full sm:w-auto">
        {t("producto.agregar")}
      </button>
    </div>
  );
}
