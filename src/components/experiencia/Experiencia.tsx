"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { prefiereMenosMovimiento, soportaWebGL } from "@/lib/webgl";
import { useExperiencia } from "@/stores/experiencia";
import CapitulosDom from "./CapitulosDom";
import FallbackEstatico from "./FallbackEstatico";
import Preloader from "./Preloader";
import OverlayQuiz from "@/components/overlays/OverlayQuiz";
import ModalListaEspera from "@/components/overlays/ModalListaEspera";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// El canvas solo existe en el cliente y solo en "/" (§6).
const Escena = dynamic(() => import("./Escena"), { ssr: false });

// §2: fallback obligatorio si el primer frame tarda > 4 s.
const ESPERA_PRIMER_FRAME_MS = 4000;

type Modo = "decidiendo" | "3d" | "fallback";

// Si el canvas revienta (GLB corrupto, contexto WebGL perdido…), la venta
// no se cae con él: pasamos al fallback estático (§2).
class CapturaErrorEscena extends Component<
  { alFallar: () => void; children: React.ReactNode },
  { fallo: boolean }
> {
  state = { fallo: false };

  static getDerivedStateFromError() {
    return { fallo: true };
  }

  componentDidCatch() {
    this.props.alFallar();
  }

  render() {
    return this.state.fallo ? null : this.props.children;
  }
}

export default function Experiencia() {
  const [modo, setModo] = useState<Modo>("decidiendo");
  const [escenaLista, setEscenaLista] = useState(false);
  const contenedorRef = useRef<HTMLDivElement | null>(null);

  const alPrimerFrame = useCallback(() => setEscenaLista(true), []);

  // Decisión de modo (§2): sin WebGL o con prefers-reduced-motion → fallback.
  // setTimeout y no requestAnimationFrame: rAF no corre en pestañas ocultas
  // y dejaría el preloader colgado si la página carga en segundo plano.
  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      setModo(soportaWebGL() && !prefiereMenosMovimiento() ? "3d" : "fallback");
    }, 0);
    return () => window.clearTimeout(temporizador);
  }, []);

  // Presupuesto de primer frame (§2). Solo cuenta mientras la pestaña está
  // visible: en segundo plano el navegador congela el render y el timeout
  // mandaría al fallback a máquinas perfectamente capaces.
  useEffect(() => {
    if (modo !== "3d" || escenaLista) return;
    let temporizador: number | undefined;
    const armar = () => {
      temporizador = window.setTimeout(
        () => setModo("fallback"),
        ESPERA_PRIMER_FRAME_MS,
      );
    };
    const alCambiarVisibilidad = () => {
      window.clearTimeout(temporizador);
      if (!document.hidden) armar();
    };
    if (!document.hidden) armar();
    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    return () => {
      window.clearTimeout(temporizador);
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
    };
  }, [modo, escenaLista]);

  // El rig: Lenis + ScrollTrigger con scrub sobre una sola línea de tiempo (§0).
  useEffect(() => {
    if (modo !== "3d") return;
    const estado = useExperiencia.getState();
    estado.marcarActividad();

    const lenis = new Lenis();
    estado.setLenis(lenis);
    lenis.on("scroll", ScrollTrigger.update);
    const tic = (tiempo: number) => lenis.raf(tiempo * 1000);
    gsap.ticker.add(tic);
    gsap.ticker.lagSmoothing(0);

    const maestro = ScrollTrigger.create({
      id: "timeline-global",
      start: 0,
      end: () => ScrollTrigger.maxScroll(window),
      onUpdate: (self) => useExperiencia.getState().setProgreso(self.progress),
    });

    // Mientras un overlay está abierto, el timeline no avanza (§2).
    const soltar = useExperiencia.subscribe((actual, previo) => {
      if (actual.overlay === previo.overlay) return;
      if (actual.overlay === "ninguno") lenis.start();
      else lenis.stop();
    });
    // El estado del overlay sobrevive a las navegaciones cliente: si al volver
    // a "/" hay uno abierto, el Lenis recién creado debe nacer parado.
    if (useExperiencia.getState().overlay !== "ninguno") lenis.stop();

    return () => {
      soltar();
      maestro.kill();
      gsap.ticker.remove(tic);
      lenis.destroy();
      useExperiencia.getState().setLenis(null);
    };
  }, [modo]);

  if (modo === "fallback") {
    return (
      <>
        <FallbackEstatico />
        <OverlayQuiz />
        <ModalListaEspera />
      </>
    );
  }

  return (
    <>
      <Preloader listo={escenaLista} />
      <div
        ref={contenedorRef}
        className="relative"
        style={{ height: "var(--alto-experiencia)" }}
      >
        <div className="degradado-marca fixed inset-0" aria-hidden>
          {modo === "3d" && (
            <CapturaErrorEscena alFallar={() => setModo("fallback")}>
              <Escena alPrimerFrame={alPrimerFrame} />
            </CapturaErrorEscena>
          )}
        </div>
        <CapitulosDom activo={modo === "3d" && escenaLista} />
      </div>
      <OverlayQuiz />
      <ModalListaEspera />
    </>
  );
}
