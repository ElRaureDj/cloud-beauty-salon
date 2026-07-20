import Link from "next/link";
import { estaAutenticado } from "@/lib/admin-auth";
import { CATALOGO } from "@/lib/catalogo";
import { hayBD } from "@/lib/db";
import { UMBRAL_STOCK_BAJO } from "@/lib/formato";
import { stockDeProductos } from "@/lib/stock";
import LoginAdmin from "./LoginAdmin";
import EditorStock from "./EditorStock";

// Panel de stock (bloque 3). Lee cookies → dinámico, nunca prerenderizado.
export default async function PaginaAdmin() {
  if (!(await estaAutenticado())) return <LoginAdmin />;

  if (!hayBD()) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-tinta-suave">
          La base de datos no está configurada (DATABASE_URL). Crea la BD Neon y
          corre <code>npm run db:setup</code>.
        </p>
      </main>
    );
  }

  const stock = await stockDeProductos(CATALOGO.map((p) => p.id));
  const inicial = CATALOGO.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    linea: p.linea,
    unidades: stock.get(p.id) ?? 0,
  }));

  // Alerta de bajo stock (mejora G3): agotados y "pocas unidades" (≤ umbral).
  const bajoStock = inicial
    .filter((f) => f.unidades <= UMBRAL_STOCK_BAJO)
    .sort((a, b) => a.unidades - b.unidades);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <header className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl">Stock</h1>
        <nav className="flex gap-4">
          <Link
            href="/admin/pedidos"
            className="text-sm text-acento underline-offset-4 hover:underline"
          >
            Pedidos →
          </Link>
          <Link
            href="/admin/resenas"
            className="text-sm text-acento underline-offset-4 hover:underline"
          >
            Reseñas →
          </Link>
          <Link
            href="/admin/newsletter"
            className="text-sm text-acento underline-offset-4 hover:underline"
          >
            Newsletter →
          </Link>
        </nav>
      </header>
      {bajoStock.length > 0 && (
        <details className="mt-6 rounded-2xl border border-acento/40 bg-acento/10 p-4">
          <summary className="cursor-pointer text-sm font-medium text-acento">
            {bajoStock.length} con bajo stock (≤ {UMBRAL_STOCK_BAJO})
          </summary>
          <ul className="mt-3 flex flex-col gap-1 text-sm text-tinta-suave">
            {bajoStock.map((f) => (
              <li key={f.id} className="flex justify-between gap-3">
                <span className="truncate">{f.nombre}</span>
                <span className="shrink-0 tabular-nums">
                  {f.unidades === 0 ? "agotado" : `${f.unidades} u.`}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <EditorStock inicial={inicial} />
    </main>
  );
}
