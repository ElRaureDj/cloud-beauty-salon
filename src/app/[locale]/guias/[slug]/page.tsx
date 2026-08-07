import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { productoPorId } from "@/lib/catalogo";
import { textoPrecio } from "@/lib/formato";
import { GUIAS, guiaPorSlug } from "@/lib/data/guias";
import { getT, resolverLocale, LOCALES, type Locale } from "@/lib/i18n";
import { alternatesDeRuta, rutaLocalizada } from "@/lib/i18n/rutas";
import ImagenProducto from "@/components/tienda/ImagenProducto";

// Guía capilar (mejora L4). SSG por idioma, con JSON-LD Article y productos
// del catálogo enlazados.
export function generateStaticParams() {
  return LOCALES.flatMap((locale) => GUIAS.map((g) => ({ locale, slug: g.slug })));
}

export const dynamicParams = false;

export async function generateMetadata(
  props: PageProps<"/[locale]/guias/[slug]">,
): Promise<Metadata> {
  const { locale, slug } = await props.params;
  const guia = guiaPorSlug(slug);
  if (!guia) return {};
  const loc = resolverLocale(locale);
  return {
    title: guia.titulo[loc],
    description: guia.resumen[loc],
    alternates: alternatesDeRuta(loc, `/guias/${slug}`),
  };
}

export default async function PaginaGuia(
  props: PageProps<"/[locale]/guias/[slug]">,
) {
  const { locale, slug } = await props.params;
  const guia = guiaPorSlug(slug);
  if (!guia) notFound();

  const loc: Locale = resolverLocale(locale);
  const tr = getT(loc);
  const { t } = tr;
  const r = (path: string) => rutaLocalizada(loc, path);
  const sitio = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cloudbeautysalon.com";

  const productos = guia.productos
    .map((id) => productoPorId(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guia.titulo[loc],
    description: guia.resumen[loc],
    datePublished: guia.fecha,
    inLanguage: loc === "en" ? "en-US" : "es-ES",
    author: { "@type": "Organization", name: "Cloud Beauty Salon" },
    publisher: { "@type": "Organization", name: "Cloud Beauty Salon" },
    mainEntityOfPage: `${sitio}${r(`/guias/${slug}`)}`,
  };

  return (
    <main className="mx-auto max-w-2xl px-6 pb-24 pt-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <nav className="text-sm text-tinta-suave">
        <Link href={r("/guias")} className="underline-offset-4 hover:underline">
          {t("guias.titulo")}
        </Link>
      </nav>

      <h1 className="mt-4 font-display text-3xl leading-tight sm:text-4xl">
        {guia.titulo[loc]}
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-tinta-suave">
        {guia.resumen[loc]}
      </p>

      {guia.secciones.map((s) => (
        <section key={s.titulo.es} className="mt-10">
          <h2 className="font-display text-xl">{s.titulo[loc]}</h2>
          {s.parrafos[loc].map((p, i) => (
            <p key={i} className="mt-3 leading-relaxed text-tinta-suave">
              {p}
            </p>
          ))}
        </section>
      ))}

      {productos.length > 0 && (
        <section className="mt-14 border-t border-borde pt-10">
          <h2 className="font-display text-xl">{t("guias.productos")}</h2>
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {productos.map((p) => (
              <li key={p.id}>
                <Link
                  href={r(`/producto/${p.id}`)}
                  className="group block rounded-3xl border border-transparent p-2 transition-colors hover:border-borde hover:bg-fondo-1/40"
                >
                  <ImagenProducto producto={p} clase="aspect-square w-full" />
                  <p className="mt-2 text-sm leading-snug">{p.nombre}</p>
                  <p className="mt-0.5 text-xs font-medium tabular-nums text-tinta-suave">
                    {textoPrecio(p.precio, tr)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link
        href={r("/guias")}
        className="mt-12 inline-block text-acento underline-offset-4 hover:underline"
      >
        ← {t("guias.titulo")}
      </Link>
    </main>
  );
}
