"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { IconoCandado } from "@/components/iconos";
import { useT, useRuta } from "@/lib/i18n/client";
import { useExperiencia } from "@/stores/experiencia";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// [DOM] Overlays HTML sincronizados con el timeline (§0). Cada ScrollTrigger
// lleva el id del capítulo del guion — los porcentajes son contrato (§4).
export default function CapitulosDom({ activo }: { activo: boolean }) {
  const abrirOverlay = useExperiencia((s) => s.abrirOverlay);
  const { t } = useT();
  const ruta = useRuta();

  const taglineRef = useRef<HTMLDivElement | null>(null);
  const indicadorRef = useRef<HTMLDivElement | null>(null);
  const copyPeloRef = useRef<HTMLParagraphElement | null>(null);
  const estacionPeloRef = useRef<HTMLDivElement | null>(null);
  const ctaTiendaRef = useRef<HTMLDivElement | null>(null);
  const franjaTrustRef = useRef<HTMLParagraphElement | null>(null);
  const pruebaSocialRef = useRef<HTMLParagraphElement | null>(null);
  const estacionManosRef = useRef<HTMLDivElement | null>(null);
  const lineaHistoriaRef = useRef<HTMLParagraphElement | null>(null);
  const estacionPiesRef = useRef<HTMLDivElement | null>(null);
  const cierreRef = useRef<HTMLDivElement | null>(null);
  const pieRef = useRef<HTMLElement | null>(null);

  const volverArriba = () => {
    const lenis = useExperiencia.getState().lenis;
    if (lenis) lenis.scrollTo(0);
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (!activo) return;
    const max = () => ScrollTrigger.maxScroll(window);

    // Aparece, sostiene y se desvanece dentro de su rango del timeline.
    const apareceYSeVa = (
      id: string,
      el: HTMLElement | null,
      inicio: number,
      fin: number,
    ) => {
      gsap
        .timeline({
          scrollTrigger: {
            id,
            start: () => max() * inicio,
            end: () => max() * fin,
            scrub: true,
          },
        })
        .fromTo(el, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.15 })
        .to(el, { autoAlpha: 1, duration: 0.7 })
        .to(el, { autoAlpha: 0, duration: 0.15 });
    };

    // Aparece y se queda (bloque final).
    const aparece = (id: string, el: HTMLElement | null, inicio: number, fin: number) => {
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: 16 },
        {
          autoAlpha: 1,
          y: 0,
          scrollTrigger: {
            id,
            start: () => max() * inicio,
            end: () => max() * fin,
            scrub: true,
          },
        },
      );
    };

    const ctx = gsap.context(() => {
      // Cap. 0 — la portada se retira en cuanto empieza el viaje.
      gsap.to([taglineRef.current, indicadorRef.current], {
        autoAlpha: 0,
        scrollTrigger: {
          id: "cap0",
          start: 0,
          end: () => max() * 0.05,
          scrub: true,
        },
      });

      // Cap. 1 — copy.pelo.intro aparece al 8% y se desvanece a 14% (§4).
      apareceYSeVa("cap1", copyPeloRef.current, 0.08, 0.14);

      // Cap. 2 — iconos anclados al pelo: entran al 16%, salen del pin a 32%.
      apareceYSeVa("cap2-pelo", estacionPeloRef.current, 0.16, 0.32);
      apareceYSeVa("cap2-cta-tienda", ctaTiendaRef.current, 0.18, 0.32);

      // Cap. 3 — franja de marca al 36% y prueba social al 42% (§4).
      apareceYSeVa("cap3", franjaTrustRef.current, 0.35, 0.42);
      apareceYSeVa("cap3-social", pruebaSocialRef.current, 0.41, 0.45);

      // Cap. 4 — estación MANOS: la conversión del salón entra al 52% (§4).
      apareceYSeVa("cap4-manos", estacionManosRef.current, 0.52, 0.65);

      // Cap. 5 — una sola línea, sin CTAs (§4).
      apareceYSeVa("cap5", lineaHistoriaRef.current, 0.66, 0.71);

      // Cap. 6 — estación PIES (§4).
      apareceYSeVa("cap6-pies", estacionPiesRef.current, 0.74, 0.85);

      // Cap. 7 — cierre y conversión: entra y se queda (§4).
      aparece("cap7", cierreRef.current, 0.87, 0.92);
      aparece("cap7-pie", pieRef.current, 0.96, 0.995);
    });

    const marco = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      cancelAnimationFrame(marco);
      ctx.revert();
    };
  }, [activo]);

  return (
    <div className="pointer-events-none fixed inset-0 z-30" aria-hidden={!activo}>
      {/* Cap. 0 — tagline de portada */}
      <div ref={taglineRef} className="absolute inset-x-6 bottom-[22%] text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-tinta-suave">
          {t("marca.nombre")}
        </p>
        <h2 className="mt-3 font-display text-3xl sm:text-5xl">{t("hero.tagline")}</h2>
      </div>

      {/* Cap. 0 — indicador de scroll */}
      <div
        ref={indicadorRef}
        className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-1 text-tinta-suave"
      >
        <span className="text-xs uppercase tracking-[0.25em]">{t("hero.desliza")}</span>
        <svg
          className="anima-desliza h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Cap. 1 — copy.pelo.intro */}
      <p
        ref={copyPeloRef}
        className="invisible absolute inset-x-6 top-[38%] text-center font-display text-3xl opacity-0 sm:text-4xl"
      >
        {t("copy.pelo.intro")}
      </p>

      {/* Cap. 2 — estación PELO */}
      <div
        ref={estacionPeloRef}
        className="invisible absolute left-[56%] top-[34%] flex flex-col items-start gap-3 opacity-0"
      >
        <button
          type="button"
          onClick={() => abrirOverlay("quiz")}
          className="boton-primario pulso-activo pointer-events-auto"
        >
          {t("cap2.productos")}
        </button>
        <button
          type="button"
          onClick={() => abrirOverlay("espera-peluqueria")}
          className="boton-secundario pointer-events-auto opacity-70"
        >
          <IconoCandado className="mr-2 h-4 w-4" />
          {t("cap2.peluqueria")} · {t("cap2.muyPronto")}
        </button>
      </div>

      {/* Cap. 2 — CTA secundario a la tienda */}
      <div
        ref={ctaTiendaRef}
        className="invisible absolute inset-x-0 bottom-10 flex justify-center opacity-0"
      >
        <Link href={ruta("/tienda")} className="boton-secundario pointer-events-auto">
          {t("cap2.verTienda")}
        </Link>
      </div>

      {/* Cap. 3 — franja de marca (§4, 36%). Con velo propio: el contraste no
          puede depender de lo que la cámara tenga detrás. */}
      <p
        ref={franjaTrustRef}
        className="invisible absolute inset-x-6 top-[14%] text-center opacity-0"
      >
        <span className="inline-block rounded-full bg-fondo-0/75 px-4 py-2 text-sm uppercase tracking-[0.2em] text-tinta">
          {t("copy.marca.trust")}
        </span>
      </p>

      {/* Cap. 3 — prueba social (§4, 42%): sin datos reales no se inventan cifras */}
      <p
        ref={pruebaSocialRef}
        className="nota-todo invisible absolute inset-x-6 bottom-[14%] mx-auto max-w-sm text-center opacity-0"
      >
        TODO(guion §4 Cap. 3): reseñas y nº real de clientas — no inventar cifras.
      </p>

      {/* Cap. 4 — estación MANOS: generador de leads del salón (§4, 52%) */}
      <div
        ref={estacionManosRef}
        className="invisible absolute left-[54%] top-[36%] flex max-w-[42%] flex-col items-start gap-3 opacity-0 sm:max-w-xs"
      >
        <p className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-tinta-suave">
          <IconoCandado className="h-4 w-4" />
          {t("cap4.manicura")} · {t("cap4.abrimosPronto")}
        </p>
        <button
          type="button"
          onClick={() => abrirOverlay("espera-manicura")}
          className="boton-primario pulso-activo pointer-events-auto text-left"
        >
          {t("cap4.avisame")}
        </button>
      </div>

      {/* Cap. 5 — línea en parallax, sin CTAs (§4) */}
      <p
        ref={lineaHistoriaRef}
        className="nota-todo invisible absolute inset-x-6 top-[42%] mx-auto max-w-sm text-center opacity-0"
      >
        TODO(guion §9.7): línea de historia de la marca (copy.marca.historia).
      </p>

      {/* Cap. 6 — estación PIES (§4) */}
      <div
        ref={estacionPiesRef}
        className="invisible absolute left-[52%] top-[30%] flex max-w-[44%] flex-col items-start gap-3 opacity-0 sm:max-w-xs"
      >
        <p className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-tinta-suave">
          <IconoCandado className="h-4 w-4" />
          {t("cap6.pedicura")} · {t("cap2.muyPronto")}
        </p>
        <button
          type="button"
          onClick={() => abrirOverlay("espera-pedicura")}
          className="boton-secundario pointer-events-auto text-left"
        >
          {t("cap4.avisame")}
        </button>
      </div>

      {/* Cap. 7 — cierre y conversión (§4, 85–100%) */}
      <div
        ref={cierreRef}
        className="invisible absolute inset-x-6 top-[30%] flex flex-col items-center gap-5 text-center opacity-0"
      >
        <h2 className="font-display text-3xl sm:text-5xl">{t("copy.cierre.titulo")}</h2>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => abrirOverlay("quiz")}
            className="boton-primario pulso-activo pointer-events-auto"
          >
            {t("cap2.hacerDiagnostico")}
          </button>
          <Link href={ruta("/tienda")} className="boton-secundario pointer-events-auto">
            {t("cap7.irTienda")}
          </Link>
        </div>
        <p className="nota-todo pointer-events-auto">
          TODO(guion §9.5): newsletter, WhatsApp y redes al tener marca y dominio.
        </p>
      </div>

      {/* Cap. 7 — pie: contacto, legales y volver arriba (§4) */}
      <footer
        ref={pieRef}
        className="invisible absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-6 py-4 text-sm text-tinta-suave opacity-0"
      >
        <Link href={ruta("/contacto")} className="pointer-events-auto underline-offset-4 hover:underline">
          {t("footer.contacto")}
        </Link>
        <Link
          href={ruta("/legal/envios")}
          className="pointer-events-auto underline-offset-4 hover:underline"
        >
          {t("footer.envios")}
        </Link>
        <Link
          href={ruta("/legal/privacidad")}
          className="pointer-events-auto underline-offset-4 hover:underline"
        >
          {t("footer.privacidad")}
        </Link>
        <Link
          href={ruta("/legal/terminos")}
          className="pointer-events-auto underline-offset-4 hover:underline"
        >
          {t("footer.terminos")}
        </Link>
        <button
          type="button"
          onClick={volverArriba}
          className="pointer-events-auto underline-offset-4 hover:underline"
        >
          {t("footer.volverArriba")} ↑
        </button>
      </footer>
    </div>
  );
}
