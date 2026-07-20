import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATALOGO, combinaCon, productoPorSlug } from "@/lib/catalogo";
import { nombreCategoria, nombreEtapa, textoPrecio } from "@/lib/formato";
import { getT, resolverLocale, LOCALES } from "@/lib/i18n";
import { alternatesDeRuta, rutaLocalizada } from "@/lib/i18n/rutas";
import PanelCompra from "@/components/tienda/PanelCompra";
import Resenas from "@/components/tienda/Resenas";
import ImagenProducto from "@/components/tienda/ImagenProducto";

// §6: fichas renderizadas en servidor e indexables; se prerenderiza todo el
// catálogo en build, para cada idioma.
export function generateStaticParams() {
  return LOCALES.flatMap((locale) => CATALOGO.map((p) => ({ locale, slug: p.id })));
}

export async function generateMetadata(
  props: PageProps<"/[locale]/producto/[slug]">,
): Promise<Metadata> {
  const { locale, slug } = await props.params;
  const producto = productoPorSlug(slug);
  if (!producto) return {};
  // Nombre y descripción vienen del catálogo TRUSS (universales); el título de
  // pestaña añade la marca vía el template del layout.
  const loc = resolverLocale(locale);
  const marca = getT(loc).t("marca.nombre");
  return {
    title: producto.nombre,
    description: producto.descripcion,
    alternates: alternatesDeRuta(loc, `/producto/${slug}`),
    // Al compartir una ficha, la tarjeta usa el packshot real del producto
    // (§ bloque 4). openGraph/twitter no se fusionan con el layout: los repetimos.
    openGraph: {
      type: "website",
      siteName: marca,
      title: producto.nombre,
      description: producto.descripcion,
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
      description: producto.descripcion,
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

  return (
    <main className="mx-auto max-w-4xl px-6 pb-24 pt-28">
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
          <h1 className="mt-1 font-display text-3xl">{producto.nombre}</h1>
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

          <p className="mt-5 leading-relaxed">{producto.descripcion}</p>

          <div className="mt-6">
            <PanelCompra producto={producto} />
          </div>

          <h2 className="mt-8 font-display text-lg">{t("producto.modoDeUso")}</h2>
          <p className="mt-2 leading-relaxed text-tinta-suave">{producto.modoDeUso}</p>
        </div>
      </div>

      <Resenas productoId={producto.id} />

      {relacionados.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-xl">{t("producto.combinaCon")}</h2>
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
        </section>
      )}

      <Link
        href={r("/tienda")}
        className="mt-12 inline-block text-acento underline-offset-4 hover:underline"
      >
        {t("producto.volverTienda")}
      </Link>
    </main>
  );
}
