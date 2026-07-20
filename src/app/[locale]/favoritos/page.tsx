import type { Metadata } from "next";
import Link from "next/link";
import { CATALOGO } from "@/lib/catalogo";
import { getT, resolverLocale, LOCALES } from "@/lib/i18n";
import { rutaLocalizada } from "@/lib/i18n/rutas";
import ListaFavoritos, {
  type ItemFavorito,
} from "@/components/tienda/ListaFavoritos";

// Favoritos (mejora F4): página personal → no se indexa. El shell es estático
// por idioma; la lista es una isla cliente que lee localStorage.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function PaginaFavoritos(
  props: PageProps<"/[locale]/favoritos">,
) {
  const { locale } = await props.params;
  const loc = resolverLocale(locale);
  const { t } = getT(loc);

  // Catálogo mínimo (sin descripciones): evita arrastrar el JSON completo al
  // bundle cliente; la isla filtra por los ids favoritos.
  const catalogo: ItemFavorito[] = CATALOGO.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    precio: p.precio,
    imagen: p.imagen,
    linea: p.linea,
  }));

  return (
    <main className="mx-auto max-w-5xl px-6 pb-24 pt-28">
      <h1 className="font-display text-3xl sm:text-4xl">{t("favoritos.titulo")}</h1>
      <p className="mt-3 max-w-prose text-tinta-suave">{t("favoritos.intro")}</p>

      <ListaFavoritos catalogo={catalogo} />

      <Link
        href={rutaLocalizada(loc, "/tienda")}
        className="mt-14 inline-block text-acento underline-offset-4 hover:underline"
      >
        {t("producto.volverTienda")}
      </Link>
    </main>
  );
}
