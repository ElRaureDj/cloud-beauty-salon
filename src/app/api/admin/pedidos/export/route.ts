import { estaAutenticado } from "@/lib/admin-auth";
import { pedidosRecientes } from "@/lib/pedidos";

// Export CSV de pedidos para el panel (mejora G3). GET protegido por la cookie
// de sesión; el navegador la envía con el enlace de descarga.
//
// Datos del cliente (nombre/email/dirección) vienen de Stripe y son texto libre.
// Además de comillas RFC-4180, neutralizamos la INYECCIÓN DE FÓRMULAS: un valor
// que empieza por = + - @ (o tab/CR) lo ejecutaría Excel/Sheets al abrir el CSV;
// se antepone un apóstrofo para que se trate como texto.
function campo(valor: unknown): string {
  let s = valor == null ? "" : String(valor);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET() {
  if (!(await estaAutenticado())) {
    return new Response("no autorizado", { status: 401 });
  }

  const pedidos = await pedidosRecientes(5000);
  const cabecera = [
    "fecha",
    "pedido",
    "pagado",
    "reembolsado",
    "enviado",
    "total",
    "moneda",
    "cliente",
    "email",
    "direccion",
    "productos",
  ];
  const filas = pedidos.map((p) => [
    new Date(p.creada_en).toISOString(),
    p.session_id,
    p.pagado ? "sí" : "no",
    p.reembolsado ? "sí" : "no",
    p.enviado ? "sí" : "no",
    ((p.total ?? 0) / 100).toFixed(2),
    p.moneda ?? "",
    p.nombre ?? "",
    p.email ?? "",
    p.direccion ?? "",
    (p.lineas ?? []).map((l) => `${l.nombre} x${l.cantidad}`).join("; "),
  ]);
  const csv = [cabecera, ...filas]
    .map((fila) => fila.map(campo).join(","))
    .join("\r\n");
  // BOM para que Excel interprete UTF-8 (acentos) correctamente.
  return new Response("\uFEFF" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="pedidos.csv"',
    },
  });
}
