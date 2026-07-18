import productos from "@/lib/data/productos.json";

// Esquema §5.2 del guion, ampliado con descripcion/modoDeUso para las fichas.
// TODO(guion): cargar catálogo real Trust con precios de distribución (§9.6);
// mientras precio === 0, la UI muestra "precio por confirmar" y el checkout
// sigue deshabilitado (§9.2).
// Los helpers de presentación (nombres, precios) viven en src/lib/formato.ts
// para que este módulo — que arrastra el JSON completo — solo lo importen
// superficies que de verdad necesitan el catálogo.
export type Etapa = "hidratacion" | "nutricion" | "reconstruccion";

export type Categoria = "champu" | "acondicionador" | "mascara" | "leave-in" | "booster";

export type Producto = {
  id: string;
  nombre: string;
  linea: string;
  categoria: Categoria;
  etapa: Etapa[];
  tags: string[];
  aptoPara?: { porosidad?: string[]; quimica?: string[] };
  precio: number;
  stock: number;
  imagen: string;
  descripcion: string;
  modoDeUso: string;
};

export const CATALOGO = productos as Producto[];

export function productoPorId(id: string): Producto | undefined {
  return CATALOGO.find((p) => p.id === id);
}

// El id funciona como slug de /producto/[slug] (§6).
export function productoPorSlug(slug: string): Producto | undefined {
  return productoPorId(slug);
}

export function lineasDelCatalogo(): string[] {
  return [...new Set(CATALOGO.map((p) => p.linea))];
}

// "Combina con" de la ficha (§6): misma línea primero, luego misma etapa.
export function combinaCon(producto: Producto, maximo = 3): Producto[] {
  const misma = CATALOGO.filter(
    (p) => p.id !== producto.id && p.linea === producto.linea,
  );
  const porEtapa = CATALOGO.filter(
    (p) =>
      p.id !== producto.id &&
      p.linea !== producto.linea &&
      p.etapa.some((e) => producto.etapa.includes(e)),
  );
  return [...misma, ...porEtapa].slice(0, maximo);
}
