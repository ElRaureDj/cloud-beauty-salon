import Stripe from "stripe";
import { enviarCorreo, escaparHtml } from "@/lib/email";
import { sql } from "@/lib/db";

// Webhook de Stripe. Dos trabajos:
//  1) Descontar stock del pedido pagado (bloque 3) — idempotente por sesión,
//     así reintentos y el par completed/async_succeeded descuentan 1 sola vez.
//     Un fallo de BD aquí devuelve 500 A PROPÓSITO para que Stripe reintente.
//  2) Avisar al salón por email (informativo, best-effort: nunca falla la
//     respuesta; el pedido siempre queda en el panel de Stripe).
//
// Alta en Stripe (Developers → Webhooks): eventos checkout.session.completed,
// checkout.session.async_payment_succeeded / .async_payment_failed y
// charge.refunded; el secreto (whsec_…) en STRIPE_WEBHOOK_SECRET (+ redeploy).

const TIPOS_SESION = new Set<string>([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
]);

function dinero(centavos: number | null, moneda: string | null): string {
  return new Intl.NumberFormat("es-US", {
    style: "currency",
    currency: (moneda ?? "usd").toUpperCase(),
  }).format((centavos ?? 0) / 100);
}

// Recupera {producto_id, cantidad} de los line items expandidos: el id viaja en
// product.metadata.producto_id (lo stampa el checkout). Sin metadata (sesiones
// antiguas) esa línea se ignora para el descuento.
function itemsVendidos(
  lineItems: Stripe.LineItem[],
): { producto_id: string; cantidad: number }[] {
  const out: { producto_id: string; cantidad: number }[] = [];
  for (const li of lineItems) {
    const prod = li.price?.product;
    const id =
      prod && typeof prod === "object" && !("deleted" in prod && prod.deleted)
        ? (prod as Stripe.Product).metadata?.producto_id
        : undefined;
    if (id && li.quantity) out.push({ producto_id: id, cantidad: li.quantity });
  }
  return out;
}

// Descuento atómico e idempotente en UNA sentencia. La PK de pedidos_procesados
// serializa la "reclamación": si la sesión ya se procesó, `claim` queda vacío y
// no se actualiza nada. Devuelve true si detecta sobreventa (se pidió más de lo
// que había) para avisar al salón. Requiere sql != null (lo garantiza quien llama).
async function descontarStock(
  cliente: NonNullable<typeof sql>,
  sessionId: string,
  eventoId: string,
  vendidos: { producto_id: string; cantidad: number }[],
): Promise<boolean> {
  const json = JSON.stringify(vendidos);
  const filas = (await cliente`
    with entrada as (select ${json}::jsonb as data),
    lineas as (
      select x.producto_id, x.cantidad
      from entrada, jsonb_to_recordset(entrada.data) as x(producto_id text, cantidad int)
    ),
    antes as (
      select producto_id, unidades from stock
      where producto_id in (select producto_id from lineas)
    ),
    claim as (
      insert into pedidos_procesados (session_id, evento_id, lineas)
      values (${sessionId}, ${eventoId}, (select data from entrada))
      on conflict (session_id) do nothing
      returning session_id
    ),
    vendidos as (
      select producto_id, cantidad from lineas where exists (select 1 from claim)
    )
    update stock s
      set unidades = greatest(0, s.unidades - v.cantidad), actualizado_en = now()
    from vendidos v, antes a
    where s.producto_id = v.producto_id and a.producto_id = v.producto_id
    returning s.producto_id, a.unidades as antes, v.cantidad as pedida
  `) as { producto_id: string; antes: number; pedida: number }[];
  return filas.some((f) => Number(f.antes) < Number(f.pedida));
}

async function avisarPedido(opts: {
  sesion: Stripe.Checkout.Session;
  lineItems: Stripe.LineItem[];
  destino: string;
  pagado: boolean;
  fallido: boolean;
  oversold: boolean;
}): Promise<void> {
  const { sesion, lineItems, destino, pagado, fallido, oversold } = opts;
  const filas = lineItems
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

  const estadoPago = fallido
    ? "PAGO FALLIDO — el cobro asíncrono no se completó, no despaches"
    : pagado
      ? "Pagado ✓"
      : "PENDIENTE — el pago aún se está procesando, no despaches todavía";

  const html =
    `<h2>Nuevo pedido</h2>` +
    (oversold
      ? `<p style="color:#b00"><strong>⚠ OVERSOLD — verifica el stock físico: se pidió más de lo disponible.</strong></p>`
      : ``) +
    `<p><strong>Estado del pago:</strong> ${escaparHtml(estadoPago)}</p>` +
    `<p><strong>Cliente:</strong> ${escaparHtml(cliente?.name ?? "—")} ` +
    `(${escaparHtml(cliente?.email ?? "—")})</p>` +
    `<p><strong>Envío a:</strong> ${escaparHtml(dirTexto)}</p>` +
    `<p><strong>Productos:</strong></p><ul>${filas}</ul>` +
    `<p><strong>Total:</strong> ${dinero(sesion.amount_total, sesion.currency)}</p>` +
    `<p style="color:#888">Pedido ${escaparHtml(sesion.id)} — gestión completa en el panel de Stripe.</p>`;

  const asunto = fallido
    ? "Pedido (pago fallido)"
    : pagado
      ? "Nuevo pedido"
      : "Pedido (pago pendiente)";

  const resultado = await enviarCorreo({
    to: destino,
    subject: `${asunto} · ${dinero(sesion.amount_total, sesion.currency)}`,
    html,
    replyTo: cliente?.email ?? undefined,
  });
  if (resultado !== "enviado") {
    console.warn(`webhook: aviso de pedido no enviado (${resultado})`);
  }
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

  const destino = process.env.ORDER_TO ?? process.env.WAITLIST_TO;

  // Reembolso: solo aviso al salón. NO se repone stock en v1 (un reembolso no
  // implica que la unidad vuelva a la estantería); se ajusta a mano en /admin.
  if (evento.type === "charge.refunded") {
    const cargo = evento.data.object;
    if (destino) {
      await enviarCorreo({
        to: destino,
        subject: `Reembolso · ${dinero(cargo.amount_refunded, cargo.currency)}`,
        html:
          `<h2>Reembolso emitido</h2>` +
          `<p>Se reembolsaron ${dinero(cargo.amount_refunded, cargo.currency)} del cargo ${escaparHtml(cargo.id)}.</p>` +
          `<p><strong>El stock NO se repone automáticamente.</strong> Si la unidad vuelve a estar disponible, ajústala en el panel /admin.</p>`,
      }).catch((error) =>
        console.warn("webhook: aviso de reembolso no enviado", error),
      );
    }
    return Response.json({ received: true }, { status: 200 });
  }

  if (!TIPOS_SESION.has(evento.type)) {
    return Response.json({ received: true }, { status: 200 });
  }

  const sesion = evento.data.object as Stripe.Checkout.Session;
  // "no_payment_required" = pedido cumplido de importe $0 (p. ej. código 100% +
  // envío gratis): también descuenta stock, si no se podría sobrevender.
  const pagado =
    evento.type === "checkout.session.async_payment_succeeded" ||
    (evento.type === "checkout.session.completed" &&
      (sesion.payment_status === "paid" ||
        sesion.payment_status === "no_payment_required"));
  const fallido = evento.type === "checkout.session.async_payment_failed";

  // Line items expandidos: una sola lectura sirve para descontar y para el email.
  let lineItems: Stripe.LineItem[] = [];
  try {
    const lista = await stripe.checkout.sessions.listLineItems(sesion.id, {
      expand: ["data.price.product"],
      limit: 100,
    });
    lineItems = lista.data;
  } catch (error) {
    // Si íbamos a descontar y no podemos leer, pedimos reintento (500).
    if (pagado && sql) {
      console.error("webhook: no pude leer line items para descontar", error);
      return Response.json({ ok: false }, { status: 500 });
    }
    console.warn("webhook: no pude leer line items (solo afecta al email)", error);
  }

  // Descuento de stock idempotente (bloque 3). Solo si el pedido está pagado y
  // hay BD. Un fallo devuelve 500 → Stripe reintenta (es idempotente por sesión).
  let oversold = false;
  if (pagado && sql && lineItems.length > 0) {
    const vendidos = itemsVendidos(lineItems);
    if (vendidos.length > 0) {
      try {
        oversold = await descontarStock(sql, sesion.id, evento.id, vendidos);
      } catch (error) {
        console.error("webhook: descuento de stock falló, pido reintento", error);
        return Response.json({ ok: false }, { status: 500 });
      }
    }
  }

  // Aviso al salón (best-effort; nunca falla la respuesta).
  if (destino) {
    try {
      await avisarPedido({ sesion, lineItems, destino, pagado, fallido, oversold });
    } catch (error) {
      console.warn("webhook: error preparando/enviando el aviso", error);
    }
  }

  return Response.json({ received: true }, { status: 200 });
}
