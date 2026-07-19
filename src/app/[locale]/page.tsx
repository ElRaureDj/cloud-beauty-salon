import type { Metadata } from "next";
import Experiencia from "@/components/experiencia/Experiencia";
import { getT, resolverLocale } from "@/lib/i18n";
import { alternatesDeRuta } from "@/lib/i18n/rutas";

// Título y descripción vienen del layout; aquí solo añadimos los hreflang de la
// portada (§9 SEO). Metadata de segmentos hijos se fusiona con la del padre.
export async function generateMetadata(
  props: PageProps<"/[locale]">,
): Promise<Metadata> {
  const { locale } = await props.params;
  return { alternates: alternatesDeRuta(resolverLocale(locale), "/") };
}

export default async function PaginaInicio(props: PageProps<"/[locale]">) {
  const { locale } = await props.params;
  const { t } = getT(resolverLocale(locale));
  return (
    <main>
      {/* Texto renderizado en servidor: la venta nunca depende del canvas (§2). */}
      <h1 className="sr-only">{`${t("marca.nombre")} — ${t("hero.tagline")}`}</h1>
      <Experiencia />
    </main>
  );
}
