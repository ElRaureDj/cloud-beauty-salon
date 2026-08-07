"use client";

import { useRef, useSyncExternalStore } from "react";
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

/** Instantánea del servidor: allí no hay DOM y la preferencia sale siempre "auto". */
const AUTO = (): Preferencia => "auto";
const leer = (): Preferencia => useTema.getState().preferencia;

export default function SelectorTema() {
  const { t } = useT();
  const elegir = useTema((s) => s.elegir);

  // El store se inicializa leyendo el <html> (lo necesita la escena 3D en su
  // PRIMER render), pero este selector SÍ se prerenderiza: marcar el activo
  // real en el primer render de cliente rompería la hidratación. Con la
  // instantánea de servidor de useSyncExternalStore, React usa "auto" mientras
  // hidrata —igual que el HTML— y pasa al valor real justo después, sin efecto
  // ni estado extra.
  const preferencia = useSyncExternalStore(useTema.subscribe, leer, AUTO);
  const grupo = useRef<HTMLDivElement>(null);

  // Un radiogroup se recorre con las FLECHAS, no con el tabulador: el grupo
  // entero ocupa una sola parada de tabulación (tabIndex móvil, "roving") y
  // dentro se mueve con ←/→ o ↑/↓, eligiendo al pasar. Sin esto, el selector
  // anunciaba ser un grupo de radio y no se comportaba como tal.
  const alTeclear = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const paso =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? 1
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? -1
          : 0;
    if (!paso) return;
    e.preventDefault();
    // Del STORE, no de `preferencia`: con la tecla mantenida los eventos llegan
    // más rápido de lo que React vuelve a renderizar, y partiendo del valor del
    // render todas las repeticiones calculaban desde el mismo punto (probado:
    // →,→,← acababa en "oscuro" en vez de en "claro").
    const i = PREFERENCIAS.indexOf(useTema.getState().preferencia);
    const siguiente =
      PREFERENCIAS[(i + paso + PREFERENCIAS.length) % PREFERENCIAS.length];
    elegir(siguiente);
    // El foco acompaña a la selección, como pide el patrón.
    grupo.current
      ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
      [PREFERENCIAS.indexOf(siguiente)]?.focus();
  };

  return (
    <div
      ref={grupo}
      role="radiogroup"
      aria-label={t("tema.titulo")}
      onKeyDown={alTeclear}
      className="flex items-center gap-0.5 rounded-full border border-borde p-0.5"
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
            tabIndex={activa ? 0 : -1}
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
