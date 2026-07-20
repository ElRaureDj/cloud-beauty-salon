"use client";

import { useEffect, useState } from "react";
import type { Producto } from "@/lib/catalogo";
import { etiquetaStock } from "@/lib/formato";
import { useT } from "@/lib/i18n/client";
import BotonAgregar from "./BotonAgregar";
import AvisoStock from "./AvisoStock";

// Disponibilidad en vivo de una ficha (bloque 3). La ficha es estática (SSG) por
// SEO; este panel pide el stock al montar (GET /api/producto/estado) y resuelve
// desde un estado indeterminado ("comprobando…") para evitar el parpadeo de un
// botón que se activa y luego se desactiva. Sin BD → stock null → botón normal.
type Estado = { stock: number | null } | undefined; // undefined = cargando

export default function PanelCompra({ producto }: { producto: Producto }) {
  const tr = useT();
  const [estado, setEstado] = useState<Estado>(undefined);

  useEffect(() => {
    let vivo = true;
    fetch(`/api/producto/estado?id=${encodeURIComponent(producto.id)}`, {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { stock?: number | null } | null) => {
        if (vivo) setEstado({ stock: d?.stock ?? null });
      })
      .catch(() => {
        if (vivo) setEstado({ stock: null });
      });
    return () => {
      vivo = false;
    };
  }, [producto.id]);

  if (estado === undefined) {
    return (
      <button
        type="button"
        disabled
        aria-busy="true"
        className="boton-primario w-full opacity-40 sm:w-auto"
      >
        {tr.t("producto.comprobando")}
      </button>
    );
  }

  const et = etiquetaStock(estado.stock, tr);
  return (
    <div>
      {/* "Últimas N" solo; si está agotado, el propio botón ya lo dice (no
          duplicar la palabra "Agotado" encima). */}
      {et.texto && !et.agotado && (
        <p className="mb-2 text-sm text-acento">{et.texto}</p>
      )}
      <BotonAgregar producto={producto} agotado={et.agotado} />
      {/* Agotado → ofrecer aviso de reposición (F2). */}
      {et.agotado && <AvisoStock productoId={producto.id} />}
    </div>
  );
}
