import { es, type ClaveI18n } from "./es";
import { en } from "./en";

// Sistema i18n consciente del idioma (§7 / §9 bilingüe). El español es el
// idioma por defecto y no lleva prefijo en la URL ("/"); el inglés vive bajo
// "/en". `getT(locale)` devuelve un traductor ligado a ese idioma, con las
// llamadas `t("clave")` / `tf("clave", vars)` idénticas a antes — solo cambia
// de dónde sale `t` (servidor: getT; cliente: useT en ./client).

export const LOCALES = ["es", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const defaultLocale: Locale = "es";

export function isLocale(valor: unknown): valor is Locale {
  return (
    typeof valor === "string" && (LOCALES as readonly string[]).includes(valor)
  );
}

const diccionarios: Record<Locale, Record<ClaveI18n, string>> = { es, en };

export type Traductor = {
  locale: Locale;
  t: (clave: ClaveI18n) => string;
  tf: (clave: ClaveI18n, vars: Record<string, string | number>) => string;
};

export function getT(locale: Locale): Traductor {
  const dic = diccionarios[locale] ?? es;
  // Si faltara una clave en un idioma, caemos al español (nunca vacío).
  const leer = (clave: ClaveI18n): string => dic[clave] ?? es[clave];
  return {
    locale,
    t: leer,
    tf: (clave, vars) =>
      Object.entries(vars).reduce(
        (texto, [k, v]) => texto.replaceAll(`{${k}}`, String(v)),
        leer(clave),
      ),
  };
}

export type { ClaveI18n };
