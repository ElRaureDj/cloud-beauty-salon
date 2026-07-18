"use client";

import { useEffect, useId, useRef } from "react";
import { t } from "@/lib/i18n/es";

type Props = {
  abierto: boolean;
  titulo: string;
  onCerrar: () => void;
  lado?: "centro" | "derecha";
  children: React.ReactNode;
};

// Base común de overlays (§5) sobre <dialog> nativo: showModal() da trampa de
// foco, fondo inerte para lectores de pantalla, Escape y jerarquía top-layer.
// Mientras está abierto se bloquea también el scroll nativo del documento —
// lenis.stop() solo cubre rueda/touch, no teclado ni barra de scroll (§2).
export default function ModalBase({
  abierto,
  titulo,
  onCerrar,
  lado = "centro",
  children,
}: Props) {
  const tituloId = useId();
  const dialogoRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    if (!abierto) return;
    const dialogo = dialogoRef.current;
    const invocador = document.activeElement as HTMLElement | null;
    dialogo?.showModal();

    const overflowPrevio = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "clip";
    return () => {
      document.documentElement.style.overflow = overflowPrevio;
      dialogo?.close();
      invocador?.focus?.();
    };
  }, [abierto]);

  if (!abierto) return null;

  const esDrawer = lado === "derecha";

  return (
    <dialog
      ref={dialogoRef}
      aria-labelledby={tituloId}
      data-lenis-prevent
      onCancel={(e) => {
        e.preventDefault();
        onCerrar();
      }}
      onClick={(e) => {
        // Los clics sobre ::backdrop llegan con el propio dialog como target.
        if (e.target === dialogoRef.current) onCerrar();
      }}
      className={
        esDrawer
          ? "anima-entrar-derecha m-0 ml-auto h-dvh max-h-[100dvh] w-full max-w-sm bg-fondo-0 p-0 text-tinta shadow-2xl"
          : "anima-aparecer m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-3xl bg-fondo-0 p-0 text-tinta shadow-2xl"
      }
    >
      <div className={esDrawer ? "flex h-full flex-col p-6" : "p-6"}>
        <div className="flex items-center justify-between gap-4">
          <h2 id={tituloId} className="font-display text-2xl">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label={t("comun.cerrar")}
            className="rounded-full border border-tinta-suave/40 p-2 transition-colors hover:border-tinta-suave"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden
            >
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="mt-5 flex-1">{children}</div>
      </div>
    </dialog>
  );
}
