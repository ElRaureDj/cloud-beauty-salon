"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";
import { useTienda } from "@/stores/carrito";

// Añadir rápido desde la tarjeta de la tienda (mejora H2): un "+" que mete el
// producto sin abrir la ficha. No se muestra si el precio está por confirmar ni
// si está agotado. Corta la propagación para no navegar por el <Link> de la
// tarjeta. Feedback breve con un check; si ya está en el carrito, lo indica.
export default function BotonAgregarRapido({
  id,
  nombre,
  precio,
  imagen,
  agotado = false,
  className = "",
}: {
  id: string;
  nombre: string;
  precio: number;
  imagen?: string;
  agotado?: boolean;
  className?: string;
}) {
  const { t } = useT();
  const agregar = useTienda((s) => s.agregar);
  const enCarrito = useTienda((s) => s.carrito.some((l) => l.id === id));
  const [hecho, setHecho] = useState(false);

  if (precio <= 0 || agotado) return null;

  const marcado = enCarrito || hecho;

  return (
    <button
      type="button"
      aria-label={marcado ? t("producto.verCarrito") : t("producto.agregar")}
      disabled={enCarrito}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (enCarrito) return;
        agregar({ id, nombre, precio, imagen });
        setHecho(true);
      }}
      className={`grid place-items-center rounded-full border transition-colors ${
        marcado
          ? "border-acento bg-acento text-acento-tinta"
          : "border-tinta-suave/30 bg-fondo-0/70 text-tinta backdrop-blur-sm hover:border-acento hover:text-acento"
      } ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
        {marcado ? (
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        )}
      </svg>
    </button>
  );
}
