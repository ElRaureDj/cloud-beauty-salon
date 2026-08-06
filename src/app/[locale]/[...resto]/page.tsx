import { notFound } from "next/navigation";

// Catch-all (pulido): sin esto, una URL no matcheada (/kitz, /tiendas…) caía en
// la 404 genérica de Next en inglés — la 404 de marca ([locale]/not-found.tsx)
// solo se renderiza cuando algo lanza notFound(). Este catch-all la activa para
// cualquier ruta desconocida, con el idioma correcto vía el layout de [locale].
export default function CualquierOtraRuta(): never {
  notFound();
}
