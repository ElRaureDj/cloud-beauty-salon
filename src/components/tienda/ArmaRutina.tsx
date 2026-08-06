"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useT } from "@/lib/i18n/client";
import { DESCUENTO_BUNDLE } from "@/lib/formato";
import { useTienda } from "@/stores/carrito";
import { useExperiencia } from "@/stores/experiencia";

// "Arma tu rutina" (mejora L1): la clienta elige un producto por paso —
// champú, acondicionador y tratamiento — y se lleva el descuento de rutina
// completa (mismo mecanismo de bundle del diagnóstico y los kits, §5.3).
// Con 2+ pasos elegidos ya hay descuento.
export type ItemRutinaBuilder = {
  id: string;
  nombre: string;
  linea: string;
  precio: number;
  imagen: string;
  categoria: string;
};

type Paso = { clave: "champu" | "acondicionador" | "tratamiento"; etiqueta: string };

export default function ArmaRutina({ items }: { items: ItemRutinaBuilder[] }) {
  const { t, tf } = useT();
  const agregar = useTienda((s) => s.agregar);
  const marcarBundle = useTienda((s) => s.marcarBundle);
  const abrirOverlay = useExperiencia((s) => s.abrirOverlay);

  const [eleccion, setEleccion] = useState<Record<string, string | null>>({
    champu: null,
    acondicionador: null,
    tratamiento: null,
  });

  const pasos: Paso[] = [
    { clave: "champu", etiqueta: t("rutina.paso.champu") },
    { clave: "acondicionador", etiqueta: t("rutina.paso.acondicionador") },
    { clave: "tratamiento", etiqueta: t("rutina.paso.tratamiento") },
  ];

  const porPaso = useMemo(() => {
    const conPrecio = items.filter((i) => i.precio > 0);
    return {
      champu: conPrecio.filter((i) => i.categoria === "champu"),
      acondicionador: conPrecio.filter((i) => i.categoria === "acondicionador"),
      tratamiento: conPrecio.filter(
        (i) =>
          i.categoria === "mascara" ||
          i.categoria === "booster" ||
          i.categoria === "leave-in",
      ),
    } as Record<string, ItemRutinaBuilder[]>;
  }, [items]);

  const elegidos = useMemo(() => {
    const porId = new Map(items.map((i) => [i.id, i]));
    return Object.values(eleccion)
      .filter((id): id is string => Boolean(id))
      .map((id) => porId.get(id))
      .filter((i): i is ItemRutinaBuilder => Boolean(i));
  }, [eleccion, items]);

  const total = elegidos.reduce((s, i) => s + i.precio, 0);
  const conDescuento = elegidos.length >= 2 ? total * (1 - DESCUENTO_BUNDLE) : total;
  const ahorro = total - conDescuento;

  const anadir = () => {
    const enCarrito = new Set(useTienda.getState().carrito.map((l) => l.id));
    for (const i of elegidos) {
      if (!enCarrito.has(i.id)) {
        agregar({ id: i.id, nombre: i.nombre, precio: i.precio, imagen: i.imagen });
      }
    }
    if (elegidos.length >= 2) marcarBundle(elegidos.map((i) => i.id));
    abrirOverlay("carrito");
  };

  return (
    <div className="mt-8 flex flex-col gap-10">
      {pasos.map((paso, idx) => (
        <section key={paso.clave} aria-label={paso.etiqueta}>
          <h2 className="flex items-baseline gap-3 font-display text-xl">
            <span aria-hidden className="text-sm text-acento">
              {idx + 1}
            </span>
            {paso.etiqueta}
            {eleccion[paso.clave] && (
              <span aria-hidden className="text-sm text-acento">
                ✓
              </span>
            )}
          </h2>
          <ul className="mt-3 flex snap-x gap-3 overflow-x-auto pb-2">
            {porPaso[paso.clave].map((p) => {
              const activo = eleccion[paso.clave] === p.id;
              return (
                <li key={p.id} className="w-36 shrink-0 snap-start">
                  <button
                    type="button"
                    aria-pressed={activo}
                    onClick={() =>
                      setEleccion((e) => ({
                        ...e,
                        [paso.clave]: activo ? null : p.id,
                      }))
                    }
                    className={`block w-full rounded-2xl border p-2 text-left transition-colors ${
                      activo
                        ? "border-acento bg-fondo-1/60"
                        : "border-tinta-suave/20 hover:border-tinta-suave/50"
                    }`}
                  >
                    <span className="relative block aspect-square w-full overflow-hidden rounded-xl bg-white">
                      <Image
                        src={p.imagen}
                        alt=""
                        width={300}
                        height={300}
                        sizes="150px"
                        className="h-full w-full object-contain"
                      />
                    </span>
                    <span className="mt-2 line-clamp-2 block text-xs leading-snug">
                      {p.nombre}
                    </span>
                    <span className="mt-1 block text-xs font-medium tabular-nums">
                      ${p.precio.toFixed(2)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {/* Resumen pegajoso: total, ahorro y CTA. */}
      <div className="sticky bottom-0 -mx-6 border-t border-tinta-suave/20 bg-fondo-0/90 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-3">
          <div>
            {elegidos.length >= 2 ? (
              <p className="text-sm">
                <span className="text-tinta-suave line-through">${total.toFixed(2)}</span>{" "}
                <strong className="text-lg tabular-nums">${conDescuento.toFixed(2)}</strong>{" "}
                <span className="text-acento">
                  {tf("kits.ahorras", { monto: `$${ahorro.toFixed(2)}` })}
                </span>
              </p>
            ) : (
              <p className="text-sm text-tinta-suave">{t("rutina.eligeDos")}</p>
            )}
          </div>
          <button
            type="button"
            onClick={anadir}
            disabled={elegidos.length === 0}
            className="boton-primario disabled:opacity-40"
          >
            {elegidos.length >= 2
              ? tf("rutina.anadirCon", { n: elegidos.length })
              : t("producto.agregar")}
          </button>
        </div>
      </div>
    </div>
  );
}
