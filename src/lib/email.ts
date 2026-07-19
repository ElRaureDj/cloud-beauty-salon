// Correo transaccional vía Resend (§9.4). Punto único para el waitlist (§5.4)
// y el aviso de pedidos (webhook de Stripe). Sin RESEND_API_KEY no envía
// ("sin-config"); si Resend responde error, "error". El remitente sale de
// WAITLIST_FROM (un buzón del dominio verificado en Resend) o del sandbox de
// Resend si aún no está configurado.

export type ResultadoEmail = "enviado" | "sin-config" | "error";

// Escapa datos de usuario antes de inyectarlos en el HTML del correo: nombre,
// contacto, direcciones… nunca se meten crudos.
export function escaparHtml(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type Correo = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

export async function enviarCorreo({
  to,
  subject,
  html,
  replyTo,
}: Correo): Promise<ResultadoEmail> {
  const clave = process.env.RESEND_API_KEY;
  const remitente = process.env.WAITLIST_FROM ?? "onboarding@resend.dev";
  if (!clave) {
    console.warn("email: falta RESEND_API_KEY");
    return "sin-config";
  }

  try {
    const respuesta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${clave}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Cloud Beauty Salon <${remitente}>`,
        to: [to],
        reply_to: replyTo,
        subject,
        html,
      }),
    });
    if (!respuesta.ok) {
      console.warn(`email: Resend respondió ${respuesta.status}`);
      return "error";
    }
    return "enviado";
  } catch (error) {
    console.warn("email: fallo enviando", error);
    return "error";
  }
}
