"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { IconoCandado } from "@/components/iconos";
import { t } from "@/lib/i18n/es";
import { useExperiencia } from "@/stores/experiencia";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// [DOM] Overlays HTML sincronizados con el timeline (§0). Cada ScrollTrigger
// lleva el id del capítulo del guion — los porcentajes son contrato (§4).
export default function CapitulosDom({ activo }: { activo: boolean }) {
  const abrirOverlay = useExperiencia((s) => s.abrirOverlay);

  const taglineRef = useRef<HTMLDivElement | null>(null);
  const indicadorRef = useRef<HTMLDivElement | null>(null);
  const copyPeloRef = useRef<HTMLParagraphElement | null>(null);
  const estacionPeloRef = useRef<HTMLDivElement | null>(null);
  const ctaTiendaRef = useRef<HTMLDivElement | null>(null);
  const notaFase3Ref = useRef<HTMLParagraphElement | null>(null);

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

      // Cap. 2 — CTA secundario a /tienda desde el 18% (§4).
      apareceYSeVa("cap2-cta-tienda", ctaTiendaRef.current, 0.18, 0.32);

      // Marcador honesto del límite de la Fase 1.
      gsap.fromTo(
        notaFase3Ref.current,
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          scrollTrigger: {
            id: "nota-fase-3",
            start: () => max() * 0.36,
            end: () => max() * 0.42,
            scrub: true,
          },
        },
      );
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
      <div
        ref={taglineRef}
        className="absolute inset-x-6 bottom-[22%] text-center"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-tinta-suave">
          {"{{MARCA}}"}
        </p>
        <h2 className="mt-3 font-display text-3xl sm:text-5xl">
          {t("hero.tagline")}
        </h2>
      </div>

      {/* Cap. 0 — indicador de scroll */}
      <div
        ref={indicadorRef}
        className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-1 text-tinta-suave"
      >
        <span className="text-xs uppercase tracking-[0.25em]">
          {t("hero.desliza")}
        </span>
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

      {/* Cap. 2 — estación PELO: iconos anclados visualmente al pelo */}
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
        {/* DESACTIVADO pero interactivo: abre la captura de interés (§5.4),
            así que no lleva aria-disabled — el candado y el copy ya comunican
            el estado. */}
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
        <Link href="/tienda" className="boton-secundario pointer-events-auto">
          {t("cap2.verTienda")}
        </Link>
      </div>

      {/* Fin del contenido de Fase 1 */}
      <p
        ref={notaFase3Ref}
        className="nota-todo invisible absolute inset-x-6 top-1/2 mx-auto max-w-md -translate-y-1/2 text-center opacity-0"
      >
        TODO(fase-3): aquí continúa el descenso — caps. 3–7 del guion (§10).
      </p>
    </div>
  );
}
