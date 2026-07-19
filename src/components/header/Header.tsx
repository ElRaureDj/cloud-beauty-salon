"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useT, useRuta, useLocale } from "@/lib/i18n/client";
import { LOCALES } from "@/lib/i18n";
import { rutaEnOtroIdioma } from "@/lib/i18n/rutas";
import { prefiereMenosMovimiento } from "@/lib/webgl";
import { contarArticulos, useTienda } from "@/stores/carrito";
import { useExperiencia } from "@/stores/experiencia";
import CarritoDrawer from "./CarritoDrawer";

// Selector de idioma (§9): conserva la subruta actual Y su query al cambiar —
// p. ej. /tienda?categoria=mascara → /en/tienda?categoria=mascara. usePathname
// no incluye la query; useSearchParams sí, pero obliga a un <Suspense> para no
// forzar el render en cliente de las páginas estáticas (ver Header).
function SelectorIdiomaVista({ sufijo }: { sufijo: string }) {
  const pathname = usePathname();
  const locale = useLocale();
  const { t } = useT();
  return (
    <div
      aria-label={t("header.idioma")}
      className="flex items-center gap-1 text-xs uppercase tracking-wider"
    >
      {LOCALES.map((l, i) => (
        <span key={l} className="flex items-center gap-1">
          {i > 0 && <span aria-hidden className="text-tinta-suave/40">·</span>}
          {l === locale ? (
            <span aria-current="true" className="text-tinta">
              {l}
            </span>
          ) : (
            <Link
              href={rutaEnOtroIdioma(l, pathname) + sufijo}
              hrefLang={l}
              aria-label={t(`header.idioma.${l}`)}
              className="text-tinta-suave transition-colors hover:text-tinta"
            >
              {l}
            </Link>
          )}
        </span>
      ))}
    </div>
  );
}

function SelectorIdioma() {
  const qs = useSearchParams().toString();
  return <SelectorIdiomaVista sufijo={qs ? `?${qs}` : ""} />;
}

// Regla de oro (§1): desde cualquier punto del scroll, la tienda y el carrito
// están a un toque. Header fijo: logo (→ inicio) · Tienda · idioma · carrito.
export default function Header() {
  const pathname = usePathname();
  const { t } = useT();
  const ruta = useRuta();
  const abrirOverlay = useExperiencia((s) => s.abrirOverlay);
  const cerrarOverlay = useExperiencia((s) => s.cerrarOverlay);
  const totalArticulos = useTienda(contarArticulos);

  // Home del idioma actual: "/" en español, "/en" en inglés. usePathname()
  // devuelve la ruta VISIBLE (el proxy reescribe sin cambiar la URL).
  const inicio = ruta("/");
  const enInicio = pathname === inicio;

  // Rehidrata carrito y respuestas desde localStorage tras montar (§2).
  useEffect(() => {
    void useTienda.persist.rehydrate();
  }, []);

  // El estado de overlay vive en memoria y sobrevive a las navegaciones
  // cliente: al cambiar de ruta, cualquier overlay abierto se cierra.
  useEffect(() => {
    cerrarOverlay();
  }, [pathname, cerrarOverlay]);

  const irAlInicio = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!enInicio) return; // navegación normal hacia la home del idioma
    e.preventDefault();
    const lenis = useExperiencia.getState().lenis;
    if (lenis) lenis.scrollTo(0);
    else
      window.scrollTo({
        top: 0,
        behavior: prefiereMenosMovimiento() ? "auto" : "smooth",
      });
  };

  return (
    <>
      {/* Sin backdrop-blur sobre el canvas de "/": desenfoca cada frame del
          WebGL y come presupuesto móvil (§2); ahí basta un degradado. */}
      <header
        className={`fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between px-4 sm:px-6 ${
          enInicio
            ? "bg-gradient-to-b from-fondo-0/80 to-transparent"
            : "bg-fondo-0/40 backdrop-blur-md"
        }`}
      >
        <Link
          href={inicio}
          onClick={irAlInicio}
          className="font-display text-sm uppercase tracking-[0.25em]"
        >
          {t("marca.nombre")}
        </Link>
        <nav className="flex items-center gap-4 sm:gap-5">
          <Link
            href={ruta("/tienda")}
            className="text-sm text-tinta-suave transition-colors hover:text-tinta"
          >
            {t("header.tienda")}
          </Link>

          {/* Fallback sin query mientras hidrata: evita deoptar a CSR las
              páginas estáticas; en cliente se completa con los filtros. */}
          <Suspense fallback={<SelectorIdiomaVista sufijo="" />}>
            <SelectorIdioma />
          </Suspense>

          <button
            type="button"
            onClick={() => abrirOverlay("carrito")}
            aria-label={
              totalArticulos > 0
                ? `${t("header.carrito")}, ${totalArticulos} ${
                    totalArticulos === 1
                      ? t("header.articulo")
                      : t("header.articulos")
                  }`
                : t("header.carrito")
            }
            className="relative rounded-full p-2 transition-colors hover:bg-fondo-1/60"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden
            >
              <path
                d="M6 8h12l-1 12a2 2 0 01-2 2H9a2 2 0 01-2-2L6 8z"
                strokeLinejoin="round"
              />
              <path d="M9 8V6a3 3 0 016 0v2" strokeLinecap="round" />
            </svg>
            {totalArticulos > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-acento px-1 text-[10px] font-semibold text-acento-tinta">
                {totalArticulos}
              </span>
            )}
          </button>
        </nav>
      </header>
      <CarritoDrawer />
    </>
  );
}
