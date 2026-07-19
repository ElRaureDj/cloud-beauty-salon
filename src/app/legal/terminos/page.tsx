import type { Metadata } from "next";
import Link from "next/link";
import { t } from "@/lib/i18n/es";

export const metadata: Metadata = { title: t("legal.terminos.titulo") };

// §6 — /legal/*. TODO(guion): texto legal real antes de salir a producción.
export default function PaginaTerminos() {
  return (
    <main className="mx-auto max-w-2xl px-6 pb-24 pt-28">
      <h1 className="font-display text-3xl">{t("legal.terminos.titulo")}</h1>
      <p className="nota-todo mt-6">
        TODO(guion): términos, políticas de envío y devolución (§4 Cap. 7) según
        la decisión de envíos (§9.3).
      </p>
      <Link
        href="/"
        className="mt-10 inline-block text-acento underline-offset-4 hover:underline"
      >
        {t("tienda.volver")}
      </Link>
    </main>
  );
}
