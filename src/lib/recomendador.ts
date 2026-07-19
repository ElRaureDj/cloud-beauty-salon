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

// Para boosters la coincidencia debe ser real: mejor ningún extra que un
// producto que no corresponde a la señal del quiz.
function buscarEstricto(
  categoria: Producto["categoria"],
  cumple: (p: Producto) => boolean,
): Producto | undefined {
  return CATALOGO.find((p) => p.categoria === categoria && cumple(p));
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
  const deCrecimiento = (p: Producto) => p.tags.includes("crecimiento");
  // Con el catálogo real las líneas tienen carácter: el matizador (Blond
  // Revolution) es para decoloradas, no para cualquier tinte; y la línea de
  // rizos (Curly) solo si el patrón es rizado (3x/4x).
  const esRizada = (r.patron ?? "").startsWith("3") || (r.patron ?? "").startsWith("4");
  const colorPref = (p: Producto) =>
    deColor(p) &&
    (quimica.includes("decoloracion") || !p.tags.includes("matizador"));
  const antiFrizz = (p: Producto) =>
    esRizada
      ? p.tags.includes("rizos")
      : p.tags.includes("anti-frizz") && !p.tags.includes("rizos");
  const nutritivo = (p: Producto) => p.tags.includes("nutritivo");
  // Fallback genérico sin carácter de color: que el orden alfabético del
  // catálogo real no cuele el matizador de rubias a quien no lo pidió.
  const deEtapaNeutro = (p: Producto) =>
    deEtapa(p) && !p.tags.includes("matizador") && !p.tags.includes("proteccion-color");

  // Champú — precedencia: graso con puntas secas (regla 4 completa) > color
  // tratado (regla 2) > sin química + crecimiento (regla 6) > graso a solas.
  let champu: Producto | undefined;
  if (r.cuero === "graso" && puntasSecas) {
    champu = buscar("champu", [(p) => p.tags.includes("equilibrante")]);
    razones.push(t("reco.razon.grasoPuntas"));
  } else if (conColor) {
    champu = buscar("champu", [colorPref, deColor, deEtapa]);
    razones.push(t("reco.razon.color"));
  } else if (sinQuimica && objetivos.includes("crecimiento")) {
    // El catálogo real no tiene línea "crecimiento": la fortalecedora
    // (Therapy) es su equivalente §5.2.
    champu = buscar("champu", [
      (p) => p.tags.includes("fortalecedor") || deCrecimiento(p),
      deEtapaNeutro,
      deEtapa,
    ]);
    razones.push(t("reco.razon.crecimiento"));
  } else if (r.cuero === "graso") {
    champu = buscar("champu", [(p) => p.tags.includes("equilibrante")]);
    razones.push(t("reco.razon.graso"));
  } else {
    champu = buscar("champu", [deEtapaNeutro, deEtapa]);
  }

  // Acondicionador y leave-in: primero la señal fuerte (frizz o color),
  // después la etapa.
  const acondicionador = buscar("acondicionador", [
    ...(objetivos.includes("frizz") ? [antiFrizz] : []),
    ...(conColor ? [colorPref] : []),
    deEtapaNeutro,
    deEtapa,
  ]);
  const leaveIn = buscar("leave-in", [
    ...(conColor ? [colorPref] : []),
    ...(objetivos.includes("frizz") ? [antiFrizz] : []),
    deEtapaNeutro,
    deEtapa,
  ]);

  // Máscara: el corazón del cronograma. La reconstrucción manda sobre las
  // preferencias de frizz/color (§5.2 regla 1).
  const mascara = buscar("mascara", [
    ...(conColor && etapaPrincipal !== "reconstruccion" ? [colorPref] : []),
    ...(objetivos.includes("frizz") && etapaPrincipal !== "reconstruccion"
      ? [antiFrizz]
      : []),
    ...(etapaPrincipal === "nutricion" ? [nutritivo] : []),
    deEtapaNeutro,
    deEtapa,
  ]);

  // Boosters
  const paquete: Producto[] = [champu, acondicionador, mascara, leaveIn].filter(
    (p): p is Producto => Boolean(p),
  );

  if (r.calor === "diario") {
    const termico = buscarEstricto("booster", (p) => p.tags.includes("termico"));
    if (termico) {
      paquete.push(termico);
      razones.push(t("reco.razon.termico"));
    }
  }
  if (etapaPrincipal === "reconstruccion") {
    const choque = buscarEstricto("booster", (p) => p.tags.includes("choque"));
    if (choque && !paquete.some((p) => p.id === choque.id)) paquete.push(choque);
  } else if (sinQuimica && objetivos.includes("crecimiento")) {
    const fortalecedorExtra = buscarEstricto(
      "booster",
      (p) => p.tags.includes("fortalecedor") || deCrecimiento(p),
    );
    if (fortalecedorExtra && !paquete.some((p) => p.id === fortalecedorExtra.id)) {
      paquete.push(fortalecedorExtra);
    }
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
