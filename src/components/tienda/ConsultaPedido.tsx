"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";

type PedidoPublico = {
  fecha: string;
  pagado: boolean;
  reembolsado: boolean;
  enviado: boolean;
  total: number | null;
  moneda: string | null;
  lineas: { nombre: string; cantidad: number }[];
};

export default function ConsultaPedido({ numeroInicial }: { numeroInicial?: string }) {
  const tr = useT();
  const { t } = tr;
  const [numero, setNumero] = useState(numeroInicial ?? "");
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<
    "idle" | "consultando" | "ok" | "noEncontrado" | "error"
  >("idle");
  const [pedido, setPedido] = useState<PedidoPublico | null>(null);

  const consultar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEstado("consultando");
    setPedido(null);
    try {
      const r = await fetch("/api/pedido/consulta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedido: numero, email }),
      });
      if (!r.ok) {
        setEstado("error");
        return;
      }
      const d = (await r.json()) as { encontrado?: boolean; pedido?: PedidoPublico };
      if (d.encontrado && d.pedido) {
        setPedido(d.pedido);
        setEstado("ok");
      } else {
        setEstado("noEncontrado");
      }
    } catch {
      setEstado("error");
    }
  };

  const etiquetaEstado = (p: PedidoPublico) => {
    if (p.reembolsado) return t("pedido.estado.reembolsado");
    if (p.enviado) return t("pedido.estado.enviado");
    if (p.pagado) return t("pedido.estado.preparando");
    return t("pedido.estado.pendiente");
  };

  const dinero = (c: number | null, m: string | null) =>
    new Intl.NumberFormat(tr.locale === "en" ? "en-US" : "es-US", {
      style: "currency",
      currency: (m ?? "usd").toUpperCase(),
    }).format((c ?? 0) / 100);

  return (
    <div className="mt-8">
      <form onSubmit={consultar} className="flex flex-col gap-4">
        <div>
          <label htmlFor="pedido-num" className="text-sm text-tinta-suave">
            {t("pedido.numero")}
          </label>
          <input
            id="pedido-num"
            type="text"
            required
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-tinta-suave/30 bg-transparent px-4 py-2 text-base outline-none focus:border-acento sm:text-sm"
          />
          <p className="mt-1 text-xs text-tinta-suave">{t("pedido.numero.ayuda")}</p>
        </div>
        <div>
          <label htmlFor="pedido-email" className="text-sm text-tinta-suave">
            {t("pedido.email")}
          </label>
          <input
            id="pedido-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-tinta-suave/30 bg-transparent px-4 py-2 text-base outline-none focus:border-acento sm:text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={estado === "consultando"}
          className="boton-primario w-full disabled:opacity-50 sm:w-auto"
        >
          {estado === "consultando" ? t("pedido.consultando") : t("pedido.consultar")}
        </button>
      </form>

      {estado === "noEncontrado" && (
        <p className="mt-4 text-sm text-acento" role="alert">
          {t("pedido.noEncontrado")}
        </p>
      )}
      {estado === "error" && (
        <p className="mt-4 text-sm text-acento" role="alert">
          {t("pedido.error")}
        </p>
      )}

      {estado === "ok" && pedido && (
        <div className="mt-6 rounded-2xl border border-tinta-suave/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full border border-acento px-3 py-1 text-sm text-acento">
              {etiquetaEstado(pedido)}
            </span>
            <span className="text-xs text-tinta-suave">
              {new Date(pedido.fecha).toLocaleDateString(
                tr.locale === "en" ? "en-US" : "es-US",
                { dateStyle: "medium" },
              )}
            </span>
          </div>
          <ul className="mt-4 flex flex-col gap-1 text-sm text-tinta-suave">
            {pedido.lineas.map((l, i) => (
              <li key={i}>
                {l.nombre} × {l.cantidad}
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-tinta-suave/15 pt-3 text-sm">
            <span className="text-tinta-suave">{t("pedido.total")}: </span>
            <strong>{dinero(pedido.total, pedido.moneda)}</strong>
          </p>
        </div>
      )}
    </div>
  );
}
