"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useT, useRuta } from "@/lib/i18n/client";
import { useFavoritos } from "@/stores/favoritos";
import BotonFavorito from "./BotonFavorito";

// Vista de favoritos (mejora F4). El catálogo mínimo llega como prop desde el
// servidor (sin arrastrar el JSON completo al bundle cliente); esta isla filtra
// por los ids guardados en localStorage. Orden = el del store (más reciente
// primero).
export type ItemFavorito = {
  id: string;
  nombre: string;
  precio: number;
  imagen: string;
  linea: string;
};

export default function ListaFavoritos({
  catalogo,
}: {
  catalogo: ItemFavorito[];
}) {
  const { t } = useT();
  const ruta = useRuta();
  const ids = useFavoritos((s) => s.ids);
  const [hidratado, setHidratado] = useState(false);

  // Rehidrata por si se llega directo a /favoritos (el Header también lo hace).
  // Hasta rehidratar, `ids` está vacío (skipHydration): no pintamos el estado
  // "no tienes favoritos" para no mostrar un mensaje falso a quien SÍ tiene.
  useEffect(() => {
    void useFavoritos.persist.rehydrate();
    setHidratado(true);
  }, []);

  const porId = new Map(catalogo.map((p) => [p.id, p]));
  const items = ids
    .map((id) => porId.get(id))
    .filter((p): p is ItemFavorito => Boolean(p));

  if (!hidratado) {
    return <div className="mt-8 min-h-40" aria-hidden />;
  }

  if (items.length === 0) {
    return (
      <div className="mt-8">
        <p className="text-tinta-suave">{t("favoritos.vacio")}</p>
        <Link href={ruta("/tienda")} className="boton-primario mt-6 inline-block">
          {t("carrito.irTienda")}
        </Link>
      </div>
    );
  }

  return (
    <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
      {items.map((p) => (
        <li key={p.id} className="relative">
          <Link
            href={ruta(`/producto/${p.id}`)}
            className="group block rounded-3xl border border-transparent p-2 transition-colors hover:border-tinta-suave/20"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white">
              <Image
                src={p.imagen}
                alt={p.nombre}
                width={800}
                height={800}
                sizes="(max-width: 640px) 50vw, 33vw"
                className="h-full w-full object-contain"
              />
            </div>
            <p className="mt-2 text-sm leading-snug">{p.nombre}</p>
            <p className="mt-0.5 text-xs text-tinta-suave">
              {p.precio > 0 ? `$${p.precio.toFixed(2)}` : t("precio.porConfirmar")}
            </p>
          </Link>
          <BotonFavorito
            id={p.id}
            className="absolute right-3 top-3 h-9 w-9 bg-fondo-0/70 backdrop-blur-sm"
          />
        </li>
      ))}
    </ul>
  );
}
