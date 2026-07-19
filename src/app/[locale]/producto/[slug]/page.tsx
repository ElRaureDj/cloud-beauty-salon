import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATALOGO, combinaCon, productoPorSlug } from "@/lib/catalogo";
import { nombreCategoria, nombreEtapa, textoPrecio } from "@/lib/formato";
import { t } from "@/lib/i18n/es";
import { LOCALES } from "@/lib/i18n";
import BotonAgregar from "@/components/tienda/BotonAgregar";
import ImagenProducto from "@/components/tienda/ImagenProducto";

// §6: fichas renderizadas en servidor e indexables; se prerenderiza todo el
// catálogo en build, para cada idioma.
export function generateStaticParams() {
  return LOCALES.flatMap((locale) => CATALOGO.map((p) => ({ locale, slug: p.id })));
}

export async function generateMetadata(
  props: PageProps<"/[locale]/producto/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const producto = productoPorSlug(slug);
  if (!producto) return {};
  return {
    title: producto.nombre,
    description: producto.descripcion,
  };
}

export default async function PaginaProducto(props: PageProps<"/[locale]/producto/[slug]">) {
  const { slug } = await props.params;
  const producto = productoPorSlug(slug);
  if (!producto) notFound();

  const relacionados = combinaCon(producto);

  return (
    <main className="mx-auto max-w-4xl px-6 pb-24 pt-28">
      <nav className="text-sm text-tinta-suave">
        <Link href="/tienda" className="underline-offset-4 hover:underline">
          {t("tienda.titulo")}
        </Link>{" "}
        / {nombreCategoria(producto.categoria)}
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
          <p className="mt-2 text-lg">{textoPrecio(producto.precio)}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {producto.etapa.map((e) => (
              <span
                key={e}
                className="rounded-full bg-fondo-1 px-3 py-1 text-xs text-tinta-suave"
              >
                {nombreEtapa(e)}
              </span>
            ))}
          </div>

          <p className="mt-5 leading-relaxed">{producto.descripcion}</p>

          <div className="mt-6">
            <BotonAgregar producto={producto} />
          </div>

          <h2 className="mt-8 font-display text-lg">{t("producto.modoDeUso")}</h2>
          <p className="mt-2 leading-relaxed text-tinta-suave">{producto.modoDeUso}</p>
        </div>
      </div>

      {relacionados.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-xl">{t("producto.combinaCon")}</h2>
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {relacionados.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/producto/${p.id}`}
                  className="group block rounded-3xl border border-transparent p-2 transition-colors hover:border-tinta-suave/20"
                >
                  <ImagenProducto producto={p} clase="aspect-square w-full" />
                  <p className="mt-2 text-sm leading-snug">{p.nombre}</p>
                  <p className="mt-0.5 text-xs text-tinta-suave">
                    {textoPrecio(p.precio)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link
        href="/tienda"
        className="mt-12 inline-block text-acento underline-offset-4 hover:underline"
      >
        {t("producto.volverTienda")}
      </Link>
    </main>
  );
}
