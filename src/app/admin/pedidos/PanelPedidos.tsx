"use client";

import { useState } from "react";

export type PedidoVista = {
  session_id: string;
  fecha: string;
  cliente: string;
  email: string;
  direccion: string;
  total: string;
  pagado: boolean;
  reembolsado: boolean;
  enviado: boolean;
  lineas: string[];
};

// Panel de pedidos (mejora M3): lista los pedidos y permite marcar "enviado".
// El pago viene del webhook; "enviado" lo gestiona Disleny aquí a mano.
export default function PanelPedidos({ inicial }: { inicial: PedidoVista[] }) {
  const [pedidos, setPedidos] = useState(inicial);
  // Estado POR pedido (no escalar): un fallo en un pedido no puede tapar el
  // aviso de otro, y una petición en vuelo solo deshabilita SU casilla.
  const [enCurso, setEnCurso] = useState<Set<string>>(new Set());
  const [inciertos, setInciertos] = useState<Set<string>>(new Set());
  const [rechazo, setRechazo] = useState(false);

  const marcar = (
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    session_id: string,
    incluir: boolean,
  ) =>
    setter((s) => {
      const n = new Set(s);
      if (incluir) n.add(session_id);
      else n.delete(session_id);
      return n;
    });

  const fijarEnviado = (session_id: string, enviado: boolean) =>
    setPedidos((ps) =>
      ps.map((p) => (p.session_id === session_id ? { ...p, enviado } : p)),
    );

  const alternar = async (session_id: string, enviado: boolean) => {
    setRechazo(false);
    marcar(setInciertos, session_id, false); // reintentamos ESTE pedido
    marcar(setEnCurso, session_id, true);
    // Optimista: reflejamos el cambio ya. Si el servidor lo RECHAZA (r.ok=false)
    // revertimos (estado consistente). Ante un error de red (ambiguo: pudo
    // aplicarse tras el commit) mantenemos el valor optimista y marcamos ESTE
    // pedido como incierto (aviso de recargar), sin borrar el de otros.
    fijarEnviado(session_id, enviado);
    try {
      const r = await fetch("/api/admin/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id, enviado }),
      });
      if (!r.ok) {
        fijarEnviado(session_id, !enviado);
        setRechazo(true);
      }
    } catch {
      marcar(setInciertos, session_id, true);
    } finally {
      marcar(setEnCurso, session_id, false);
    }
  };

  if (pedidos.length === 0) {
    return <p className="mt-6 text-tinta-suave">Aún no hay pedidos.</p>;
  }

  return (
    <ul className="mt-6 flex flex-col gap-4">
      {rechazo && (
        <li role="alert" className="text-sm text-acento">
          No se pudo guardar el cambio. Inténtalo de nuevo.
        </li>
      )}
      {inciertos.size > 0 && (
        <li role="alert" className="text-sm text-acento">
          {inciertos.size === 1 ? "Un pedido" : `${inciertos.size} pedidos`} pueden
          estar sin sincronizar por un fallo de red. Recarga la página para ver el
          estado real.
        </li>
      )}
      {pedidos.map((p) => (
        <li
          key={p.session_id}
          className="rounded-2xl border border-tinta-suave/20 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">
              {p.cliente} · {p.total}
            </span>
            <span className="text-xs text-tinta-suave">{p.fecha}</span>
          </div>
          <p className="mt-1 text-xs text-tinta-suave">
            {p.email} · {p.direccion}
          </p>
          <ul className="mt-2 text-sm text-tinta-suave">
            {p.lineas.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
          <div className="mt-3 flex items-center gap-3">
            <span
              className={`rounded-full border px-2 py-0.5 text-xs ${
                p.reembolsado
                  ? "border-tinta-suave/40 text-tinta-suave line-through"
                  : p.pagado
                    ? "border-acento text-acento"
                    : "border-tinta-suave/40 text-tinta-suave"
              }`}
            >
              {p.reembolsado ? "Reembolsado" : p.pagado ? "Pagado" : "Pendiente"}
            </span>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={p.enviado}
                disabled={enCurso.has(p.session_id)}
                onChange={(e) => alternar(p.session_id, e.target.checked)}
                className="accent-acento"
              />
              Enviado
            </label>
          </div>
        </li>
      ))}
    </ul>
  );
}
