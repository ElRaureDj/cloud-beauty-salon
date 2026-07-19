import type { Metadata } from "next";
import Link from "next/link";
import { t } from "@/lib/i18n/es";
import VaciarCarrito from "./VaciarCarrito";

export const metadata: Metadata = { title: t("compra.exito.titulo") };

// Vuelta de Stripe Checkout (§9.2). El pago ya está confirmado por Stripe;
// aquí solo celebramos y dejamos el carrito listo para la próxima.
export default function PaginaCompraExito() {
  return (
    <main className="grid min-h-svh place-items-center px-6 text-center">
      <VaciarCarrito />
      <div>
        <p className="font-display text-4xl text-acento">✦</p>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl">
          {t("compra.exito.titulo")}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-tinta-suave">
          {t("compra.exito.mensaje")}
        </p>
        <div className="mt-8 flex justify-center gap-3">
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
