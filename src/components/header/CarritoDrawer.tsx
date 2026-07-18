"use client";

import Link from "next/link";
import { t } from "@/lib/i18n/es";
import { useTienda } from "@/stores/carrito";
import { useExperiencia } from "@/stores/experiencia";
import ModalBase from "@/components/overlays/ModalBase";

// §5.3 — Drawer lateral derecho. Las líneas de producto, el bundle del quiz y
// el checkout llegan en Fase 2 (pasarela por decidir, §9.2).
export default function CarritoDrawer() {
  const abierto = useExperiencia((s) => s.overlay === "carrito");
  const cerrar = useExperiencia((s) => s.cerrarOverlay);
  const carrito = useTienda((s) => s.carrito);

  return (
    <ModalBase
      abierto={abierto}
      titulo={t("carrito.titulo")}
      onCerrar={cerrar}
      lado="derecha"
    >
      {carrito.length === 0 ? (
        <div className="flex h-full flex-col">
          {/* Estado vacío que invita a actuar (§7). */}
          <p className="text-tinta-suave">{t("carrito.vacio")}</p>
          <Link
            href="/tienda"
            onClick={cerrar}
            className="boton-primario mt-6 w-full"
          >
            {t("carrito.irTienda")}
          </Link>
        </div>
      ) : (
        <p className="nota-todo">
          TODO(fase-2): líneas de carrito, bundle del quiz con descuento y
          checkout (§5.3).
        </p>
      )}
    </ModalBase>
  );
}
