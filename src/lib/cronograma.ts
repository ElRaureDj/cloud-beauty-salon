import type { Etapa } from "@/lib/catalogo";
import type { RespuestasQuiz } from "@/stores/carrito";

// Cronograma capilar (mejora H1). Guía GENERAL (no consejo médico) que reparte
// las etapas —hidratación, nutrición, reconstrucción— entre los lavados de la
// semana según el nivel de daño: más reconstrucción cuanto más dañado, siempre
// con hidratación para no resecar la fibra.

export type NivelDano = 0 | 1 | 2; // bajo, medio, alto
export type Lavados = 2 | 3 | 4;

export const NIVELES: NivelDano[] = [0, 1, 2];
export const LAVADOS: Lavados[] = [2, 3, 4];

const TABLA: Record<NivelDano, Record<Lavados, Etapa[]>> = {
  0: {
    2: ["hidratacion", "nutricion"],
    3: ["hidratacion", "hidratacion", "nutricion"],
    4: ["hidratacion", "hidratacion", "nutricion", "hidratacion"],
  },
  1: {
    2: ["hidratacion", "reconstruccion"],
    3: ["hidratacion", "nutricion", "reconstruccion"],
    4: ["hidratacion", "nutricion", "reconstruccion", "hidratacion"],
  },
  2: {
    2: ["nutricion", "reconstruccion"],
    3: ["hidratacion", "reconstruccion", "nutricion"],
    4: ["hidratacion", "reconstruccion", "nutricion", "reconstruccion"],
  },
};

export function rotacion(nivel: NivelDano, lavados: Lavados): Etapa[] {
  return TABLA[nivel][lavados];
}

// Días sugeridos (0 = lunes … 6 = domingo) repartidos en la semana.
export function diasSugeridos(lavados: Lavados): number[] {
  if (lavados === 2) return [0, 3];
  if (lavados === 3) return [0, 2, 4];
  return [0, 2, 4, 6];
}

// Valores por defecto derivados del diagnóstico (si la clienta lo hizo): la
// frecuencia de lavado y el daño (química agresiva o calor diario suben el nivel).
export function desdeQuiz(q: RespuestasQuiz | null): {
  lavados: Lavados;
  nivel: NivelDano;
} {
  let lavados: Lavados = 3;
  if (q?.lavado === "diario") lavados = 4;
  else if (q?.lavado === "semanal") lavados = 2;

  let nivel: NivelDano = 0;
  const quimica = q?.quimica ?? [];
  const fuerte = quimica.some((c) =>
    ["decoloracion", "alisado", "permanente"].includes(c),
  );
  if (fuerte) nivel = 2;
  else if (quimica.includes("tinte") || q?.calor === "diario") nivel = 1;

  return { lavados, nivel };
}
