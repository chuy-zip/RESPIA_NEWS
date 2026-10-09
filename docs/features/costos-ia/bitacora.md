# Bitácora de costos-ia

De lo más reciente a lo más antiguo.

## 2026-10-09 · CIC-14 · Las pruebas usan modelos gratis de OpenRouter: OpenAI no tiene un nivel gratis

**Requisitos:** `RP-01`, `RP-02` · **Notion:** [CIC-14](https://app.notion.com/p/3f4f573ce6df81c0a2fdef4150ce5938) ·
**Decisión:** D-22

- **Comprensión:** el equipo quería desarrollar con modelos gratis y usar OpenAI o Haiku 5.5 en producción.
- **Hipótesis:** existe un nivel gratis de API suficiente para trabajar el prompt sin gastar el presupuesto.
- **Construcción:** ninguna.
- **Prueba:** búsqueda web de precios y condiciones de OpenAI y OpenRouter.
- **Observación:**
  - OpenAI no tiene un nivel gratis general en su API. Sus tokens gratis exigen compartir los datos para entrenamiento.
  - OpenRouter tiene modelos `:free`: 20 peticiones por minuto y 50 por día sin compra de créditos. También
    pueden entrenar con lo que reciben, y la lista de modelos gratis cambia.
  - Haiku 5.5 no tiene versión gratis. OpenRouter cobra el mismo precio por token que el proveedor y 5.5 % por
    compra de créditos, con un mínimo de USD 0.80.
  - El enunciado no exige un proveedor.
- **Corrección:** las pruebas usan modelos `:free` de OpenRouter, solo con datos de ejemplo. Producción usa
  Haiku 5.5 o un GPT de gama baja, comprado donde el costo total sea menor. La reserva para la demo es el 30 %.
- **Agente:** Claude Code (Claude Opus 5.5).
- **Pedido:** comparar proveedores y opciones gratis para pruebas.
- **Propuesta:** el agente recomendó OpenRouter para todo: una llave, un saldo y un formato. También recomendó
  validar con el modelo de producción antes de cerrar cada tarea. Al principio entendió que el equipo quería
  Haiku 5.5 gratis en OpenRouter. El equipo lo corrigió: lo gratis es solo para pruebas.
- **Decisión:** el equipo aceptó los modelos `:free` para pruebas y dejó la elección de producción para la
  medición con el conjunto fijo (CIC-17).
- **Verificación:** documentación de OpenRouter (FAQ y límites) y del centro de ayuda de OpenAI, consultadas el
  2026-10-09. Algunos precios vienen de sitios de terceros: se confirman en la página oficial antes de comprar.
- **Evidencia:** 2026-10-09, búsqueda web. Sin gasto todavía.
