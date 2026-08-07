"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { useTienda } from "@/stores/carrito";
import { useExperiencia } from "@/stores/experiencia";

// Añadir rápido desde la tarjeta de la tienda (mejora H2): un "+" que mete el
// producto sin abrir la ficha. No se muestra si el precio está por confirmar ni
// si está agotado. El estado se deriva SOLO del carrito (reactivo): si ya está
// dentro, el botón muestra un check y, al pulsarlo, abre el carrito. Es hermano
// del <Link> de la tarjeta, así que su clic no navega.
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
  const abrirOverlay = useExperiencia((s) => s.abrirOverlay);
  // Anuncio LIGADO A LA ACCIÓN de añadir (no a la pertenencia al carrito: eso
  // haría que el lector anunciara "añadido" al rehidratar la página con el
  // producto ya dentro). Transitorio: se limpia solo.
  const [anuncio, setAnuncio] = useState("");
  const temporizador = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(temporizador.current), []);

  if (precio <= 0 || agotado) return null;

  return (
    <>
      <span role="status" className="sr-only">
        {anuncio}
      </span>
      <button
        type="button"
        aria-label={enCarrito ? t("producto.verCarrito") : t("producto.agregar")}
        onClick={() => {
          if (enCarrito) {
            abrirOverlay("carrito");
            return;
          }
          agregar({ id, nombre, precio, imagen });
          setAnuncio(t("carrito.anadido"));
          window.clearTimeout(temporizador.current);
          temporizador.current = window.setTimeout(() => setAnuncio(""), 2000);
        }}
        className={`grid place-items-center rounded-full border transition-[color,background-color,border-color,opacity] duration-200 ${
          enCarrito
            ? "border-acento bg-acento text-acento-tinta"
            : "border-borde bg-fondo-1/90 text-tinta backdrop-blur-sm hover:border-acento hover:text-acento"
        } ${className}`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          {enCarrito ? (
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          )}
        </svg>
      </button>
    </>
  );
}
