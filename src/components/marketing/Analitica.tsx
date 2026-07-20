"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Analítica de Vercel (bloque 4) con redacción: algunas URLs llevan datos que
// no deben acabar en el panel de Vercel — el ?token=… del boletín (credencial
// de confirmación/baja) y el session_id / ?n= del pedido (uno de los dos
// factores para consultar un pedido; mejora H3). beforeSend los sustituye antes
// de enviar el evento (Analytics registra la URL completa).
const PARAMS_SENSIBLES = ["token", "session_id", "n"];

export default function Analitica() {
  return (
    <>
      <Analytics
        beforeSend={(evento) => {
          try {
            const url = new URL(evento.url);
            let tocado = false;
            for (const p of PARAMS_SENSIBLES) {
              if (url.searchParams.has(p)) {
                url.searchParams.set(p, "redacted");
                tocado = true;
              }
            }
            if (tocado) return { ...evento, url: url.toString() };
          } catch {
            // URL rara: mejor enviar el evento tal cual que perderlo.
          }
          return evento;
        }}
      />
      <SpeedInsights />
    </>
  );
}
