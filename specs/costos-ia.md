# Costos de IA

Registro de cada llamada a un modelo, tope de gasto y reserva para la demo.

**Requisitos:** `RP-01`, `RP-02`, `RP-03` · **Bitácora:** [bitacora.md](../docs/features/costos-ia/bitacora.md) ·
**Decisiones:** D-22, D-23, D-24 · **Investigación (Notion):** [CIC-14](https://app.notion.com/p/3f4f573ce6df81c0a2fdef4150ce5938),
[CIC-15](https://app.notion.com/p/3f4f573ce6df8133b74ac33fb3932d13), [CIC-16](https://app.notion.com/p/3f4f573ce6df813eaee5d41ff0675832) ·
**Responsable:** Rodrigo Mansilla (IA). Tabla del registro: Ricardo Chuy.

## Comportamiento actual

Todavía no hay llamadas a modelos. Gasto acumulado: USD 0.

### Presupuesto (D-22)

| Parte | Monto | Uso |
|---|---|---|
| Desarrollo y pruebas | USD 14 | Es el tope de la app hasta la demo |
| Reserva para la demo | USD 6 (30 %) | Chat en vivo, validación con compañeros e imágenes en vivo |

Estimación de la demo: 300 preguntas × USD 0.001 = USD 0.30 de chat (CIC-16). No se generan imágenes (D-23).

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
- Infra: las variables de servidor del modelo y del buscador, sin `NEXT_PUBLIC_`.

## Uso de IA en el producto

Lista de todas las funciones con IA del producto (`RP-03`):

| Función | Feature | Modelo | Para qué | Alternativa más barata considerada | Costo estimado |
|---|---|---|---|---|---|
| `responderChat` | `chat` | Haiku 5.5 o GPT de gama baja | Entender la pregunta, pedir datos con tools y redactar | Plantillas o router con reglas (CIC-24) | USD 0.001 a 0.002 por pregunta |
| `buscar_externo` | `chat` | Proveedor de búsqueda, pendiente | Fuentes externas cuando la app no tiene noticias | Responder solo «no hay noticias» (CIC-25) | Pendiente |
| `elegirImagen` | `imagenes` | El mismo modelo del chat | Proponer una imagen del banco leyendo descripciones | El administrador elige sin sugerencia (CIC-27) | Menos de USD 0.0002 por noticia |
| Recomendador | `recomendacion` | Ninguno | Ordenar el feed | No aplica | USD 0 |

## Done específico

- La suma del registro difiere menos de 5 % de la consola del proveedor (CIC-15).

## Tareas

| Estado | Tarea | Req. | Evidencia |
|---|---|---|---|
| ⏳ | Módulo de costo en `src/lib/ia/`: tabla de precios, cálculo y tope que falla cerrado | `RP-02` | |
| ⏳ | Pedir a Datos la tabla `ai_usage` | `RP-02` | |
| ⏳ | Elegir el modelo y el proveedor de producción con el conjunto fijo | `RP-01` | |
| ⏳ | Consulta de gasto, saldo y costo por función | `RP-02` | |
| ⏳ | Forzar el tope y comprobar que no se llama al modelo | `RP-02` | |

## Cambio en curso

Primer cambio: el módulo de costo en `src/lib/ia/` (CIC-15). Calcula el costo máximo de la llamada, lo compara
con el tope, llama al modelo y registra el uso. Si no puede leer el gasto acumulado, no llama.
