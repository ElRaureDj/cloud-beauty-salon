import type { Metadata } from "next";
import Link from "next/link";
import { t } from "@/lib/i18n/es";

export const metadata: Metadata = { title: t("contacto.titulo") };

// §6 — ruta fuera de la experiencia. Contenido al decidir marca y canales (§9.5).
export default function PaginaContacto() {
  return (
    <main className="mx-auto max-w-2xl px-6 pb-24 pt-28">
      <h1 className="font-display text-3xl">{t("contacto.titulo")}</h1>
      <p className="nota-todo mt-6">
        TODO(guion §9.5): datos de contacto reales (WhatsApp, dirección, redes)
        al tener marca y dominio.
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
