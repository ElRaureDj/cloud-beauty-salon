"use client";

import Link from "next/link";
import { t } from "@/lib/i18n/es";
import { useExperiencia } from "@/stores/experiencia";
import ModalBase from "./ModalBase";

// §5.1 — el quiz completo (10 pasos + recomendador §5.2) llega en Fase 2.
export default function OverlayQuiz() {
  const abierto = useExperiencia((s) => s.overlay === "quiz");
  const cerrar = useExperiencia((s) => s.cerrarOverlay);

  return (
    <ModalBase abierto={abierto} titulo={t("quiz.titulo")} onCerrar={cerrar}>
      <p className="nota-todo">
        TODO(fase-2): quiz capilar de 10 preguntas y recomendador de rutina
        (§5.1–5.2), con respuestas en Zustand + localStorage.
      </p>
      {/* El quiz siempre permite saltar a /tienda (§5.1). */}
      <Link
        href="/tienda"
        onClick={cerrar}
        className="boton-secundario mt-6 w-full"
      >
        {t("cap2.verTienda")}
      </Link>
    </ModalBase>
  );
}
