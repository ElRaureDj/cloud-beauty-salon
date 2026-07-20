"use client";

import { useT } from "@/lib/i18n/client";
import { useFavoritos } from "@/stores/favoritos";

// Corazón de favoritos (mejora F4). Reutilizable: en las tarjetas de la tienda
// (superpuesto) y en la ficha. Alterna el favorito y refleja el estado. Corta la
// propagación para no disparar el <Link> de la tarjeta al pulsarlo.
export default function BotonFavorito({
  id,
  className = "",
}: {
  id: string;
  className?: string;
}) {
  const { t } = useT();
  const favorito = useFavoritos((s) => s.ids.includes(id));
  const alternar = useFavoritos((s) => s.alternar);

  return (
    <button
      type="button"
      aria-pressed={favorito}
      aria-label={favorito ? t("favoritos.quitar") : t("favoritos.anadir")}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        alternar(id);
      }}
      className={`grid place-items-center rounded-full transition-colors ${
        favorito ? "text-acento" : "text-tinta-suave hover:text-tinta"
      } ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill={favorito ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.8}
        aria-hidden
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    </button>
  );
}
