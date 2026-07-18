# GUION.md — Experiencia Scroll 3D "{{MARCA}}"

> Fuente única de verdad de la coreografía del scroll.
> **Claude Code:** no improvises fuera de este guion. Si un capítulo no define algo, deja un `TODO(guion)` visible y pregunta. Los porcentajes son contrato: cada ScrollTrigger se nombra con el id del capítulo (`cap2-pelo`, `cap4-manos`, etc.).

---

## 0. Cómo leer este guion

- La experiencia es **una sola línea de tiempo controlada por el scroll** (GSAP ScrollTrigger con `scrub` + Lenis). El progreso global va de 0% a 100%; cada capítulo declara su rango.
- La página mide en total ~800vh en móvil y ~700vh en desktop (ajustable; lo que no se ajusta son los porcentajes relativos).
- **La modelo NO se anima en v1.** Una sola pose estática; toda "rotación" y "descenso" lo hace la cámara orbitando. Esto elimina rigging, esqueleto y blend shapes del alcance.
- Notación:
  - **[CAM]** — movimiento de cámara
  - **[3D]** — eventos de escena (materiales, luces, props)
  - **[DOM]** — overlays HTML sincronizados (React, fuera del canvas)
  - **[CTA]** — botones / acciones
  - **[COPY]** — texto en pantalla (clave i18n; español primero)
- Estados de funcionalidad:
  - `ACTIVO` — funciona en v1
  - `DESACTIVADO` — visible pero bloqueado, con captura de interés ("Avísame")
  - `FUTURO` — no se construye aún; solo se deja el hueco arquitectónico

---

## 1. Alcance v1 (lo que vende hoy)

| Módulo | Estado v1 |
|---|---|
| Venta de productos capilares Trust | `ACTIVO` |
| Quiz capilar + recomendador de rutina | `ACTIVO` |
| Tienda `/tienda` y fichas `/producto/[slug]` (sin 3D) | `ACTIVO` |
| Carrito + checkout | `ACTIVO` (pasarela por decidir, ver §9) |
| Servicios de peluquería | `DESACTIVADO` |
| Manicura (servicio + simulador) | `DESACTIVADO` + lista de espera |
| Pedicura | `DESACTIVADO` + lista de espera |
| Sesión de clienta / historial (último color, fechas, cara personalizada) | `FUTURO` |
| Simulador de color 3D sobre la cara de la clienta | `FUTURO` |

**Regla de oro:** desde cualquier punto del scroll, la tienda y el carrito están a un toque. Header fijo con logo (→ inicio), enlace "Tienda" y carrito con contador. La experiencia 3D es la puerta, nunca la jaula.

---

## 2. Reglas globales

- **Mobile-first.** Los encuadres se diseñan primero en vertical (390×844 de referencia); desktop hereda y respira.
- **Presupuesto de rendimiento:** carga inicial ≤ 3 MB (modelo Draco + texturas 2K máx.); 60 fps desktop, ≥ 30 fps en móvil de gama media; `dpr` limitado a 2; una sola luz direccional + entorno HDRI.
- **Fallback obligatorio:** sin WebGL, con `prefers-reduced-motion`, o si el primer frame tarda > 4 s → misma narrativa en secciones estáticas con imágenes renderizadas del modelo. La venta nunca depende del canvas.
- El quiz, el carrito y las listas de espera son **overlays DOM**; mientras un overlay está abierto, el scroll del timeline se bloquea.
- Estado global en Zustand: `scrollProgress`, `capituloActivo`, `respuestasQuiz`, `carrito`. Carrito y respuestas persisten en `localStorage`.
- **Requisito del asset:** figura femenina completa, estilizada (no fotorrealista), pose única elegante: de pie, peso en una cadera, manos relajadas ligeramente al frente, pies visibles. Pelo como mallas con alpha (cards), no strands. Manos y pies con topología digna — son las dos estaciones de conversión futuras y es donde los modelos baratos fallan.

---

## 3. Dirección de arte (resumen operativo)

- **Tesis del hero:** el rostro es la portada; el viaje de la cámara por el cuerpo es la firma de la web. No hay otro elemento "wow": todo lo demás es quieto y disciplinado.
- Paleta: fondo degradado profundo derivado de la identidad de {{MARCA}} + 1 acento cálido para CTAs. `TODO(guion): definir 4–6 hex al tener logo/manual de marca.`
- Tipografía: 1 display con carácter para titulares de capítulo (uso escaso), 1 sans legible para todo lo demás. Nada de serif-crema genérica.
- Motion: solo lo coreografiado aquí. Micro-interacciones únicamente en CTAs activos (pulso suave) e indicador de scroll.
- Copy: voz cercana, de tú, frases cortas, verbos activos. Los botones dicen exactamente lo que hacen ("Hacer mi diagnóstico", no "Empezar"). Sin tecnicismos de sistema.

---

## 4. Línea de tiempo

### Cap. 0 — Portada (estado inicial, 0%)
- **Preloader:** logo + barra ligada a la carga real de assets; mínimo 1,2 s en pantalla; imagen póster de respaldo si WebGL falla.
- **[3D]** Rostro en plano medio-corto, luz de estudio suave, fondo degradado de marca.
- **[DOM]** Header fijo (logo · Tienda · carrito). Abajo: indicador "Desliza" con animación sutil.
- **[COPY]** `hero.tagline` — propuesta: "Tu pelo, versión profesional." `TODO(guion): validar tagline.`
- Si no hay scroll en 6 s: micro-parallax con giroscopio (móvil) o mouse (desktop) para invitar a moverse.

### Cap. 1 — Del rostro al pelo (0–15%)
- **[CAM]** 0→10%: dolly-in lento del rostro hacia el lateral de la cabeza. 10→15%: órbita ~20° hasta que el pelo llena el cuadro.
- **[3D]** La luz clave gana intensidad sobre el pelo; brillo especular sutil.
- **[DOM]** 8%: aparece `copy.pelo.intro` ("Todo empieza por tu pelo."); se desvanece a 14%.
- `FUTURO` (con sesión): chip "Tu último color: {color} · hace {n} semanas" + recomendación de retoque y CTA a peluquería.

### Cap. 2 — Estación PELO (15–32%) — PIN
- **[CAM]** Cámara fija en primer plano del pelo con órbita casi imperceptible (±3°) para que la imagen respire.
- **[DOM]** 16%: entran dos iconos anclados visualmente al pelo:
  - **Productos** — `ACTIVO`, con pulso suave. **[CTA]** abre overlay Quiz capilar (§5.1).
  - **Peluquería** — `DESACTIVADO`: candado + "Muy pronto". Tap → mini-modal de lista de espera (§5.4).
- **[DOM]** 18%: **[CTA]** secundario "Ver toda la tienda" → `/tienda`.
- **[3D]** Opcional v1.5: al elegir "color actual" en el quiz, el tinte del material del pelo se actualiza en vivo (solo hue, sin pretensión de realismo). Requiere que el pelo sea material separado — ya exigido en §2.
- Salida del pin a 32%. Si hay overlay abierto, el fondo no avanza.

### Cap. 3 — Descenso por el torso (32–45%)
- **[CAM]** Pull-back + órbita de 180° descendiendo del hombro a la cintura. La "vuelta" de la modelo la hace la cámara.
- **[3D]** **Vitrina flotante:** 4–6 productos Trust (billboards con foto de packshot; 3D low-poly solo si sobra presupuesto) orbitan acompañando el descenso. Cada uno clicable → `/producto/[slug]`. La zona muerta del scroll convertida en escaparate.
- **[DOM]** 36%: franja `copy.marca.trust` — "Distribuidor autorizado Trust · Cosmética profesional brasileña".
- **[DOM]** 42%: prueba social (reseñas, "+{n} clientas") — placeholder hasta tener datos reales; no inventar cifras.

### Cap. 4 — Estación MANOS (45–65%) — PIN
- **[CAM]** 45→50%: la cámara baja y encuadra las manos (la pose del asset ya las presenta al frente). 50→65%: quieta, órbita ±3°.
- **[3D]** Uñas con esmalte neutro; material preparado para swap de color (`FUTURO`).
- **[DOM]** 52%: icono **Manicura** — `DESACTIVADO` v1: "Abrimos pronto" + **[CTA]** "Avísame y llévate un beneficio de apertura" → lista de espera (§5.4). **Este es el generador de leads del salón: se trata como conversión, no como relleno.**
- `FUTURO`: historial de clienta (último set + fecha + desgaste estimado según tiempo), selector de tipo (semipermanente, gel, acrílico, press-on…), colores en stock, extras (retiro, diseño, francesa), carrito de servicios con precios, agenda.
- Salida del pin a 65%.

### Cap. 5 — Descenso piernas (65–72%)
- **[CAM]** Descenso más rápido con órbita inversa (−90°) para variar el ritmo.
- **[DOM]** Una sola línea en parallax (`copy.marca.historia`), sin CTAs. Respiro visual antes de la última estación.

### Cap. 6 — Estación PIES (72–85%) — PIN
- **[CAM]** Encuadre de pies/tobillos, picado suave.
- **[DOM]** Icono **Pedicura** — `DESACTIVADO` + misma lista de espera con checkbox "también me interesa pedicura".
- `FUTURO`: "igual que manos" (hereda selección) o "custom" (selector propio), con previsualización en los pies del modelo.

### Cap. 7 — Cierre y conversión (85–100%)
- **[CAM]** Pull-back a figura completa; reencuadre elegante en ¾ trasero vía órbita.
- **[DOM]** Bloque final: `copy.cierre.titulo` "¿Lista para tu rutina?" — **[CTA primario]** "Hacer mi diagnóstico" (abre Quiz) · **[CTA]** "Ir a la tienda".
- Newsletter + WhatsApp + redes.
- Footer: contacto, políticas de envío/devolución, legal, "Volver arriba" con scroll suave.

---

## 5. Overlays (fuera de la línea de tiempo)

### 5.1 Quiz capilar (`ACTIVO`)
Una pregunta por pantalla, barra de progreso, se puede saltar en cualquier momento a `/tienda`. Respuestas → Zustand + `localStorage` (anónimo).

1. **Patrón** — selector visual 1A–4C (ilustraciones, no texto técnico).
2. **Grosor** — fino / medio / grueso.
3. **Porosidad** — baja / media / alta, con mini-explicación del test de la gota de agua.
4. **Cuero cabelludo** — graso / normal / seco / sensible / con caspa.
5. **Química activa** (multi) — tinte, decoloración, alisado/progresiva, permanente, ninguna.
6. **Color original y color actual** — swatches.
7. **Largo** — corto / medio / largo / extra largo.
8. **Calor** — nunca / a veces / a diario.
9. **Frecuencia de lavado** — diario / interdiario / 2 veces por semana o menos.
10. **Objetivo principal** (máx. 2) — hidratación, control de frizz, protección de color, reconstrucción, crecimiento, volumen.

### 5.2 Recomendador de rutina (`ACTIVO`)
Mapea respuestas al **cronograma capilar** (Hidratación / Nutrición / Reconstrucción) y arma el paquete: champú + acondicionador + máscara + leave-in (+ booster según objetivo). Muestra precio del bundle, ahorro vs. suelto, y "Agregar todo al carrito".

Reglas base (ampliables en `src/lib/recomendador.ts`):

| Señal | Prioridad |
|---|---|
| Decoloración o porosidad alta | Reconstrucción |
| Tinte / color tratado | Línea protección color |
| Objetivo frizz (clima húmedo del sur de Florida) | Nutrición / anti-frizz |
| Cuero graso + puntas secas | Champú equilibrante + máscara solo medios-puntas |
| Calor a diario | Protector térmico obligatorio en todo paquete |
| Sin química + objetivo crecimiento | Hidratación + línea fortalecedora |

Esquema de producto (`src/lib/data/productos.json`):

```json
{
  "id": "trust-uso-obrigatorio-shampoo",
  "nombre": "Champú Uso Obrigatório",
  "linea": "Uso Obrigatório",
  "categoria": "champu",
  "etapa": ["hidratacion"],
  "tags": ["anti-frizz", "post-quimica"],
  "aptoPara": { "porosidad": ["media", "alta"], "quimica": ["tinte", "decoloracion"] },
  "precio": 0,
  "stock": 0,
  "imagen": "/productos/trust-uo-shampoo.jpg"
}
```

`TODO(guion): cargar catálogo real Trust con precios de distribución.`

### 5.3 Carrito (`ACTIVO`)
Drawer lateral derecho. Línea de bundle con descuento si viene del quiz. Persiste en `localStorage`. Checkout según decisión de pasarela (§9).

### 5.4 Lista de espera (`DESACTIVADO` → captura)
Un solo formulario reutilizado por peluquería, manicura y pedicura: nombre + WhatsApp o email + interés (checkboxes). Endpoint `POST /api/waitlist`. Destino de los datos: por decidir (§9). Mensaje de éxito: "Lista. Te avisamos antes que a nadie."

---

## 6. Rutas fuera de la experiencia

- `/` — la experiencia scroll (este guion).
- `/tienda` — grid de productos con filtros por categoría, etapa del cronograma y línea. **Sin canvas, carga ligera, indexable.**
- `/producto/[slug]` — ficha: fotos, descripción, modo de uso, "combina con", agregar al carrito.
- `/legal/*`, `/contacto`.
- Regla SEO: `/tienda` y las fichas renderizan en servidor; el canvas solo existe en `/`.

---

## 7. Copy y tono

- Español primero. **Claves i18n desde el día 1** (`next-intl` o similar); inglés en fase 2 sin refactor.
- De tú, cálido, directo. Cero jerga de sistema. Los errores dicen qué pasó y cómo seguir; nunca se disculpan en vago.
- Los estados vacíos invitan a actuar ("Tu carrito está listo para su primer producto").

---

## 8. Assets requeridos

| Asset | Especificación | Fuente |
|---|---|---|
| Modelo femenino completo | Estilizado, ≤ 80k tris tras decimación, texturas ≤ 2K, pelo en cards con material separado, manos/pies revisados, pose única (§2). GLB + Draco. | Marketplace de pago (~50–200 USD); lo gratuito falla en manos y pies |
| HDRI estudio | 1K, neutro cálido | Poly Haven |
| Packshots producto | Foto fondo neutro ≥ 1200px por producto | Fotos propias del inventario Trust |
| Logo + paleta + 2 fuentes | Vectorial | Identidad de {{MARCA}} |
| Renders del modelo para fallback | 5 imágenes (rostro, pelo, torso, manos, pies) | Se generan desde la propia escena |

---

## 9. Decisiones pendientes (Raul)

1. Confirmar: manicura/pedicura nacen `DESACTIVADO` con lista de espera (recomendado) — o `ACTIVO` con reserva simple por WhatsApp.
2. Pasarela de pago: Stripe / PayPal / checkout de Shopify headless.
3. Alcance de envíos: local Miami-Dade, todo EE. UU., o recogida.
4. Destino de la lista de espera: Google Sheet vía API, email (Resend), o DB.
5. Nombre de marca y dominio (reemplazar `{{MARCA}}`).
6. Catálogo: JSON local v1 → ¿migración futura a Shopify/CMS cuando haya volumen?
7. Tagline y textos definitivos de cada capítulo.

---

## 10. Mapa de fases para Claude Code

- **Fase 1 — El rig.** Caps. 0–2 con modelo placeholder: canvas fijo, Lenis + ScrollTrigger con scrub, pin del Cap. 2, header fijo, fallback estático, presupuesto de rendimiento verificado en móvil real.
- **Fase 2 — El negocio.** Quiz (§5.1), recomendador (§5.2), carrito (§5.3), `/tienda` y fichas. Esto ya vende sin que exista el resto del scroll.
- **Fase 3 — El cuerpo.** Caps. 3–7, vitrina flotante, listas de espera, pulido de motion y copy.
- **Fase 4 — `FUTURO`.** Sesión de clienta, historial, simulador de color, flujos de manicura/pedicura, cara personalizada.

Cada fase termina con: build sin warnings, prueba en un móvil de gama media real, y commit etiquetado (`fase-1`, `fase-2`…).
