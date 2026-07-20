import type { Metadata } from "next";
import Link from "next/link";
import { getT, resolverLocale } from "@/lib/i18n";
import { rutaLocalizada } from "@/lib/i18n/rutas";
import VaciarCarrito from "./VaciarCarrito";

export async function generateMetadata(
  props: PageProps<"/[locale]/compra/exito">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const { t } = getT(resolverLocale(locale));
  return { title: t("compra.exito.titulo") };
}

// Vuelta de Stripe Checkout (§9.2). El pago ya está confirmado por Stripe;
// aquí solo celebramos y dejamos el carrito listo para la próxima.
export default async function PaginaCompraExito(
  props: PageProps<"/[locale]/compra/exito">,
) {
  const { locale } = await props.params;
  const busqueda = await props.searchParams;
  const loc = resolverLocale(locale);
  const { t } = getT(loc);
  const r = (path: string) => rutaLocalizada(loc, path);
  const sessionId =
    typeof busqueda.session_id === "string" ? busqueda.session_id : "";

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
        {sessionId && (
          <div className="mx-auto mt-6 max-w-sm">
            <p className="text-xs text-tinta-suave">{t("compra.exito.numero")}</p>
            <p className="mt-1 break-all rounded-lg border border-tinta-suave/20 px-3 py-2 font-mono text-xs">
              {sessionId}
            </p>
            <Link
              href={r(`/pedido?n=${encodeURIComponent(sessionId)}`)}
              className="mt-3 inline-block text-sm text-acento underline-offset-4 hover:underline"
            >
              {t("compra.exito.verPedido")}
            </Link>
          </div>
        )}
        <div className="mt-8 flex justify-center gap-3">
          <Link href={r("/tienda")} className="boton-primario">
            {t("carrito.irTienda")}
          </Link>
          <Link href={r("/")} className="boton-secundario">
            {t("tienda.volver")}
          </Link>
        </div>
      </div>
    </main>
  );
}
