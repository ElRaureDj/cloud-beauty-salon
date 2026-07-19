import { productoPorId } from "@/lib/catalogo";
import { hayBD } from "@/lib/db";
import { stockDeProducto } from "@/lib/stock";
import { resenasDeProducto } from "@/lib/resenas";

// Estado en vivo de una ficha (bloque 3): stock + reseñas aprobadas, en UNA
// llamada. La ficha es estática (SSG) por SEO; este endpoint le da los datos
// vivos desde el cliente sin sacrificar la prerenderización. Público (solo
// lectura). Sin BD → stock null y reseñas vacías (la UI degrada, no bloquea).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id || !productoPorId(id)) {
    return Response.json({ ok: false }, { status: 400 });
  }

  const [stock, resenas] = await Promise.all([
    stockDeProducto(id),
    resenasDeProducto(id),
  ]);

  return Response.json(
    { ok: true, activo: hayBD(), stock, resenas },
    { headers: { "Cache-Control": "no-store" } },
  );
}
