import { nombreCategoria } from "@/lib/formato";
import type { Producto } from "@/lib/catalogo";

// TODO(guion §8): sustituir por packshots reales (foto fondo neutro ≥ 1200px)
// con next/image en cuanto exista el inventario fotografiado.
export default function ImagenProducto({
  producto,
  clase = "",
}: {
  producto: Producto;
  clase?: string;
}) {
  return (
    <div
      aria-hidden
      className={`grid place-items-center rounded-2xl bg-gradient-to-b from-fondo-1 to-fondo-0 ${clase}`}
    >
      <div className="text-center">
        <span className="font-display text-4xl text-tinta-suave/60">
          {producto.nombre.charAt(0)}
        </span>
        <p className="mt-1 text-[10px] uppercase tracking-widest text-tinta-suave/50">
          {nombreCategoria(producto.categoria)}
        </p>
      </div>
    </div>
  );
}
