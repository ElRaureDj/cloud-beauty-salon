import { sql } from "@/lib/db";

// Guard del email de carrito abandonado (mejora K3). Stripe entrega webhooks
// al-menos-una-vez y cada sesión abandonada dispara su propio expired: sin
// registro, una clienta podría recibir duplicados (retry) o varios correos
// (multi-sesión) — y la política de privacidad promete "un único correo".
//
// Reclama ANTES de enviar (claim-first): garantiza como máximo 1 correo por
// sesión y no más de 1 por email cada 7 días. Sin BD devuelve false (mejor no
// enviar que arriesgar spam sin guard).
export async function reclamarRecuperacion(
  session_id: string,
  email: string,
): Promise<boolean> {
  if (!sql || !session_id || !email) return false;
  // Anti-spam por clienta: si ya se le escribió hace poco (otra sesión
  // abandonada), no repetir.
  const recientes = (await sql`
    select 1 as uno from recuperaciones_enviadas
    where lower(email) = lower(${email})
      and enviada_en > now() - interval '7 days'
    limit 1
  `) as unknown[];
  if (recientes.length > 0) return false;
  // Idempotencia por sesión (reintentos de Stripe): solo la primera inserción
  // gana el derecho a enviar.
  const filas = (await sql`
    insert into recuperaciones_enviadas (session_id, email)
    values (${session_id}, ${email})
    on conflict (session_id) do nothing
    returning session_id
  `) as unknown[];
  return filas.length > 0;
}
