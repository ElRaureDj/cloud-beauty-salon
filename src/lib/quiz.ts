import type { RespuestasQuiz } from "@/stores/carrito";
import type { ClaveI18n } from "@/lib/i18n/es";

// Definición del quiz capilar (§5.1): 10 preguntas, una por pantalla.
// Todo el copy vive en el diccionario i18n (§7): aquí solo claves y valores.

export type OpcionQuiz = {
  valor: string;
  clave: ClaveI18n;
  claveDetalle?: ClaveI18n;
};

export type PasoQuiz = {
  campo: keyof RespuestasQuiz;
  claveTitulo: ClaveI18n;
  claveAyuda?: ClaveI18n;
  tipo: "simple" | "multi" | "patron" | "colores";
  maximo?: number;
  opciones?: OpcionQuiz[];
};

// Patrones 1–4 con subtipos A–C: selector visual, no texto técnico (§5.1).
export const GRUPOS_PATRON = [
  { grupo: "1", clave: "patron.1", onda: 0 },
  { grupo: "2", clave: "patron.2", onda: 1 },
  { grupo: "3", clave: "patron.3", onda: 2 },
  { grupo: "4", clave: "patron.4", onda: 3 },
] as const satisfies ReadonlyArray<{ grupo: string; clave: ClaveI18n; onda: number }>;

export const SWATCHES_COLOR = [
  { valor: "#0d0b0a", clave: "swatch.negro" },
  { valor: "#2e1b13", clave: "swatch.castanoOscuro" },
  { valor: "#5a3825", clave: "swatch.castano" },
  { valor: "#8a5a33", clave: "swatch.castanoClaro" },
  { valor: "#b5773a", clave: "swatch.cobrizo" },
  { valor: "#d9a45f", clave: "swatch.rubioOscuro" },
  { valor: "#e8c98a", clave: "swatch.rubio" },
  { valor: "#f2e6c9", clave: "swatch.platino" },
  { valor: "#8c3b2e", clave: "swatch.rojo" },
  { valor: "#9c9c9c", clave: "swatch.gris" },
  { valor: "#7c4a8f", clave: "swatch.fantasia" },
] as const satisfies ReadonlyArray<{ valor: string; clave: ClaveI18n }>;

export const PASOS_QUIZ: PasoQuiz[] = [
  { campo: "patron", claveTitulo: "quiz.pregunta.patron", tipo: "patron" },
  {
    campo: "grosor",
    claveTitulo: "quiz.pregunta.grosor",
    tipo: "simple",
    opciones: [
      { valor: "fino", clave: "op.grosor.fino", claveDetalle: "op.grosor.fino.d" },
      { valor: "medio", clave: "op.grosor.medio", claveDetalle: "op.grosor.medio.d" },
      { valor: "grueso", clave: "op.grosor.grueso", claveDetalle: "op.grosor.grueso.d" },
    ],
  },
  {
    campo: "porosidad",
    claveTitulo: "quiz.pregunta.porosidad",
    claveAyuda: "quiz.pregunta.porosidad.ayuda",
    tipo: "simple",
    opciones: [
      { valor: "baja", clave: "op.porosidad.baja", claveDetalle: "op.porosidad.baja.d" },
      { valor: "media", clave: "op.porosidad.media", claveDetalle: "op.porosidad.media.d" },
      { valor: "alta", clave: "op.porosidad.alta", claveDetalle: "op.porosidad.alta.d" },
    ],
  },
  {
    campo: "cuero",
    claveTitulo: "quiz.pregunta.cuero",
    tipo: "simple",
    opciones: [
      { valor: "graso", clave: "op.cuero.graso", claveDetalle: "op.cuero.graso.d" },
      { valor: "normal", clave: "op.cuero.normal" },
      { valor: "seco", clave: "op.cuero.seco", claveDetalle: "op.cuero.seco.d" },
      { valor: "sensible", clave: "op.cuero.sensible", claveDetalle: "op.cuero.sensible.d" },
      { valor: "caspa", clave: "op.cuero.caspa" },
    ],
  },
  {
    campo: "quimica",
    claveTitulo: "quiz.pregunta.quimica",
    claveAyuda: "quiz.pregunta.quimica.ayuda",
    tipo: "multi",
    opciones: [
      { valor: "tinte", clave: "op.quimica.tinte" },
      { valor: "decoloracion", clave: "op.quimica.decoloracion" },
      { valor: "alisado", clave: "op.quimica.alisado" },
      { valor: "permanente", clave: "op.quimica.permanente" },
      { valor: "ninguna", clave: "op.quimica.ninguna" },
    ],
  },
  { campo: "colorOriginal", claveTitulo: "quiz.pregunta.colores", tipo: "colores" },
  {
    campo: "largo",
    claveTitulo: "quiz.pregunta.largo",
    tipo: "simple",
    opciones: [
      { valor: "corto", clave: "op.largo.corto", claveDetalle: "op.largo.corto.d" },
      { valor: "medio", clave: "op.largo.medio", claveDetalle: "op.largo.medio.d" },
      { valor: "largo", clave: "op.largo.largo", claveDetalle: "op.largo.largo.d" },
      { valor: "extra", clave: "op.largo.extra", claveDetalle: "op.largo.extra.d" },
    ],
  },
  {
    campo: "calor",
    claveTitulo: "quiz.pregunta.calor",
    tipo: "simple",
    opciones: [
      { valor: "nunca", clave: "op.calor.nunca" },
      { valor: "aveces", clave: "op.calor.aveces" },
      { valor: "diario", clave: "op.calor.diario" },
    ],
  },
  {
    campo: "lavado",
    claveTitulo: "quiz.pregunta.lavado",
    tipo: "simple",
    opciones: [
      { valor: "diario", clave: "op.lavado.diario" },
      { valor: "interdiario", clave: "op.lavado.interdiario" },
      { valor: "semanal", clave: "op.lavado.semanal" },
    ],
  },
  {
    campo: "objetivos",
    claveTitulo: "quiz.pregunta.objetivo",
    tipo: "multi",
    maximo: 2, // §5.1: objetivo principal, máx. 2
    opciones: [
      { valor: "hidratacion", clave: "op.objetivo.hidratacion" },
      { valor: "frizz", clave: "op.objetivo.frizz" },
      { valor: "color", clave: "op.objetivo.color" },
      { valor: "reconstruccion", clave: "op.objetivo.reconstruccion" },
      { valor: "crecimiento", clave: "op.objetivo.crecimiento" },
      { valor: "volumen", clave: "op.objetivo.volumen" },
    ],
  },
];
