"use client";

import Link from "next/link";
import { IconoCandado } from "@/components/iconos";
import { t } from "@/lib/i18n/es";
import { useExperiencia } from "@/stores/experiencia";

// §2: sin WebGL, con prefers-reduced-motion o si el primer frame tarda > 4 s,
// la misma narrativa se sirve en secciones estáticas. La venta nunca depende
// del canvas. TODO(guion): sustituir los bloques degradados por los renders
// del modelo generados desde la propia escena (§8).
export default function FallbackEstatico() {
  const abrirOverlay = useExperiencia((s) => s.abrirOverlay);

  return (
    <div className="pt-14">
      {/* Cap. 0 — Portada */}
      <section className="degradado-marca grid min-h-[92svh] place-items-center px-6 text-center">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-tinta-suave">
            {t("marca.nombre")}
          </p>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl">{t("hero.tagline")}</h2>
        </div>
      </section>

      {/* Caps. 1–2 — Estación PELO */}
      <section className="px-6 py-24 text-center">
        <div
          aria-hidden
          className="mx-auto h-64 w-48 rounded-[42%] bg-gradient-to-b from-fondo-1 to-fondo-0"
        />
        <h3 className="mt-8 font-display text-3xl">{t("copy.pelo.intro")}</h3>
        <div className="mt-10 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => abrirOverlay("quiz")}
            className="boton-primario pulso-activo"
          >
            {t("cap2.hacerDiagnostico")}
          </button>
          <Link href="/tienda" className="boton-secundario">
            {t("cap2.verTienda")}
          </Link>
          <button
            type="button"
            onClick={() => abrirOverlay("espera-peluqueria")}
            className="boton-secundario opacity-70"
          >
            <IconoCandado className="mr-2 h-4 w-4" />
            {t("cap2.peluqueria")} · {t("cap2.muyPronto")}
          </button>
        </div>
      </section>

      {/* Cap. 3 — marca y tienda */}
      <section className="border-y border-tinta-suave/15 px-6 py-14 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-tinta-suave">
          {t("copy.marca.trust")}
        </p>
      </section>

      {/* Cap. 4 — Estación MANOS (conversión del salón) */}
      <section className="px-6 py-24 text-center">
        <p className="flex items-center justify-center gap-2 text-sm uppercase tracking-[0.2em] text-tinta-suave">
          <IconoCandado className="h-4 w-4" />
          {t("cap4.manicura")} · {t("cap4.abrimosPronto")}
        </p>
        <button
          type="button"
          onClick={() => abrirOverlay("espera-manicura")}
          className="boton-primario pulso-activo mt-6"
        >
          {t("cap4.avisame")}
        </button>
      </section>

      {/* Cap. 6 — Estación PIES */}
      <section className="px-6 pb-24 text-center">
        <p className="flex items-center justify-center gap-2 text-sm uppercase tracking-[0.2em] text-tinta-suave">
          <IconoCandado className="h-4 w-4" />
          {t("cap6.pedicura")} · {t("cap2.muyPronto")}
        </p>
        <button
          type="button"
          onClick={() => abrirOverlay("espera-pedicura")}
          className="boton-secundario mt-6"
        >
          {t("cap4.avisame")}
        </button>
      </section>

      {/* Cap. 7 — Cierre y conversión */}
      <section className="degradado-marca px-6 py-24 text-center">
        <h2 className="font-display text-3xl sm:text-4xl">{t("copy.cierre.titulo")}</h2>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => abrirOverlay("quiz")}
            className="boton-primario pulso-activo"
          >
            {t("cap2.hacerDiagnostico")}
          </button>
          <Link href="/tienda" className="boton-secundario">
            {t("cap7.irTienda")}
          </Link>
        </div>
        <footer className="mt-16 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-tinta-suave">
          <Link href="/contacto" className="underline-offset-4 hover:underline">
            {t("footer.contacto")}
          </Link>
          <Link href="/legal/envios" className="underline-offset-4 hover:underline">
            {t("footer.envios")}
          </Link>
          <Link href="/legal/privacidad" className="underline-offset-4 hover:underline">
            {t("footer.privacidad")}
          </Link>
          <Link href="/legal/terminos" className="underline-offset-4 hover:underline">
            {t("footer.terminos")}
          </Link>
        </footer>
      </section>
    </div>
  );
}
