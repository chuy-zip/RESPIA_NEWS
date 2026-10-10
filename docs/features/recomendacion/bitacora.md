# Bitácora de recomendacion

De lo más reciente a lo más antiguo.

## 2026-10-10 · CIC-28 · El recomendador se alinea al contrato del feed: cuatro prominencias y bloque importante

**Requisitos:** `RF-08`, `RF-11`, `RT-01` · **Notion:** [CIC-28](https://app.notion.com/p/3f4f573ce6df813fb993ea21c9aa29db) ·
**Ticket:** [TKT-2](https://app.notion.com/p/3f5f573ce6df814ba4fcf0fa30be4906) · **Decisión:** D-20

- **Comprensión:** la propuesta del 2026-10-09 tenía 3 niveles por franjas de puntaje y cupos reservados para las
  noticias importantes (`RF-11`).
- **Hipótesis:** el recomendador debe entregar lo que la pantalla del feed ya muestra.
- **Construcción:** lectura de `specs/feed-y-lector.md` y del contrato `GET /api/feed` en `notion-frontend.md`.
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
