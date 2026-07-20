import type { Metadata } from "next";
import Link from "next/link";
import { productoPorId } from "@/lib/catalogo";
import { DESCUENTO_BUNDLE } from "@/lib/formato";
import { KITS } from "@/lib/kits";
import { getT, resolverLocale, LOCALES } from "@/lib/i18n";
import { alternatesDeRuta, rutaLocalizada } from "@/lib/i18n/rutas";
import AnadirKit from "@/components/tienda/AnadirKit";
import ImagenProducto from "@/components/tienda/ImagenProducto";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata(
  props: PageProps<"/[locale]/kits">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const loc = resolverLocale(locale);
  const { t } = getT(loc);
  return {
    title: t("kits.titulo"),
    description: t("kits.intro"),
    alternates: alternatesDeRuta(loc, "/kits"),
  };
}

export default async function PaginaKits(props: PageProps<"/[locale]/kits">) {
  const { locale } = await props.params;
  const loc = resolverLocale(locale);
  const { t, tf } = getT(loc);
  const r = (path: string) => rutaLocalizada(loc, path);

  const kits = KITS.map((k) => {
    const productos = k.productos
      .map((id) => productoPorId(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
    const conPrecio = productos.filter((p) => p.precio > 0);
    const total = conPrecio.reduce((s, p) => s + p.precio, 0);
    return { kit: k, productos, conPrecio, total };
  });

  return (
    <main className="mx-auto max-w-5xl px-6 pb-24 pt-28">
      <h1 className="font-display text-3xl sm:text-4xl">{t("kits.titulo")}</h1>
      <p className="mt-3 max-w-prose text-tinta-suave">{t("kits.intro")}</p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {kits.map(({ kit, productos, conPrecio, total }) => {
          const conDescuento = total * (1 - DESCUENTO_BUNDLE);
          const ahorro = total - conDescuento;
          const hayPrecio = conPrecio.length >= 2;
          return (
            <section
              key={kit.id}
              className="flex flex-col rounded-3xl border border-tinta-suave/20 p-5"
            >
              <h2 className="font-display text-xl">{t(kit.nombre)}</h2>
              <p className="mt-1 text-sm text-tinta-suave">{t(kit.descripcion)}</p>

              <p className="mt-4 text-xs uppercase tracking-widest text-tinta-suave">
                {t("kits.incluye")}
              </p>
              <ul className="mt-2 grid grid-cols-3 gap-2">
                {productos.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={r(`/producto/${p.id}`)}
                      className="group block rounded-2xl border border-transparent p-1 transition-colors hover:border-tinta-suave/20"
                    >
                      <ImagenProducto producto={p} clase="aspect-square w-full" />
                      <p className="mt-1 line-clamp-2 text-[11px] leading-tight text-tinta-suave">
                        {p.nombre}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-5">
                {hayPrecio ? (
                  <>
                    <p className="text-sm">
                      <span className="text-tinta-suave line-through">
                        ${total.toFixed(2)}
                      </span>{" "}
                      <strong className="text-base">${conDescuento.toFixed(2)}</strong>{" "}
                      <span className="text-acento">
                        {tf("kits.ahorras", { monto: `$${ahorro.toFixed(2)}` })}
                      </span>
                    </p>
                    <AnadirKit
                      items={conPrecio.map((p) => ({
                        id: p.id,
                        nombre: p.nombre,
                        precio: p.precio,
                        imagen: p.imagen,
                      }))}
                    />
                  </>
                ) : (
                  <p className="nota-todo text-center text-sm">
                    {t("carrito.preciosPendientes")}
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <Link
        href={r("/tienda")}
        className="mt-14 inline-block text-acento underline-offset-4 hover:underline"
      >
        {t("producto.volverTienda")}
      </Link>
    </main>
  );
}
