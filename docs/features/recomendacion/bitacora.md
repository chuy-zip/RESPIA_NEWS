# Bitácora de recomendacion

De lo más reciente a lo más antiguo.

## 2026-10-10 · CIC-28 · Un solo clic le ganaba a un tema elegido

**Requisitos:** `RF-10` · **Notion:** [CIC-28](https://app.notion.com/p/3f4f573ce6df813fb993ea21c9aa29db) ·
**Ticket:** [TKT-2](https://app.notion.com/p/3f5f573ce6df814ba4fcf0fa30be4906) · **Decisiones:** D-31, D-32 ·
**PR:** [#12](https://github.com/chuy-zip/RESPIA_NEWS/pull/12)

- **Comprensión:** `topicWeights` dividía el total de cada tema entre el del tema con más señales. Un tema elegido
  valía al menos 0.5.
- **Hipótesis:** el tema más leído vale 1 y los demás se comparan con él.
- **Construcción:** Backend conectó `GET /api/feed` con el recomendador (PR #10 y #11) y lo probó con una cuenta.
- **Prueba:** una cuenta con Tecnología elegida abrió una noticia de Economía.
- **Observación:** Economía pesó 1 y Tecnología 0.5. Un solo clic le ganó a una elección explícita.
- **Corrección:** el peso es `señales / (señales + 2)`, sin compararse con otro tema. Un tema elegido cuenta como 2
  señales previas: empieza en 0.5 y las señales lo suben hacia 1. Una apertura de otro tema vale 0.33.
- **Agente:** Claude Code (Claude Opus 5.5).
- **Pedido:** Rodrigo pidió revisar lo que trajo Gerardo y después arreglar el peso.
- **Propuesta:** el agente había escrito la división entre el tema más leído en el incremento 1. Las pruebas de
  entonces fijaban ese comportamiento, así que no lo detectaron. Propuso contar el tema elegido como 2 señales.
- **Decisión:** Rodrigo aprobó el arreglo. Cumple D-32 sin cambiar su texto.
- **Verificación:** `node --test "src/lib/recomendacion/*.test.mjs"`: 24 de 24 pasan. La prueba con el caso de Backend
  falla con la regla vieja.
- **Evidencia:** 2026-10-10, PR #12. Tras 5 aperturas de salud, su posición media pasa de 16.6 a 7.4.

## 2026-10-10 · CIC-28 · Las relacionadas usan el alcance de la noticia, no el ámbito del lector

**Requisitos:** `RF-11`, `RT-01` · **Notion:** [CIC-28](https://app.notion.com/p/3f4f573ce6df813fb993ea21c9aa29db) ·
**Ticket:** [TKT-2](https://app.notion.com/p/3f5f573ce6df814ba4fcf0fa30be4906) · **Decisión:** D-31

- **Comprensión:** el spec decía «primero van las de otro ámbito», con el ámbito del bloque importante: país del
  lector, resto de Centroamérica o internacional.
- **Hipótesis:** el mismo ámbito sirve para mostrar el cruce entre lo internacional y lo local.
- **Construcción:** revisión del caso del informe sobre IA y economía frente a la noticia de remesas, con las
  regiones del catálogo del PR #7.
- **Prueba:** cálculo del ámbito de las dos noticias para un lector de Guatemala. No hubo prueba de código.
- **Observación:** el informe es relevante para toda Centroamérica y la noticia de remesas para Guatemala. Para ese
  lector, las dos tienen el ámbito «tu país». El ámbito del lector no las distingue.
- **Corrección:** las relacionadas usan el alcance de la noticia, que no depende del lector: `local` (un país),
  `regional` (dos o más) o `international` (ninguno). El bloque importante sigue con el ámbito del lector.
- **Agente:** Claude Code (Claude Opus 5.5).
- **Pedido:** Rodrigo pidió empezar el incremento 2.
- **Propuesta:** el agente escribió «otro ámbito» en el spec sin probar el caso del cruce. Al revisar el catálogo
  del PR #7 encontró el problema y propuso el alcance de la noticia.
- **Decisión:** el cambio queda dentro de D-31, que no define el ámbito de las relacionadas. Se aplica el criterio
  de Rodrigo: usa los datos que ya existen y no bloquea a nadie.
- **Verificación:** prueba «El informe regional va primero» en `related.test.mjs`.
- **Evidencia:** 2026-10-10, revisión del caso. La prueba del código está en el spec (incremento 2).

## 2026-10-10 · CIC-28 · Marco teórico y diseño cerrado: bloque por ámbito, señales con tipo y relacionadas

**Requisitos:** `RF-08`, `RF-10`, `RF-11`, `RT-01`, `RP-03` · **Notion:** [CIC-28](https://app.notion.com/p/3f4f573ce6df813fb993ea21c9aa29db),
[Recomendación de noticias](https://app.notion.com/p/3f5f573ce6df81e4b04aca2eebe95d10) ·
**Ticket:** [TKT-2](https://app.notion.com/p/3f5f573ce6df814ba4fcf0fa30be4906) · **Decisiones:** D-31, D-32

- **Comprensión:** el bloque `importantItems` llevaba las 3 noticias importantes más recientes. Cada apertura
  sumaba al interés. La única señal era abrir una noticia.
- **Hipótesis:** el diseño se apoya en fuentes verificadas y se decide con un criterio fijo: lo que se integra sin
  crear bloqueos, da más retorno y cabe en el tiempo.
- **Construcción:** página de teoría en Notion con 26 fuentes. Cada fuente tiene autor, año, sede y DOI o enlace.
- **Prueba:** cálculo de casos con los pesos de `feed.ts`. No hubo prueba de código.
- **Observación:**
  - Una noticia importante de otra región, reciente y sin interés, suma 0.35. Una noticia local de hace dos días
    suma 0.40. El puntaje solo no cumple `RF-11`.
  - Con «las 3 más recientes», tres importantes de un país dejan fuera la internacional.
  - Si cada apertura suma, abrir 5 veces una noticia de deportes pesa más que leer 3 noticias de economía.
  - `RF-16` pide regiones de relevancia, no el lugar del hecho. Con ese dato, una noticia internacional puede
    subir para el país al que afecta.
  - Ding y Li (2005) definen `λ = 1/T0`. Con esa λ, el peso en `T0` es 0.37, no 0.5. `feed.ts` usa `0.5 ** (t/T0)`,
    que sí es una vida media.
- **Corrección:** el bloque lleva una noticia por ámbito. Cada tipo de señal cuenta una vez por noticia y por
  lector. La señal `chat` vale 1 más que abrir. El onboarding agrega temas elegidos. El incremento 2 agrega las
  relacionadas.
- **Agente:** Claude Code (Claude Opus 5.5).
- **Pedido:** planificar el recomendador, primero con una fase de investigación y notas teóricas con referencias
  reales.
- **Propuesta:** el agente hizo primero preguntas de diseño, sin investigación. Rodrigo lo corrigió y pidió la fase
  de investigación. La lista inicial de fuentes del agente tenía tres datos incorrectos: la sede de Hu et al., las
  páginas de Galtung y Ruge y un autor faltante en Nguyen et al. La verificación los corrigió. El agente también
  propuso un campo de origen, que el criterio descartó.
- **Decisión:** Rodrigo aprobó la región con prioridad, el bloque por ámbito, la región como país, el conteo único
  y el onboarding con temas. Agregó la señal del chat y el cruce entre noticias internacionales y locales. Las
  demás preguntas se cerraron con su criterio: sin campo de origen, relacionadas en el incremento 2, la señal del
  chat sin bloquear `RF-10` y los pesos explicados en `/privacidad`.
- **Verificación:** DOIs consultados en Crossref y en las páginas de las editoriales. Texto de Ding y Li leído en
  el PDF.
- **Evidencia:** 2026-10-10, página de teoría en Notion y cálculo de casos. La prueba del código está en el spec.

## 2026-10-10 · CIC-28 · El recomendador se alinea al contrato del feed: cuatro prominencias y bloque importante

**Requisitos:** `RF-08`, `RF-11`, `RT-01` · **Notion:** [CIC-28](https://app.notion.com/p/3f4f573ce6df813fb993ea21c9aa29db) ·
**Ticket:** [TKT-2](https://app.notion.com/p/3f5f573ce6df814ba4fcf0fa30be4906) · **Decisión:** D-20

- **Comprensión:** la propuesta del 2026-10-09 tenía 3 niveles por franjas de puntaje y cupos reservados para las
  noticias importantes (`RF-11`).
- **Hipótesis:** el recomendador debe entregar lo que la pantalla del feed ya muestra.
- **Construcción:** lectura de `specs/front/feed-y-lector.md` y del contrato `GET /api/feed` en `notion-frontend.md`.
- **Prueba:** comparación de la propuesta con ese contrato. No hubo prueba de código.
- **Observación:**
  - La pantalla tiene cuatro variantes de tarjeta: `hero`, `large`, `standard` y `compact`.
  - Cada noticia trae un motivo legible, y hay un bloque `importantItems` que no depende del filtro por tema.
  - Las regiones y los temas llegan como IDs del catálogo. Las señales se envían a `POST /api/interactions`.
- **Corrección:** la prominencia sale de la posición en el orden y usa las cuatro variantes. `RF-11` se cumple con
  el bloque `importantItems` en lugar de cupos. La entrada usa IDs.
- **Agente:** Claude Code (Claude Opus 5.5).
- **Pedido:** centrarse en el recomendador, que es el núcleo del feed y del chat.
- **Propuesta:** el agente leyó los specs de Frontend antes de escribir código y propuso alinearse a su contrato.
- **Decisión:** Rodrigo pidió avanzar con el recomendador. La alineación con el contrato queda por confirmar con
  Sergio y Gerardo al integrar el endpoint.
- **Verificación:** lectura de los specs de Frontend y del contrato propuesto.
- **Evidencia:** 2026-10-10, revisión de documentos. La prueba del código está en el spec (incremento 1).
