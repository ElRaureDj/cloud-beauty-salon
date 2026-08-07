"use client";

import Link from "next/link";
import { useT, useRuta } from "@/lib/i18n/client";
import { MAX_COMPARAR, useComparar } from "@/stores/comparar";

// Comparador (mejora L3): chip "Comparar" por tarjeta + barra flotante con el
// enlace a /comparar?ids=… La selección vive en memoria (stores/comparar).

export function CompararCheck({ id }: { id: string }) {
  const { t } = useT();
  const activo = useComparar((s) => s.ids.includes(id));
  const lleno = useComparar((s) => s.ids.length >= MAX_COMPARAR);
  const alternar = useComparar((s) => s.alternar);

  return (
    <button
      type="button"
      aria-pressed={activo}
      disabled={!activo && lleno}
      onClick={() => alternar(id)}
      className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors disabled:opacity-30 ${
        activo
          ? "border-acento text-acento"
          : "border-tinta-suave/30 text-tinta-suave hover:border-tinta-suave hover:text-tinta"
      }`}
    >
      <span
        aria-hidden
        className={`grid h-3.5 w-3.5 place-items-center rounded-sm border text-[9px] leading-none ${
          activo ? "border-acento bg-acento text-acento-tinta" : "border-tinta-suave/50"
        }`}
      >
        {activo ? "✓" : ""}
      </span>
      {t("comparar.chip")}
    </button>
  );
}

export function BarraComparar() {
  const { t, tf } = useT();
  const ruta = useRuta();
  const ids = useComparar((s) => s.ids);
  const limpiar = useComparar((s) => s.limpiar);

  if (ids.length < 2) return null;

  return (
    <div className="anima-aparecer fixed inset-x-0 bottom-4 z-40 px-4">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3 rounded-full border border-borde bg-fondo-1/95 py-2 pl-5 pr-2 panel-flotante backdrop-blur-md">
        <span className="text-sm text-tinta-suave">
          {tf("comparar.n", { n: ids.length })}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={limpiar}
            className="text-xs text-tinta-suave underline-offset-4 hover:underline"
          >
            {t("comparar.limpiar")}
          </button>
          <Link
            href={`${ruta("/comparar")}?ids=${ids.join(",")}`}
            className="boton-primario px-4 py-2 text-sm"
          >
            {t("comparar.ver")}
          </Link>
        </div>
      </div>
    </div>
  );
}
