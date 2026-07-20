"use client";

import { useState } from "react";
import Link from "next/link";
import { useT, useLocale, useRuta } from "@/lib/i18n/client";

// Alta al boletín (bloque 4). Compacto para vivir en el cierre/pie: email +
// botón. El alta es de DOBLE OPT-IN: el éxito aquí solo significa "revisa tu
// correo"; nadie queda suscrito sin confirmar su enlace.
export default function FormularioNewsletter() {
  const { t } = useT();
  const locale = useLocale();
  const ruta = useRuta();
  const [email, setEmail] = useState("");
  const [miel, setMiel] = useState("");
  const [estado, setEstado] = useState<
    "editando" | "enviando" | "exito" | "invalido" | "error"
  >("editando");

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const limpio = email.trim();
    if (!limpio.includes("@") || !limpio.includes(".")) {
      setEstado("invalido");
      return;
    }
    setEstado("enviando");
    try {
      const r = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: limpio, locale, web: miel }),
      });
      if (r.status === 400) {
        setEstado("invalido");
        return;
      }
      if (!r.ok) throw new Error(String(r.status));
      setEstado("exito");
      setEmail("");
    } catch {
      setEstado("error");
    }
  };

  if (estado === "exito") {
    return (
      <p role="status" className="text-sm text-acento">
        {t("news.exito")}
      </p>
    );
  }

  return (
    <form onSubmit={enviar} noValidate className="w-full max-w-sm">
      <p className="text-sm text-tinta-suave">
        <span className="font-medium text-tinta">{t("news.titulo")}</span>
        {" · "}
        {t("news.intro")}
      </p>

      {/* Honeypot: invisible para humanos (route.ts responde éxito falso). */}
      <input
        type="text"
        name="web"
        value={miel}
        onChange={(e) => setMiel(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-px w-px opacity-0"
      />

      <div className="mt-2 flex gap-2">
        <label className="sr-only" htmlFor="news-email">
          {t("news.placeholder")}
        </label>
        <input
          id="news-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t("news.placeholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-w-0 flex-1 rounded-full border border-tinta-suave/30 bg-transparent px-4 py-2 text-base outline-none focus:border-acento sm:text-sm"
        />
        <button
          type="submit"
          disabled={estado === "enviando"}
          className="boton-primario shrink-0 px-4 py-2 text-sm disabled:opacity-40"
        >
          {estado === "enviando" ? t("news.enviando") : t("news.boton")}
        </button>
      </div>

      {estado === "invalido" && (
        <p role="alert" className="mt-2 text-sm text-acento">
          {t("news.invalido")}
        </p>
      )}
      {estado === "error" && (
        <p role="alert" className="mt-2 text-sm text-acento">
          {t("news.error")}
        </p>
      )}

      <p className="mt-2 text-xs text-tinta-suave">
        {t("news.legalPre")}
        <Link
          href={ruta("/legal/privacidad")}
          className="underline underline-offset-2 hover:text-tinta"
        >
          {t("news.legalEnlace")}
        </Link>
        .
      </p>
    </form>
  );
}
