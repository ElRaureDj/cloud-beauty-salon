"use client";

import { useState } from "react";

type Fila = { id: string; nombre: string; linea: string; unidades: number };

// Editor de stock del panel (bloque 3). Números editables por producto; guarda
// SOLO las filas modificadas (diff contra la línea base). Enviar filas no
// tocadas pisaría con un valor obsoleto ventas ocurridas desde que se abrió el
// panel (lost update) y dispararía avisos de reposición falsos (F2): fijarStock
// hace un set absoluto. La base avanza tras cada guardado correcto.
export default function EditorStock({ inicial }: { inicial: Fila[] }) {
  const [filas, setFilas] = useState(inicial);
  const [base, setBase] = useState<Record<string, number>>(() =>
    Object.fromEntries(inicial.map((f) => [f.id, f.unidades])),
  );
  const [estado, setEstado] = useState<"quieto" | "guardando" | "ok" | "error">(
    "quieto",
  );

  const cambiar = (id: string, valor: number) =>
    setFilas((f) =>
      f.map((x) => (x.id === id ? { ...x, unidades: valor } : x)),
    );

  const guardar = async () => {
    const cambios = filas
      .filter((f) => f.unidades !== base[f.id])
      .map((f) => ({ id: f.id, unidades: f.unidades }));
    if (cambios.length === 0) {
      setEstado("ok"); // nada que guardar
      return;
    }
    setEstado("guardando");
    try {
      const r = await fetch("/api/admin/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cambios }),
      });
      if (r.ok) {
        // La base avanza a lo guardado: el próximo guardado vuelve a diffear.
        setBase(Object.fromEntries(filas.map((f) => [f.id, f.unidades])));
        setEstado("ok");
      } else {
        setEstado("error");
      }
    } catch {
      setEstado("error");
    }
  };

  return (
    <div>
      <ul className="mt-6 divide-y divide-tinta-suave/15">
        {filas.map((f) => (
          <li key={f.id} className="flex items-center justify-between gap-4 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm">{f.nombre}</p>
              <p className="text-xs text-tinta-suave">{f.linea}</p>
            </div>
            <input
              type="number"
              min={0}
              value={f.unidades}
              onChange={(e) =>
                cambiar(f.id, Math.max(0, Math.trunc(Number(e.target.value) || 0)))
              }
              className="w-20 shrink-0 rounded-lg border border-tinta-suave/30 bg-transparent px-2 py-1 text-right outline-none focus:border-acento"
            />
          </li>
        ))}
      </ul>
      <div className="sticky bottom-0 mt-4 flex items-center gap-3 bg-fondo-0/90 py-3 backdrop-blur">
        <button
          type="button"
          onClick={guardar}
          disabled={estado === "guardando"}
          className="boton-primario disabled:opacity-40"
        >
          {estado === "guardando" ? "Guardando…" : "Guardar stock"}
        </button>
        {estado === "ok" && <span className="text-sm text-acento">Guardado ✓</span>}
        {estado === "error" && (
          <span className="text-sm text-acento">Error al guardar</span>
        )}
      </div>
    </div>
  );
}
