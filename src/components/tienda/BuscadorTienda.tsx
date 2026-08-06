"use client";

import { useId, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useT, useRuta } from "@/lib/i18n/client";

// Búsqueda instantánea (mejora K1): resultados con foto y precio MIENTRAS se
// escribe. El catálogo entero (54) viaja como prop mínima y se filtra en
// cliente — cero backend. El <form> GET se conserva: sin JS (o pulsando
// Enter/Buscar) sigue funcionando el flujo clásico con la URL.
export type ItemBusqueda = {
  id: string;
  nombre: string;
  linea: string;
  precio: number;
  imagen: string;
};

const MAX_RESULTADOS = 6;

export default function BuscadorTienda({
  action,
  ocultos,
  qInicial,
  items,
}: {
  action: string;
  /** Campos hidden que preservan el resto del estado de la URL. */
  ocultos: Record<string, string>;
  qInicial: string;
  items: ItemBusqueda[];
}) {
  const { t, tf } = useT();
  const ruta = useRuta();
  const idLista = useId();
  const [q, setQ] = useState(qInicial);
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement | null>(null);

  const consulta = q.trim().toLowerCase();
  const resultados = useMemo(() => {
    if (consulta.length < 2) return [];
    return items
      .filter(
        (p) =>
          p.nombre.toLowerCase().includes(consulta) ||
          p.linea.toLowerCase().includes(consulta),
      )
      .slice(0, MAX_RESULTADOS);
  }, [items, consulta]);

  const mostrar = abierto && consulta.length >= 2;

  return (
    <div
      ref={contenedor}
      className="relative mt-8"
      // Cierra al salir el foco del bloque completo (input + resultados).
      onBlur={(e) => {
        if (!contenedor.current?.contains(e.relatedTarget as Node)) {
          setAbierto(false);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") setAbierto(false);
      }}
    >
      <form action={action} method="get" role="search" className="flex gap-2">
        {Object.entries(ocultos).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <label className="sr-only" htmlFor="tienda-q">
          {t("tienda.buscar")}
        </label>
        <input
          id="tienda-q"
          type="search"
          name="q"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setAbierto(true);
          }}
          onFocus={() => setAbierto(true)}
          placeholder={t("tienda.buscar")}
          autoComplete="off"
          aria-expanded={mostrar}
          aria-controls={idLista}
          className="min-w-0 flex-1 rounded-full border border-tinta-suave/30 bg-transparent px-4 py-2 text-base outline-none focus:border-acento sm:text-sm"
        />
        <button type="submit" className="boton-primario shrink-0 px-4 py-2 text-sm">
          {t("tienda.buscar.enviar")}
        </button>
      </form>

      {mostrar && (
        <div
          id={idLista}
          className="anima-aparecer absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-tinta-suave/20 bg-fondo-0/95 shadow-[0_16px_48px_rgba(0,0,0,0.5)] backdrop-blur-md"
        >
          {resultados.length === 0 ? (
            <p className="px-4 py-3 text-sm text-tinta-suave" role="status">
              {t("tienda.sinResultados")}
            </p>
          ) : (
            <ul>
              {resultados.map((p) => (
                <li key={p.id}>
                  <Link
                    href={ruta(`/producto/${p.id}`)}
                    className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-fondo-1/60 focus-visible:bg-fondo-1/60"
                  >
                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white">
                      <Image
                        src={p.imagen}
                        alt=""
                        width={80}
                        height={80}
                        sizes="40px"
                        className="h-full w-full object-contain"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{p.nombre}</span>
                      <span className="block text-xs text-tinta-suave">{p.linea}</span>
                    </span>
                    <span className="shrink-0 text-sm font-medium tabular-nums">
                      {p.precio > 0
                        ? `$${p.precio.toFixed(2)}`
                        : t("precio.porConfirmar")}
                    </span>
                  </Link>
                </li>
              ))}
              <li className="border-t border-tinta-suave/15">
                <button
                  type="submit"
                  form={undefined}
                  onClick={(e) => {
                    // Envía el form GET (mantiene filtros): buscar "q" completo.
                    e.preventDefault();
                    (
                      contenedor.current?.querySelector("form") as HTMLFormElement | null
                    )?.submit();
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-acento transition-colors hover:bg-fondo-1/60"
                >
                  {tf("tienda.buscar.todos", { q: q.trim() })}
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
