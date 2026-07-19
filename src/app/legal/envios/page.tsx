import type { Metadata } from "next";
import Link from "next/link";
import { t } from "@/lib/i18n/es";

export const metadata: Metadata = { title: t("legal.envios.titulo") };

// §9.3 RESUELTO (2026-07-19): todo EE. UU., $8 tarifa plana, gratis desde $75;
// devoluciones 30 días sin abrir. Estas cifras deben coincidir SIEMPRE con
// las de /api/checkout (ENVIO_CENTAVOS y ENVIO_GRATIS_DESDE_CENTAVOS).
export default function PaginaEnvios() {
  return (
    <main className="mx-auto max-w-2xl px-6 pb-24 pt-28">
      <h1 className="font-display text-3xl">{t("legal.envios.titulo")}</h1>
      <p className="mt-2 text-sm text-tinta-suave">
        Última actualización: 19 de julio de 2026
      </p>

      <div className="mt-8 space-y-8 leading-relaxed text-tinta">
        <section>
          <h2 className="font-display text-xl">Dónde enviamos</h2>
          <p className="mt-3">
            Enviamos a todo Estados Unidos (los 50 estados y Washington D. C.).
            No realizamos envíos internacionales. Si un pedido tiene como
            destino un territorio de EE. UU. o una dirección militar
            (APO/FPO/DPO) que nuestro transportista no cubra, lo cancelaremos
            y reembolsaremos íntegramente antes del envío.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">Cuánto cuesta</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              Tarifa plana de <strong>$8</strong> por pedido, a cualquier punto
              del país.
            </li>
            <li>
              <strong>Envío gratis</strong> en pedidos de <strong>$75</strong>{" "}
              o más (subtotal de productos, después de aplicar descuentos).
            </li>
          </ul>
          <p className="mt-3">
            Los impuestos sobre la venta que apliquen se calculan en el momento
            del pago según el estado de destino y se muestran antes de
            confirmar la compra.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">Cuándo llega</h2>
          <p className="mt-3">
            Preparamos los pedidos en 1–2 días hábiles y la entrega estimada es
            de <strong>3–7 días hábiles</strong> desde la confirmación del
            pago. Recibirás la confirmación del pedido por correo electrónico y
            te avisaremos cuando salga el envío.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">Devoluciones</h2>
          <p className="mt-3">
            Aceptamos devoluciones durante los <strong>30 días</strong>{" "}
            siguientes a la entrega, siempre que el producto esté{" "}
            <strong>sin abrir, sin usar y con su precinto intacto</strong>. Por
            razones de higiene no podemos aceptar productos cosméticos
            abiertos.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              El costo del envío de vuelta corre por cuenta de la clienta,
              salvo que el producto llegue defectuoso o hayamos cometido un
              error con tu pedido: en ese caso lo cubrimos nosotros.
            </li>
            <li>
              Una vez recibido y revisado el producto, reembolsamos al método
              de pago original en un plazo de 5–10 días hábiles.
            </li>
            <li>
              Si tu pedido llega dañado o incorrecto, escríbenos con una foto
              dentro de los 30 días y lo resolvemos con reposición o reembolso
              completo.
            </li>
          </ul>
          <p className="mt-3">
            Las condiciones completas están en los{" "}
            <Link
              href="/legal/terminos"
              className="text-acento underline-offset-4 hover:underline"
            >
              términos y condiciones
            </Link>
            .
          </p>
        </section>

        <p className="nota-todo">
          Borrador operativo — TODO(guion): revisar con un asesor legal antes
          del lanzamiento y añadir el canal de contacto definitivo (§9.5).
        </p>
      </div>

      <Link
        href="/"
        className="mt-10 inline-block text-acento underline-offset-4 hover:underline"
      >
        {t("tienda.volver")}
      </Link>
    </main>
  );
}
