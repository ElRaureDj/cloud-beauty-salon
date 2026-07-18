import type { Metadata } from "next";
import Link from "next/link";
import { t } from "@/lib/i18n/es";

export const metadata: Metadata = {
  title: t("noEncontrado.titulo"),
};

export default function NoEncontrado() {
  return (
    <main className="grid min-h-svh place-items-center px-6 text-center">
      <div>
        <p className="font-display text-5xl" aria-hidden>
          404
        </p>
        <h1 className="mt-3 font-display text-2xl">{t("noEncontrado.titulo")}</h1>
        <p className="mt-2 text-tinta-suave">{t("noEncontrado.mensaje")}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/tienda" className="boton-primario">
            {t("carrito.irTienda")}
          </Link>
          <Link href="/" className="boton-secundario">
            {t("tienda.volver")}
          </Link>
        </div>
      </div>
    </main>
  );
}
