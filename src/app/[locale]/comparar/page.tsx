import type { Metadata } from "next";
import Link from "next/link";
import { productoPorId, type Producto } from "@/lib/catalogo";
import { nombreCategoria, nombreEtapa, textoPrecio } from "@/lib/formato";
import { getT, resolverLocale } from "@/lib/i18n";
import { rutaLocalizada } from "@/lib/i18n/rutas";
import { slugDeLinea } from "@/lib/lineas";
import ImagenProducto from "@/components/tienda/ImagenProducto";
import BotonAgregarRapido from "@/components/tienda/BotonAgregarRapido";

// Comparador (mejora L3): tabla lado a lado de 2-3 productos vía ?ids=a,b,c.
// Página paramétrica → no se indexa.
export const metadata: Metadata = { robots: { index: false, follow: false } };

const MAX = 3;

export default async function PaginaComparar(
  props: PageProps<"/[locale]/comparar">,
) {
  const { locale } = await props.params;
  const busqueda = await props.searchParams;
  const loc = resolverLocale(locale);
  const tr = getT(loc);
  const { t } = tr;
  const r = (path: string) => rutaLocalizada(loc, path);

  const idsRaw = typeof busqueda.ids === "string" ? busqueda.ids : "";
  // Dedupe: ?ids= es entrada no confiable (URL editable) — un id repetido
  // duplicaría columnas (keys de React) y expulsaría un producto legítimo.
  const productos = [...new Set(idsRaw.split(",").map((id) => id.trim()))]
    .map((id) => productoPorId(id))
    .filter((p): p is Producto => Boolean(p))
    .slice(0, MAX);

  // Filas de la tabla comparativa: [etiqueta, valor por producto].
  const filas: [string, (p: Producto) => React.ReactNode][] = [
    [t("producto.attr.linea"), (p) => (
      <Link
        href={r(`/linea/${slugDeLinea(p.linea)}`)}
        className="text-acento underline-offset-4 hover:underline"
      >
        {p.linea}
      </Link>
    )],
    [t("producto.attr.categoria"), (p) => nombreCategoria(p.categoria, tr)],
    [
      t("producto.attr.etapa"),
      (p) => p.etapa.map((e) => nombreEtapa(e, tr)).join(", "),
    ],
    [t("producto.attr.tamano"), (p) => p.tamano?.split("/")[0].trim() ?? "—"],
    [t("producto.descripcionSeccion"), (p) => p.descripcion],
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 pb-24 pt-28">
      <h1 className="font-display text-3xl sm:text-4xl">{t("comparar.titulo")}</h1>

      {productos.length < 2 ? (
        <div className="mt-10">
          <p className="text-tinta-suave">{t("comparar.vacio")}</p>
          <Link href={r("/tienda")} className="boton-primario mt-6 inline-block">
            {t("carrito.irTienda")}
          </Link>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr>
                {/* Celda vacía SIN aria-hidden: ocultarla desalineaba las
                    columnas para lectores de pantalla (cabecera con una celda
                    menos que el cuerpo). */}
                <td className="w-36" />
                {productos.map((p) => (
                  <th key={p.id} scope="col" className="p-3 text-left font-normal align-top">
                    <Link href={r(`/producto/${p.id}`)} className="group block">
                      <ImagenProducto producto={p} clase="aspect-square w-full max-w-48" />
                      <span className="mt-3 block text-sm font-medium leading-snug">
                        {p.nombre}
                      </span>
                    </Link>
                    <p className="mt-1 font-display text-lg tabular-nums">
                      {textoPrecio(p.precio, tr)}
                    </p>
                    <div className="relative mt-2 h-9 w-9">
                      <BotonAgregarRapido
                        id={p.id}
                        nombre={p.nombre}
                        precio={p.precio}
                        imagen={p.imagen}
                        className="absolute inset-0 h-9 w-9"
                      />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-tinta-suave/15">
              {filas.map(([etiqueta, valor]) => (
                <tr key={etiqueta}>
                  <th
                    scope="row"
                    className="py-3 pr-4 text-left align-top text-xs font-normal uppercase tracking-widest text-tinta-suave"
                  >
                    {etiqueta}
                  </th>
                  {productos.map((p) => (
                    <td key={p.id} className="p-3 align-top leading-relaxed text-tinta-suave">
                      {valor(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
