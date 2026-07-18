import type { Metadata } from "next";
import Link from "next/link";
import { CATALOGO, lineasDelCatalogo, type Etapa } from "@/lib/catalogo";
import {
  CATEGORIAS,
  ETAPAS,
  nombreCategoria,
  nombreEtapa,
  textoPrecio,
} from "@/lib/formato";
import { t } from "@/lib/i18n/es";
import ImagenProducto from "@/components/tienda/ImagenProducto";

export const metadata: Metadata = {
  title: t("tienda.titulo"),
  description: t("tienda.meta.descripcion"),
};

type Filtros = { categoria?: string; etapa?: string; linea?: string };

function primero(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

// Chips de filtro como enlaces: cero JS, indexable y con URL compartible (§6).
function ChipFiltro({
  activo,
  etiqueta,
  query,
}: {
  activo: boolean;
  etiqueta: string;
  query: Filtros;
}) {
  const limpio = Object.fromEntries(
    Object.entries(query).filter(([, v]) => v !== undefined),
  ) as Record<string, string>;
  return (
    <Link
      href={{ pathname: "/tienda", query: limpio }}
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

// §6: /tienda renderiza en servidor, ligera e indexable; el canvas solo en "/".
export default async function PaginaTienda(props: PageProps<"/tienda">) {
  const params = await props.searchParams;
  const categoria = primero(params.categoria);
  const etapa = primero(params.etapa);
  const linea = primero(params.linea);
  const filtros: Filtros = { categoria, etapa, linea };

  const productos = CATALOGO.filter(
    (p) =>
      (!categoria || p.categoria === categoria) &&
      (!etapa || p.etapa.includes(etapa as Etapa)) &&
      (!linea || p.linea === linea),
  );

  const hayFiltros = Boolean(categoria || etapa || linea);
  const preciosPendientes = CATALOGO.every((p) => p.precio === 0);

  return (
    <main className="mx-auto max-w-5xl px-6 pb-24 pt-28">
      <h1 className="font-display text-3xl sm:text-4xl">{t("tienda.titulo")}</h1>
      <p className="mt-3 max-w-prose text-tinta-suave">{t("copy.marca.trust")}.</p>
      {preciosPendientes && (
        <p className="nota-todo mt-4">
          TODO(guion §9.6): catálogo provisional — faltan referencias y precios
          reales Trust; el checkout se habilita con la pasarela (§9.2).
        </p>
      )}

      <section aria-label={t("tienda.filtros.grupo")} className="mt-8 flex flex-col gap-3">
        <div
          role="group"
          aria-labelledby="filtro-categoria"
          className="flex flex-wrap items-center gap-2"
        >
          <span
            id="filtro-categoria"
            className="w-24 shrink-0 text-xs uppercase tracking-widest text-tinta-suave"
          >
            {t("tienda.filtros.categoria")}
          </span>
          <ChipFiltro
            etiqueta={t("tienda.filtros.todo")}
            activo={!categoria}
            query={{ ...filtros, categoria: undefined }}
          />
          {CATEGORIAS.map((c) => (
            <ChipFiltro
              key={c}
              etiqueta={nombreCategoria(c)}
              activo={categoria === c}
              query={{ ...filtros, categoria: c }}
            />
          ))}
        </div>
        <div
          role="group"
          aria-labelledby="filtro-etapa"
          className="flex flex-wrap items-center gap-2"
        >
          <span
            id="filtro-etapa"
            className="w-24 shrink-0 text-xs uppercase tracking-widest text-tinta-suave"
          >
            {t("tienda.filtros.etapa")}
          </span>
          <ChipFiltro
            etiqueta={t("tienda.filtros.todo")}
            activo={!etapa}
            query={{ ...filtros, etapa: undefined }}
          />
          {ETAPAS.map((e) => (
            <ChipFiltro
              key={e}
              etiqueta={nombreEtapa(e)}
              activo={etapa === e}
              query={{ ...filtros, etapa: e }}
            />
          ))}
        </div>
        <div
          role="group"
          aria-labelledby="filtro-linea"
          className="flex flex-wrap items-center gap-2"
        >
          <span
            id="filtro-linea"
            className="w-24 shrink-0 text-xs uppercase tracking-widest text-tinta-suave"
          >
            {t("tienda.filtros.linea")}
          </span>
          <ChipFiltro
            etiqueta={t("tienda.filtros.todo")}
            activo={!linea}
            query={{ ...filtros, linea: undefined }}
          />
          {lineasDelCatalogo().map((l) => (
            <ChipFiltro
              key={l}
              etiqueta={l}
              activo={linea === l}
              query={{ ...filtros, linea: l }}
            />
          ))}
        </div>
        {hayFiltros && (
          <Link
            href="/tienda"
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
          {productos.map((p) => (
            <li key={p.id}>
              <Link
                href={`/producto/${p.id}`}
                className="group block rounded-3xl border border-transparent p-2 transition-colors hover:border-tinta-suave/20"
              >
                <ImagenProducto producto={p} clase="aspect-[3/4] w-full" />
                <p className="mt-3 text-sm leading-snug">{p.nombre}</p>
                <p className="mt-0.5 text-xs text-tinta-suave">{p.linea}</p>
                <p className="mt-1 text-xs text-tinta-suave">{textoPrecio(p.precio)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/"
        className="mt-14 inline-block text-acento underline-offset-4 hover:underline"
      >
        {t("tienda.volver")}
      </Link>
    </main>
  );
}
