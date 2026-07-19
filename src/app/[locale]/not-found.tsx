"use client";

import Link from "next/link";
import { useT, useRuta } from "@/lib/i18n/client";

// not-found NO recibe params en Next, pero se renderiza dentro del layout de
// [locale] (que envuelve con LocaleProvider), así que useT/useRuta ya conocen
// el idioma. Por eso es cliente y no exporta metadata (una 404 no se indexa).
export default function NoEncontrado() {
  const { t } = useT();
  const ruta = useRuta();
  return (
    <main className="grid min-h-svh place-items-center px-6 text-center">
      <div>
        <p className="font-display text-5xl" aria-hidden>
          404
        </p>
        <h1 className="mt-3 font-display text-2xl">{t("noEncontrado.titulo")}</h1>
        <p className="mt-2 text-tinta-suave">{t("noEncontrado.mensaje")}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href={ruta("/tienda")} className="boton-primario">
            {t("carrito.irTienda")}
          </Link>
          <Link href={ruta("/")} className="boton-secundario">
            {t("tienda.volver")}
          </Link>
        </div>
      </div>
    </main>
  );
}
