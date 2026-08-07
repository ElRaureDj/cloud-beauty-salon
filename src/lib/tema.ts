// Tema claro/oscuro. Tres preferencias: "auto" (sigue el ajuste del
// dispositivo), "claro" y "oscuro". La elección se guarda en localStorage y se
// aplica como atributo data-tema en <html>; el CSS hace el resto (globals.css).
//
// Deliberadamente NO se decide por la hora: el sistema operativo del móvil ya
// cambia solo de noche, y hacerlo nosotros por reloj pisaría esa preferencia
// (alguien con el teléfono en claro a las 22 h vería la tienda en oscuro sin
// haberlo pedido).

export type Preferencia = "auto" | "claro" | "oscuro";
export type TemaResuelto = "claro" | "oscuro";

export const PREFERENCIAS: Preferencia[] = ["auto", "claro", "oscuro"];
export const CLAVE_TEMA = "cbs-tema";

/** Colores de fondo por tema — para la barra del navegador (theme-color). */
export const FONDO_POR_TEMA: Record<TemaResuelto, string> = {
  oscuro: "#171012",
  claro: "#faf6f1",
};

export function esPreferencia(v: unknown): v is Preferencia {
  return v === "auto" || v === "claro" || v === "oscuro";
}

/** Qué tema toca de verdad, dada la preferencia y lo que pide el dispositivo. */
export function resolverTema(
  preferencia: Preferencia,
  dispositivoEnClaro: boolean,
): TemaResuelto {
  if (preferencia !== "auto") return preferencia;
  return dispositivoEnClaro ? "claro" : "oscuro";
}

/**
 * Script que corre ANTES del primer pintado (va inline en el <head>): lee la
 * preferencia guardada y pone el atributo. Sin esto, quien eligió "claro"
 * vería un fogonazo oscuro en cada carga, porque el HTML es estático y el
 * servidor no puede saber su elección.
 *
 * Se mantiene diminuto y a prueba de fallos a propósito: si localStorage está
 * bloqueado (Safari en privado, cookies de terceros), no hace nada y queda el
 * modo "auto", que es el comportamiento correcto por defecto.
 */
export const SCRIPT_TEMA = `try{var p=localStorage.getItem(${JSON.stringify(
  CLAVE_TEMA,
)});if(p==="claro"||p==="oscuro")document.documentElement.dataset.tema=p}catch(e){}`;
