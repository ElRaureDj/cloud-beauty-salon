import type { ClaveI18n } from "@/lib/i18n";

// Kits / bundles curados (mejora G1): sets de productos por objetivo. Al añadir
// un kit se marca como bundle → aplica el 10% de descuento de rutina completa
// (mismo mecanismo que el diagnóstico, §5.3). Los ids deben existir en el
// catálogo; la página filtra los que falten o no tengan precio.
export type Kit = {
  id: string;
  nombre: ClaveI18n;
  descripcion: ClaveI18n;
  productos: string[];
};

export const KITS: Kit[] = [
  {
    id: "rubias",
    nombre: "kits.rubias.nombre",
    descripcion: "kits.rubias.desc",
    productos: [
      "blond-revolution-antioxidant-shampoo",
      "blond-revolution-immediate-neutralizing-mousse-300ml",
      "blond-revolution-impassable-blond-finisher",
    ],
  },
  {
    id: "rizos",
    nombre: "kits.rizos.nombre",
    descripcion: "kits.rizos.desc",
    productos: ["curly-shampoo", "curly-conditioner", "curly-fix"],
  },
  {
    id: "reconstruccion",
    nombre: "kits.reconstruccion.nombre",
    descripcion: "kits.reconstruccion.desc",
    productos: ["shock-repair-1-box-with-4-units", "instant-repair", "miracle-mask"],
  },
  {
    id: "hidratacion",
    nombre: "kits.hidratacion.nombre",
    descripcion: "kits.hidratacion.desc",
    productos: [
      "ultra-hydration-shampoo",
      "ultra-hydration-conditioner",
      "nutri-infusion-mask-180g-6-35-fl-oz",
    ],
  },
];
