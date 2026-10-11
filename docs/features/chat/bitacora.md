# Bitácora de chat

De lo más reciente a lo más antiguo.

## 2026-10-10 · CIC-25 · Con 2 palabras fijas, una pregunta larga encontraba noticias ajenas

**Requisitos:** `RF-14`, `RP-03` · **Notion:** [CIC-25](https://app.notion.com/p/3f4f573ce6df81f1b613d529ddfd1d62) ·
**Ticket:** [TKT-1](https://app.notion.com/p/3f5f573ce6df81949870d08ecf84997e) · **Decisiones:** D-25, D-34 ·
**PR:** [#14](https://github.com/chuy-zip/RESPIA_NEWS/pull/14)

- **Comprensión:** `searchRss` aceptaba una noticia con 2 palabras de la pregunta en común, sin importar cuántas
  palabras tuviera la pregunta.
- **Hipótesis:** 2 palabras bastan para que una noticia sea del tema.
- **Construcción:** `searchExternal` en `src/lib/ia/external-search.ts`: primero el RSS y, sin resultados, Tavily.
- **Prueba:** dos preguntas en vivo, contra los feeds reales y Tavily. La llave no se imprimió.
- **Observación:**
  - «elecciones en Honduras»: el RSS no tenía nada y Tavily trajo 5 noticias del tema, en 4.9 s.
  - «tratado de libre comercio entre Centroamérica y Corea del Sur»: el RSS trajo un terremoto en Panamá y una
    nota de migración. Solo coincidían «sur» y «centro», la raíz de «Centroamérica». Tavily no corrió.
  - Con el arreglo, la misma pregunta pasó a Tavily. De sus 5 resultados, solo 1 era del tema.
- **Corrección:** una noticia del RSS necesita la mitad de las palabras de la pregunta, y nunca menos de 2. Una prueba
  automática con ese caso falla con la regla vieja. Tavily también trae resultados ajenos: el modelo decide si
  responden la pregunta (`covered`, D-34), y el conjunto fijo del incremento 3 lo mide.
- **Agente:** Claude Code (Claude Opus 5.5).
- **Pedido:** Rodrigo pidió empezar el chat.
- **Propuesta:** el agente había escrito el mínimo de 2 palabras el 2026-10-09 y lo probó solo con preguntas cortas.
- **Decisión:** el arreglo sigue D-25. No cambia ninguna decisión.
- **Verificación:** `node --test src/lib/ia/external-search.test.mjs`: 5 de 5 pasan. Prueba en vivo repetida.
- **Evidencia:** 2026-10-10, salida de la prueba en vivo en este registro. Tavily gastó unos 4 créditos.

## 2026-10-10 · CIC-24 · El chat usa contexto fijo en lugar de tools

**Requisitos:** `RF-12`, `RF-14`, `RP-02`, `RP-03` · **Notion:** [CIC-24](https://app.notion.com/p/3f4f573ce6df816ebafef145e7ffe6d2) ·
**Ticket:** [TKT-1](https://app.notion.com/p/3f5f573ce6df81949870d08ecf84997e) · **Decisión:** D-34 (reemplaza D-24)

- **Comprensión:** D-24 decía que el modelo pide datos con tools, en dos rondas como máximo.
- **Hipótesis:** las tools hacen falta para las consultas (c) y (d) de `RF-12`.
- **Construcción:** Backend construyó `POST /api/chat` con el contrato del incremento 2 de este spec (PR #11). El
  servidor arma el contexto antes de llamar al modelo: las 10 primeras del feed, el bloque importante y hasta 5
  noticias de la búsqueda de texto.
- **Prueba:** revisión del código del PR #11. Pruebas de Backend: 401 sin sesión, `unavailable` sin módulo y 422 con
  entradas inválidas.
- **Observación:** el contexto fijo ya cubre la búsqueda que hacía `buscar_noticias`, sin una segunda llamada al
  modelo. La búsqueda externa puede decidirla el servidor: corre cuando la búsqueda de texto devuelve 0.
- **Corrección:** contexto fijo, una llamada al modelo y búsqueda externa en el módulo de IA (D-34). Las tools
  vuelven solo si el conjunto fijo (CIC-17) falla en las consultas (c) y (d).
- **Agente:** Claude Code (Claude Opus 5.5).
- **Pedido:** Rodrigo pidió revisar lo que trajo Gerardo.
- **Propuesta:** el agente vio que el código no seguía D-24 y propuso quedarse con el contexto fijo. También propuso
  el `articleId` para la señal `chat`, `externalUrls` en la salida y `AiLimitError` para el tope.
- **Decisión:** Rodrigo aprobó las cinco propuestas (D-34).
- **Verificación:** lectura de `src/lib/services/chat.ts` y `src/types/chat.ts`. Pendiente: el conjunto fijo del chat
  cuando haya créditos.
- **Evidencia:** 2026-10-10, revisión del PR #11.

## 2026-10-09 · CIC-25 · Lector RSS: la prueba con feeds reales cambió la lista y la búsqueda

**Requisitos:** `RF-14`, `RP-03` · **Notion:** [CIC-25](https://app.notion.com/p/3f4f573ce6df81f1b613d529ddfd1d62) ·
**Commit:** `a2d6218` (rama `chat`) · **Decisión:** D-25, D-26

- **Comprensión:** el incremento 1 lee el RSS de los sitios permitidos de Centroamérica y medios internacionales,
  y busca por palabras sin modelo.
- **Hipótesis:** con los feeds que responden al user agent de la app, una búsqueda por raíces de palabras encuentra
  las noticias de una pregunta en pocos segundos.
- **Construcción:** `src/lib/ia/rss.ts` con 24 sitios, `fast-xml-parser`, un límite de 5 s por feed y un mínimo de
  2 palabras en común.
- **Prueba:** un script local con Node 24 leyó cada feed e hizo 5 preguntas de ejemplo.
- **Observación:**
  - La Prensa de Nicaragua tardó de 6 a 8 s en 3 intentos. Cada búsqueda esperaba su límite de 5 s.
  - «Noticias de economía en Costa Rica» trajo noticias de sismos: «Costa» y «Rica» contaban como 2 palabras.
    Pasó lo mismo con «Estados Unidos».
  - «Receta de pastel de chocolate» encontró una receta en Infobae.
- **Corrección:**
  - La Prensa de Nicaragua salió de la lista. Nicaragua sigue con Confidencial y Divergentes.
  - Los nombres de lugar de varias palabras cuentan como una sola coincidencia.
  - El guardrail de alcance debe actuar antes de buscar afuera (pendiente en el spec).
  - Resultado después de corregir: 23 de 23 feeds con noticias, unos 2 s por búsqueda sin caché, y «economía en
    Costa Rica» devuelve 0 resultados, que es el caso en que entra Tavily.
- **Agente:** Claude Code (Claude Opus 5.5).
- **Pedido:** empezar el lector RSS de la búsqueda externa con cobertura de Centroamérica.
- **Propuesta:** el agente probó 36 feeds, escribió el lector, lo probó con preguntas de ejemplo y propuso las tres
  correcciones.
- **Decisión:** el equipo pidió empezar por el RSS y eligió la cobertura de Centroamérica (D-26).
- **Verificación:** el mismo script antes y después de corregir. `typecheck` y `lint` sin errores.
- **Evidencia:** 2026-10-09, equipo local, Node 24, feeds reales. Falta probar desde Vercel.

## 2026-10-09 · CIC-25 · Búsqueda externa: RSS primero y Tavily de respaldo, sin MCP

**Requisitos:** `RF-14`, `RF-06`, `RP-01` · **Notion:** [CIC-25](https://app.notion.com/p/3f4f573ce6df81f1b613d529ddfd1d62) ·
**Decisión:** D-25

- **Comprensión:** faltaba elegir el proveedor de la búsqueda externa. Los candidatos eran APIs de pago: Tavily,
  Exa, Brave y la búsqueda web de OpenRouter. El equipo preguntó si convenía un MCP, una skill o una opción open source.
- **Hipótesis:** con una lista de sitios permitidos, el RSS de esos sitios cubre la mayoría de los casos sin
  costo. Una API de búsqueda solo hace falta como respaldo.
- **Construcción:** ninguna.
- **Prueba:** revisión de la documentación de créditos de Tavily y estimación de búsquedas del mes de la demo.
- **Observación:**
  - Una skill solo instruye al agente que programa: no corre en la app.
  - Un MCP de búsqueda envuelve la misma API de pago y quita al servidor el control de cuándo se busca.
  - El RSS no cobra, no necesita llave y la pregunta no sale del servidor. Solo trae las últimas noticias de cada sitio.
  - Tavily da 1 000 créditos gratis por mes, sin tarjeta. El peor caso estimado es de 460 créditos.
- **Corrección:** D-25. Primero el RSS y Tavily solo si el RSS no tiene resultados. Sin MCP.
- **Agente:** Claude Code (Claude Opus 5.5).
- **Pedido:** decidir entre MCP, skill u open source, y confirmar si Tavily cabe en su plan gratis.
- **Propuesta:** el agente descartó MCP y skill y propuso el RSS como fuente principal. Comparó el RSS, un
  SearXNG propio y las APIs de búsqueda.
- **Decisión:** el equipo eligió RSS y Tavily.
- **Verificación:** documentación de créditos de Tavily, consultada el 2026-10-09. El cálculo del peor caso está
  en Notion (*Arquitectura y costo del chat*).
- **Evidencia:** 2026-10-09. La prueba del flujo queda pendiente (métrica de CIC-25).

## 2026-10-09 · CIC-25 · `RF-14` cambia: fuentes externas solo cuando la app no tiene noticias

**Requisitos:** `RF-14`, `RF-13`, `RT-03`, `RT-04` · **Notion:** [CIC-25](https://app.notion.com/p/3f4f573ce6df81f1b613d529ddfd1d62) ·
**Decisión:** D-24

- **Comprensión:** el equipo quiere que el chat busque fuera de la app cuando no hay noticias publicadas sobre
  la pregunta, con una condición: que busque, cite y no invente.
- **Hipótesis:** la búsqueda externa, limitada a sitios permitidos y con cada frase citada, responde sin inventar.
- **Construcción:** ninguna. Es un ciclo de diseño.
- **Prueba:** comparación de la propuesta con los requisitos. No hubo prueba de código.
- **Observación:** `RF-14` decía que el chat «se limita al contenido de las noticias de la app». Una fuente
  externa no tiene un estado asignado por una persona (`RF-13`, `RT-03`). La propuesta contradecía el requisito.
- **Corrección:** se cambió `RF-14` (registro de cambios de [ALCANCE.md](../../ALCANCE.md)). La búsqueda
  externa corre solo con 0 resultados internos, en sitios permitidos, separada y con la etiqueta «Fuente
  externa, no verificada por la redacción». El contexto general también sale de fuentes citadas.
- **Agente:** Claude Code (Claude Opus 5.5).
- **Pedido:** revisar si la tool de novedades puede buscar fuera de la app.
- **Propuesta:** el agente señaló el conflicto con `RF-14`, `RF-13`, `RT-03` y `RT-04` antes de diseñar.
  Propuso la regla «cada frase tiene fuente», el formato armado por el servidor y los guardrails (CIC-26).
- **Decisión:** el equipo mantuvo la búsqueda externa con esas reglas. Agregó la lista de sitios por tema y
  pidió que el chat solo responda sobre noticias y no devuelva código.
- **Verificación:** lectura del enunciado y de `RF-13`, `RF-14`, `RT-03` y `RT-04`.
- **Evidencia:** 2026-10-09, conversación de diseño. La prueba queda pendiente: 5 preguntas sin cobertura en la
  app (métrica de CIC-25).

## 2026-10-09 · CIC-24 · Sin router aparte ni BERT: el LLM con tools decide qué datos pide

**Requisitos:** `RF-12`, `RP-03` · **Notion:** [CIC-24](https://app.notion.com/p/3f4f573ce6df816ebafef145e7ffe6d2) ·
**Decisión:** D-24

- **Comprensión:** el equipo propuso un router que clasifica cada pregunta en los cuatro tipos de `RF-12` y la
  envía a un BERT, al LLM o al LLM con tools.
- **Hipótesis:** un solo LLM con tools atiende los cuatro tipos y las preguntas mixtas.
- **Construcción:** ninguna. Es un ciclo de diseño.
- **Prueba:** revisión del enunciado y de los requisitos. No hubo prueba de código.
- **Observación:** el enunciado pide atender «otras consultas equivalentes». Una pregunta como «¿qué pasa con la
  economía en mi región?» es de dos tipos a la vez. Un router necesita su propia llamada al modelo o reglas por
  palabras. BERT clasifica y compara textos, pero no los redacta.
- **Corrección:** se descartaron el router y BERT. El modelo recibe el top 10 del feed del usuario y tres tools.
  Los cuatro tipos pasan a ser casos de prueba.
- **Agente:** Claude Code (Claude Opus 5.5).
- **Pedido:** revisar la arquitectura propuesta para el chat.
- **Propuesta:** tool calling con un solo LLM. El top del feed va en el contexto y las tools ejecutan SQL.
- **Decisión:** el equipo aceptó y agregó la búsqueda externa (CIC-25).
- **Verificación:** lectura del enunciado y de `RF-12` y `RP-03`. La calidad se mide con el conjunto fijo (CIC-17).
- **Evidencia:** 2026-10-09, conversación de diseño. La prueba con el conjunto fijo queda pendiente.
