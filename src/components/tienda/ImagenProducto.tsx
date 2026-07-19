import Image from "next/image";
import type { Producto } from "@/lib/catalogo";

// Packshots reales de trussmiami.com (fuente autorizada, §8 resuelto):
// WebP 800×800 sobre blanco en /public/productos.
export default function ImagenProducto({
  producto,
  clase = "",
  prioritaria = false,
}: {
  producto: Producto;
  clase?: string;
  prioritaria?: boolean;
}) {
  return (
    <div className={`overflow-hidden rounded-2xl bg-white ${clase}`}>
      <Image
        src={producto.imagen}
        alt={producto.nombre}
        width={800}
        height={800}
        priority={prioritaria}
        sizes="(max-width: 640px) 50vw, 33vw"
        className="h-full w-full object-contain"
      />
    </div>
  );
}
