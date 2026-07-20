"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";

const PRESETS = [25, 50, 100];

function chip(activo: boolean) {
  return `rounded-full border px-4 py-1.5 text-sm transition-colors ${
    activo
      ? "border-acento bg-acento text-acento-tinta"
      : "border-tinta-suave/30 text-tinta-suave hover:border-tinta-suave hover:text-tinta"
  }`;
}

// Compra de tarjeta regalo (mejora I1): importe + emails + mensaje → checkout de
// Stripe. Al pagar, el destinatario recibe un código por email.
export default function FormularioRegalo() {
  const tr = useT();
  const { t, tf } = tr;
  const [importe, setImporte] = useState(50);
  const [personalizado, setPersonalizado] = useState(false);
  const [destinatario, setDestinatario] = useState("");
  const [comprador, setComprador] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "error" | "sinConfig">(
    "idle",
  );

  const comprar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEstado("enviando");
    try {
      const r = await fetch("/api/regalo/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ importe, destinatario, comprador, mensaje, locale: tr.locale }),
      });
      if (r.status === 503) {
        setEstado("sinConfig");
        return;
      }
      const d = (await r.json()) as { ok?: boolean; url?: string };
      if (!r.ok || !d.url) throw new Error("regalo");
      window.location.assign(d.url);
    } catch {
      setEstado("error");
    }
  };

  const inputCls =
    "mt-1 w-full rounded-2xl border border-tinta-suave/30 bg-transparent px-4 py-2 text-base outline-none focus:border-acento sm:text-sm";

  return (
    <form onSubmit={comprar} className="mt-8 flex flex-col gap-5">
      <div>
        <p className="text-xs uppercase tracking-widest text-tinta-suave">
          {t("regalo.importe")}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESETS.map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={!personalizado && importe === v}
              onClick={() => {
                setImporte(v);
                setPersonalizado(false);
              }}
              className={chip(!personalizado && importe === v)}
            >
              ${v}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={personalizado}
            onClick={() => setPersonalizado(true)}
            className={chip(personalizado)}
          >
            {t("regalo.importe.otro")}
          </button>
        </div>
        {personalizado && (
          <input
            type="number"
            min={10}
            max={500}
            value={importe}
            onChange={(e) =>
              setImporte(
                Math.max(10, Math.min(500, Math.round(Number(e.target.value) || 0))),
              )
            }
            className="mt-2 w-32 rounded-2xl border border-tinta-suave/30 bg-transparent px-4 py-2 text-right outline-none focus:border-acento"
          />
        )}
      </div>

      <div>
        <label className="text-sm text-tinta-suave" htmlFor="regalo-destinatario">
          {t("regalo.destinatario")}
        </label>
        <input
          id="regalo-destinatario"
          type="email"
          required
          value={destinatario}
          onChange={(e) => setDestinatario(e.target.value)}
          className={inputCls}
        />
      </div>

      <div>
        <label className="text-sm text-tinta-suave" htmlFor="regalo-comprador">
          {t("regalo.comprador")}
        </label>
        <input
          id="regalo-comprador"
          type="email"
          required
          value={comprador}
          onChange={(e) => setComprador(e.target.value)}
          className={inputCls}
        />
      </div>

      <div>
        <label className="text-sm text-tinta-suave" htmlFor="regalo-mensaje">
          {t("regalo.mensaje")}
        </label>
        <textarea
          id="regalo-mensaje"
          rows={2}
          maxLength={200}
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          className={inputCls}
        />
      </div>

      <button
        type="submit"
        disabled={estado === "enviando" || !destinatario || !comprador}
        className="boton-primario w-full disabled:opacity-40 sm:w-auto"
      >
        {estado === "enviando"
          ? t("regalo.enviando")
          : tf("regalo.comprar", { importe: `$${importe}` })}
      </button>

      {estado === "error" && (
        <p role="alert" className="text-sm text-acento">
          {t("regalo.error")}
        </p>
      )}
      {estado === "sinConfig" && (
        <p role="alert" className="text-sm text-acento">
          {t("regalo.noConfig")}
        </p>
      )}
      <p className="text-xs text-tinta-suave">{t("regalo.nota")}</p>
    </form>
  );
}
