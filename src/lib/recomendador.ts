import { CATALOGO, type Etapa, type Producto } from "@/lib/catalogo";
import { nombreEtapa } from "@/lib/formato";
import { t, tf } from "@/lib/i18n/es";
import type { RespuestasQuiz } from "@/stores/carrito";

// Recomendador de rutina (§5.2): mapea las respuestas del quiz al cronograma
// capilar (Hidratación / Nutrición / Reconstrucción) y arma el paquete:
// champú + acondicionador + máscara + leave-in (+ booster según objetivo).
// Reglas base de la tabla del guion; ampliables aquí. El copy de las razones
// vive en el diccionario i18n (§7).

export type Recomendacion = {
  etapaPrincipal: Etapa;
  paquete: Producto[];
  razones: string[];
};

function buscar(
  categoria: Producto["categoria"],
  preferencias: Array<(p: Producto) => boolean>,
): Producto | undefined {
  for (const cumple of preferencias) {
    const encontrado = CATALOGO.find((p) => p.categoria === categoria && cumple(p));
    if (encontrado) return encontrado;
  }
  return CATALOGO.find((p) => p.categoria === categoria);
}

// Con empate de señales, la urgencia manda: reconstruir > nutrir > hidratar.
const PRIORIDAD_EMPATE: Etapa[] = ["reconstruccion", "nutricion", "hidratacion"];

export function recomendar(r: RespuestasQuiz): Recomendacion {
  const razones: string[] = [];
  const quimica = r.quimica ?? [];
  const objetivos = r.objetivos ?? [];
  const conColor = quimica.includes("tinte") || quimica.includes("decoloracion");
  const sinQuimica = quimica.length === 0 || quimica.includes("ninguna");
  // §5.2 habla de "puntas secas"; el quiz no lo pregunta directo — proxy:
  // porosidad alta u objetivo hidratación.
  const puntasSecas = r.porosidad === "alta" || objetivos.includes("hidratacion");

  // Señal → prioridad (tabla §5.2)
  const puntos: Record<Etapa, number> = { hidratacion: 0, nutricion: 0, reconstruccion: 0 };

  if (quimica.includes("decoloracion") || r.porosidad === "alta") {
    puntos.reconstruccion += 3;
    razones.push(t("reco.razon.reconstruccion"));
  }
  if (objetivos.includes("frizz")) {
    puntos.nutricion += 2;
    razones.push(t("reco.razon.frizz"));
  }
  if (objetivos.includes("hidratacion") || r.porosidad === "baja") {
    puntos.hidratacion += 2;
  }
  if (objetivos.includes("reconstruccion")) {
    puntos.reconstruccion += 2;
  }

  // Sin señales, la base del cronograma es hidratación; con empate entre
  // señales reales, la urgencia manda (R > N > H).
  const entradas = Object.entries(puntos) as Array<[Etapa, number]>;
  const maximo = Math.max(...entradas.map(([, v]) => v));
  const etapaPrincipal: Etapa =
    maximo === 0
      ? "hidratacion"
      : entradas
          .filter(([, v]) => v === maximo)
          .sort(
            (a, b) =>
              PRIORIDAD_EMPATE.indexOf(a[0]) - PRIORIDAD_EMPATE.indexOf(b[0]),
          )[0][0];

  const deEtapa = (p: Producto) => p.etapa.includes(etapaPrincipal);
  const deColor = (p: Producto) => p.tags.includes("proteccion-color");
  const antiFrizz = (p: Producto) => p.tags.includes("anti-frizz");
  const deCrecimiento = (p: Producto) => p.tags.includes("crecimiento");

  // Champú — precedencia: graso con puntas secas (regla 4 completa) > color
  // tratado (regla 2) > sin química + crecimiento (regla 6) > graso a solas.
  let champu: Producto | undefined;
  if (r.cuero === "graso" && puntasSecas) {
    champu = buscar("champu", [(p) => p.tags.includes("equilibrante")]);
    razones.push(t("reco.razon.grasoPuntas"));
  } else if (conColor) {
    champu = buscar("champu", [deColor, deEtapa]);
    razones.push(t("reco.razon.color"));
  } else if (sinQuimica && objetivos.includes("crecimiento")) {
    champu = buscar("champu", [deCrecimiento, deEtapa]);
    razones.push(t("reco.razon.crecimiento"));
  } else if (r.cuero === "graso") {
    champu = buscar("champu", [(p) => p.tags.includes("equilibrante")]);
    razones.push(t("reco.razon.graso"));
  } else {
    champu = buscar("champu", [deEtapa]);
  }

  // Acondicionador y leave-in
  const acondicionador = buscar("acondicionador", [
    objetivos.includes("frizz") ? antiFrizz : deEtapa,
    deEtapa,
  ]);
  const leaveIn = buscar("leave-in", [
    objetivos.includes("frizz") ? antiFrizz : deEtapa,
    deEtapa,
  ]);

  // Máscara: el corazón del cronograma
  const mascara = buscar("mascara", [
    conColor && etapaPrincipal !== "reconstruccion" ? deColor : deEtapa,
    deEtapa,
  ]);

  // Boosters
  const paquete: Producto[] = [champu, acondicionador, mascara, leaveIn].filter(
    (p): p is Producto => Boolean(p),
  );

  if (r.calor === "diario") {
    const termico = buscar("booster", [(p) => p.tags.includes("termico")]);
    if (termico) {
      paquete.push(termico);
      razones.push(t("reco.razon.termico"));
    }
  }
  if (etapaPrincipal === "reconstruccion") {
    const choque = buscar("booster", [(p) => p.tags.includes("choque")]);
    if (choque && !paquete.some((p) => p.id === choque.id)) paquete.push(choque);
  } else if (sinQuimica && objetivos.includes("crecimiento")) {
    const tonico = buscar("booster", [deCrecimiento]);
    if (tonico && !paquete.some((p) => p.id === tonico.id)) paquete.push(tonico);
  }

  if (razones.length === 0) {
    razones.push(
      tf("reco.razon.base", { etapa: nombreEtapa(etapaPrincipal).toLowerCase() }),
    );
  }

  return { etapaPrincipal, paquete, razones };
}

export function totalPaquete(paquete: Producto[]): number {
  return paquete.reduce((total, p) => total + p.precio, 0);
}
