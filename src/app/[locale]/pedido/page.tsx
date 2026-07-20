import type { Metadata } from "next";
import Link from "next/link";
import { getT, resolverLocale, LOCALES } from "@/lib/i18n";
import { rutaLocalizada } from "@/lib/i18n/rutas";
import ConsultaPedido from "@/components/tienda/ConsultaPedido";

// Página personal (consulta de pedido) → no se indexa.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function PaginaPedido(
  props: PageProps<"/[locale]/pedido">,
) {
  const { locale } = await props.params;
  const busqueda = await props.searchParams;
  const loc = resolverLocale(locale);
  const { t } = getT(loc);
  const numeroInicial = typeof busqueda.n === "string" ? busqueda.n : undefined;

  return (
    <main className="mx-auto max-w-md px-6 pb-24 pt-28">
      <h1 className="font-display text-3xl sm:text-4xl">{t("pedido.titulo")}</h1>
      <p className="mt-3 text-tinta-suave">{t("pedido.intro")}</p>

      <ConsultaPedido numeroInicial={numeroInicial} />

      <Link
        href={rutaLocalizada(loc, "/contacto")}
        className="mt-10 inline-block text-acento underline-offset-4 hover:underline"
      >
        {t("faq.masPreguntas")}
      </Link>
    </main>
  );
}
