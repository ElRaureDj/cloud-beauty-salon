import type { Metadata } from "next";
import Link from "next/link";
import { t } from "@/lib/i18n/es";

export const metadata: Metadata = {
  title: t("tienda.titulo"),
  description:
    "Productos capilares profesionales Trust: champús, acondicionadores, máscaras y leave-ins.",
};

// §6: /tienda es servidor, ligera e indexable; el canvas solo existe en "/".
export default function PaginaTienda() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-24 pt-28">
      <h1 className="font-display text-3xl sm:text-4xl">{t("tienda.titulo")}</h1>
      <p className="mt-3 max-w-prose text-tinta-suave">{t("copy.marca.trust")}.</p>
      <p className="nota-todo mt-6">
        TODO(fase-2): grid real con filtros por categoría, etapa del cronograma y línea (§6),
        sobre el catálogo Trust con precios de distribución (§9.6).
      </p>
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3" aria-hidden>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] rounded-2xl bg-fondo-1/70" />
        ))}
      </div>
      <Link
        href="/"
        className="mt-12 inline-block text-acento underline-offset-4 hover:underline"
      >
        {t("tienda.volver")}
      </Link>
    </main>
  );
}
