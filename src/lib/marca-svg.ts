// Isotipo de marca como SVG string, para los contextos que NO son React DOM:
// imágenes generadas en servidor (Open Graph, iconos PWA, apple-icon) donde el
// SVG viaja como data-URI dentro de un <img> de ImageResponse (Satori/resvg
// rasteriza máscaras y degradados con fidelidad; el SVG inline solo admite un
// subconjunto). El dibujo es el mismo que components/marca/Logo.tsx.

// El signo se dibuja SIEMPRE en el lienzo 64×40; su caja real es
// x 10.5→54.5 (44 de ancho), y 5→29 (24 de alto). El icono cuadrado no
// reescribe coordenadas: reutiliza este dibujo y lo centra con un transform.
const CAJA = { x: 10.5, y: 5, ancho: 44, alto: 24 };

// Trazos extendidos más allá del lienzo: la máscara solo pinta donde hay nube.
// `simple` = variante de tamaño mínimo (una sola onda más gruesa): igual que en
// el componente, por debajo de ~26 px las dos ondas se empastan. La usa el
// favicon, que el navegador pinta a 16–32 px.
const ondas = (simple = false) => `
<g stroke="black" fill="none" stroke-linecap="round">
  <path stroke-width="${simple ? 3.2 : 2.4}" d="M-6.8 20.6c3.3-3.1 6.6-3.1 9.9 0s6.6 3.1 9.9 0 6.6-3.1 9.9 0 6.6 3.1 9.9 0 6.6-3.1 9.9 0 6.6 3.1 9.9 0 6.6-3.1 9.9 0"/>
  ${simple ? "" : `<path stroke-width="2.2" d="M-2 26.6c3-2.8 6-2.8 9 0s6 2.8 9 0 6-2.8 9 0 6 2.8 9 0 6-2.8 9 0 6 2.8 9 0 6-2.8 9 0 6 2.8 9 0"/>`}
</g>`;

const NUBE = `
<circle cx="19" cy="21.5" r="8.5"/><circle cx="32" cy="17" r="12"/><circle cx="45.5" cy="21" r="9"/>
<rect x="10.5" y="21" width="44" height="8" rx="1.5"/>`;

const DEGRADADO = `<linearGradient id="g" x1="0" y1="0" x2="0.35" y2="1">
  <stop offset="0" stop-color="#f2d3b0"/><stop offset="1" stop-color="#d99a63"/>
</linearGradient>`;

/** Isotipo suelto (fondo transparente), lienzo 64×40. */
export function nubeSvg(ancho = 240, simple = false): string {
  const alto = Math.round((ancho * 40) / 64);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 40" width="${ancho}" height="${alto}">
<defs>${DEGRADADO}<mask id="m"><rect width="64" height="40" fill="white"/>${ondas(simple)}</mask></defs>
<g mask="url(#m)" fill="url(#g)">${NUBE}</g></svg>`;
}

/**
 * Icono cuadrado con el fondo de marca (PWA / apple-icon). `ocupacion` es la
 * fracción del lado que ocupa el ancho del signo: 0.76 para los iconos
 * normales y 0.64 para el "maskable" (Android recorta en círculo y solo
 * garantiza el 80% central). `simple` usa la variante de tamaño mínimo.
 */
export function iconoNubeSvg(
  lado = 512,
  ocupacion = 0.76,
  simple = false,
): string {
  const escala = (64 * ocupacion) / CAJA.ancho;
  const cx = CAJA.x + CAJA.ancho / 2;
  const cy = CAJA.y + CAJA.alto / 2;
  // Centra la caja del signo en el cuadrado y la escala desde su propio centro.
  // OJO: el transform va SOLO en el grupo de la nube. El contenido de una
  // <mask> con maskContentUnits="userSpaceOnUse" (el valor por defecto) vive ya
  // en el espacio del elemento que la referencia, así que las ondas se escalan
  // y desplazan con la nube; repetir el transform dentro de la máscara lo
  // aplicaba dos veces y mandaba los mechones fuera del signo.
  const t = `translate(${32 - cx} ${32 - cy}) translate(${cx} ${cy}) scale(${escala.toFixed(4)}) translate(${-cx} ${-cy})`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${lado}" height="${lado}">
<defs>${DEGRADADO}
<radialGradient id="bg" cx="0.5" cy="0.12" r="0.95"><stop offset="0" stop-color="#34222b"/><stop offset="1" stop-color="#171012"/></radialGradient>
<mask id="m"><rect x="-32" y="-32" width="128" height="128" fill="white"/>${ondas(simple)}</mask></defs>
<rect width="64" height="64" fill="url(#bg)"/>
<g mask="url(#m)" fill="url(#g)" transform="${t}">${NUBE}</g></svg>`;
}

export function comoDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
