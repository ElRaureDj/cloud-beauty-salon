// Coreografía del scroll — GUION §4. Los porcentajes son contrato:
// cada ScrollTrigger se nombra con el id del capítulo.
export const CAPITULOS = [
  { id: "cap0", inicio: 0, fin: 0 }, // Portada (estado inicial)
  { id: "cap1", inicio: 0, fin: 0.15 }, // Del rostro al pelo
  { id: "cap2-pelo", inicio: 0.15, fin: 0.32 }, // Estación PELO — PIN
  { id: "cap3", inicio: 0.32, fin: 0.45 }, // Descenso por el torso + vitrina
  { id: "cap4-manos", inicio: 0.45, fin: 0.65 }, // Estación MANOS — PIN
  { id: "cap5", inicio: 0.65, fin: 0.72 }, // Descenso piernas
  { id: "cap6-pies", inicio: 0.72, fin: 0.85 }, // Estación PIES — PIN
  { id: "cap7", inicio: 0.85, fin: 1 }, // Cierre y conversión
] as const;

export type IdCapitulo = (typeof CAPITULOS)[number]["id"];

export function capituloEn(p: number): IdCapitulo {
  // Zona muerta de portada: un sub-píxel de scroll no saca del estado cap0.
  if (p < 0.002) return "cap0";
  for (let i = CAPITULOS.length - 1; i >= 2; i--) {
    if (p > CAPITULOS[i].inicio) return CAPITULOS[i].id;
  }
  return "cap1";
}

// Todo modelo se normaliza a esta altura con los pies en y = 0 (Escena.tsx),
// así un asset nuevo sustituye al actual sin tocar la coreografía.
export const ALTURA_MODELO = 1.7;

// Con la figura normalizada a 1.7: cabeza ≈ 1.58, cintura ≈ 1.0, pies ≈ 0.1.
export const ANCLAS = {
  rostro: [0, 1.56, 0] as const,
  cabeza: [0, 1.58, 0] as const,
};

type ClaveCamara = {
  p: number;
  pos: [number, number, number];
  mirada: [number, number, number];
};

// [CAM] El viaje completo, encuadres pensados en vertical primero (§2):
// 0→15% rostro→lateral; 15→32% pin pelo; 32→45% pull-back + órbita de 180°
// descendiendo del hombro a la cintura (la "vuelta" la hace la cámara);
// 45→65% pin manos; 65→72% descenso rápido con órbita inversa; 72→85% pin
// pies en picado suave; 85→100% pull-back a figura completa en ¾ trasero.
export const CLAVES_CAMARA: ClaveCamara[] = [
  { p: 0.0, pos: [0, 1.54, 1.5], mirada: [0, 1.5, 0] },
  { p: 0.1, pos: [0.55, 1.62, 0.75], mirada: [0, 1.56, 0] },
  { p: 0.15, pos: [0.62, 1.66, 0.12], mirada: [0, 1.6, -0.02] },
  { p: 0.32, pos: [0.62, 1.66, 0.12], mirada: [0, 1.6, -0.02] },
  { p: 0.36, pos: [0.78, 1.48, -0.38], mirada: [0, 1.36, 0] },
  { p: 0.4, pos: [0.16, 1.28, -0.98], mirada: [0, 1.16, 0] },
  { p: 0.45, pos: [-0.9, 1.08, -0.12], mirada: [0, 1.0, 0] },
  // Pin MANOS: encuadre vertical-first — ambas manos (cadera y muslo) caben
  // en el cuadro de 390×844 (§2).
  { p: 0.5, pos: [-0.5, 0.92, 1.3], mirada: [-0.02, 0.84, 0.03] },
  { p: 0.65, pos: [-0.5, 0.92, 1.3], mirada: [-0.02, 0.84, 0.03] },
  // Cap. 5: órbita INVERSA (−90°) para variar el ritmo (§4) — el sentido de
  // giro se invierte respecto a los caps. 3-4.
  { p: 0.72, pos: [-0.82, 0.52, -0.5], mirada: [0, 0.36, 0] },
  { p: 0.76, pos: [-0.45, 0.6, -0.62], mirada: [0.02, 0.12, 0.02] },
  { p: 0.85, pos: [-0.45, 0.6, -0.62], mirada: [0.02, 0.12, 0.02] },
  { p: 0.93, pos: [1.5, 1.22, -1.62], mirada: [0, 0.96, 0] },
  { p: 1.0, pos: [1.58, 1.28, -1.9], mirada: [0, 1.0, 0] },
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

// Órbita casi imperceptible (±3°) durante los pines para que la imagen
// respire (§4 caps. 2, 4 y 6). Entra y sale con suavidad en los bordes.
const GRADOS_RESPIRACION = 3;
const PINES = [
  { inicio: 0.15, fin: 0.32 },
  { inicio: 0.5, fin: 0.65 },
  { inicio: 0.76, fin: 0.85 },
];

export function orbitaRespiracion(p: number, tiempo: number): number {
  for (const pin of PINES) {
    if (p <= pin.inicio || p >= pin.fin + 0.03) continue;
    const entrada = Math.min(1, (p - pin.inicio) / 0.02);
    const salida = p > pin.fin ? 1 - (p - pin.fin) / 0.03 : 1;
    const peso = Math.min(entrada, salida);
    return peso * GRADOS_RESPIRACION * (Math.PI / 180) * Math.sin(tiempo * 0.35);
  }
  return 0;
}

// [3D] Cap. 1: la luz clave gana intensidad sobre el pelo (§4 Cap. 1).
export function intensidadLuzClave(p: number): number {
  const t = Math.min(Math.max(p / 0.15, 0), 1);
  return 1.2 + 0.6 * t * t * (3 - 2 * t); // smoothstep
}

// [3D] Cap. 3 — vitrina flotante (§4): rango en el que orbitan los productos.
export const VITRINA = { inicio: 0.32, fin: 0.45 };
