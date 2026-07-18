"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { t } from "@/lib/i18n/es";
import { prefiereMenosMovimiento } from "@/lib/webgl";
import { contarArticulos, useTienda } from "@/stores/carrito";
import { useExperiencia } from "@/stores/experiencia";
import CarritoDrawer from "./CarritoDrawer";

// Regla de oro (§1): desde cualquier punto del scroll, la tienda y el carrito
// están a un toque. Header fijo: logo (→ inicio) · Tienda · carrito con contador.
export default function Header() {
  const pathname = usePathname();
  const abrirOverlay = useExperiencia((s) => s.abrirOverlay);
  const cerrarOverlay = useExperiencia((s) => s.cerrarOverlay);
  const totalArticulos = useTienda(contarArticulos);

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
    if (pathname !== "/") return; // navegación normal hacia "/"
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
          pathname === "/"
            ? "bg-gradient-to-b from-fondo-0/80 to-transparent"
            : "bg-fondo-0/40 backdrop-blur-md"
        }`}
      >
        <Link
          href="/"
          onClick={irAlInicio}
          className="font-display text-sm uppercase tracking-[0.25em]"
        >
          {/* TODO(guion): logo real de {{MARCA}} (§8) */}
          {"{{MARCA}}"}
        </Link>
        <nav className="flex items-center gap-5">
          <Link
            href="/tienda"
            className="text-sm text-tinta-suave transition-colors hover:text-tinta"
          >
            {t("header.tienda")}
          </Link>
          <button
            type="button"
            onClick={() => abrirOverlay("carrito")}
            aria-label={
              totalArticulos > 0
                ? `${t("header.carrito")}, ${totalArticulos} ${
                    totalArticulos === 1 ? "artículo" : "artículos"
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
