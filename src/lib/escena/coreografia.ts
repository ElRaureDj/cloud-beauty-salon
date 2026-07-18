// Coreografía del scroll — GUION §4. Los porcentajes son contrato:
// cada ScrollTrigger se nombra con el id del capítulo.
export const CAPITULOS = [
  { id: "cap0", inicio: 0, fin: 0 }, // Portada (estado inicial)
  { id: "cap1", inicio: 0, fin: 0.15 }, // Del rostro al pelo
  { id: "cap2-pelo", inicio: 0.15, fin: 0.32 }, // Estación PELO — PIN
  // TODO(guion): caps. 3–7 llegan en Fase 3 (§10)
] as const;

export type IdCapitulo = (typeof CAPITULOS)[number]["id"] | "post-fase-1";

export function capituloEn(p: number): IdCapitulo {
  if (p < 0.002) return "cap0";
  if (p < 0.15) return "cap1";
  if (p <= 0.32) return "cap2-pelo";
  return "post-fase-1";
}

// Todo modelo se normaliza a esta altura con los pies en y = 0 (Escena.tsx),
// así el asset comprado sustituye al placeholder sin tocar la coreografía.
export const ALTURA_MODELO = 1.7;

// Cabeza centrada en y ≈ 1.58 con la figura normalizada a 1.7.
export const ANCLAS = {
  rostro: [0, 1.56, 0] as const,
  cabeza: [0, 1.58, 0] as const,
};

type ClaveCamara = {
  p: number;
  pos: [number, number, number];
  mirada: [number, number, number];
};

// [CAM] Caps. 0–2, encuadres pensados en vertical primero (§2):
// 0→10% dolly-in del rostro hacia el lateral de la cabeza;
// 10→15% órbita ~20° hasta que el pelo llena el cuadro;
// 15→32% cámara quieta (el pin); la respiración ±3° se añade aparte.
export const CLAVES_CAMARA: ClaveCamara[] = [
  { p: 0.0, pos: [0, 1.54, 1.5], mirada: [0, 1.5, 0] },
  { p: 0.1, pos: [0.55, 1.62, 0.75], mirada: [0, 1.56, 0] },
  { p: 0.15, pos: [0.62, 1.66, 0.12], mirada: [0, 1.6, -0.02] },
  { p: 0.32, pos: [0.62, 1.66, 0.12], mirada: [0, 1.6, -0.02] },
];

const suavizar = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2; // easeInOutSine

export function camaraEn(p: number): {
  pos: [number, number, number];
  mirada: [number, number, number];
} {
  const claves = CLAVES_CAMARA;
  const maxP = claves[claves.length - 1].p;
  const pc = Math.min(Math.max(p, 0), maxP);
  let i = 0;
  while (i < claves.length - 2 && pc > claves[i + 1].p) i++;
  const a = claves[i];
  const b = claves[i + 1];
  const tramo = b.p - a.p;
  const t = tramo === 0 ? 0 : suavizar((pc - a.p) / tramo);
  const mezcla = (x: number, y: number) => x + (y - x) * t;
  return {
    pos: [mezcla(a.pos[0], b.pos[0]), mezcla(a.pos[1], b.pos[1]), mezcla(a.pos[2], b.pos[2])],
    mirada: [
      mezcla(a.mirada[0], b.mirada[0]),
      mezcla(a.mirada[1], b.mirada[1]),
      mezcla(a.mirada[2], b.mirada[2]),
    ],
  };
}

// Órbita casi imperceptible (±3°) durante el pin del Cap. 2 para que la
// imagen respire (§4 Cap. 2). Entra y sale con suavidad en los bordes del pin.
const GRADOS_RESPIRACION = 3;

export function orbitaRespiracion(p: number, tiempo: number): number {
  const { inicio, fin } = { inicio: 0.15, fin: 0.32 };
  if (p <= inicio || p >= fin + 0.03) return 0;
  const entrada = Math.min(1, (p - inicio) / 0.02);
  const salida = p > fin ? 1 - (p - fin) / 0.03 : 1;
  const peso = Math.min(entrada, salida);
  return peso * GRADOS_RESPIRACION * (Math.PI / 180) * Math.sin(tiempo * 0.35);
}

// [3D] Cap. 1: la luz clave gana intensidad sobre el pelo (§4 Cap. 1).
export function intensidadLuzClave(p: number): number {
  const t = Math.min(Math.max(p / 0.15, 0), 1);
  return 1.2 + 0.6 * t * t * (3 - 2 * t); // smoothstep
}
