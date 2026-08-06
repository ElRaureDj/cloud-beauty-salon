import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { nombreEtapa, textoPrecio } from "@/lib/formato";
import { getT, resolverLocale, LOCALES } from "@/lib/i18n";
import { alternatesDeRuta, rutaLocalizada } from "@/lib/i18n/rutas";
import { lineaPorSlug, lineas } from "@/lib/lineas";
import ImagenProducto from "@/components/tienda/ImagenProducto";
import BotonFavorito from "@/components/tienda/BotonFavorito";

// Landing SEO por línea TRUSS (mejora K2): derivada 100% del catálogo, SSG por
// idioma. Captura búsquedas de marca ("truss ultra hydration", …).
export function generateStaticParams() {
  return LOCALES.flatMap((locale) =>
    lineas().map((l) => ({ locale, slug: l.slug })),
  );
}

export const dynamicParams = false;

export async function generateMetadata(
  props: PageProps<"/[locale]/linea/[slug]">,
): Promise<Metadata> {
  const { locale, slug } = await props.params;
  const linea = lineaPorSlug(slug);
  if (!linea) return {};
  const loc = resolverLocale(locale);
  const { tf } = getT(loc);
  return {
    title: tf("linea.titulo", { nombre: linea.nombre }),
    description: tf("linea.meta", {
      nombre: linea.nombre,
      n: linea.productos.length,
    }),
    alternates: alternatesDeRuta(loc, `/linea/${slug}`),
  };
}

export default async function PaginaLinea(
  props: PageProps<"/[locale]/linea/[slug]">,
) {
  const { locale, slug } = await props.params;
  const linea = lineaPorSlug(slug);
  if (!linea) notFound();

  const loc = resolverLocale(locale);
  const tr = getT(loc);
  const { t, tf } = tr;
  const r = (path: string) => rutaLocalizada(loc, path);
  const sitio = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cloudbeautysalon.com";

  const etapasTexto = linea.etapas.map((e) => nombreEtapa(e, tr)).join(" · ");

  // JSON-LD: miga de pan + lista de productos de la línea.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: t("tienda.titulo"),
            item: `${sitio}${r("/tienda")}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: linea.nombre,
            item: `${sitio}${r(`/linea/${slug}`)}`,
          },
        ],
      },
      {
        "@type": "ItemList",
        name: tf("linea.titulo", { nombre: linea.nombre }),
        itemListElement: linea.productos.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${sitio}${r(`/producto/${p.id}`)}`,
          name: p.nombre,
        })),
      },
    ],
  };

  return (
    <main className="mx-auto max-w-5xl px-6 pb-24 pt-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <nav className="text-sm text-tinta-suave">
        <Link href={r("/tienda")} className="underline-offset-4 hover:underline">
          {t("tienda.titulo")}
        </Link>{" "}
        / {linea.nombre}
      </nav>

      <h1 className="mt-4 font-display text-3xl sm:text-4xl">
        {tf("linea.titulo", { nombre: linea.nombre })}
      </h1>
      <p className="mt-3 max-w-prose text-tinta-suave">
        {tf("linea.intro", {
          nombre: linea.nombre,
          etapas: etapasTexto,
          n: linea.productos.length,
        })}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {linea.etapas.map((e) => (
          <span
            key={e}
            className="rounded-full bg-fondo-1 px-3 py-1 text-xs text-tinta-suave"
          >
            {nombreEtapa(e, tr)}
          </span>
        ))}
      </div>

      <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {linea.productos.map((p, i) => (
          <li key={p.id} className="group relative">
            <Link
              href={r(`/producto/${p.id}`)}
              className="group block rounded-3xl border border-transparent p-2 transition-colors hover:border-tinta-suave/20 hover:bg-fondo-1/40"
            >
              <ImagenProducto
                producto={p}
                clase="aspect-square w-full"
                prioritaria={i < 3}
              />
              <p className="mt-3 text-sm leading-snug">{p.nombre}</p>
              <p className="mt-0.5 text-xs text-tinta-suave">
                {p.tamano ? p.tamano.split("/")[0].trim() : ""}
              </p>
              <p className="mt-1 text-sm font-medium tabular-nums">
                {textoPrecio(p.precio, tr)}
              </p>
            </Link>
            <BotonFavorito
              id={p.id}
              className="absolute right-3 top-3 h-9 w-9 bg-fondo-0/70 backdrop-blur-sm"
            />
          </li>
        ))}
      </ul>

      <div className="mt-12 flex flex-wrap gap-4">
        <Link
          href={`${r("/tienda")}?linea=${encodeURIComponent(linea.nombre)}`}
          className="boton-secundario"
        >
          {t("linea.verFiltrada")}
        </Link>
        <Link
          href={r("/tienda")}
          className="inline-flex items-center text-acento underline-offset-4 hover:underline"
        >
          {t("producto.volverTienda")}
        </Link>
      </div>
    </main>
  );
}
