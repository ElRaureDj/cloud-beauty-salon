import { sql } from "@/lib/db";
import type { Locale } from "@/lib/i18n";

// Newsletter con doble opt-in (bloque 4). El alta guarda la fila SIN confirmar
// y se envía un correo con enlace de confirmación (token aleatorio por email);
// solo las confirmadas cuentan como suscritas. Confirmación y baja MUTAN solo
// por POST (server actions): los GET de esas páginas son de solo lectura — los
// escáneres de correo corporativos (SafeLinks, Proofpoint…) detonan con GET
// todos los enlaces de un email y no deben confirmar ni borrar nada.

export type Alta = {
  token: string;
  yaConfirmado: boolean;
  ultimoEnvio: Date | null;
};

// Alta (o re-alta) de un email. Si ya existía se conserva su token; el locale
// solo se actualiza mientras NO esté confirmada (una confirmada fijó su idioma
// y un tercero no debe poder cambiárselo re-enviando el formulario).
export async function altaNewsletter(
  email: string,
  locale: Locale,
): Promise<Alta | null> {
  if (!sql) return null;
  // Purga oportunista: las altas sin confirmar caducan a los 30 días (la
  // política de privacidad no promete guardar pendientes para siempre).
  await sql`delete from newsletter where not confirmado and creada_en < now() - interval '30 days'`;
  const token = crypto.randomUUID();
  const filas = (await sql`
    insert into newsletter (email, token, locale)
    values (${email}, ${token}, ${locale})
    on conflict (email) do update set
      locale = case when newsletter.confirmado then newsletter.locale
                    else excluded.locale end
    returning token, confirmado, ultimo_envio
  `) as { token: string; confirmado: boolean; ultimo_envio: string | Date | null }[];
  if (!filas.length) return null;
  return {
    token: filas[0].token,
    yaConfirmado: filas[0].confirmado,
    ultimoEnvio: filas[0].ultimo_envio ? new Date(filas[0].ultimo_envio) : null,
  };
}

// Sella el momento del envío del correo de confirmación (throttle: el alta no
// re-manda si el último envío es reciente — antibombardeo a terceros).
export async function marcarEnvio(email: string): Promise<void> {
  if (!sql) return;
  await sql`update newsletter set ultimo_envio = now() where email = ${email}`;
}

// Lectura pura para el GET de las páginas de token (sin efectos).
export async function existeToken(token: string): Promise<boolean> {
  if (!sql || !token) return false;
  const filas = (await sql`
    select 1 as uno from newsletter where token = ${token} limit 1
  `) as { uno: number }[];
  return filas.length > 0;
}

export async function confirmarNewsletter(token: string): Promise<boolean> {
  if (!sql || !token) return false;
  const filas = (await sql`
    update newsletter
      set confirmado = true,
          confirmado_en = coalesce(confirmado_en, now())
    where token = ${token}
    returning email
  `) as { email: string }[];
  return filas.length > 0;
}

// Borra la suscripción. Devuelve true también si el token ya no existe: para
// quien pulsa el botón dos veces, "ya no estás en la lista" es la verdad.
export async function bajaNewsletter(token: string): Promise<boolean> {
  if (!sql || !token) return false;
  await sql`delete from newsletter where token = ${token}`;
  return true;
}

export type Suscriptora = {
  email: string;
  locale: string;
  token: string;
  confirmado_en: string | Date | null;
};

// Para el panel admin: solo las confirmadas (las pendientes no son lista). El
// token permite construir la URL de baja de cada una — la política promete un
// enlace de baja en cada correo, así que el panel debe poder proporcionarlo.
export async function suscriptorasConfirmadas(): Promise<Suscriptora[]> {
  if (!sql) return [];
  return (await sql`
    select email, locale, token, confirmado_en from newsletter
    where confirmado order by confirmado_en desc limit 5000
  `) as Suscriptora[];
}
