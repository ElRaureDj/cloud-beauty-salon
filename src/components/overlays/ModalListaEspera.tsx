"use client";

import { t } from "@/lib/i18n/es";
import { useExperiencia } from "@/stores/experiencia";
import ModalBase from "./ModalBase";

// §5.4 — Peluquería nace DESACTIVADO con captura de interés. El formulario
// (nombre + WhatsApp o email + checkboxes) y POST /api/waitlist llegan en
// Fase 3; el destino de los datos sigue por decidir (§9.4).
export default function ModalListaEspera() {
  const abierto = useExperiencia((s) => s.overlay === "espera-peluqueria");
  const cerrar = useExperiencia((s) => s.cerrarOverlay);

  return (
    <ModalBase abierto={abierto} titulo={t("cap2.peluqueria")} onCerrar={cerrar}>
      <p className="text-tinta-suave">{t("cap2.muyPronto")}.</p>
      <p className="nota-todo mt-4">
        TODO(fase-3): formulario de lista de espera (§5.4) — nombre + WhatsApp o
        email → POST /api/waitlist. Destino de los datos por decidir (§9.4).
      </p>
    </ModalBase>
  );
}
