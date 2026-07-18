import { create } from "zustand";
import type Lenis from "lenis";
import { capituloEn, type IdCapitulo } from "@/lib/escena/coreografia";

export type Overlay = "ninguno" | "quiz" | "espera-peluqueria" | "carrito";

type EstadoExperiencia = {
  // scrollProgress del timeline global 0–1 (GUION §2). La cámara lo lee con
  // getState() en useFrame; los componentes NO deben suscribirse a `progreso`
  // (cambia a 60 fps) — suscribirse a `capituloActivo` u `overlay`.
  progreso: number;
  capituloActivo: IdCapitulo;
  overlay: Overlay;
  ultimoScrollEn: number; // para el micro-parallax de invitación (§4 Cap. 0)
  lenis: Lenis | null;
  setProgreso: (p: number) => void;
  marcarActividad: () => void;
  abrirOverlay: (overlay: Exclude<Overlay, "ninguno">) => void;
  cerrarOverlay: () => void;
  setLenis: (lenis: Lenis | null) => void;
};

export const useExperiencia = create<EstadoExperiencia>()((set) => ({
  progreso: 0,
  capituloActivo: "cap0",
  overlay: "ninguno",
  ultimoScrollEn: 0,
  lenis: null,
  setProgreso: (p) =>
    set({ progreso: p, capituloActivo: capituloEn(p), ultimoScrollEn: Date.now() }),
  marcarActividad: () => set({ ultimoScrollEn: Date.now() }),
  abrirOverlay: (overlay) => set({ overlay }),
  cerrarOverlay: () => set({ overlay: "ninguno" }),
  setLenis: (lenis) => set({ lenis }),
}));
