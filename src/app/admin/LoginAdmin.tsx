"use client";

import { useState } from "react";

// Login del panel (bloque 3). Español (interno). Al acertar, recarga para que
// el server component vea la cookie y muestre el panel.
export default function LoginAdmin() {
  const [password, setPassword] = useState("");
  const [estado, setEstado] = useState<"editando" | "enviando" | "error">(
    "editando",
  );

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEstado("enviando");
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (r.ok) {
        window.location.reload();
        return;
      }
      setEstado("error");
    } catch {
      setEstado("error");
    }
  };

  return (
    <main className="grid min-h-svh place-items-center px-6">
      <form onSubmit={enviar} className="w-full max-w-xs">
        <h1 className="font-display text-2xl">Panel · Cloud Beauty Salon</h1>
        <label
          className="mt-6 block text-sm text-tinta-suave"
          htmlFor="admin-pass"
        >
          Contraseña
        </label>
        <input
          id="admin-pass"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          className="mt-1 w-full rounded-2xl border border-tinta-suave/30 bg-transparent px-4 py-3 outline-none focus:border-acento"
        />
        {estado === "error" && (
          <p role="alert" className="mt-2 text-sm text-acento">
            Contraseña incorrecta.
          </p>
        )}
        <button
          type="submit"
          disabled={estado === "enviando"}
          className="boton-primario mt-4 w-full disabled:opacity-40"
        >
          {estado === "enviando" ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
