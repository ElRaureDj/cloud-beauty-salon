// Guías capilares (mejora L4) — mini-blog SEO bilingüe. Contenido editorial
// propio (veraz, sin claims médicas), con productos del catálogo enlazados.
// Añadir una guía = añadir un objeto aquí (slug estable, ES+EN completos).

type Bi = { es: string; en: string };

export type Guia = {
  slug: string;
  titulo: Bi;
  resumen: Bi;
  fecha: string; // ISO, para el JSON-LD Article
  secciones: { titulo: Bi; parrafos: { es: string[]; en: string[] } }[];
  productos: string[]; // ids del catálogo
};

export const GUIAS: Guia[] = [
  {
    slug: "cronograma-capilar",
    titulo: {
      es: "El cronograma capilar, explicado fácil",
      en: "The hair-care schedule, made simple",
    },
    resumen: {
      es: "Hidratación, nutrición y reconstrucción: qué hace cada etapa, cómo saber cuál necesita tu pelo y cómo repartirlas en tu semana.",
      en: "Hydration, nutrition and reconstruction: what each stage does, how to tell which one your hair needs, and how to fit them into your week.",
    },
    fecha: "2026-08-06",
    secciones: [
      {
        titulo: { es: "Las tres etapas", en: "The three stages" },
        parrafos: {
          es: [
            "El cronograma capilar es la metodología brasileña que alterna tres tipos de tratamiento según lo que tu pelo pierde: agua (hidratación), lípidos (nutrición) y proteína (reconstrucción). La hidratación devuelve suavidad y elasticidad; la nutrición repone el brillo y controla el frizz; la reconstrucción recupera la fuerza de la fibra dañada por química o calor.",
            "La clave no es hacer las tres siempre, sino leer tu pelo: opaco y áspero pide nutrición; reseco y sin forma, hidratación; quebradizo o con las puntas abiertas, reconstrucción.",
          ],
          en: [
            "The hair-care schedule is the Brazilian method that alternates three types of treatment based on what your hair loses: water (hydration), lipids (nutrition) and protein (reconstruction). Hydration restores softness and elasticity; nutrition brings back shine and controls frizz; reconstruction rebuilds strength in hair damaged by chemical processes or heat.",
            "The key isn't doing all three all the time — it's reading your hair: dull and rough asks for nutrition; dry and shapeless, hydration; brittle or with split ends, reconstruction.",
          ],
        },
      },
      {
        titulo: { es: "Cómo repartirlas en tu semana", en: "How to fit them into your week" },
        parrafos: {
          es: [
            "Con dos lavados por semana y el pelo sano, basta alternar hidratación y nutrición. Si usas plancha a diario o llevas decoloración, introduce la reconstrucción una vez por semana — nunca en todos los lavados, porque el exceso de proteína endurece la fibra.",
            "En nuestra página del cronograma puedes armar tu semana en segundos según tus lavados y tu nivel de daño, con el tratamiento sugerido para cada día.",
          ],
          en: [
            "With two washes a week and healthy hair, alternating hydration and nutrition is enough. If you flat-iron daily or have bleached hair, bring in reconstruction once a week — never in every wash, as too much protein stiffens the fiber.",
            "On our schedule page you can build your week in seconds based on your washes and damage level, with a suggested treatment for each day.",
          ],
        },
      },
      {
        titulo: { es: "Señales de que vas bien", en: "Signs you're on track" },
        parrafos: {
          es: [
            "El pelo bien cronogramado se desenreda fácil en mojado, mantiene la forma al secarse y no 'chicle' al estirarlo. Si notas rigidez, baja la reconstrucción; si notas pesadez, baja la nutrición y sube la hidratación.",
          ],
          en: [
            "Well-scheduled hair detangles easily when wet, holds its shape as it dries and doesn't feel gummy when stretched. If it feels stiff, dial back reconstruction; if it feels heavy, dial back nutrition and increase hydration.",
          ],
        },
      },
    ],
    productos: [
      "ultra-hydration-shampoo",
      "nutri-infusion-mask-180g-6-35-fl-oz",
      "shock-repair-1-box-with-4-units",
    ],
  },
  {
    slug: "como-elegir-champu",
    titulo: {
      es: "Cómo elegir tu champú TRUSS",
      en: "How to choose your TRUSS shampoo",
    },
    resumen: {
      es: "El champú correcto se elige por cuero cabelludo y objetivo, no por moda. Guía rápida por tipo de pelo y línea TRUSS.",
      en: "The right shampoo is chosen by scalp and goal, not by trend. A quick guide by hair type and TRUSS line.",
    },
    fecha: "2026-08-06",
    secciones: [
      {
        titulo: { es: "Primero, el cuero cabelludo", en: "Scalp first" },
        parrafos: {
          es: [
            "El champú limpia la raíz; los largos se tratan con acondicionador y máscaras. Raíz grasa que se ensucia rápido: busca equilibrio (Equilibrium). Cabello muy reseco: una base de hidratación diaria como Ultra Hydration. Si acumulas productos de peinado, un detox suave (Vegan Detox) una vez por semana resetea sin agredir.",
          ],
          en: [
            "Shampoo cleanses the roots; lengths are treated with conditioner and masks. Oily roots that get dirty fast: look for balance (Equilibrium). Very dry hair: a daily hydration base like Ultra Hydration. If styling products build up, a gentle weekly detox (Vegan Detox) resets without stripping.",
          ],
        },
      },
      {
        titulo: { es: "Después, tu objetivo", en: "Then, your goal" },
        parrafos: {
          es: [
            "¿Color tratado? Color Shield limpia sin arrastrar pigmento. ¿Rubio que amarillea? La línea Blond Revolution combate la oxidación. ¿Frizz en el clima de Miami? Frizz Zero disciplina sin restar movimiento. ¿Rizos? Curly limpia respetando el patrón. Y si tu pelo pasó por química agresiva, Miracle o Deluxe Prime acompañan la reconstrucción.",
            "Regla de oro: el champú se elige por lo que tu pelo ES hoy, no por lo que quieres que sea — de la transformación se encargan los tratamientos.",
          ],
          en: [
            "Color-treated? Color Shield cleanses without stripping pigment. Blonde turning yellow? The Blond Revolution line fights oxidation. Frizz in Miami weather? Frizz Zero tames without killing movement. Curls? Curly cleanses while respecting your pattern. And if your hair has been through aggressive chemistry, Miracle or Deluxe Prime support reconstruction.",
            "Golden rule: choose your shampoo for what your hair IS today, not what you want it to become — transformation is the treatments' job.",
          ],
        },
      },
    ],
    productos: [
      "equilibrium-shampoo",
      "ultra-hydration-shampoo",
      "color-shield-shampoo-300ml-10-1-fl-oz",
      "frizz-zero-shampoo",
    ],
  },
  {
    slug: "rutina-rubias",
    titulo: {
      es: "La rutina para rubias que sí funciona",
      en: "The blonde routine that actually works",
    },
    resumen: {
      es: "Decoloración = fibra sedienta y amarillo indeseado. Los tres gestos que mantienen un rubio luminoso entre visitas al salón.",
      en: "Bleaching = thirsty fiber and unwanted yellow. The three habits that keep a blonde luminous between salon visits.",
    },
    fecha: "2026-08-06",
    secciones: [
      {
        titulo: { es: "Neutralizar sin resecar", en: "Neutralize without drying" },
        parrafos: {
          es: [
            "El amarillo aparece porque el pigmento frío se lava antes que el fondo cálido de la decoloración. Un champú antioxidante para rubias (Blond Revolution) mantiene el tono más tiempo, y la mousse neutralizante refresca los matices entre lavados con hidratación en vez de resecar como los matizadores agresivos.",
          ],
          en: [
            "Yellow shows up because cool pigment washes out before the warm undertone left by bleaching. An antioxidant shampoo for blondes (Blond Revolution) keeps the tone longer, and the neutralizing mousse refreshes it between washes while hydrating — unlike harsh toners that dry hair out.",
          ],
        },
      },
      {
        titulo: { es: "Reconstruir y sellar", en: "Rebuild and seal" },
        parrafos: {
          es: [
            "La fibra decolorada pierde proteína: una reconstrucción semanal (Deluxe Prime, o ampollas Shock Repair en momentos críticos) le devuelve cuerpo y elasticidad. Y antes del secador o la plancha, un finalizador con protección térmica sella la cutícula y aporta ese brillo espejo del salón.",
            "Con estos tres gestos —limpiar en frío, reconstruir semanal y sellar con calor controlado— el rubio aguanta luminoso hasta el próximo retoque.",
          ],
          en: [
            "Bleached fiber loses protein: a weekly reconstruction (Deluxe Prime, or Shock Repair ampoules at critical moments) restores body and elasticity. And before blow-drying or flat-ironing, a finisher with heat protection seals the cuticle and delivers that mirror-like salon shine.",
            "With these three habits — cool-toned cleansing, weekly rebuilding and sealed, controlled heat — your blonde stays luminous until the next touch-up.",
          ],
        },
      },
    ],
    productos: [
      "blond-revolution-antioxidant-shampoo",
      "blond-revolution-immediate-neutralizing-mousse-300ml",
      "blond-revolution-impassable-blond-finisher",
      "deluxe-prime-champagne-blond",
    ],
  },
];

export function guiaPorSlug(slug: string): Guia | undefined {
  return GUIAS.find((g) => g.slug === slug);
}
