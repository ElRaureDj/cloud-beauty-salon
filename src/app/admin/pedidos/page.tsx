import Link from "next/link";
import { estaAutenticado } from "@/lib/admin-auth";
import { hayBD } from "@/lib/db";
import { pedidosRecientes, ventasResumen } from "@/lib/pedidos";
import LoginAdmin from "../LoginAdmin";
import PanelPedidos, { type PedidoVista } from "./PanelPedidos";

function dinero(centavos: number | null, moneda: string | null): string {
  return new Intl.NumberFormat("es-US", {
    style: "currency",
    currency: (moneda ?? "usd").toUpperCase(),
  }).format((centavos ?? 0) / 100);
}

// Panel de pedidos + ventas (mejora M3). Lee cookies → dinámico.
export default async function PaginaAdminPedidos() {
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

  const [pedidos, ventas] = await Promise.all([
    pedidosRecientes(),
    ventasResumen(),
  ]);

  const inicial: PedidoVista[] = pedidos.map((p) => ({
    session_id: p.session_id,
    fecha: new Date(p.creada_en).toLocaleString("es-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    cliente: p.nombre || "—",
    email: p.email || "—",
    direccion: p.direccion || "—",
    total: dinero(p.total, p.moneda),
    pagado: p.pagado,
    reembolsado: p.reembolsado,
    enviado: p.enviado,
    lineas: (p.lineas ?? []).map(
      (l) => `${l.nombre} × ${l.cantidad}`,
    ),
  }));

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <header className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl">Pedidos</h1>
        <Link
          href="/admin"
          className="text-sm text-acento underline-offset-4 hover:underline"
        >
          ← Stock
        </Link>
      </header>

      <p className="mt-4 rounded-2xl border border-tinta-suave/20 px-4 py-3 text-sm">
        <span className="text-tinta-suave">Ventas (pagadas): </span>
        <strong>{ventas.pedidos}</strong>
        <span className="text-tinta-suave"> pedidos · </span>
        <strong>{dinero(ventas.total, ventas.moneda)}</strong>
      </p>

      <PanelPedidos inicial={inicial} />
    </main>
  );
}
