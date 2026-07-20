"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useT, useRuta } from "@/lib/i18n/client";
import { nombreEtapa } from "@/lib/formato";
import type { Etapa } from "@/lib/catalogo";
import {
  desdeQuiz,
  diasSugeridos,
  LAVADOS,
  NIVELES,
  rotacion,
  type Lavados,
  type NivelDano,
} from "@/lib/cronograma";
import { useTienda } from "@/stores/carrito";
import { useExperiencia } from "@/stores/experiencia";

export type ItemEtapa = {
  id: string;
  nombre: string;
  precio: number;
  imagen: string;
};

const DIAS: Record<string, string[]> = {
  es: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
};

// A NIVEL DE MÓDULO: si se define dentro del render, su identidad cambia en cada
// render y React remonta los botones (se pierde el foco de teclado, WCAG 2.4.3).
function Segmento<T extends string | number>({
  valor,
  opciones,
  etiqueta,
  onCambio,
}: {
  valor: T;
  opciones: { v: T; texto: string }[];
  etiqueta: string;
  onCambio: (v: T) => void;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-tinta-suave">{etiqueta}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {opciones.map((o) => (
          <button
            key={String(o.v)}
            type="button"
            aria-pressed={valor === o.v}
            onClick={() => onCambio(o.v)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              valor === o.v
                ? "border-acento bg-acento text-acento-tinta"
                : "border-tinta-suave/30 text-tinta-suave hover:border-tinta-suave hover:text-tinta"
            }`}
          >
            {o.texto}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PlanCronograma({
  productosPorEtapa,
}: {
  productosPorEtapa: Record<Etapa, ItemEtapa[]>;
}) {
  const tr = useT();
  const { t, tf } = tr;
  const ruta = useRuta();
  const agregar = useTienda((s) => s.agregar);
  const abrirOverlay = useExperiencia((s) => s.abrirOverlay);

  const [lavados, setLavados] = useState<Lavados>(3);
  const [nivel, setNivel] = useState<NivelDano>(0);
  const [tieneQuiz, setTieneQuiz] = useState(false);

  // Pre-rellenar desde el diagnóstico si la clienta lo hizo.
  useEffect(() => {
    void useTienda.persist.rehydrate();
    const q = useTienda.getState().respuestasQuiz;
    if (q) {
      setTieneQuiz(true);
      const d = desdeQuiz(q);
      setLavados(d.lavados);
      setNivel(d.nivel);
    }
  }, []);

  const dias = DIAS[tr.locale] ?? DIAS.es;
  const plan = useMemo(() => {
    const etapas = rotacion(nivel, lavados);
    const cuando = diasSugeridos(lavados);
    return etapas.map((etapa, i) => ({
      dia: dias[cuando[i]],
      etapa,
      producto: productosPorEtapa[etapa]?.[0],
    }));
  }, [nivel, lavados, dias, productosPorEtapa]);

  const anadirTodo = () => {
    const vistos = new Set<string>();
    for (const paso of plan) {
      const p = paso.producto;
      if (p && !vistos.has(p.id)) {
        vistos.add(p.id);
        agregar({ id: p.id, nombre: p.nombre, precio: p.precio, imagen: p.imagen });
      }
    }
    if (vistos.size > 0) abrirOverlay("carrito");
  };

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:gap-10">
        <Segmento
          etiqueta={t("cronograma.lavados")}
          valor={lavados}
          opciones={LAVADOS.map((v) => ({ v, texto: String(v) }))}
          onCambio={(v) => setLavados(v)}
        />
        <Segmento
          etiqueta={t("cronograma.dano")}
          valor={nivel}
          opciones={NIVELES.map((v) => ({
            v,
            texto: t(
              (["cronograma.dano.bajo", "cronograma.dano.medio", "cronograma.dano.alto"] as const)[v],
            ),
          }))}
          onCambio={(v) => setNivel(v)}
        />
      </div>

      {!tieneQuiz && (
        <p className="mt-4 text-sm text-tinta-suave">
          {t("cronograma.sinQuiz")}{" "}
          <Link href={ruta("/")} className="text-acento underline-offset-4 hover:underline">
            {t("cronograma.sinQuiz.enlace")}
          </Link>
        </p>
      )}

      <ol className="mt-8 flex flex-col gap-3">
        {plan.map((paso, i) => (
          <li
            key={i}
            className="flex items-center gap-4 rounded-2xl border border-tinta-suave/20 p-3"
          >
            <div className="w-24 shrink-0">
              <p className="text-sm font-medium">{paso.dia}</p>
              <p className="text-xs text-acento">{nombreEtapa(paso.etapa, tr)}</p>
            </div>
            {paso.producto ? (
              <Link
                href={ruta(`/producto/${paso.producto.id}`)}
                className="flex min-w-0 flex-1 items-center gap-3 underline-offset-4 hover:underline"
              >
                <span className="relative aspect-square w-12 shrink-0 overflow-hidden rounded-lg bg-white">
                  <Image
                    src={paso.producto.imagen}
                    alt={paso.producto.nombre}
                    width={96}
                    height={96}
                    sizes="48px"
                    className="h-full w-full object-contain"
                  />
                </span>
                <span className="min-w-0 truncate text-sm">{paso.producto.nombre}</span>
              </Link>
            ) : (
              <span className="flex-1 text-sm text-tinta-suave">
                {t("cronograma.sinProducto")}
              </span>
            )}
          </li>
        ))}
      </ol>

      <button type="button" onClick={anadirTodo} className="boton-primario mt-6 w-full sm:w-auto">
        {t("cronograma.anadirTodo")}
      </button>

      <p className="mt-6 text-xs text-tinta-suave">{tf("cronograma.disclaimer", {})}</p>
    </div>
  );
}
