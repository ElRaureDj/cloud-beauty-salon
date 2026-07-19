"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { defaultLocale, getT, type Locale, type Traductor } from ".";
import { rutaLocalizada } from "./rutas";

// Idioma actual para los componentes cliente. El layout de cada idioma envuelve
// el árbol con <LocaleProvider locale={...}>; los componentes obtienen su
// traductor con useT(), manteniendo `t("clave")` igual que antes.
const LocaleContext = createContext<Locale>(defaultLocale);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export function useT(): Traductor {
  const locale = useLocale();
  return useMemo(() => getT(locale), [locale]);
}

// Href localizado en cliente: r("/tienda") → "/tienda" (es) o "/en/tienda" (en).
// Mantiene los <Link href={r("...")}> conscientes del idioma sin acoplar cada
// componente al valor del locale.
export function useRuta(): (path: string) => string {
  const locale = useLocale();
  return useMemo(
    () => (path: string) => rutaLocalizada(locale, path),
    [locale],
  );
}
