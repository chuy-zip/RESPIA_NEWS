# Bitácora de chat

De lo más reciente a lo más antiguo.

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
