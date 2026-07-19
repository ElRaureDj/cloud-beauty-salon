import Link from "next/link";
import { estaAutenticado } from "@/lib/admin-auth";
import { hayBD } from "@/lib/db";
import { resenasPendientes } from "@/lib/resenas";
import LoginAdmin from "../LoginAdmin";
import ModeracionResenas from "./ModeracionResenas";

// Moderación de reseñas (bloque 3). Lee cookies → dinámico.
export default async function PaginaAdminResenas() {
  if (!(await estaAutenticado())) return <LoginAdmin />;

  const pendientes = hayBD() ? await resenasPendientes() : [];

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <header className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl">Reseñas pendientes</h1>
        <Link
          href="/admin"
          className="text-sm text-acento underline-offset-4 hover:underline"
        >
          ← Stock
        </Link>
      </header>
      <ModeracionResenas inicial={pendientes} />
    </main>
  );
}
