"use client";

import { useId } from "react";

// Identidad de marca (mejora N): la nube de "Cloud Beauty Salon" cuyas ondas
// interiores son mechones de cabello — el nombre y el negocio en un solo signo.
//
// Construcción: la silueta son 3 círculos + base (fill nonzero → sin costuras),
// y las ondas se CALAN con una máscara: son transparentes de verdad, así el
// signo funciona igual sobre el fondo oscuro de la marca, sobre blanco o sobre
// una foto. Los ids son únicos por instancia (useId) para poder pintar varios
// logos en la misma página sin que las defs colisionen.

export type PropsNube = {
  /** Tamaño en px del alto del isotipo (el ancho sale del ratio 64:40). */
  alto?: number;
  /** "degradado" (marca) o "solido" (usa currentColor: header, footer…). */
  tono?: "degradado" | "solido";
  className?: string;
  /** Clase extra para el grupo animable (preloader). */
  claseNube?: string;
  claseOndas?: string;
  /**
   * Variante de tamaño mínimo. Por debajo de ~26 px las dos ondas se empastan
   * (cada trazo cae por debajo del píxel y medio) y el signo se lee como una
   * mancha; "simple" deja una sola onda más gruesa, que a 16–22 px sigue
   * leyéndose como nube + mechón. "auto" decide según `alto`.
   */
  detalle?: "auto" | "completo" | "simple";
};

/** Umbral en px a partir del cual caben las dos ondas sin empastarse. */
const ALTO_MINIMO_DOS_ONDAS = 26;

export function LogoNube({
  alto = 28,
  tono = "degradado",
  className = "",
  claseNube = "",
  claseOndas = "",
  detalle = "auto",
}: PropsNube) {
  const id = useId();
  const idMascara = `nube-mascara-${id}`;
  const idGrad = `nube-grad-${id}`;
  const relleno = tono === "degradado" ? `url(#${idGrad})` : "currentColor";
  const simple =
    detalle === "simple" ||
    (detalle === "auto" && alto < ALTO_MINIMO_DOS_ONDAS);

  return (
    <svg
      viewBox="0 0 64 40"
      height={alto}
      width={(alto * 64) / 40}
      className={className}
      role="img"
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id={idGrad} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#f2d3b0" />
          <stop offset="1" stopColor="#d99a63" />
        </linearGradient>
        <mask id={idMascara}>
          {/* Blanco = visible; negro = calado (las ondas). Los trazos se
              extienden MÁS ALLÁ del lienzo (de −7 a ~72) para que el
              preloader pueda desplazarlos un período completo sin que
              aparezcan bordes: fuera de la nube la máscara no pinta nada. */}
          <rect width="64" height="40" fill="white" />
          <g stroke="black" fill="none" strokeLinecap="round">
            <path
              className={claseOndas}
              strokeWidth={simple ? "3.2" : "2.4"}
              d="M-6.8 20.6c3.3-3.1 6.6-3.1 9.9 0s6.6 3.1 9.9 0 6.6-3.1 9.9 0 6.6 3.1 9.9 0 6.6-3.1 9.9 0 6.6 3.1 9.9 0 6.6-3.1 9.9 0 6.6 3.1 9.9 0"
            />
            {!simple && (
              <path
                className={claseOndas ? `${claseOndas}-lenta` : ""}
                strokeWidth="2.2"
                d="M-2 26.6c3-2.8 6-2.8 9 0s6 2.8 9 0 6-2.8 9 0 6 2.8 9 0 6-2.8 9 0 6 2.8 9 0 6-2.8 9 0 6 2.8 9 0"
              />
            )}
          </g>
        </mask>
      </defs>
      {/* Silueta: círculos + base. Un solo fill → sin uniones visibles. */}
      <g className={claseNube} mask={`url(#${idMascara})`} fill={relleno}>
        <circle cx="19" cy="21.5" r="8.5" />
        <circle cx="32" cy="17" r="12" />
        <circle cx="45.5" cy="21" r="9" />
        <rect x="10.5" y="21" width="44" height="8" rx="1.5" />
      </g>
    </svg>
  );
}

// Lockup completo: isotipo + wordmark. `apilado` centra el signo sobre el
// nombre (preloader, OG); en línea es el bloque del header.
export function Logo({
  alto = 26,
  tono = "degradado",
  apilado = false,
  className = "",
}: PropsNube & { apilado?: boolean }) {
  return (
    <span
      className={`inline-flex items-center ${
        apilado ? "flex-col gap-3" : "gap-2.5"
      } ${className}`}
    >
      <LogoNube alto={alto} tono={tono} />
      <span
        className="font-display uppercase leading-none tracking-[0.25em]"
        style={{ fontSize: apilado ? alto * 0.42 : alto * 0.5 }}
      >
        Cloud Beauty Salon
      </span>
    </span>
  );
}
