# Costos de IA

Registro de cada llamada a un modelo, tope de gasto y reserva para la demo.

**Requisitos:** `RP-01`, `RP-02`, `RP-03` · **Bitácora:** [bitacora.md](../../docs/features/costos-ia/bitacora.md) ·
**Decisiones:** D-23 a D-25, D-30 · **Investigación (Notion):** [CIC-14](https://app.notion.com/p/3f4f573ce6df81c0a2fdef4150ce5938),
[CIC-15](https://app.notion.com/p/3f4f573ce6df8133b74ac33fb3932d13), [CIC-16](https://app.notion.com/p/3f4f573ce6df813eaee5d41ff0675832) ·
**Estimación por proveedor y por pregunta:** [Arquitectura y costo del chat](https://app.notion.com/p/3f4f573ce6df8168a4e8d347d5b4c749) ·
**Responsable:** Rodrigo Mansilla (IA). Tabla del registro: Ricardo Chuy.

## Comportamiento actual

Todavía no hay llamadas a modelos. Gasto acumulado: USD 0. La API de créditos de OpenRouter lo confirmó el
2026-10-10.

### Presupuesto (D-30)

| Parte | Monto | Uso |
|---|---|---|
| Desarrollo y pruebas | USD 14 | Es el tope de la app hasta la demo |
| Reserva para la demo | USD 6 (30 %) | Chat en vivo, validación con compañeros e imágenes en vivo |

Estimación de la demo: 300 preguntas × USD 0.001 = USD 0.30 de chat (CIC-16). No se generan imágenes (D-23).

La búsqueda externa no gasta presupuesto: el RSS es gratis y Tavily queda en su plan gratis de 1 000 créditos por
mes (D-25). El registro cuenta los créditos de Tavily de cada búsqueda para vigilar ese límite.

### Modelos (D-30)

- **Desarrollo y producción:** Claude Haiku 5.5 (`claude-haiku-5-5`) por la API oficial de Anthropic, la opción
  sin comisión. No se usan modelos `:free`.
- **Llave:** `ANTHROPIC_API_KEY`, variable de servidor. El código del modelo se escribe cuando haya créditos.
- **Costo de desarrollo:** el conjunto fijo del chat (CIC-17) cuesta entre USD 0.01 y 0.04 por ejecución.

## Criterios de aceptación

- **`RP-01`**: el gasto del registro y el de la consola del proveedor nunca superan USD 20.
- **`RP-02`**: cada función de IA aparece en el registro con modelo, tokens y costo. Se consultan el gasto, el
  saldo y el costo por función. Con el tope forzado, la función no llama al modelo.
- **`RP-03`**: ordenar, filtrar y recuperar no llaman a ningún modelo. Se revisan `src/lib/recomendacion/` y
  el servicio que arma el contexto del chat (D-34).

## No incluido

- Un panel con gráficos. El gasto se consulta con SQL o con una página simple del portal.

## Dependencias

- Datos: el script `006_ai_usage.sql`, con la tabla y sus tres funciones. Lo revisa Ricardo y se ejecuta cuando
  llegue a `main`. Sin `user_id` mientras no haya un límite por usuario (CIC-15).
- Backend: la ruta `GET /api/admin/ai-usage`, que llama a `getAiUsageSummary()`, y la traducción de `AiLimitError` a
  429 `AI_LIMIT_REACHED` (D-34).
- Infra: las variables de servidor del modelo y de Tavily (`TAVILY_API_KEY`), sin `NEXT_PUBLIC_`.

## Uso de IA en el producto

Lista de todas las funciones con IA del producto (`RP-03`):

| Función | Feature | Modelo | Para qué | Alternativa más barata considerada | Costo estimado |
|---|---|---|---|---|---|
| `responderChat` | `chat` | Claude Haiku 5.5 (D-30) | Entender la pregunta y redactar con las noticias del contexto (D-34) | Plantillas o router con reglas (CIC-24) | USD 0.001 a 0.002 por pregunta |
| `buscar_externo` | `chat` | Ninguno: RSS y Tavily (D-25) | Fuentes externas cuando la app no tiene noticias | Responder solo «no hay noticias» (CIC-25) | USD 0 dentro de los 1 000 créditos gratis de Tavily por mes |
| `elegirImagen` | `imagenes` | El mismo modelo del chat | Proponer una imagen del banco leyendo descripciones | El administrador elige sin sugerencia (CIC-27) | Menos de USD 0.0002 por noticia |
| Recomendador | `recomendacion` | Ninguno | Ordenar el feed | No aplica | USD 0 |

## Done específico

- La suma del registro difiere menos de 5 % de la consola del proveedor (CIC-15).

## Tareas

Están en el ticket [TKT-3](https://app.notion.com/p/3f5f573ce6df817e8164c1d218f1c3ef) de la base [Tickets](https://app.notion.com/p/e7bcbe3443c343b2873a2b5b97eb474c) de Notion (D-28). El ticket guarda la lista de tareas con su evidencia y de qué áreas depende.

## Cambio en curso

### Incremento 1: registro de costo y tope (rama `costos-ia`)

Requisitos: `RP-01`, `RP-02`. Decisiones: D-30, D-34. Ticket: TKT-3. Ciclo: CIC-15.

- `src/lib/ia/cost.ts` es el único camino hacia el proveedor. Cada función de IA lo llama con su nombre:
  `responderChat` o `elegirImagen`.
- **Antes de llamar:** suma el gasto registrado y el costo máximo de la llamada (tokens de entrada estimados por su
  precio, más `max_tokens` por el precio de salida). Si el total pasa el tope de la app, no llama y lanza
  `AiLimitError`. Si no puede leer el gasto, tampoco llama: falla cerrado.
- **Después de llamar:** guarda una fila con los tokens reales de `usage` y su costo.
- **Tope:** USD 14 hasta la demo, con USD 6 de reserva (D-30). Para la demo, el tope sube a USD 20 con un cambio de
  una línea.
- **Precios:** una tabla en el código con su fecha de revisión. Haiku 5.5, por millón de tokens: USD 0.10 de
  entrada, 0.50 de salida, 0.01 de lectura de caché y 0.125 de escritura de caché (1.25 veces la entrada).
- **Tavily:** cada búsqueda guarda una fila con 1 crédito y costo 0, para vigilar los 1 000 créditos por mes (D-25).
- **Tabla `ai_usage` (script 006):** fecha, función, modelo, entorno (`local`, `preview` o `production`), tokens de
  entrada, de salida y de caché, costo en USD y créditos externos. No guarda el `user_id` ni el texto de la pregunta:
  no es un dato del usuario y no cambia `/privacidad` (CIC-15).
- **Acceso a la tabla:** la app no la lee ni la escribe directo. Usa tres funciones de la base: `record_ai_usage`
  (registrar), `ai_spend_total` (gasto acumulado, para el tope) y `ai_usage_summary` (desglose por función, solo
  administradores). Así no hace falta una llave de servicio. Riesgo aceptado: una cuenta con sesión puede llamar
  `record_ai_usage` y sumar gasto falso. La tabla rechaza valores negativos y funciones desconocidas.
- **Resumen para el portal (ficha 11):** `getAiUsageSummary()` devuelve moneda, gasto, saldo de la app (tope menos
  gasto), reserva, tope, desglose por función y disponibilidad. Un dato que no se puede leer va como `null`. La ruta
  `GET /api/admin/ai-usage` es de Backend.
- **Segunda barrera:** el límite de gasto del workspace de Anthropic donde vive la llave. Lo configura Rodrigo.
- **Prueba:** `node --test src/lib/ia/cost.test.mjs`, con la base simulada. Cubre el costo con tokens reales, el tope
  que bloquea sin llamar, la falla cerrada, el registro de Tavily y el resumen con `null`. La prueba con la API real
  espera los créditos.
