import type { Metadata } from "next";
import Link from "next/link";
import { CATALOGO, type Etapa } from "@/lib/catalogo";
import { ETAPAS } from "@/lib/formato";
import { getT, resolverLocale, LOCALES } from "@/lib/i18n";
import { alternatesDeRuta, rutaLocalizada } from "@/lib/i18n/rutas";
import PlanCronograma, {
  type ItemEtapa,
} from "@/components/tienda/PlanCronograma";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata(
  props: PageProps<"/[locale]/cronograma">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const loc = resolverLocale(locale);
  const { t } = getT(loc);
  return {
    title: t("cronograma.titulo"),
    description: t("cronograma.intro"),
    alternates: alternatesDeRuta(loc, "/cronograma"),
  };
}

export default async function PaginaCronograma(
  props: PageProps<"/[locale]/cronograma">,
) {
  const { locale } = await props.params;
  const loc = resolverLocale(locale);
  const { t } = getT(loc);

  // Tratamiento recomendado por etapa: máscaras y boosters de esa etapa con
  // precio, para que el plan pueda sugerir uno y añadirlo.
  const productosPorEtapa = Object.fromEntries(
    ETAPAS.map((et) => {
      const items: ItemEtapa[] = CATALOGO.filter(
        (p) =>
          p.precio > 0 &&
          p.etapa.includes(et) &&
          (p.categoria === "mascara" || p.categoria === "booster"),
      )
        .slice(0, 4)
        .map((p) => ({
          id: p.id,
          nombre: p.nombre,
          precio: p.precio,
          imagen: p.imagen,
        }));
      return [et, items];
    }),
  ) as Record<Etapa, ItemEtapa[]>;

  return (
    <main className="mx-auto max-w-2xl px-6 pb-24 pt-28">
      <h1 className="font-display text-3xl sm:text-4xl">{t("cronograma.titulo")}</h1>
      <p className="mt-3 text-tinta-suave">{t("cronograma.intro")}</p>

      <PlanCronograma productosPorEtapa={productosPorEtapa} />

      <Link
        href={rutaLocalizada(loc, "/tienda")}
        className="mt-12 inline-block text-acento underline-offset-4 hover:underline"
      >
        {t("producto.volverTienda")}
      </Link>
    </main>
  );
}
