"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoNube } from "@/components/marca/Logo";
import { useT, useRuta } from "@/lib/i18n/client";

// Footer global (pulido pro): las páginas interiores terminaban "en seco", sin
// enlaces legales ni navegación secundaria. La home NO lo lleva (su cierre 3D
// ya tiene footer propio en el overlay); el panel /admin vive fuera de este
// layout. Solo claves i18n ya existentes.
export default function PieGlobal() {
  const pathname = usePathname();
  const { t } = useT();
  const ruta = useRuta();

  // La home vive en "/" (visible) pero se PRERENDERIZA como "/es" en build:
  // hay que excluir las tres formas o el footer se colaría en el HTML estático
  // de la home (y luego desaparecería al hidratar — mismatch). La pantalla de
  // compra confirmada también va limpia (celebración a viewport completo).
  if (pathname === "/" || pathname === "/es" || pathname === "/en") return null;
  if (pathname.endsWith("/compra/exito")) return null;

  const columnas: { titulo: string; enlaces: [string, string][] }[] = [
    {
      titulo: t("header.tienda"),
      enlaces: [
        [ruta("/tienda"), t("header.tienda")],
        [ruta("/kits"), t("kits.enlace")],
        [ruta("/rutina"), t("rutina.enlace")],
        [ruta("/cronograma"), t("cronograma.enlace")],
        [ruta("/regalo"), t("regalo.enlace")],
      ],
    },
    {
      titulo: t("marca.nombre"),
      enlaces: [
        [ruta("/guias"), t("guias.enlace")],
        [ruta("/nosotros"), t("nosotros.enlace")],
        [ruta("/faq"), t("faq.enlace")],
        [ruta("/contacto"), t("footer.contacto")],
        [ruta("/pedido"), t("pedido.enlace")],
      ],
    },
  ];

  return (
    <footer className="mt-24 border-t border-tinta-suave/15">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <p className="flex items-center gap-2.5 font-display text-sm uppercase tracking-[0.25em]">
              <LogoNube alto={20} />
              {t("marca.nombre")}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-tinta-suave">
              {t("copy.marca.trust")}.
            </p>
          </div>
          <nav className="flex gap-16" aria-label={t("marca.nombre")}>
            {columnas.map((col) => (
              <ul key={col.titulo} className="flex flex-col gap-2.5">
                {col.enlaces.map(([href, texto]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-tinta-suave transition-colors hover:text-tinta"
                    >
                      {texto}
                    </Link>
                  </li>
                ))}
              </ul>
            ))}
          </nav>
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-tinta-suave/10 pt-6 text-xs text-tinta-suave sm:flex-row sm:items-center sm:justify-between">
          {/* suppressHydrationWarning: si un build de diciembre se sirve en
              enero, el año del HTML y el del cliente difieren un instante. */}
          <p suppressHydrationWarning>
            © {new Date().getFullYear()} {t("marca.nombre")}
          </p>
          <div className="flex gap-5">
            <Link href={ruta("/legal/privacidad")} className="transition-colors hover:text-tinta">
              {t("footer.privacidad")}
            </Link>
            <Link href={ruta("/legal/terminos")} className="transition-colors hover:text-tinta">
              {t("footer.terminos")}
            </Link>
            <Link href={ruta("/legal/envios")} className="transition-colors hover:text-tinta">
              {t("footer.envios")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
