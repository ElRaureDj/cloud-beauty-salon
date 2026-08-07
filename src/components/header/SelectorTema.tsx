"use client";

import { useEffect, useState } from "react";
import { useTema } from "@/stores/tema";
import { PREFERENCIAS, type Preferencia } from "@/lib/tema";
import { useT } from "@/lib/i18n/client";

// Selector de tema (auto / claro / oscuro). Es un grupo de radio, no un botón
// que cicla: con tres estados, un botón que rota obliga a adivinar en qué punto
// del ciclo estás, y "auto" no tiene icono evidente al que volver.
//
// Compacto a propósito: comparte barra con idioma y carrito. Tres iconos de 16
// px dentro de una píldora, con el activo marcado por fondo (no solo color).

const ICONOS: Record<Preferencia, React.ReactNode> = {
  // Media luna / medio sol: "sigue a tu dispositivo".
  auto: (
    <>
      <circle cx="8" cy="8" r="5.2" />
      <path d="M8 2.8v10.4a5.2 5.2 0 000-10.4z" fill="currentColor" stroke="none" />
    </>
  ),
  claro: (
    <>
      <circle cx="8" cy="8" r="3.1" />
      <path d="M8 1v1.6M8 13.4V15M1 8h1.6M13.4 8H15M3.1 3.1l1.1 1.1M11.8 11.8l1.1 1.1M12.9 3.1l-1.1 1.1M4.2 11.8l-1.1 1.1" />
    </>
  ),
  oscuro: <path d="M13 9.6A5.6 5.6 0 016.4 3a5.6 5.6 0 106.6 6.6z" />,
};

export default function SelectorTema() {
  const { t } = useT();
  const guardada = useTema((s) => s.preferencia);
  const elegir = useTema((s) => s.elegir);

  // El store se inicializa leyendo el <html> (lo necesita la escena 3D en su
  // PRIMER render), pero este selector sí se prerenderiza en el servidor, donde
  // no hay DOM y la preferencia siempre sale "auto". Marcar el activo antes de
  // hidratar rompería la hidratación, así que hasta entonces se pinta el mismo
  // estado que el HTML del servidor y se corrige en el primer efecto.
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);
  const preferencia = montado ? guardada : "auto";

  return (
    <div
      role="radiogroup"
      aria-label={t("tema.titulo")}
      className="flex items-center gap-0.5 rounded-full border border-tinta-suave/25 p-0.5"
    >
      {PREFERENCIAS.map((p) => {
        const activa = preferencia === p;
        return (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={activa}
            aria-label={t(`tema.${p}`)}
            title={t(`tema.${p}`)}
            onClick={() => elegir(p)}
            className={`grid h-6 w-6 place-items-center rounded-full transition-colors ${
              activa
                ? "bg-acento text-acento-tinta"
                : "text-tinta-suave hover:text-tinta"
            }`}
          >
            <svg
              viewBox="0 0 16 16"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              aria-hidden
            >
              {ICONOS[p]}
            </svg>
          </button>
        );
      })}
    </div>
  );
}
