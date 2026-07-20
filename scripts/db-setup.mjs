// Crea las tablas del bloque 3 (inventario + reseñas) y siembra el stock
// inicial desde src/lib/data/productos.json.
//
// Uso:  DATABASE_URL=postgres://... npm run db:setup
//       (o con la variable ya presente en el entorno)
//
// Idempotente: CREATE TABLE IF NOT EXISTS + INSERT ... ON CONFLICT DO NOTHING.
// Re-ejecutarlo NO pisa unidades ya descontadas por ventas — solo siembra los
// productos que aún no estén en la tabla `stock`.
import { neon } from "@neondatabase/serverless";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!url) {
  console.error(
    "Falta DATABASE_URL (o POSTGRES_URL).\n" +
      "Ejemplo:  DATABASE_URL='postgres://...' npm run db:setup",
  );
  process.exit(1);
}

const sql = neon(url);
const aqui = dirname(fileURLToPath(import.meta.url));
const productos = JSON.parse(
  await readFile(join(aqui, "..", "src", "lib", "data", "productos.json"), "utf8"),
);

console.log("Creando tablas…");
await sql`create table if not exists stock (
  producto_id    text primary key,
  unidades       integer not null default 0 check (unidades >= 0),
  actualizado_en timestamptz not null default now()
)`;
await sql`create table if not exists pedidos_procesados (
  session_id   text primary key,
  evento_id    text,
  lineas       jsonb,
  procesado_en timestamptz not null default now()
)`;
await sql`create table if not exists resenas (
  id          bigserial primary key,
  producto_id text not null,
  rating      smallint not null check (rating between 1 and 5),
  autor       text not null,
  texto       text not null,
  aprobada    boolean not null default false,
  creada_en   timestamptz not null default now()
)`;
await sql`create index if not exists resenas_lectura on resenas (producto_id, aprobada, creada_en desc)`;
await sql`create table if not exists newsletter (
  email          text primary key,
  token          text not null,
  locale         text not null default 'es',
  confirmado     boolean not null default false,
  creada_en      timestamptz not null default now(),
  confirmado_en  timestamptz,
  ultimo_envio   timestamptz
)`;
// Migración suave para tablas creadas antes de añadir la columna.
await sql`alter table newsletter add column if not exists ultimo_envio timestamptz`;
await sql`create index if not exists newsletter_token on newsletter (token)`;

console.log(`Sembrando stock de ${productos.length} productos (on conflict do nothing)…`);
const ids = productos.map((p) => p.id);
const unidades = productos.map((p) => Number(p.stock ?? 0));
await sql`
  insert into stock (producto_id, unidades)
  select * from unnest(${ids}::text[], ${unidades}::int[])
  on conflict (producto_id) do nothing
`;

const filas = await sql`select count(*)::int as n from stock`;
console.log(`Listo. ${filas[0].n} filas en la tabla stock.`);
