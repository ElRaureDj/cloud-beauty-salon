import { neon } from "@neondatabase/serverless";

// Primera capa de persistencia del proyecto (bloque 3: inventario + reseñas).
// Neon Postgres — la integración de Vercel inyecta DATABASE_URL/POSTGRES_URL.
// Driver HTTP (una petición por consulta): sin pool que gestionar en serverless.
//
// Si NO hay URL configurada, `sql` es null y las features de BD degradan a
// "off" — igual que el checkout sin STRIPE_SECRET_KEY o el waitlist sin
// RESEND_API_KEY: la tienda sigue funcionando, solo sin badges de stock ni
// descuento de inventario. Ningún import de este módulo debe lanzar.
//
// Solo servidor: no importar desde componentes cliente.
const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

export const sql = url ? neon(url) : null;

export function hayBD(): boolean {
  return sql !== null;
}
