import { CATALOGO, type Etapa, type Producto } from "@/lib/catalogo";

// Landing pages por línea TRUSS (mejora K2): todo derivado del catálogo — una
// línea nueva en productos.json crea su landing sola. Solo servidor/SSG.

export type Linea = {
  slug: string;
  nombre: string;
  productos: Producto[];
  etapas: Etapa[];
};

// Slug URL-safe y estable a partir del nombre de la línea.
export function slugDeLinea(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // sin acentos (rango combinante)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

let cache: Linea[] | null = null;

export function lineas(): Linea[] {
  if (cache) return cache;
  const porNombre = new Map<string, Producto[]>();
  for (const p of CATALOGO) {
    const lista = porNombre.get(p.linea) ?? [];
    lista.push(p);
    porNombre.set(p.linea, lista);
  }
  cache = [...porNombre.entries()].map(([nombre, productos]) => ({
    slug: slugDeLinea(nombre),
    nombre,
    productos,
    etapas: [...new Set(productos.flatMap((p) => p.etapa))],
  }));
  return cache;
}

export function lineaPorSlug(slug: string): Linea | undefined {
  return lineas().find((l) => l.slug === slug);
}
