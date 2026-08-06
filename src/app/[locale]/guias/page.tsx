import type { Metadata } from "next";
import Link from "next/link";
import { GUIAS } from "@/lib/data/guias";
import { getT, resolverLocale, LOCALES, type Locale } from "@/lib/i18n";
import { alternatesDeRuta, rutaLocalizada } from "@/lib/i18n/rutas";

// Índice de guías capilares (mejora L4). SSG por idioma.
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata(
  props: PageProps<"/[locale]/guias">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const loc = resolverLocale(locale);
  const { t } = getT(loc);
  return {
    title: t("guias.titulo"),
    description: t("guias.intro"),
    alternates: alternatesDeRuta(loc, "/guias"),
  };
}

export default async function PaginaGuias(props: PageProps<"/[locale]/guias">) {
  const { locale } = await props.params;
  const loc: Locale = resolverLocale(locale);
  const { t } = getT(loc);
  const r = (path: string) => rutaLocalizada(loc, path);

  return (
    <main className="mx-auto max-w-2xl px-6 pb-24 pt-28">
      <h1 className="font-display text-3xl sm:text-4xl">{t("guias.titulo")}</h1>
      <p className="mt-3 text-tinta-suave">{t("guias.intro")}</p>

      <ul className="mt-10 flex flex-col gap-6">
        {GUIAS.map((g) => (
          <li key={g.slug}>
            <Link
              href={r(`/guias/${g.slug}`)}
              className="block rounded-3xl border border-tinta-suave/20 p-6 transition-colors hover:border-tinta-suave/50 hover:bg-fondo-1/40"
            >
              <h2 className="font-display text-xl">{g.titulo[loc]}</h2>
              <p className="mt-2 text-sm leading-relaxed text-tinta-suave">
                {g.resumen[loc]}
              </p>
              <span className="mt-3 inline-block text-sm text-acento">
                {t("guias.leer")} →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
