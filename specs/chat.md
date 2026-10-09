# Chat

Pantalla inicial de la app. Responde preguntas sobre las noticias publicadas, con sus fuentes y su estado.

**Requisitos:** `RF-07`, `RF-12`, `RF-13`, `RF-14` · **Bitácora:** [bitacora.md](../docs/features/chat/bitacora.md) ·
**Decisiones:** D-22, D-24 · **Investigación (Notion):** [CIC-17](https://app.notion.com/p/3f4f573ce6df817fa334d985f22c9866),
[CIC-18](https://app.notion.com/p/3f4f573ce6df811d87d3e2e8e6299177), [CIC-19](https://app.notion.com/p/3f4f573ce6df8114b7a8fcaa06b79af7),
[CIC-20](https://app.notion.com/p/3f4f573ce6df8184b77cf0d2fdd69dff), [CIC-22](https://app.notion.com/p/3f4f573ce6df8124b49ec9f981cb4615),
[CIC-24](https://app.notion.com/p/3f4f573ce6df816ebafef145e7ffe6d2), [CIC-25](https://app.notion.com/p/3f4f573ce6df81f1b613d529ddfd1d62),
[CIC-26](https://app.notion.com/p/3f4f573ce6df81e3bda9d48841dee84f) ·
**Responsable:** Rodrigo Mansilla (IA). Pantalla: Sergio Orellana. Ruta y servicios: Gerardo Pineda.

## Comportamiento actual

Todavía no existe. El diseño está en «Cambio en curso».

## Criterios de aceptación

- **`RF-07`**: abrir la app con sesión lleva al chat. Escribir, cerrar y reabrir: el chat empieza vacío.
- **`RF-12`**: el conjunto fijo de preguntas (CIC-17) responde bien los cuatro tipos y 3 preguntas mixtas.
- **`RF-13`**: cada noticia citada enlaza a su lector y muestra el estado que tiene en la base.
- **`RF-14`**: un tema sin cobertura en la app recibe «no hay noticias publicadas» y, si existen, fuentes
  externas de la lista permitida con su etiqueta. Un tema sin cobertura en ningún sitio no recibe texto inventado.
- **Guardrails**: los 6 casos adversariales de CIC-26 reciben la respuesta esperada.

## No incluido

- Historial entre sesiones (`RF-07`).
- Respuestas sobre temas ajenos a las noticias, código o tareas.
- Cambiar el estado de una noticia o publicarla: lo hace solo una persona (`RT-04`).
- Contexto que sale de la memoria del modelo, sin enlace.

## Dependencias

- `recomendacion`: las primeras recomendaciones del usuario.
- Backend: la ruta `POST /api/chat` y los servicios que ejecutan las tools.
- Datos: la tabla de noticias con regiones, temas y estado (`RF-16`), el índice de texto completo (CIC-18) y la tabla `ai_usage`.
- Frontend: la pantalla, el historial en memoria y las etiquetas.
- `costos-ia`: el registro y el tope de cada llamada.
- Un proveedor de búsqueda externa con filtro por dominio. Pendiente.

## Uso de IA en el producto

| Función | Modelo | Para qué | Alternativa más barata considerada | Costo estimado |
|---|---|---|---|---|
| `responderChat` | Haiku 5.5 o GPT de gama baja (D-22). Pruebas: modelos `:free` de OpenRouter | Entender la pregunta, pedir datos con tools y redactar la respuesta | Plantillas o router con reglas: no cumplen `RF-12` (c) ni las preguntas mixtas (CIC-24) | USD 0.001 a 0.002 por pregunta |
| `buscar_externo` | Proveedor de búsqueda, pendiente | Fuentes externas cuando la app no tiene noticias | Responder solo «no hay noticias» (CIC-25) | Se mide con el proveedor elegido |

## Done específico

- El conjunto fijo (CIC-17) pasa con el modelo de producción, no solo con el modelo `:free`.
- El costo de cada pregunta aparece en el registro (`RP-02`).
- `/privacidad` nombra al proveedor del modelo y al buscador, porque reciben las preguntas (`RF-06`).

## Tareas

| Estado | Tarea | Req. | Evidencia |
|---|---|---|---|
| ⏳ | Escribir el conjunto fijo: cuatro tipos, preguntas mixtas, sin cobertura y casos adversariales | `RF-12` | |
| ⏳ | Prompt y salida estructurada, probados con modelos `:free` | `RF-12`, `RF-13` | |
| ⏳ | Tools `recomendaciones_del_usuario` y `buscar_noticias`, con SQL y sin modelo | `RF-12`, `RP-03` | |
| ⏳ | Elegir el proveedor de búsqueda externa y la lista de sitios por tema | `RF-14` | |
| ⏳ | Tool `buscar_externo`, que corre solo con 0 resultados internos | `RF-14` | |
| ⏳ | Guardrails del servidor | `RF-14`, `RT-04` | |
| ⏳ | Validar con el modelo de producción | `RF-12` | |
| ⏳ | Actualizar `/privacidad` | `RF-06` | |
| En curso | Interfaz de demo: consultas preparadas, citas, memoria y estados visibles | `RF-07`, `RF-12`, `RF-13` | Código escrito. Pruebas pendientes del usuario. Investigación propia en [notion-frontend.md](../notion-frontend.md) |
| Pendiente | Conectar la pantalla al contrato aprobado y retirar respuestas de ejemplo | `RF-12`, `RF-13`, `RF-14` | Backend e IA pendientes |

## Cambio en curso

### Interfaz de demostración independiente

2026-10-09: Sergio solicitó una demo editorial con feed y conversación en memoria.
El registro propio de frontend está en [notion-frontend.md](../notion-frontend.md).
No adopta los ciclos de IA como hipótesis propias ni modifica el diseño de servidor descrito abajo.
Los cuatro botones de ejemplo muestran respuestas preparadas con referencias al corpus ficticio.
Una consulta libre explica que el servicio no está conectado. No se simula una respuesta de modelo.
La demo solo usa noticias internas, según la petición del usuario. La búsqueda externa de D-24 queda pendiente de integración.
Se preparan estados de carga, error, desconexión y límite de costo. No se ejecuta ninguna prueba por instrucción del usuario.
Contrato propuesto: POST `/api/chat`, JSON con respuesta y citas validadas por el servidor.
La forma definitiva y los límites del contexto se acuerdan con Backend antes de retirar la demo.

### Diseño de servidor

Diseño acordado el 2026-10-09 (D-24). Todavía no hay código de servidor.

### Flujo de una pregunta

1. La app envía la pregunta y los últimos 4 turnos. La conversación vive solo en la memoria de la pantalla (CIC-22).
2. El servidor verifica la sesión y el tope de gasto (`costos-ia`).
3. El servidor pone en el contexto las 10 primeras recomendaciones del usuario.
4. El modelo responde con esas noticias o pide datos con una tool. Hace como máximo 2 rondas.
5. El servidor valida la salida, arma el formato y registra el costo.

### Tools

| Tool | Qué devuelve | Cuándo se usa |
|---|---|---|
| `recomendaciones_del_usuario()` | Las primeras noticias del feed del usuario | Ya va en el contexto. Tipo (b) |
| `buscar_noticias(texto, tema, region, desde)` | Noticias publicadas que coinciden, por SQL (CIC-18) | Tipos (a), (c) y (d) |
| `buscar_externo(consulta, tema)` | Resultados de los sitios permitidos para el tema | Solo si `buscar_noticias` devolvió 0 resultados. Lo controla el servidor |

### Formato de la respuesta

El modelo devuelve JSON con los textos, los IDs de las noticias y las URLs externas que usó. El servidor
pone los estados y las etiquetas desde los datos:

```text
Según tus recomendaciones, estas son las más cercanas:
- <texto> · <título de la noticia> (enlace al lector) · Confirmado

Fuentes externas mencionan (no verificadas por la redacción):
- <texto> · <sitio> (enlace)
```

### Reglas de fuente

- Cada frase tiene una fuente: una noticia de la app o un enlace externo.
- El contexto general de una explicación sale solo de fuentes externas citadas. Lo que el modelo sabe de
  memoria, sin enlace, no se dice.
- El estado de una noticia sale de la base. Una fuente externa lleva «Fuente externa, no verificada por la redacción».

### Guardrails (CIC-26)

1. **Alcance:** para lo que no es de noticias, la respuesta fija es «Solo puedo responder sobre noticias».
2. **Formato:** si el modelo no devuelve el JSON esperado, el servidor manda la respuesta fija.
3. **Sin código:** si el texto trae bloques de código, el servidor los reemplaza por la respuesta fija.
4. **Solo fuentes reales:** el servidor descarta los IDs y las URLs que no vinieron de las tools.
5. **Búsqueda externa controlada:** solo con 0 resultados internos, solo en dominios permitidos, y el servidor
   comprueba el dominio de cada resultado.
6. **Contenido como dato:** el texto de las noticias y de las páginas externas no da instrucciones al modelo.
7. **Límites:** largo máximo de la pregunta, últimos 4 turnos y tope de tokens de salida.

### Pendiente

- Proveedor de búsqueda externa: filtro por dominio, costo por búsqueda y condiciones de uso. Necesita una
  variable de servidor nueva y una fila en `DECISIONES.md`.
- Lista de sitios permitidos por tema: decisión editorial del equipo.
- Límite diario de preguntas por usuario: guarda el `user_id`, así que obliga a actualizar `/privacidad`.
