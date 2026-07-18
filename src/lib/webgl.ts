// Detección para el fallback obligatorio (GUION §2): sin WebGL o con
// prefers-reduced-motion la narrativa se sirve en secciones estáticas.
export function soportaWebGL(): boolean {
  try {
    const lienzo = document.createElement("canvas");
    return Boolean(lienzo.getContext("webgl2") ?? lienzo.getContext("webgl"));
  } catch {
    return false;
  }
}

export function prefiereMenosMovimiento(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
