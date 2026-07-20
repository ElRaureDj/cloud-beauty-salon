import type { Metadata } from "next";
import Link from "next/link";
import { CATALOGO, lineasDelCatalogo, type Etapa } from "@/lib/catalogo";
import {
  CATEGORIAS,
  ETAPAS,
  etiquetaStock,
  nombreCategoria,
  nombreEtapa,
  textoPrecio,
} from "@/lib/formato";
import { getT, resolverLocale, type Traductor } from "@/lib/i18n";
import { alternatesDeRuta, rutaLocalizada } from "@/lib/i18n/rutas";
import { stockDeProductos } from "@/lib/stock";
import { resumenPorProducto } from "@/lib/resenas";
import ImagenProducto from "@/components/tienda/ImagenProducto";
import BotonFavorito from "@/components/tienda/BotonFavorito";

export async function generateMetadata(
  props: PageProps<"/[locale]/tienda">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const loc = resolverLocale(locale);
  const { t } = getT(loc);
  return {
    title: t("tienda.titulo"),
    description: t("tienda.meta.descripcion"),
    alternates: alternatesDeRuta(loc, "/tienda"),
  };
}

const ORDENES = ["relevancia", "precioAsc", "precioDesc", "valorados"] as const;
type Orden = (typeof ORDENES)[number];

// Estado de la vista que se PRESERVA al cambiar cualquier control (chips,
// buscador, orden): todo vive en la URL → cero JS, indexable, compartible (§6).
type Estado = {
  categoria?: string;
  etapa?: string;
  linea?: string;
  q?: string;
  orden?: string;
  disponibles?: string;
};

function primero(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function limpiarEstado(e: Estado): Record<string, string> {
  return Object.fromEntries(
    Object.entries(e).filter(([, v]) => v !== undefined && v !== ""),
  ) as Record<string, string>;
}

// Chip-enlace genérico (filtro u orden): navega preservando el resto del estado.
function Chip({
  activo,
  etiqueta,
  estado,
  pathname,
}: {
  activo: boolean;
  etiqueta: string;
  estado: Estado;
  pathname: string;
}) {
  return (
    <Link
      href={{ pathname, query: limpiarEstado(estado) }}
      aria-current={activo ? "true" : undefined}
      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
        activo
          ? "border-acento bg-acento text-acento-tinta"
          : "border-tinta-suave/30 text-tinta-suave hover:border-tinta-suave hover:text-tinta"
      }`}
    >
      {etiqueta}
    </Link>
  );
}

function FilaFiltro({
  id,
  etiqueta,
  children,
}: {
  id: string;
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <div role="group" aria-labelledby={id} className="flex flex-wrap items-center gap-2">
      <span
        id={id}
        className="w-24 shrink-0 text-xs uppercase tracking-widest text-tinta-suave"
      >
        {etiqueta}
      </span>
      {children}
    </div>
  );
}

// Media + nº de reseñas bajo el precio (prueba social). Solo si hay reseñas.
function EstrellasResumen({
  media,
  total,
  tr,
}: {
  media: number;
  total: number;
  tr: Traductor;
}) {
  const llenas = Math.round(media);
  return (
    <p className="mt-0.5 flex items-center gap-1 text-xs text-tinta-suave">
      <span aria-hidden className="tracking-tight">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={i < llenas ? "text-acento" : "text-tinta-suave/30"}>
            ★
          </span>
        ))}
      </span>
      <span>
        {media.toFixed(1)} · {total}{" "}
        {total === 1 ? tr.t("tienda.resenas.una") : tr.t("tienda.resenas.varias")}
      </span>
    </p>
  );
}

// §6: /tienda renderiza en servidor, ligera e indexable; el canvas solo en "/".
export default async function PaginaTienda(props: PageProps<"/[locale]/tienda">) {
  const { locale } = await props.params;
  const params = await props.searchParams;
  const loc = resolverLocale(locale);
  const tr = getT(loc);
  const { t } = tr;
  const r = (path: string) => rutaLocalizada(loc, path);
  const rutaTienda = r("/tienda");

  const categoria = primero(params.categoria);
  const etapa = primero(params.etapa);
  const linea = primero(params.linea);
  const q = primero(params.q)?.trim();
  const ordenRaw = primero(params.orden);
  const orden: Orden = (ORDENES as readonly string[]).includes(ordenRaw ?? "")
    ? (ordenRaw as Orden)
    : "relevancia";
  const disponibles = primero(params.disponibles) === "1";

  // Estado base (para preservar en cada control). El orden por defecto y
  // disponibles=off no se escriben en la URL (más limpia).
  const base: Estado = {
    categoria,
    etapa,
    linea,
    q,
    orden: orden === "relevancia" ? undefined : orden,
    disponibles: disponibles ? "1" : undefined,
  };

  // 1) Filtro base: chips + búsqueda por texto (nombre o línea).
  const qLower = q?.toLowerCase();
  let productos = CATALOGO.filter(
    (p) =>
      (!categoria || p.categoria === categoria) &&
      (!etapa || p.etapa.includes(etapa as Etapa)) &&
      (!linea || p.linea === linea) &&
      (!qLower ||
        p.nombre.toLowerCase().includes(qLower) ||
        p.linea.toLowerCase().includes(qLower)),
  );

  // 2) Stock y reseñas de los candidatos (una query cada uno).
  const stockMap = await stockDeProductos(productos.map((p) => p.id));

  // 3) "Solo disponibles": oculta stock 0 (si no hay BD, stockMap vacío → no filtra).
  if (disponibles) {
    productos = productos.filter((p) => (stockMap.get(p.id) ?? 1) > 0);
  }

  const resenasMap = await resumenPorProducto(productos.map((p) => p.id));

  // 4) Orden. Precios "por confirmar" (0) al final en precioAsc.
  const conPrecio = (p: { precio: number }) => (p.precio > 0 ? p.precio : Infinity);
  if (orden === "precioAsc")
    productos = [...productos].sort((a, b) => conPrecio(a) - conPrecio(b));
  else if (orden === "precioDesc")
    productos = [...productos].sort((a, b) => b.precio - a.precio);
  else if (orden === "valorados") {
    // Puntuación bayesiana para "mejor valorados": una sola reseña extrema no
    // domina la lista y los productos sin reseñas van al final. C = media global
    // (previo), M = su peso (nº de reseñas "virtuales" que atraen hacia C
    // mientras haya pocas reales). Así 1×5★ no supera a 200×4.8, y 1×1★ no
    // encabeza por delante de los no valorados.
    const vals = [...resenasMap.values()];
    const nTotal = vals.reduce((s, r) => s + r.total, 0);
    const mediaGlobal =
      nTotal > 0 ? vals.reduce((s, r) => s + r.media * r.total, 0) / nTotal : 0;
    const M = 5;
    const score = (id: string) => {
      const r = resenasMap.get(id);
      return r && r.total > 0
        ? (r.total * r.media + M * mediaGlobal) / (r.total + M)
        : -1; // sin reseñas → al final
    };
    productos = [...productos].sort(
      (a, b) =>
        score(b.id) - score(a.id) ||
        (resenasMap.get(b.id)?.total ?? 0) - (resenasMap.get(a.id)?.total ?? 0),
    );
  }

  const hayFiltros = Boolean(categoria || etapa || linea || q || disponibles || orden !== "relevancia");
  const preciosPendientes = CATALOGO.every((p) => p.precio === 0);

  return (
    <main className="mx-auto max-w-5xl px-6 pb-24 pt-28">
      <div className="flex items-start justify-between gap-4">
        <h1 className="font-display text-3xl sm:text-4xl">{t("tienda.titulo")}</h1>
        <div className="mt-2 flex shrink-0 items-center gap-4 text-sm">
          <Link
            href={r("/kits")}
            className="text-tinta-suave underline-offset-4 hover:text-tinta"
          >
            {t("kits.enlace")}
          </Link>
          <Link
            href={r("/favoritos")}
            className="inline-flex items-center gap-1.5 text-tinta-suave underline-offset-4 hover:text-tinta"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            {t("favoritos.enlace")}
          </Link>
        </div>
      </div>
      <p className="mt-3 max-w-prose text-tinta-suave">{t("copy.marca.trust")}.</p>
      {preciosPendientes && (
        <p className="nota-todo mt-4">TODO(guion §9.6): faltan precios del catálogo.</p>
      )}

      {/* Buscador: form GET (cero JS). Preserva el resto del estado como hidden. */}
      <form action={rutaTienda} method="get" role="search" className="mt-8 flex gap-2">
        {categoria && <input type="hidden" name="categoria" value={categoria} />}
        {etapa && <input type="hidden" name="etapa" value={etapa} />}
        {linea && <input type="hidden" name="linea" value={linea} />}
        {orden !== "relevancia" && <input type="hidden" name="orden" value={orden} />}
        {disponibles && <input type="hidden" name="disponibles" value="1" />}
        <label className="sr-only" htmlFor="tienda-q">
          {t("tienda.buscar")}
        </label>
        <input
          id="tienda-q"
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder={t("tienda.buscar")}
          className="min-w-0 flex-1 rounded-full border border-tinta-suave/30 bg-transparent px-4 py-2 text-base outline-none focus:border-acento sm:text-sm"
        />
        <button type="submit" className="boton-primario shrink-0 px-4 py-2 text-sm">
          {t("tienda.buscar.enviar")}
        </button>
      </form>

      <section aria-label={t("tienda.filtros.grupo")} className="mt-4 flex flex-col gap-3">
        <FilaFiltro id="filtro-categoria" etiqueta={t("tienda.filtros.categoria")}>
          <Chip pathname={rutaTienda} etiqueta={t("tienda.filtros.todo")} activo={!categoria} estado={{ ...base, categoria: undefined }} />
          {CATEGORIAS.map((c) => (
            <Chip key={c} pathname={rutaTienda} etiqueta={nombreCategoria(c, tr)} activo={categoria === c} estado={{ ...base, categoria: c }} />
          ))}
        </FilaFiltro>
        <FilaFiltro id="filtro-etapa" etiqueta={t("tienda.filtros.etapa")}>
          <Chip pathname={rutaTienda} etiqueta={t("tienda.filtros.todo")} activo={!etapa} estado={{ ...base, etapa: undefined }} />
          {ETAPAS.map((e) => (
            <Chip key={e} pathname={rutaTienda} etiqueta={nombreEtapa(e, tr)} activo={etapa === e} estado={{ ...base, etapa: e }} />
          ))}
        </FilaFiltro>
        <FilaFiltro id="filtro-linea" etiqueta={t("tienda.filtros.linea")}>
          <Chip pathname={rutaTienda} etiqueta={t("tienda.filtros.todo")} activo={!linea} estado={{ ...base, linea: undefined }} />
          {lineasDelCatalogo().map((l) => (
            <Chip key={l} pathname={rutaTienda} etiqueta={l} activo={linea === l} estado={{ ...base, linea: l }} />
          ))}
        </FilaFiltro>
        <FilaFiltro id="filtro-orden" etiqueta={t("tienda.orden")}>
          {ORDENES.map((o) => (
            <Chip
              key={o}
              pathname={rutaTienda}
              etiqueta={t(`tienda.orden.${o}`)}
              activo={orden === o}
              estado={{ ...base, orden: o === "relevancia" ? undefined : o }}
            />
          ))}
          <Chip
            pathname={rutaTienda}
            etiqueta={t("tienda.soloDisponibles")}
            activo={disponibles}
            estado={{ ...base, disponibles: disponibles ? undefined : "1" }}
          />
        </FilaFiltro>
        {hayFiltros && (
          <Link
            href={rutaTienda}
            className="self-start text-sm text-acento underline-offset-4 hover:underline"
          >
            {t("tienda.filtros.limpiar")}
          </Link>
        )}
      </section>

      {productos.length === 0 ? (
        <p className="mt-14 text-tinta-suave">{t("tienda.sinResultados")}</p>
      ) : (
        <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {productos.map((p) => {
            const et = etiquetaStock(
              stockMap.has(p.id) ? stockMap.get(p.id)! : null,
              tr,
            );
            const res = resenasMap.get(p.id);
            return (
              <li key={p.id} className="relative">
                <Link
                  href={r(`/producto/${p.id}`)}
                  className="group block rounded-3xl border border-transparent p-2 transition-colors hover:border-tinta-suave/20"
                >
                  <ImagenProducto producto={p} clase="aspect-square w-full" estadoStock={et} />
                  <p className="mt-3 text-sm leading-snug">{p.nombre}</p>
                  <p className="mt-0.5 text-xs text-tinta-suave">
                    {p.linea}
                    {p.tamano ? ` · ${p.tamano.split("/")[0].trim()}` : ""}
                  </p>
                  <p className="mt-1 text-sm">{textoPrecio(p.precio, tr)}</p>
                  {res && <EstrellasResumen media={res.media} total={res.total} tr={tr} />}
                </Link>
                <BotonFavorito
                  id={p.id}
                  className="absolute right-3 top-3 h-9 w-9 bg-fondo-0/70 backdrop-blur-sm"
                />
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href={r("/")}
        className="mt-14 inline-block text-acento underline-offset-4 hover:underline"
      >
        {t("tienda.volver")}
      </Link>
    </main>
  );
}
