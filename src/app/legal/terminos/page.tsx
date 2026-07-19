import type { Metadata } from "next";
import Link from "next/link";
import { t } from "@/lib/i18n/es";

export const metadata: Metadata = { title: t("legal.terminos.titulo") };

// §6 — /legal/*. Devoluciones según §9.3 (30 días sin abrir); debe coincidir
// con /legal/envios y con la operación real de la tienda.
export default function PaginaTerminos() {
  return (
    <main className="mx-auto max-w-2xl px-6 pb-24 pt-28">
      <h1 className="font-display text-3xl">{t("legal.terminos.titulo")}</h1>
      <p className="mt-2 text-sm text-tinta-suave">
        Última actualización: 19 de julio de 2026
      </p>

      <div className="mt-8 space-y-8 leading-relaxed text-tinta">
        <section>
          <h2 className="font-display text-xl">1. Quiénes somos y qué vendemos</h2>
          <p className="mt-3">
            Cloud Beauty Salon (Miami, Florida, EE. UU.) opera esta tienda en
            línea de productos capilares profesionales de la marca TRUSS, de la
            que somos distribuidor autorizado. Al comprar en esta web aceptas
            estos términos.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">2. Precios y pago</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              Los precios se muestran en dólares estadounidenses (USD) e
              incluyen lo indicado en cada ficha; los impuestos sobre la venta
              que apliquen se calculan y muestran en el pago según el estado
              de destino.
            </li>
            <li>
              El pago se procesa de forma segura a través de Stripe. No
              almacenamos datos de tarjetas.
            </li>
            <li>
              Los descuentos por rutina del diagnóstico se aplican una vez por
              pedido sobre los productos de la rutina recomendada.
            </li>
            <li>
              Si un precio publicado contiene un error manifiesto, podremos
              cancelar el pedido y reembolsarlo íntegramente antes del envío.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl">3. Envíos</h2>
          <p className="mt-3">
            Enviamos a todo EE. UU. con tarifa plana de $8, gratis en pedidos
            de $75 o más. Los plazos y el detalle completo están en la{" "}
            <Link
              href="/legal/envios"
              className="text-acento underline-offset-4 hover:underline"
            >
              política de envíos y devoluciones
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">4. Devoluciones y reembolsos</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              Dispones de <strong>30 días naturales desde la entrega</strong>{" "}
              para devolver un producto <strong>sin abrir, sin usar y con el
              precinto intacto</strong>. Por higiene, los productos cosméticos
              abiertos no admiten devolución.
            </li>
            <li>
              El envío de vuelta corre por tu cuenta, salvo producto defectuoso
              o error nuestro en el pedido, en cuyo caso lo cubrimos nosotros.
            </li>
            <li>
              Tras recibir y revisar la devolución, reembolsamos al método de
              pago original en 5–10 días hábiles. Los gastos de envío
              originales solo se reembolsan si la devolución se debe a un
              defecto o a un error nuestro.
            </li>
            <li>
              Si el producto llega dañado o no es el que pediste, contáctanos
              con una foto dentro del plazo de 30 días y lo resolvemos con
              reposición o reembolso completo.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl">5. Uso de los productos</h2>
          <p className="mt-3">
            Sigue siempre el modo de uso indicado en cada producto. Los
            resultados varían según el tipo de cabello y su historial químico;
            las recomendaciones del diagnóstico capilar de esta web son
            orientativas y no sustituyen la valoración de un profesional. Ante
            cualquier irritación, suspende el uso.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">6. Responsabilidad y ley aplicable</h2>
          <p className="mt-3">
            Nuestra responsabilidad frente a un pedido se limita al importe
            pagado por él, sin perjuicio de los derechos que la ley te
            reconozca y que no puedan limitarse. Estos términos se rigen por
            las leyes del estado de Florida, EE. UU. Podemos actualizar estos
            términos; la versión publicada en esta página es la vigente para
            cada compra.
          </p>
        </section>

        <p className="nota-todo">
          Borrador operativo — TODO(guion): revisar con un asesor legal antes
          del lanzamiento y añadir la razón social definitiva (§9.5).
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
