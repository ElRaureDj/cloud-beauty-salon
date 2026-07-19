import Link from "next/link";
import { estaAutenticado } from "@/lib/admin-auth";
import { CATALOGO } from "@/lib/catalogo";
import { hayBD } from "@/lib/db";
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

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <header className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl">Stock</h1>
        <Link
          href="/admin/resenas"
          className="text-sm text-acento underline-offset-4 hover:underline"
        >
          Reseñas →
        </Link>
      </header>
      <EditorStock inicial={inicial} />
    </main>
  );
}
