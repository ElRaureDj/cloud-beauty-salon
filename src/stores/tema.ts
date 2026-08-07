import { create } from "zustand";
import {
  CLAVE_TEMA,
  FONDO_POR_TEMA,
  esPreferencia,
  resolverTema,
  type Preferencia,
  type TemaResuelto,
} from "@/lib/tema";

// Estado del tema. Vive en un store (y no solo en CSS) porque la escena 3D
// necesita el valor RESUELTO en JS: las luces, la sombra de contacto y el
// lienzo de las tarjetas flotantes se calculan en runtime y no salen de
// variables CSS.
//
// El valor inicial NO puede ser una constante: la escena 3D lo lee en su primer
// render y, si arrancara siempre en "oscuro", un dispositivo en claro pintaría
// el primer fotograma con el contraluz alto, el halo dorado bajo los pies y las
// tarjetas translúcidas SOBRE el fondo crema — y además construiría y tiraría
// las texturas de canvas dos veces. Se lee del DOM, que el script inline del
// <head> ya dejó correcto antes del primer pintado.
type EstadoTema = {
  preferencia: Preferencia;
  resuelto: TemaResuelto;
  elegir: (p: Preferencia) => void;
};

const CONSULTA_CLARO = "(prefers-color-scheme: light)";

function dispositivoEnClaro(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia(CONSULTA_CLARO).matches
  );
}

/** Preferencia que el script inline dejó en el <html> (sin atributo = auto). */
function preferenciaDelDom(): Preferencia {
  if (typeof document === "undefined") return "auto";
  const v = document.documentElement.dataset.tema;
  return esPreferencia(v) ? v : "auto";
}

/**
 * Estado inicial. En el servidor devuelve el oscuro (que es la base del CSS y
 * lo que se prerenderiza); en el cliente, lo que ya está aplicado en el DOM.
 */
function estadoInicial(): { preferencia: Preferencia; resuelto: TemaResuelto } {
  const preferencia = preferenciaDelDom();
  return {
    preferencia,
    resuelto:
      typeof window === "undefined"
        ? "oscuro"
        : resolverTema(preferencia, dispositivoEnClaro()),
  };
}

/** Aplica el tema al documento: atributo para el CSS + barra del navegador. */
function pintar(preferencia: Preferencia, resuelto: TemaResuelto) {
  const raiz = document.documentElement;
  // Sin atributo = "auto": así la media query de globals.css vuelve a mandar.
  if (preferencia === "auto") delete raiz.dataset.tema;
  else raiz.dataset.tema = preferencia;

  // La barra del navegador en móvil. El layout emite DOS <meta theme-color>
  // condicionados por esquema (uno dark, uno light), que es justo lo correcto
  // en modo "auto". Con una elección EXPLÍCITA hay que desactivar esa condición
  // —si no, el móvil sigue al sistema y contradice lo elegido—, y al volver a
  // "auto" hay que RESTAURARLA: machacar las dos con el mismo color dejaba la
  // barra congelada y el cambio automático dejaba de funcionar.
  for (const meta of document.querySelectorAll<HTMLMetaElement>(
    'meta[name="theme-color"]',
  )) {
    // El `media` original se guarda la primera vez, para poder devolverlo.
    if (meta.dataset.media === undefined) meta.dataset.media = meta.media;
    if (preferencia === "auto") {
      meta.media = meta.dataset.media;
      meta.content =
        FONDO_POR_TEMA[meta.media.includes("light") ? "claro" : "oscuro"];
    } else {
      meta.media = "";
      meta.content = FONDO_POR_TEMA[resuelto];
    }
  }
}

export const useTema = create<EstadoTema>()((set) => ({
  ...estadoInicial(),
  elegir: (preferencia) => {
    const resuelto = resolverTema(preferencia, dispositivoEnClaro());
    try {
      if (preferencia === "auto") localStorage.removeItem(CLAVE_TEMA);
      else localStorage.setItem(CLAVE_TEMA, preferencia);
    } catch {
      // localStorage bloqueado (Safari privado): el tema aplica igual en esta
      // sesión, solo no se recuerda.
    }
    pintar(preferencia, resuelto);
    set({ preferencia, resuelto });
  },
}));

/**
 * Lee la preferencia guardada y queda escuchando el ajuste del dispositivo.
 * Devuelve la función de limpieza (uso en un useEffect del Header).
 */
export function sincronizarTema(): () => void {
  let guardada: Preferencia = "auto";
  try {
    const v = localStorage.getItem(CLAVE_TEMA);
    if (esPreferencia(v)) guardada = v;
  } catch {
    // idem: sin almacenamiento, queda "auto".
  }

  const consulta = window.matchMedia(CONSULTA_CLARO);
  const recalcular = () => {
    const { preferencia } = useTema.getState();
    const resuelto = resolverTema(preferencia, consulta.matches);
    pintar(preferencia, resuelto);
    useTema.setState({ resuelto });
  };

  const resuelto = resolverTema(guardada, consulta.matches);
  // El script del <head> ya puso data-tema, pero NO tocó los <meta
  // theme-color>: con una elección explícita contra el ajuste del sistema, la
  // barra del navegador arrancaba del color equivocado.
  pintar(guardada, resuelto);
  useTema.setState({ preferencia: guardada, resuelto });

  consulta.addEventListener("change", recalcular);
  return () => consulta.removeEventListener("change", recalcular);
}
