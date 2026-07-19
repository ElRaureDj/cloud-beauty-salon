import Image from "next/image";
import type { Producto } from "@/lib/catalogo";
import type { EstadoStock } from "@/lib/formato";

// Packshots reales de trussmiami.com (fuente autorizada, §8 resuelto):
// WebP 800×800 sobre blanco en /public/productos. `estadoStock` (bloque 3) es
// opcional: si el producto está agotado atenúa la imagen y muestra el chip; si
// quedan pocas unidades, una etiqueta "Últimas N". Sin dato → no muestra nada.
export default function ImagenProducto({
  producto,
  clase = "",
  prioritaria = false,
  estadoStock = null,
}: {
  producto: Producto;
  clase?: string;
  prioritaria?: boolean;
  estadoStock?: EstadoStock | null;
}) {
  const agotado = estadoStock?.agotado ?? false;
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-white ${clase}`}>
      <Image
        src={producto.imagen}
        alt={producto.nombre}
        width={800}
        height={800}
        priority={prioritaria}
        sizes="(max-width: 640px) 50vw, 33vw"
        className={`h-full w-full object-contain transition-opacity ${
          agotado ? "opacity-40" : ""
        }`}
      />
      {agotado ? (
        <span className="absolute inset-0 grid place-items-center">
          <span className="rounded-full bg-black/75 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
            {estadoStock?.texto}
          </span>
        </span>
      ) : (
        estadoStock?.texto && (
          <span className="absolute left-2 top-2 rounded-full bg-acento px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-acento-tinta">
            {estadoStock.texto}
          </span>
        )
      )}
    </div>
  );
}
