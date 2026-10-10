# Chat

Pantalla inicial de la app. Responde preguntas sobre las noticias publicadas, con sus fuentes y su estado.

**Requisitos:** `RF-07`, `RF-12`, `RF-13`, `RF-14` · **Bitácora:** [bitacora.md](../docs/features/chat/bitacora.md) ·
**Decisiones:** D-24, D-25, D-26, D-30 · **Investigación (Notion):** [CIC-17](https://app.notion.com/p/3f4f573ce6df817fa334d985f22c9866),
[CIC-18](https://app.notion.com/p/3f4f573ce6df811d87d3e2e8e6299177), [CIC-19](https://app.notion.com/p/3f4f573ce6df8114b7a8fcaa06b79af7),
[CIC-20](https://app.notion.com/p/3f4f573ce6df8184b77cf0d2fdd69dff), [CIC-22](https://app.notion.com/p/3f4f573ce6df8124b49ec9f981cb4615),
[CIC-24](https://app.notion.com/p/3f4f573ce6df816ebafef145e7ffe6d2), [CIC-25](https://app.notion.com/p/3f4f573ce6df81f1b613d529ddfd1d62),
[CIC-26](https://app.notion.com/p/3f4f573ce6df81e3bda9d48841dee84f) ·
**Responsable:** Rodrigo Mansilla (IA). Pantalla: Sergio Orellana. Ruta y servicios: Gerardo Pineda.

## Comportamiento actual

No existe el servicio de chat. La interfaz de demo vive en `/chat` y ofrece cuatro respuestas preparadas.
La raíz con sesión dirige a esa ruta. La edición completa está en `/edicion`.
La conversación vive en memoria y tiene desplazamiento propio. El diseño de servidor está en «Cambio en curso».

### Backend

Responsable: Gerardo Pineda. El código está en la rama `feat/back-chat`. Todavía no llega a `dev`: la pantalla no
lo usa. El modelo no está conectado: `POST /api/chat` responde `unavailable` hasta que exista `src/lib/ia/chat.ts`.

Los tipos están en `src/types/chat.ts`. La primera parte sigue la ficha 7 de [notion-frontend.md](../notion-frontend.md).
La segunda es el contrato con el módulo del modelo, tomado del «Incremento 2» de este spec:

| Tipo | Contenido |
|---|---|
| `ChatModelInput` | `question`, `history` (últimos 4 turnos), `region` (nombre de la región del lector o `null`) y `articles` |
| `ChatContextArticle` | `id`, `title`, `summary`, `status`, `contentType`, `publishedAt`, y los nombres de `topics` y `regions` |
| `ChatModelOutput` | `text`, `articleIds` (noticias usadas) y `covered` |
| `ChatModel` | La función que exporta `src/lib/ia/chat.ts`: recibe `ChatModelInput` y devuelve `ChatModelOutput` |

Para conectar el modelo, `getChatModel()` de `src/lib/services/chat.ts` devuelve esa función.

`supabase/migrations/005_article_search.sql` agrega `articles.search`: un índice de texto en español con el título
y la entradilla (CIC-18). El script se ejecutó en Supabase el 2026-10-10, antes de llegar a `main` (excepción a la
regla 10 de `AGENTS.md`). No lo edite.

#### `POST /api/chat`

Cualquier cuenta con sesión. El cuerpo es `{ "question", "messages"? }`:

| Campo | Regla |
|---|---|
| `question` | Obligatorio. 500 caracteres como máximo |
| `messages` | Opcional. Turnos `{ "role": "reader" \| "assistant", "text" }`, de 2 000 caracteres como máximo. El servidor usa los últimos 4 |

Flujo:

1. El servidor arma el contexto: las 10 primeras noticias del feed del lector, su bloque importante y hasta 5
   noticias que coinciden con la pregunta en `articles.search`. Ningún paso llama a un modelo (`RP-03`).
2. Sin noticias en el contexto, responde `no_coverage` sin llamar al modelo (`RF-14`, CIC-20).
3. Sin módulo del modelo, o si el modelo falla, responde `unavailable`.
4. Con respuesta del modelo, descarta los ids que no estaban en el contexto y toma el estado de cada noticia de la
   base (`RF-13`). Si no queda ninguna cita o `covered` es `false`, responde `no_coverage`.

| Status | `code` | Cuándo |
|---|---|---|
| 200 | | `data` es `{ "status", "segments" }`. `status` es `answered`, `no_coverage` o `unavailable` |
| 400 | `INVALID_BODY` | El cuerpo no es JSON |
| 401 | `UNAUTHORIZED` | No hay sesión |
| 422 | `VALIDATION_ERROR` | La pregunta está vacía o es larga, o el historial no es válido. `fields` dice cuál |
| 503 | `SERVICE_UNAVAILABLE` | La base no respondió |

No incluido todavía: fuentes externas (`buscar_externo`, D-25), el tope de gasto y el registro de costo
(`costos-ia`), los guardrails que dependen del modelo y la señal `chat` de `POST /api/interactions`.

#### Probar el chat

Requisitos: `npm run dev` y una sesión. En la consola del navegador:

```js
const ask = async (body) => {
  const r = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  console.log(JSON.stringify(body).slice(0, 60), r.status, await r.json());
};
await ask({ question: "¿Qué pasa en Guatemala?", messages: [] });
await ask({ question: "", messages: [] });
await ask({ question: "x".repeat(501) });
await ask({ question: "Hola", messages: [{ role: "bot", text: "hola" }] });
```

Resultado: `200` con `status: "unavailable"` y tres `422`.

#### Pruebas registradas

| Fecha | Dónde | Qué se hizo y qué se vio | Resultado |
|---|---|---|---|
| 2026-10-10 | Local, sin sesión | `POST /api/chat`: 401 `UNAUTHORIZED` | Pasó |
| 2026-10-10 | Local, sesión de administrador | Pregunta válida: 200 `unavailable`. La búsqueda en `articles.search` no falló: la `005` está aplicada. 422 con pregunta vacía, con 501 caracteres y con un rol de historial inválido | Pasó |

Pendiente: `no_coverage` sin noticias publicadas, `answered` con el modelo conectado, pruebas en la preview de Vercel
y conexión de la pantalla.

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
| `responderChat` | Claude Haiku 5.5 por la API de Anthropic, en desarrollo y producción (D-30) | Entender la pregunta, pedir datos con tools y redactar la respuesta | Plantillas o router con reglas: no cumplen `RF-12` (c) ni las preguntas mixtas (CIC-24) | USD 0.001 a 0.002 por pregunta |
| `buscar_externo` | Ninguno: RSS de los sitios permitidos y, si no hay resultados, Tavily (D-25) | Fuentes externas cuando la app no tiene noticias | Responder solo «no hay noticias» (CIC-25) | USD 0: el RSS no cobra y Tavily queda dentro de sus 1 000 créditos gratis por mes |

## Done específico

- El conjunto fijo (CIC-17) pasa con el modelo de producción, no solo con el modelo `:free`.
- El costo de cada pregunta aparece en el registro (`RP-02`).
- `/privacidad` nombra al proveedor del modelo y a Tavily, porque reciben las preguntas (`RF-06`).

## Tareas

Están en el ticket [TKT-1](https://app.notion.com/p/3f5f573ce6df81949870d08ecf84997e) de la base [Tickets](https://app.notion.com/p/e7bcbe3443c343b2873a2b5b97eb474c) de Notion (D-28). El ticket guarda la lista de tareas con su evidencia y de qué áreas depende.

El alcance de la interfaz de demostración se describe en «Cambio en curso». Sus tickets de frontend están pendientes de asignación.

## Cambio en curso

### Interfaz de demostración independiente

2026-10-09: Sergio solicitó una demo editorial con feed y conversación en memoria.
El registro propio de frontend está en [notion-frontend.md](../notion-frontend.md).
No adopta los ciclos de IA como hipótesis propias ni modifica el diseño de servidor descrito abajo.
Los cuatro botones de ejemplo muestran respuestas preparadas con referencias al corpus ficticio.
Una consulta libre explica que el servicio no está conectado. No se simula una respuesta de modelo.
La demo solo usa noticias internas, según la petición del usuario. La búsqueda externa de D-24 queda pendiente de integración.
Se preparan estados de carga, error, desconexión y límite de costo.
El 2026-10-09 el usuario autorizó verificaciones locales y aprobó separar chat y edición.
La ruta `/chat` es la entrada autenticada en el código. La conversación tiene desplazamiento propio y el compositor permanece en el flujo.
El ajuste al teclado usa el viewport visual. Su funcionamiento en teléfonos reales sigue pendiente.
La edición completa queda en `/edicion`. Se conservan las citas, el estado temporal y las cuatro consultas preparadas.
No se cambia el servicio de IA ni sus límites. No se hacen commits ni operaciones de escritura en Git.
Contrato propuesto: POST `/api/chat`, JSON con respuesta y citas validadas por el servidor.
La forma definitiva y los límites del contexto se acuerdan con Backend antes de retirar la demo.
Las verificaciones técnicas y anónimas están en [el registro local](../notion-frontend.md#registro-honesto).
El usuario pidió no ejecutar las pruebas con sesión. No se acredita todavía el recorrido de preguntas, citas ni reapertura.

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

### Incremento 2: modelo y salida estructurada (rama `chat`, en pausa)

Requisitos: `RF-12`, `RF-13`, `RF-14`. Decisiones: D-24, D-30. Ticket: TKT-1.

En pausa hasta comprar créditos de Anthropic (D-30). Diseño:

- `src/lib/ia/chat.ts` recibe la pregunta, los últimos 4 turnos, la región del lector y las noticias del contexto.
  Devuelve el texto, los IDs de las noticias usadas y si hubo cobertura.
- El modelo es Claude Haiku 5.5 por la API de Anthropic, con el SDK oficial y salida estructurada
  (`output_config.format`). La llave es `ANTHROPIC_API_KEY`.
- El servidor descarta los IDs que no estaban en el contexto. Si no hay noticias en el contexto, responde
  «sin cobertura» sin llamar al modelo (CIC-20).
- Los estados usan los mismos valores que la pantalla de Sergio: `confirmed`, `developing` y `unconfirmed`.
- `scripts/eval-chat.mjs` tendrá el conjunto fijo: 12 noticias ficticias y 21 preguntas (CIC-17).

### Pendiente

- Tavily como respaldo del RSS y la tool `buscar_externo` dentro del flujo del chat.
- El guardrail de alcance actúa antes de cualquier búsqueda externa. En la prueba del incremento 1, «receta de
  pastel de chocolate» encontró una receta en Infobae: sin ese filtro, el chat respondería temas ajenos a las noticias.
- Variable de servidor `TAVILY_API_KEY`, sin `NEXT_PUBLIC_`. Rodrigo carga el valor en `.env.local` y en Vercel.
  El nombre se agrega a `.env.example` junto con el código que la usa.
- Límite diario de preguntas por usuario: guarda el `user_id`, así que obliga a actualizar `/privacidad`.
