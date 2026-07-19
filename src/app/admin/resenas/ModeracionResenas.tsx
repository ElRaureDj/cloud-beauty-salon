"use client";

import { useState } from "react";

type Pendiente = {
  id: number;
  producto_id: string;
  autor: string;
  rating: number;
  texto: string;
  fecha: string;
};

// Moderación de reseñas del panel (bloque 3): aprobar (se publica) o eliminar.
export default function ModeracionResenas({
  inicial,
}: {
  inicial: Pendiente[];
}) {
  const [pendientes, setPendientes] = useState(inicial);

  const [error, setError] = useState(false);

  const actuar = async (id: number, accion: "aprobar" | "eliminar") => {
    setError(false);
    try {
      const r = await fetch("/api/admin/resenas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, accion }),
      });
      if (r.ok) setPendientes((p) => p.filter((x) => x.id !== id));
      else setError(true);
    } catch {
      // Fallo de red: dejamos el item en la lista y avisamos para reintentar.
      setError(true);
    }
  };

  if (pendientes.length === 0) {
    return <p className="mt-6 text-tinta-suave">No hay reseñas pendientes.</p>;
  }

  return (
    <ul className="mt-6 flex flex-col gap-4">
      {error && (
        <li role="alert" className="text-sm text-acento">
          No se pudo completar la acción. Inténtalo de nuevo.
        </li>
      )}
      {pendientes.map((r) => (
        <li key={r.id} className="rounded-2xl border border-tinta-suave/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">
              {r.autor} · {r.rating}★
            </span>
            <span className="text-xs text-tinta-suave">{r.producto_id}</span>
          </div>
          <p className="mt-2 whitespace-pre-line text-sm text-tinta-suave">
            {r.texto}
          </p>
          <div className="mt-3 flex gap-4">
            <button
              type="button"
              onClick={() => actuar(r.id, "aprobar")}
              className="text-sm text-acento underline-offset-4 hover:underline"
            >
              Aprobar
            </button>
            <button
              type="button"
              onClick={() => actuar(r.id, "eliminar")}
              className="text-sm text-tinta-suave underline-offset-4 hover:underline"
            >
              Eliminar
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
