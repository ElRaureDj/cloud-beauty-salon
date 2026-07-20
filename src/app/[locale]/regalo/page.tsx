import type { Metadata } from "next";
import Link from "next/link";
import { getT, resolverLocale, LOCALES } from "@/lib/i18n";
import { alternatesDeRuta, rutaLocalizada } from "@/lib/i18n/rutas";
import FormularioRegalo from "@/components/tienda/FormularioRegalo";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata(
  props: PageProps<"/[locale]/regalo">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const loc = resolverLocale(locale);
  const { t } = getT(loc);
  return {
    title: t("regalo.titulo"),
    description: t("regalo.intro"),
    alternates: alternatesDeRuta(loc, "/regalo"),
  };
}

export default async function PaginaRegalo(props: PageProps<"/[locale]/regalo">) {
  const { locale } = await props.params;
  const loc = resolverLocale(locale);
  const { t } = getT(loc);

  return (
    <main className="mx-auto max-w-md px-6 pb-24 pt-28">
      <h1 className="font-display text-3xl sm:text-4xl">{t("regalo.titulo")}</h1>
      <p className="mt-3 text-tinta-suave">{t("regalo.intro")}</p>

      <FormularioRegalo />

      <Link
        href={rutaLocalizada(loc, "/tienda")}
        className="mt-12 inline-block text-acento underline-offset-4 hover:underline"
      >
        {t("producto.volverTienda")}
      </Link>
    </main>
  );
}
