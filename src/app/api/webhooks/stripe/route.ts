import Stripe from "stripe";
import { enviarCorreo, escaparHtml } from "@/lib/email";

// Aviso de pedido al salón. Stripe llama aquí al completarse un pago
// (checkout.session.completed): verificamos la firma con STRIPE_WEBHOOK_SECRET
// y mandamos un email con el resumen del pedido a la bandeja del salón
// (ORDER_TO, o WAITLIST_TO por defecto — ambos van a admin@). El aviso es
// informativo: el pedido siempre queda en el panel de Stripe, así que si el
// email falla NO pedimos reintento (respondemos 200 igual).
//
// Alta: en el panel de Stripe → Developers → Webhooks → Add endpoint apuntando
// a /api/webhooks/stripe, evento checkout.session.completed; el secreto
// (whsec_…) va en STRIPE_WEBHOOK_SECRET (+ redeploy). Sin clave/secreto: 503.

function dinero(centavos: number | null, moneda: string | null): string {
  return new Intl.NumberFormat("es-US", {
    style: "currency",
    currency: (moneda ?? "usd").toUpperCase(),
  }).format((centavos ?? 0) / 100);
}

export async function POST(request: Request) {
  const clave = process.env.STRIPE_SECRET_KEY;
  const secreto = process.env.STRIPE_WEBHOOK_SECRET;
  if (!clave || !secreto) {
    console.warn("webhook 503: falta STRIPE_SECRET_KEY o STRIPE_WEBHOOK_SECRET");
    return Response.json({ ok: false }, { status: 503 });
  }

  const firma = request.headers.get("stripe-signature");
  if (!firma) return Response.json({ ok: false }, { status: 400 });

  // La verificación de firma exige el cuerpo CRUDO (no el JSON ya parseado).
  const cuerpoCrudo = await request.text();
  const stripe = new Stripe(clave);

  let evento: Stripe.Event;
  try {
    evento = await stripe.webhooks.constructEventAsync(cuerpoCrudo, firma, secreto);
  } catch (error) {
    console.warn("webhook: firma inválida", error);
    return Response.json({ ok: false }, { status: 400 });
  }

  // Reconocemos cualquier evento; solo actuamos sobre el pago completado.
  if (evento.type !== "checkout.session.completed") {
    return Response.json({ received: true }, { status: 200 });
  }

  const sesion = evento.data.object;

  try {
    const destino = process.env.ORDER_TO ?? process.env.WAITLIST_TO;
    if (!destino) {
      console.warn("webhook: sin ORDER_TO/WAITLIST_TO — no se envía aviso");
      return Response.json({ received: true }, { status: 200 });
    }

    const lineas = await stripe.checkout.sessions.listLineItems(sesion.id, {
      limit: 50,
    });
    const filas = lineas.data
      .map(
        (li) =>
          `<li>${escaparHtml(li.description ?? "Producto")} × ${li.quantity ?? 1} — ${dinero(li.amount_total, sesion.currency)}</li>`,
      )
      .join("");

    const cliente = sesion.customer_details;
    const dir = sesion.collected_information?.shipping_details?.address ?? null;
    const dirTexto = dir
      ? [
          dir.line1,
          dir.line2,
          [dir.city, dir.state, dir.postal_code].filter(Boolean).join(" "),
          dir.country,
        ]
          .filter(Boolean)
          .join(", ")
      : "—";

    const html =
      `<h2>Nuevo pedido</h2>` +
      `<p><strong>Cliente:</strong> ${escaparHtml(cliente?.name ?? "—")} ` +
      `(${escaparHtml(cliente?.email ?? "—")})</p>` +
      `<p><strong>Envío a:</strong> ${escaparHtml(dirTexto)}</p>` +
      `<p><strong>Productos:</strong></p><ul>${filas}</ul>` +
      `<p><strong>Total:</strong> ${dinero(sesion.amount_total, sesion.currency)}</p>` +
      `<p style="color:#888">Pedido ${escaparHtml(sesion.id)} — gestión completa en el panel de Stripe.</p>`;

    const resultado = await enviarCorreo({
      to: destino,
      subject: `Nuevo pedido · ${dinero(sesion.amount_total, sesion.currency)}`,
      html,
      replyTo: cliente?.email ?? undefined,
    });
    if (resultado !== "enviado") {
      console.warn(`webhook: aviso de pedido no enviado (${resultado})`);
    }
  } catch (error) {
    console.warn("webhook: error preparando/enviando el aviso", error);
  }

  return Response.json({ received: true }, { status: 200 });
}
