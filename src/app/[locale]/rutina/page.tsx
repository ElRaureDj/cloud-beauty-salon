import type { Metadata } from "next";
import Link from "next/link";
import { CATALOGO } from "@/lib/catalogo";
import { getT, resolverLocale, LOCALES } from "@/lib/i18n";
import { alternatesDeRuta, rutaLocalizada } from "@/lib/i18n/rutas";
import ArmaRutina, {
  type ItemRutinaBuilder,
} from "@/components/tienda/ArmaRutina";

// "Arma tu rutina" (mejora L1): bundle builder en 3 pasos con el 10% de rutina
// completa. SSG por idioma; la selección vive en cliente.
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata(
  props: PageProps<"/[locale]/rutina">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const loc = resolverLocale(locale);
  const { t } = getT(loc);
  return {
    title: t("rutina.titulo"),
    description: t("rutina.intro"),
    alternates: alternatesDeRuta(loc, "/rutina"),
  };
}

export default async function PaginaRutina(props: PageProps<"/[locale]/rutina">) {
  const { locale } = await props.params;
  const loc = resolverLocale(locale);
  const { t } = getT(loc);

  const items: ItemRutinaBuilder[] = CATALOGO.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    linea: p.linea,
    precio: p.precio,
    imagen: p.imagen,
    categoria: p.categoria,
  }));

  return (
    <main className="mx-auto max-w-2xl px-6 pb-24 pt-28">
      <h1 className="font-display text-3xl sm:text-4xl">{t("rutina.titulo")}</h1>
      <p className="mt-3 text-tinta-suave">{t("rutina.intro")}</p>

      <ArmaRutina items={items} />

      <p className="mt-8 text-sm text-tinta-suave">
        {t("rutina.nota")}{" "}
        <Link
          href={rutaLocalizada(loc, "/cronograma")}
          className="text-acento underline-offset-4 hover:underline"
        >
          {t("cronograma.enlace")} →
        </Link>
      </p>
    </main>
  );
}
