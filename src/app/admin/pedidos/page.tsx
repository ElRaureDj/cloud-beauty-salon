import Link from "next/link";
import { estaAutenticado } from "@/lib/admin-auth";
import { hayBD } from "@/lib/db";
import {
  pedidosRecientes,
  ventasPorDia,
  ventasResumen,
  type VentaDia,
} from "@/lib/pedidos";
import LoginAdmin from "../LoginAdmin";
import PanelPedidos, { type PedidoVista } from "./PanelPedidos";

const DIAS_GRAFICO = 30;

function dinero(centavos: number | null, moneda: string | null): string {
  return new Intl.NumberFormat("es-US", {
    style: "currency",
    currency: (moneda ?? "usd").toUpperCase(),
  }).format((centavos ?? 0) / 100);
}

// Gráfico de barras de ventas por día (SVG en servidor, sin librerías). Rellena
// el rango completo de días para que los huecos sin ventas se vean como cero.
function GraficoVentas({
  datos,
  moneda,
}: {
  datos: VentaDia[];
  moneda: string | null;
}) {
  const mapa = new Map(datos.map((d) => [d.dia, d]));
  const hoy = new Date();
  const serie: { dia: string; total: number }[] = [];
  for (let i = DIAS_GRAFICO - 1; i >= 0; i--) {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() - i);
    const clave = d.toISOString().slice(0, 10);
    serie.push({ dia: clave, total: mapa.get(clave)?.total ?? 0 });
  }
  const max = Math.max(1, ...serie.map((s) => s.total));
  const W = 100;
  const H = 30;
  const bw = W / serie.length;
  const conVentas = serie.some((s) => s.total > 0);

  return (
    <div className="mt-4 rounded-2xl border border-tinta-suave/20 p-4">
      <p className="text-xs uppercase tracking-widest text-tinta-suave">
        Ventas · últimos {DIAS_GRAFICO} días
      </p>
      {conVentas ? (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="mt-3 h-24 w-full"
          role="img"
          aria-label={`Ventas de los últimos ${DIAS_GRAFICO} días`}
        >
          {serie.map((s, i) => {
            const h = (s.total / max) * H;
            return (
              <rect
                key={s.dia}
                x={i * bw + 0.25}
                y={H - h}
                width={bw - 0.5}
                height={h}
                className="fill-acento"
              >
                <title>{`${s.dia}: ${dinero(s.total, moneda)}`}</title>
              </rect>
            );
          })}
        </svg>
      ) : (
        <p className="mt-3 text-sm text-tinta-suave">Aún no hay ventas.</p>
      )}
    </div>
  );
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

  const [pedidos, ventas, porDia] = await Promise.all([
    pedidosRecientes(),
    ventasResumen(),
    ventasPorDia(DIAS_GRAFICO),
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

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-tinta-suave/20 px-4 py-3 text-sm">
        <p>
          <span className="text-tinta-suave">Ventas (pagadas): </span>
          <strong>{ventas.pedidos}</strong>
          <span className="text-tinta-suave"> pedidos · </span>
          <strong>{dinero(ventas.total, ventas.moneda)}</strong>
        </p>
        <a
          href="/api/admin/pedidos/export"
          className="text-acento underline-offset-4 hover:underline"
        >
          Exportar CSV
        </a>
      </div>

      <GraficoVentas datos={porDia} moneda={ventas.moneda} />

      <PanelPedidos inicial={inicial} />
    </main>
  );
}
