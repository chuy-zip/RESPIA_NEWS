# Chat

Pantalla inicial de la app. Responde preguntas sobre las noticias publicadas, con sus fuentes y su estado.

**Requisitos:** `RF-07`, `RF-12`, `RF-13`, `RF-14` · **Bitácora:** [bitacora.md](../docs/features/chat/bitacora.md) ·
**Decisiones:** D-22, D-24, D-25, D-26 · **Investigación (Notion):** [CIC-17](https://app.notion.com/p/3f4f573ce6df817fa334d985f22c9866),
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
- Búsqueda externa (D-25): el RSS de los sitios permitidos y Tavily. Leer RSS necesita un lector de XML, que es una
  dependencia nueva: se pide al equipo en su propio PR.

## Uso de IA en el producto

| Función | Modelo | Para qué | Alternativa más barata considerada | Costo estimado |
|---|---|---|---|---|
| `responderChat` | Haiku 5.5 o GPT de gama baja (D-22). Pruebas: modelos `:free` de OpenRouter | Entender la pregunta, pedir datos con tools y redactar la respuesta | Plantillas o router con reglas: no cumplen `RF-12` (c) ni las preguntas mixtas (CIC-24) | USD 0.001 a 0.002 por pregunta |
| `buscar_externo` | Ninguno: RSS de los sitios permitidos y, si no hay resultados, Tavily (D-25) | Fuentes externas cuando la app no tiene noticias | Responder solo «no hay noticias» (CIC-25) | USD 0: el RSS no cobra y Tavily queda dentro de sus 1 000 créditos gratis por mes |

## Done específico

- El conjunto fijo (CIC-17) pasa con el modelo de producción, no solo con el modelo `:free`.
- El costo de cada pregunta aparece en el registro (`RP-02`).
- `/privacidad` nombra al proveedor del modelo y a Tavily, porque reciben las preguntas (`RF-06`).

## Tareas

| Estado | Tarea | Req. | Evidencia |
|---|---|---|---|
| ⏳ | Escribir el conjunto fijo: cuatro tipos, preguntas mixtas, sin cobertura y casos adversariales | `RF-12` | |
| ⏳ | Prompt y salida estructurada, probados con modelos `:free` | `RF-12`, `RF-13` | |
| ⏳ | Tools `recomendaciones_del_usuario` y `buscar_noticias`, con SQL y sin modelo | `RF-12`, `RP-03` | |
| ✅ | Elegir el proveedor de búsqueda externa | `RF-14` | D-25, 2026-10-09. Plan gratis de Tavily revisado en su documentación: 1 000 créditos por mes. Peor caso estimado del mes de la demo: 460 créditos |
| ⏳ | Armar la lista de sitios permitidos (Centroamérica e internacional, D-26) con el feed RSS de cada sitio | `RF-14` | 2026-10-09, local: se probaron 36 feeds con curl y el user agent de la app. Quedaron 23 en `src/lib/ia/rss.ts` (rama `chat`). Falta probar desde Vercel: algunos sitios bloquean las IP de centros de datos |
| ⏳ | Lector RSS y búsqueda por palabras, sin modelo (incremento 1) | `RF-14`, `RP-03` | 2026-10-09, local con Node 24: 23 de 23 feeds con noticias y 7 preguntas de ejemplo. Una búsqueda sin caché tarda unos 2 s. `typecheck` y `lint` sin errores. Falta probar en Vercel cuando exista la ruta del chat. [Bitácora](../docs/features/chat/bitacora.md) |
| ⏳ | Tool `buscar_externo`: RSS primero y Tavily si el RSS no tiene resultados, solo con 0 resultados internos | `RF-14` | |
| ⏳ | Guardrails del servidor | `RF-14`, `RT-04` | |
| ⏳ | Validar con el modelo de producción | `RF-12` | |
| ⏳ | Actualizar `/privacidad` | `RF-06` | |

## Cambio en curso

Diseño acordado el 2026-10-09 (D-24). Todavía no hay código.

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
| `buscar_externo(consulta)` | Noticias de los sitios permitidos: primero de su RSS y, si no hay, de Tavily (D-25) | Solo si `buscar_noticias` devolvió 0 resultados. Lo controla el servidor |

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
   comprueba el dominio de cada resultado. Tavily solo corre si el RSS no tiene resultados. Si Tavily falla o se
   acaban sus créditos, el chat responde el texto fijo de «sin cobertura».
6. **Contenido como dato:** el texto de las noticias y de las páginas externas no da instrucciones al modelo.
7. **Límites:** largo máximo de la pregunta, últimos 4 turnos y tope de tokens de salida.

### Incremento 1: lector RSS (rama `chat`)

Requisitos: `RF-14`, `RP-03`. Decisiones: D-25, D-26.

- `src/lib/ia/rss.ts` guarda la lista de sitios permitidos y la función de búsqueda.
- La lista cubre los 7 países de Centroamérica, un medio regional y medios internacionales en español (D-26).
  Los medios de Belice publican en inglés. Un sitio entra en la lista solo si su feed respondió con el user agent
  de la app.
- La búsqueda compara las palabras de la pregunta con el título y el resumen de cada noticia. No llama a ningún
  modelo (`RP-03`). Devuelve como máximo 5 noticias.
- Solo se aceptan enlaces del dominio del sitio. El resumen se guarda sin HTML y con un largo máximo.
- Cada feed tiene 5 s para responder. Un feed que falla se ignora y no detiene la búsqueda.
- Next guarda cada feed 15 minutos, para no descargarlo en cada pregunta.
- Dependencia nueva: `fast-xml-parser`, para leer el XML de los feeds.
- Prueba: preguntas de ejemplo contra los feeds reales. Se anota cuántos feeds responden y qué devuelve cada pregunta.

### Pendiente

- Tavily como respaldo del RSS y la tool `buscar_externo` dentro del flujo del chat.
- El guardrail de alcance actúa antes de cualquier búsqueda externa. En la prueba del incremento 1, «receta de
  pastel de chocolate» encontró una receta en Infobae: sin ese filtro, el chat respondería temas ajenos a las noticias.
- Variable de servidor `TAVILY_API_KEY`, sin `NEXT_PUBLIC_`. Rodrigo carga el valor en `.env.local` y en Vercel.
  El nombre se agrega a `.env.example` junto con el código que la usa.
- Límite diario de preguntas por usuario: guarda el `user_id`, así que obliga a actualizar `/privacidad`.
