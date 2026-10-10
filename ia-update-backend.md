# Conectar la parte de IA con el backend

Este documento explica qué ofrece el backend a la parte de IA y qué falta del lado de IA para que el chat, el feed,
las imágenes y el registro de gasto funcionen. Cubre el modelo del chat, el recomendador, las imágenes y el gasto de IA.

## Resumen: lo que falta del lado de IA

| # | Qué hacer | Sección |
|---|---|---|
| 1 | **Crear `src/lib/ia/chat.ts`** con una función del tipo `ChatModel`: recibe la pregunta, el historial, la región y las noticias, y devuelve el texto, los ids usados y si hubo cobertura | 2.1 a 2.3 |
| 2 | Dentro de esa función: prompt, salida estructurada, guardrails del modelo, tope de gasto y registro de costo. No repetir lo que el backend ya valida | 2.4 y 2.5 |
| 3 | **Conectar la función** cambiando `getChatModel()` en `src/lib/services/chat.ts` | 2.6 |
| 4 | Acordar con el backend: cuándo corre la búsqueda externa, cómo se devuelven las citas externas, la señal `chat` y el error del tope de gasto | 2.7 |
| 5 | **Decidir si el peso de los temas es el esperado:** con una sola apertura, Economía pesó más que Tecnología, el tema elegido. `topicWeights` normaliza al máximo, así que una apertura vale 1 y un tema elegido 0.5 | 3 |
| 6 | Definir la función de noticias relacionadas (incremento 2) para agregarlas al lector | 3 |
| 7 | Para el gasto de IA: definir las columnas de `ai_usage`, escribir el módulo de costo y una función que devuelva el resumen | 4 |
| 8 | **Imágenes (obligatorias):** definir el banco de imágenes y la función que propone una imagen leyendo las descripciones (D-23) | 5 |
| 9 | Revisar el texto de `/privacidad`. Cuando el chat use el modelo, nombrar al proveedor | 6 |

El detalle de cada endpoint está en la sección «Backend» de cada spec:

| Endpoint | Spec | Estado |
|---|---|---|
| `POST /api/chat` | [chat](specs/chat.md) | Hecho. Responde `unavailable` hasta que exista el módulo del modelo |
| `GET /api/feed` | [feed-y-lector](specs/feed-y-lector.md) | Hecho. Usa `buildFeed` y `topicWeights` de `src/lib/recomendacion/feed.ts` |
| `POST /api/interactions` | [ubicacion-y-perfil](specs/ubicacion-y-perfil.md) | Hecho. Solo acepta `open` |
| `GET /api/admin/ai-usage` | Ficha 11 de [notion-frontend.md](notion-frontend.md) | No existe. Depende del registro de gasto (sección 4) |
| `POST /api/admin/images/preview` | Ficha 10 de [notion-frontend.md](notion-frontend.md) | No existe. Depende del banco y de la función de IA (sección 5) |

## 1. Reglas comunes

- Solo el servidor llama al modelo. La pantalla nunca lo llama ni recibe la llave.
- La llave es `ANTHROPIC_API_KEY` (D-30). Es una variable de servidor: nunca con `NEXT_PUBLIC_`. Agregue el nombre,
  sin valor, a `.env.example` en el mismo cambio que el código que la usa.
- El código de IA vive en `src/lib/ia/` (modelo, prompts y costo) y en `src/lib/recomendacion/` (orden del feed).
  El backend lo llama desde `src/lib/services/`. Las rutas HTTP son del backend.
- Ordenar, filtrar y buscar noticias no llama a ningún modelo (`RP-03`). El backend ya cumple esa regla.

## 2. Modelo del chat

### 2.1 Lo que tiene que existir

Un archivo `src/lib/ia/chat.ts` que exporta una función con el tipo `ChatModel` de `src/types/chat.ts`:

```ts
import type { ChatModel } from "@/types/chat";

export const responderChat: ChatModel = async (input) => {
  // prompt, llamada a Claude Haiku 5.5, tope de gasto y registro de costo
  return { text, articleIds, covered };
};
```

El tipo sale del «Incremento 2» de [specs/chat.md](specs/chat.md). Si necesita otra forma, avise antes de escribir
el módulo: el backend y la pantalla dependen de ella.

### 2.2 Qué recibe la función (`ChatModelInput`)

| Campo | Contenido |
|---|---|
| `question` | La pregunta, sin espacios al inicio ni al final. 500 caracteres como máximo |
| `history` | Los últimos 4 turnos como máximo: `{ role: "reader" \| "assistant", text }` |
| `region` | El **nombre** de la región del lector, por ejemplo `"Guatemala"`, o `null` si no eligió una |
| `articles` | Las noticias que el modelo puede citar (`ChatContextArticle[]`) |

Cada noticia de `articles` trae `id`, `title`, `summary`, `status`, `contentType`, `publishedAt`, y los **nombres**
de sus `topics` y `regions`. No trae el contenido completo (`body`): solo la entradilla. Si el modelo lo necesita
para explicar una noticia, pida que se agregue.

El orden de `articles` es este:

1. Las 10 primeras noticias del feed del lector, en su orden.
2. Las noticias de su bloque importante.
3. Hasta 5 noticias que coinciden con la pregunta en la búsqueda de texto (`articles.search`, migración `005`).

Una noticia no se repite. Todas están publicadas.

### 2.3 Qué devuelve la función (`ChatModelOutput`)

| Campo | Contenido |
|---|---|
| `text` | La respuesta |
| `articleIds` | Los ids de las noticias usadas. Solo ids de `articles` |
| `covered` | `false` si las noticias no responden la pregunta |

### 2.4 Lo que el backend ya hace

No lo repita dentro de la función:

- Valida la pregunta y el historial. Recorta el historial a 4 turnos.
- Si `articles` está vacío, responde `no_coverage` **sin llamar** a la función.
- Si la función lanza un error, responde `unavailable`. El detalle queda en los logs del servidor.
- Descarta los `articleIds` que no estaban en `articles`.
- Pone el título, el estado y el tipo de cada cita desde la base, no desde el modelo (`RF-13`).
- Si `covered` es `false`, si no queda ninguna cita o si `text` está vacío, responde `no_coverage`.

### 2.5 Lo que hace la función

- El prompt y la salida estructurada.
- Los guardrails que dependen del modelo (CIC-26): alcance («Solo puedo responder sobre noticias»), formato,
  bloques de código y contenido como dato. El texto de una noticia no da instrucciones al modelo.
- El tope de gasto **antes** de llamar al modelo, y el registro de costo después (sección 4). Si el tope se alcanzó,
  lance un error: hoy el backend responde `unavailable`. Para responder `429 AI_LIMIT_REACHED`, como pide la
  ficha 7, acordemos una clase de error que el backend reconozca.

### 2.6 Conectar la función

Cuando `src/lib/ia/chat.ts` exista, cambie `getChatModel()` en `src/lib/services/chat.ts` para que devuelva
`responderChat`. Es un archivo de backend: incluya el cambio en su PR y pida la revisión del dueño, o pídale el
cambio. Después, una pregunta válida debe responder `status: "answered"`.

### 2.7 Pendiente de acuerdo

| Tema | Qué falta |
|---|---|
| Fuentes externas (`buscar_externo`, D-25) | `src/lib/ia/rss.ts` está en la rama `chat` y no está conectado. D-24 dice que solo corre sin resultados internos, pero el contexto siempre trae las recomendaciones. Hay que decidir qué cuenta como «sin resultados internos»: por ejemplo, que la búsqueda de texto devuelva 0. El backend puede pasar ese dato en `ChatModelInput` |
| Citas externas | `ExternalCitation` ya existe en `src/types/chat.ts`. `ChatModelOutput` no tiene un campo para URLs externas todavía |
| Señal `chat` (D-31) | `POST /api/interactions` solo acepta `open`. Para registrar «preguntó desde una noticia», `POST /api/chat` necesita recibir el id de esa noticia |
| Error de tope de gasto | La clase de error para responder 429 |

## 3. Recomendador

El backend ya usa `src/lib/recomendacion/feed.ts` en `GET /api/feed` (`src/lib/services/feed.ts`). Esto es lo que
le pasa:

| Entrada | De dónde sale |
|---|---|
| Noticias | Las 200 publicadas más recientes, con `topicIds`, `regionIds`, `publishedAt` e `important` |
| `profile.regionId` | La región guardada en `profiles` |
| `profile.topicWeights` | `topicWeights(signals, chosenTopicIds, now)`, con las señales de `interactions` (hoy solo `open`) y los temas de `reader_topics` |
| `centralAmericaRegionIds` | Todas las regiones del catálogo menos la de slug `internacional` |
| `topicId` | El tema del filtro `?topic=`, si viene |

De la salida usa `items` e `importantItems`, y de cada elemento `prominence`, `reason` y `components`. Pagina
`items` por posición. `importantItems` va completo en todas las páginas.

**Observación de la prueba del 2026-10-10:** con una sola apertura, Economía pesó más que Tecnología, el tema
elegido. `topicWeights` normaliza al máximo: una apertura vale 1 y un tema elegido 0.5. Decida si es lo esperado.

**Noticias relacionadas (incremento 2, D-31):** cuando exista la función, el backend agregará `relatedArticles` a
`GET /api/articles/[id]`. Avise qué recibe y qué devuelve.

## 4. Gasto de IA

La ficha 11 pide `GET /api/admin/ai-usage`: gasto, saldo, reserva, tope, costo por función y disponibilidad. Para
construirlo falta:

1. **La tabla `ai_usage`** (función, modelo, entorno, tokens y costo, según `specs/costos-ia.md`). Es una migración
   nueva. Defina las columnas y se escribe el script.
2. **El módulo de costo** en `src/lib/ia/`: registra cada llamada y aplica el tope (CIC-15).
3. **Una función que devuelva el resumen**, por ejemplo `getAiUsageSummary()`, con los campos de `AiUsageSummary`.
   Un dato que no se puede leer va como `null`, nunca como 0.

Con eso, el backend escribe la ruta: solo administradores, 401, 403 y 503.

## 5. Imágenes

Las imágenes son obligatorias. El enunciado pide que el portal ofrezca una imagen para una noticia que no tiene, y la
parte 3 de la presentación muestra ese caso en vivo (`RF-17`, `RF-18`, `RT-05`). D-23 sigue vigente: imágenes de un
banco con licencia libre, sin generación. El modelo propone una leyendo las descripciones y una persona confirma.

Estado actual del backend:

- El bucket `article-images` existe (`supabase/migrations/002_storage_article_images.sql`).
- El administrador ya puede subir su propia foto (`POST /api/admin/images`) y publicarla con su procedencia. Los
  orígenes son `event_photo` (foto del hecho) e `illustrative`. Se guardan en `articles.image`.
- `POST /api/admin/images/preview`, la recomendación para una noticia sin foto, no existe. Usará el origen `stock`.
  Al publicar, el backend copiará la imagen elegida al bucket para que no quede rota si el banco la borra.

Del lado de IA falta:

1. **Elegir el banco de imágenes** y revisar sus condiciones: licencia, atribución, si permite **copiar** la imagen
   al bucket (el plan es copiarla) y si necesita una llave. Una llave va en una variable de servidor.
2. **Escribir `elegirImagen`** en `src/lib/ia/`: recibe la noticia y las candidatas con su descripción, y propone una
   o ninguna. Registra su costo como el chat.

Con eso, el backend construye `POST /api/admin/images/preview` y acepta la imagen al publicar. La forma de esa
función se acuerda antes de escribirla.

## 6. Privacidad

`/privacidad` todavía no dice que se guardan la región, los temas elegidos y las noticias que abre cada lector. El
texto de «Cómo se ordena tu feed» está en [specs/recomendacion.md](specs/recomendacion.md). Cuando el chat use el
modelo, `/privacidad` también debe nombrar al proveedor del modelo, porque recibe las preguntas (`RF-06`).

## 7. Probar

Requisitos: `npm run dev` y una sesión. En la consola del navegador:

```js
const ask = async (question) => {
  const r = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, messages: [] }),
  });
  console.log(question, r.status, await r.json());
};
await ask("¿Qué pasa en Guatemala?");
```

| Momento | Resultado esperado |
|---|---|
| Hoy, sin módulo | `200` con `status: "unavailable"` |
| Con el módulo conectado | `200` con `status: "answered"` y citas con su estado |
| Pregunta sin noticias que la respondan | `200` con `status: "no_coverage"` |

Las pruebas del feed están en «Probar el feed» de [specs/feed-y-lector.md](specs/feed-y-lector.md).
