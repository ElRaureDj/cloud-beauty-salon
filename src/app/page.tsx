import Experiencia from "@/components/experiencia/Experiencia";
import { t } from "@/lib/i18n/es";

export default function PaginaInicio() {
  return (
    <main>
      {/* Texto renderizado en servidor: la venta nunca depende del canvas (§2). */}
      <h1 className="sr-only">{`{{MARCA}} — ${t("hero.tagline")}`}</h1>
      <Experiencia />
    </main>
  );
}
