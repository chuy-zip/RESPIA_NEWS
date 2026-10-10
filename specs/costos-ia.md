# Costos de IA

Registro de cada llamada a un modelo, tope de gasto y reserva para la demo.

**Requisitos:** `RP-01`, `RP-02`, `RP-03` · **Bitácora:** [bitacora.md](../docs/features/costos-ia/bitacora.md) ·
**Decisiones:** D-22 a D-25 · **Investigación (Notion):** [CIC-14](https://app.notion.com/p/3f4f573ce6df81c0a2fdef4150ce5938),
[CIC-15](https://app.notion.com/p/3f4f573ce6df8133b74ac33fb3932d13), [CIC-16](https://app.notion.com/p/3f4f573ce6df813eaee5d41ff0675832) ·
**Estimación por proveedor y por pregunta:** [Arquitectura y costo del chat](https://app.notion.com/p/3f4f573ce6df8168a4e8d347d5b4c749) ·
**Responsable:** Rodrigo Mansilla (IA). Tabla del registro: Ricardo Chuy.

## Comportamiento actual

Todavía no hay llamadas a modelos. Gasto acumulado: USD 0.

### Presupuesto (D-22)

| Parte | Monto | Uso |
|---|---|---|
| Desarrollo y pruebas | USD 14 | Es el tope de la app hasta la demo |
| Reserva para la demo | USD 6 (30 %) | Chat en vivo, validación con compañeros e imágenes en vivo |

Estimación de la demo: 300 preguntas × USD 0.001 = USD 0.30 de chat (CIC-16). No se generan imágenes (D-23).

La búsqueda externa no gasta presupuesto: el RSS es gratis y Tavily queda en su plan gratis de 1 000 créditos por
mes (D-25). El registro cuenta los créditos de Tavily de cada búsqueda para vigilar ese límite.

### Modelos (D-22)

- **Pruebas:** modelos `:free` de OpenRouter, solo con datos de ejemplo, porque pueden entrenar con lo que
  reciben. Límite: 50 peticiones por día y cuenta sin compra de créditos.
- **Producción:** Claude Haiku 5.5 o un modelo GPT de gama baja. Se elige por calidad y costo, medidos con el
  conjunto fijo del chat (CIC-17).
- **Proveedor:** la API oficial o un proveedor de inferencia, el de menor costo total. OpenRouter cobra el mismo
  precio por token que el proveedor y 5.5 % por compra de créditos (mínimo USD 0.80).
- **Un solo código:** OpenRouter acepta el formato de la API de OpenAI. Entre pruebas y producción cambian tres
  variables de servidor: URL base, llave y modelo.

## Criterios de aceptación

- **`RP-01`**: el gasto del registro y el de la consola del proveedor nunca superan USD 20.
- **`RP-02`**: cada función de IA aparece en el registro con modelo, tokens y costo. Se consultan el gasto, el
  saldo y el costo por función. Con el tope forzado, la función no llama al modelo.
- **`RP-03`**: ordenar, filtrar y recuperar no llaman a ningún modelo. Se revisan `src/lib/recomendacion/` y
  las tools del chat.

## No incluido

- Un panel con gráficos. El gasto se consulta con SQL o con una página simple del portal.

## Dependencias

- Datos: la tabla `ai_usage` con función, modelo, entorno, tokens y costo. Sin `user_id` mientras no haya un
  límite por usuario (CIC-15).
- Infra: las variables de servidor del modelo y de Tavily (`TAVILY_API_KEY`), sin `NEXT_PUBLIC_`.

## Uso de IA en el producto

Lista de todas las funciones con IA del producto (`RP-03`):

| Función | Feature | Modelo | Para qué | Alternativa más barata considerada | Costo estimado |
|---|---|---|---|---|---|
| `responderChat` | `chat` | Haiku 5.5 o GPT de gama baja | Entender la pregunta, pedir datos con tools y redactar | Plantillas o router con reglas (CIC-24) | USD 0.001 a 0.002 por pregunta |
| `buscar_externo` | `chat` | Ninguno: RSS y Tavily (D-25) | Fuentes externas cuando la app no tiene noticias | Responder solo «no hay noticias» (CIC-25) | USD 0 dentro de los 1 000 créditos gratis de Tavily por mes |
| `elegirImagen` | `imagenes` | El mismo modelo del chat | Proponer una imagen del banco leyendo descripciones | El administrador elige sin sugerencia (CIC-27) | Menos de USD 0.0002 por noticia |
| Recomendador | `recomendacion` | Ninguno | Ordenar el feed | No aplica | USD 0 |

## Done específico

- La suma del registro difiere menos de 5 % de la consola del proveedor (CIC-15).

## Tareas

Están en la base [Tickets](https://app.notion.com/p/49bcd1575a0543399a87a1db2f1c341f) de Notion, feature `costos-ia` (D-27). Cada ticket tiene responsable, estado, bloqueos y evidencia.

## Cambio en curso

Primer cambio: el módulo de costo en `src/lib/ia/` (CIC-15). Calcula el costo máximo de la llamada, lo compara
con el tope, llama al modelo y registra el uso. Si no puede leer el gasto acumulado, no llama.
