import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATALOGO, combinaCon, productoPorSlug } from "@/lib/catalogo";
import { nombreCategoria, nombreEtapa, textoPrecio } from "@/lib/formato";
import { getT, resolverLocale, LOCALES } from "@/lib/i18n";
import { alternatesDeRuta, rutaLocalizada } from "@/lib/i18n/rutas";
import { resumenPorProducto } from "@/lib/resenas";
import { stockDeProducto } from "@/lib/stock";
import { descripcionProducto, modoDeUsoProducto } from "@/lib/producto-i18n";
import PanelCompra from "@/components/tienda/PanelCompra";
import AnadirRutina from "@/components/tienda/AnadirRutina";
import BotonFavorito from "@/components/tienda/BotonFavorito";
import Resenas from "@/components/tienda/Resenas";
import ImagenProducto from "@/components/tienda/ImagenProducto";
import RegistrarVisto from "@/components/tienda/RegistrarVisto";
import VistosRecientes from "@/components/tienda/VistosRecientes";

// §6: fichas renderizadas en servidor e indexables; se prerenderiza todo el
// catálogo en build, para cada idioma.
export function generateStaticParams() {
  return LOCALES.flatMap((locale) => CATALOGO.map((p) => ({ locale, slug: p.id })));
}

// ISR (mejora F3): la ficha sigue prerenderizada, pero se revalida cada hora
// para refrescar el rating y el stock del JSON-LD (datos estructurados). Sin BD
// el prerender funciona igual (rating/stock ausentes → JSON-LD sin esos campos).
export const revalidate = 3600;

export async function generateMetadata(
  props: PageProps<"/[locale]/producto/[slug]">,
): Promise<Metadata> {
  const { locale, slug } = await props.params;
  const producto = productoPorSlug(slug);
  if (!producto) return {};
  // El nombre TRUSS es universal; la descripción se traduce según el idioma.
  const loc = resolverLocale(locale);
  const marca = getT(loc).t("marca.nombre");
  const desc = descripcionProducto(producto, loc);
  return {
    title: producto.nombre,
    description: desc,
    alternates: alternatesDeRuta(loc, `/producto/${slug}`),
    // Al compartir una ficha, la tarjeta usa el packshot real del producto
    // (§ bloque 4). openGraph/twitter no se fusionan con el layout: los repetimos.
    openGraph: {
      type: "website",
      siteName: marca,
      title: producto.nombre,
      description: desc,
      locale: loc === "en" ? "en_US" : "es_ES",
      images: [
        { url: producto.imagen, width: 800, height: 800, alt: producto.nombre },
      ],
    },
    twitter: {
      // El packshot es cuadrado (800×800): "summary" lo muestra íntegro; con
      // "summary_large_image" X lo recortaría a ~1.91:1 y amputaría el producto.
      card: "summary",
      title: producto.nombre,
      description: desc,
      images: [producto.imagen],
    },
  };
}

export default async function PaginaProducto(
  props: PageProps<"/[locale]/producto/[slug]">,
) {
  const { locale, slug } = await props.params;
  const producto = productoPorSlug(slug);
  if (!producto) notFound();

  const loc = resolverLocale(locale);
  const tr = getT(loc);
  const { t } = tr;
  const r = (path: string) => rutaLocalizada(loc, path);

  const relacionados = combinaCon(producto);

  // Datos estructurados (F3): Product + Offer + AggregateRating para resultados
  // enriquecidos en Google (estrellas). Rating/stock son best-effort (sin BD se
  // omiten). Se leen aquí porque la página es ISR (revalidate arriba).
  const [resumen, stock] = await Promise.all([
    resumenPorProducto([producto.id]),
    stockDeProducto(producto.id),
  ]);
  const rating = resumen.get(producto.id);
  const sitio =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://cloudbeautysalon.com";
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: producto.nombre,
    description: descripcionProducto(producto, loc),
    image: `${sitio}${producto.imagen}`,
    brand: { "@type": "Brand", name: "TRUSS" },
    ...(producto.precio > 0
      ? {
          offers: {
            "@type": "Offer",
            price: producto.precio.toFixed(2),
            priceCurrency: "USD",
            availability:
              stock === 0
                ? "https://schema.org/OutOfStock"
                : "https://schema.org/InStock",
            url: `${sitio}${r(`/producto/${slug}`)}`,
          },
        }
      : {}),
    ...(rating && rating.total > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: rating.media.toFixed(1),
            reviewCount: rating.total,
          },
        }
      : {}),
  };

  return (
    <main className="mx-auto max-w-4xl px-6 pb-24 pt-28">
      {/* JSON-LD (F3): "<" escapado para no cerrar el <script> con datos. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <RegistrarVisto id={producto.id} />
      <nav className="text-sm text-tinta-suave">
        <Link href={r("/tienda")} className="underline-offset-4 hover:underline">
          {t("tienda.titulo")}
        </Link>{" "}
        / {nombreCategoria(producto.categoria, tr)}
      </nav>

      <div className="mt-6 grid gap-8 sm:grid-cols-2">
        <ImagenProducto producto={producto} clase="aspect-square w-full" prioritaria />

        <div>
          <p className="text-xs uppercase tracking-widest text-tinta-suave">
            {producto.linea}
          </p>
          <div className="mt-1 flex items-start justify-between gap-3">
            <h1 className="font-display text-3xl">{producto.nombre}</h1>
            <BotonFavorito
              id={producto.id}
              className="mt-1 h-10 w-10 shrink-0 border border-tinta-suave/30"
            />
          </div>
          {producto.tamano && (
            <p className="mt-1 text-xs uppercase tracking-wide text-tinta-suave">
              {producto.tamano}
            </p>
          )}
          <p className="mt-2 text-lg">{textoPrecio(producto.precio, tr)}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {producto.etapa.map((e) => (
              <span
                key={e}
                className="rounded-full bg-fondo-1 px-3 py-1 text-xs text-tinta-suave"
              >
                {nombreEtapa(e, tr)}
              </span>
            ))}
          </div>

          <p className="mt-5 leading-relaxed">
            {descripcionProducto(producto, loc)}
          </p>

          <div className="mt-6">
            <PanelCompra producto={producto} />
          </div>

          <h2 className="mt-8 font-display text-lg">{t("producto.modoDeUso")}</h2>
          <p className="mt-2 leading-relaxed text-tinta-suave">
            {modoDeUsoProducto(producto, loc)}
          </p>
        </div>
      </div>

      <Resenas productoId={producto.id} />

      {relacionados.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-xl">{t("producto.completaRutina")}</h2>
          <p className="mt-1 text-sm text-tinta-suave">
            {t("producto.completaRutina.intro")}
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {relacionados.map((p) => (
              <li key={p.id}>
                <Link
                  href={r(`/producto/${p.id}`)}
                  className="group block rounded-3xl border border-transparent p-2 transition-colors hover:border-tinta-suave/20"
                >
                  <ImagenProducto producto={p} clase="aspect-square w-full" />
                  <p className="mt-2 text-sm leading-snug">{p.nombre}</p>
                  <p className="mt-0.5 text-xs text-tinta-suave">
                    {textoPrecio(p.precio, tr)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          <AnadirRutina
            items={[producto, ...relacionados].map((p) => ({
              id: p.id,
              nombre: p.nombre,
              precio: p.precio,
              imagen: p.imagen,
            }))}
          />
        </section>
      )}

      <VistosRecientes
        excluir={producto.id}
        catalogo={CATALOGO.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          precio: p.precio,
          imagen: p.imagen,
        }))}
      />

      <Link
        href={r("/tienda")}
        className="mt-12 inline-block text-acento underline-offset-4 hover:underline"
      >
        {t("producto.volverTienda")}
      </Link>
    </main>
  );
}
