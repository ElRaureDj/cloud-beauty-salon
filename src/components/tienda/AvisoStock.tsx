"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";

// "Avísame cuando vuelva" (mejora F2): formulario para productos agotados. Deja
// el email y POST a /api/avisos. Honeypot "web" como en el newsletter.
export default function AvisoStock({ productoId }: { productoId: string }) {
  const tr = useT();
  const { t } = tr;
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "error">(
    "idle",
  );
  const [email, setEmail] = useState("");
  const [web, setWeb] = useState(""); // honeypot

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEstado("enviando");
    try {
      const r = await fetch("/api/avisos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          producto: productoId,
          email,
          locale: tr.locale,
          web,
        }),
      });
      setEstado(r.ok ? "ok" : "error");
    } catch {
      setEstado("error");
    }
  };

  if (estado === "ok") {
    return (
      <p className="mt-3 text-sm text-acento" role="status">
        {t("aviso.ok")}
      </p>
    );
  }

  return (
    <form onSubmit={enviar} className="mt-3">
      <p className="text-sm text-tinta-suave">{t("aviso.intro")}</p>
      <div className="mt-2 flex gap-2">
        <label className="sr-only" htmlFor={`aviso-${productoId}`}>
          {t("aviso.placeholder")}
        </label>
        <input
          id={`aviso-${productoId}`}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("aviso.placeholder")}
          className="min-w-0 flex-1 rounded-full border border-tinta-suave/30 bg-transparent px-4 py-2 text-base outline-none focus:border-acento sm:text-sm"
        />
        {/* Honeypot: invisible para personas, tentador para bots. */}
        <input
          type="text"
          name="web"
          value={web}
          onChange={(e) => setWeb(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="hidden"
        />
        <button
          type="submit"
          disabled={estado === "enviando"}
          className="boton-primario shrink-0 px-4 py-2 text-sm disabled:opacity-50"
        >
          {estado === "enviando" ? t("aviso.enviando") : t("aviso.boton")}
        </button>
      </div>
      {estado === "error" && (
        <p className="mt-2 text-sm text-acento" role="alert">
          {t("aviso.error")}
        </p>
      )}
    </form>
  );
}
