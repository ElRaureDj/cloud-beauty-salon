"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useT, useRuta } from "@/lib/i18n/client";
import { useVistos } from "@/stores/vistos";

// "Vistos recientemente" (mejora H2). El catálogo mínimo llega como prop del
// servidor (sin arrastrar el JSON al bundle cliente). Fila con scroll horizontal;
// se oculta si no hay nada. `excluir` evita mostrar el producto de la ficha
// actual.
export type ItemVisto = {
  id: string;
  nombre: string;
  precio: number;
  imagen: string;
};

export default function VistosRecientes({
  catalogo,
  excluir,
}: {
  catalogo: ItemVisto[];
  excluir?: string;
}) {
  const { t } = useT();
  const ruta = useRuta();
  const ids = useVistos((s) => s.ids);
  const [hidratado, setHidratado] = useState(false);

  useEffect(() => {
    void useVistos.persist.rehydrate();
    setHidratado(true);
  }, []);

  const porId = new Map(catalogo.map((p) => [p.id, p]));
  const items = ids
    .filter((id) => id !== excluir)
    .map((id) => porId.get(id))
    .filter((p): p is ItemVisto => Boolean(p));

  if (!hidratado || items.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="font-display text-xl">{t("vistos.titulo")}</h2>
      <ul className="mt-4 flex gap-4 overflow-x-auto pb-2">
        {items.map((p) => (
          <li key={p.id} className="w-32 shrink-0 sm:w-36">
            <Link
              href={ruta(`/producto/${p.id}`)}
              className="group block rounded-2xl border border-transparent p-1 transition-colors hover:border-tinta-suave/20"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white">
                <Image
                  src={p.imagen}
                  alt={p.nombre}
                  width={800}
                  height={800}
                  sizes="150px"
                  className="h-full w-full object-contain"
                />
              </div>
              <p className="mt-2 line-clamp-2 text-xs leading-snug">{p.nombre}</p>
              <p className="mt-0.5 text-xs text-tinta-suave">
                {p.precio > 0 ? `$${p.precio.toFixed(2)}` : t("precio.porConfirmar")}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
