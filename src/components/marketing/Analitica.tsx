"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Analítica de Vercel (bloque 4) con redacción: los enlaces del boletín llevan
// ?token=… (credencial de confirmación/baja de cada email) y Analytics registra
// la URL completa — sin esto, los tokens acabarían almacenados en el panel de
// Vercel. beforeSend los sustituye antes de enviar el evento.
export default function Analitica() {
  return (
    <>
      <Analytics
        beforeSend={(evento) => {
          try {
            const url = new URL(evento.url);
            if (url.searchParams.has("token")) {
              url.searchParams.set("token", "redacted");
              return { ...evento, url: url.toString() };
            }
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
