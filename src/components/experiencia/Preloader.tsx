"use client";

import { useEffect, useRef, useState } from "react";
import { t } from "@/lib/i18n/es";
import { useExperiencia } from "@/stores/experiencia";

// §4 Cap. 0: logo + barra ligada a la carga; mínimo 1,2 s en pantalla.
const MINIMO_VISIBLE_MS = 1200;
const FUNDIDO_MS = 500;

// El mínimo de 1,2 s es para la primera impresión: al volver de /tienda con
// los chunks ya en caché no se repite la espera artificial.
let yaSeMostro = false;

type Fase = "visible" | "saliendo" | "fuera";

export default function Preloader({ listo }: { listo: boolean }) {
  const [fase, setFase] = useState<Fase>("visible");
  // §4 Cap. 0: la barra sigue la carga real del GLB (bytes descargados).
  const carga = useExperiencia((s) => s.cargaProgreso);
  const nacimiento = useRef(0);
  const esReentrada = useRef(yaSeMostro);

  useEffect(() => {
    nacimiento.current = performance.now();
  }, []);

  useEffect(() => {
    if (!listo) return;
    const minimo = esReentrada.current ? 0 : MINIMO_VISIBLE_MS;
    const restante = Math.max(
      0,
      minimo - (performance.now() - nacimiento.current),
    );
    const salir = window.setTimeout(
      () => setFase("saliendo"),
      restante + (esReentrada.current ? 0 : 200),
    );
    return () => window.clearTimeout(salir);
  }, [listo]);

  useEffect(() => {
    if (fase !== "saliendo") return;
    yaSeMostro = true;
    const fuera = window.setTimeout(() => setFase("fuera"), FUNDIDO_MS);
    return () => window.clearTimeout(fuera);
  }, [fase]);

  if (fase === "fuera") return null;

  return (
    <div
      className={`degradado-marca fixed inset-0 z-50 grid place-items-center transition-opacity duration-500 ${
        fase === "saliendo" ? "pointer-events-none opacity-0" : ""
      }`}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-6">
        <span className="font-display text-lg uppercase tracking-[0.3em]">
          {t("marca.nombre")}
        </span>
        <div className="h-0.5 w-44 overflow-hidden rounded-full bg-fondo-1">
          <div
            className="h-full bg-acento transition-[width] duration-700 ease-out"
            style={{ width: `${listo ? 100 : Math.max(6, Math.round(carga * 92))}%` }}
          />
        </div>
        <span className="sr-only">{t("cargando.experiencia")}</span>
      </div>
    </div>
  );
}
