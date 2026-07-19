import type { Metadata } from "next";
import Link from "next/link";
import { t } from "@/lib/i18n/es";

export const metadata: Metadata = { title: t("legal.privacidad.titulo") };

// §6 — /legal/*. TODO(guion): texto legal real antes de salir a producción.
export default function PaginaPrivacidad() {
  return (
    <main className="mx-auto max-w-2xl px-6 pb-24 pt-28">
      <h1 className="font-display text-3xl">{t("legal.privacidad.titulo")}</h1>
      <p className="nota-todo mt-6">
        TODO(guion): política de privacidad real (tratamiento de los datos de la
        lista de espera y del carrito) antes de publicar.
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
