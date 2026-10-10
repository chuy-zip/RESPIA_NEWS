# Conectar el frontend con el backend

Este documento explica qué cambiar en el frontend para usar los endpoints reales en lugar de la demo. Empieza
por el portal administrativo (`/admin`) y después cubre el lector, el perfil y el feed.

El detalle de cada endpoint (campos, reglas y códigos) está en la sección «Backend» de cada spec:

| Endpoint | Spec | Disponible en |
|---|---|---|
| `GET /api/catalogs` | [portal-admin](specs/portal-admin.md) | `dev` |
| `POST /api/admin/articles` | [portal-admin](specs/portal-admin.md) | `dev` |
| `GET /api/admin/articles` | [portal-admin](specs/portal-admin.md) | `dev` |
| `GET /api/articles/[id]` | [portal-admin](specs/portal-admin.md) | `dev` |
| `POST /api/admin/images` | [portal-admin](specs/portal-admin.md) | `feat/back-chat`. Llega a `dev` con su PR |
| `GET` y `PATCH /api/profile` | [ubicacion-y-perfil](specs/ubicacion-y-perfil.md) | `feat/back-chat`. Llega a `dev` con su PR |
| `POST /api/interactions` | [ubicacion-y-perfil](specs/ubicacion-y-perfil.md) | `feat/back-chat`. Llega a `dev` con su PR |
| `GET /api/feed` | [feed-y-lector](specs/feed-y-lector.md) | `feat/back-chat`. Llega a `dev` con su PR |
| `POST /api/chat` | [chat](specs/chat.md) | `feat/back-chat`. Responde `unavailable` hasta que se conecte el modelo |

Los tipos están en `src/types/news.ts`, `src/types/profile.ts` y `src/types/feed.ts`. Importe esos tipos. No copie
las formas a mano.

## 1. Reglas comunes

- **Sesión:** use `fetch("/api/...")` desde el navegador. La cookie de sesión viaja sola porque la API está en el
  mismo origen. No envíe un id de usuario ni un rol: el servidor los saca de la sesión.
- **Éxito:** `{ "data": …, "meta": … }`.
- **Error:** `{ "error": { "code", "message", "fields"? } }`. El `message` está en español y se puede mostrar tal
  cual. `fields` solo aparece con `VALIDATION_ERROR` y tiene un mensaje por campo.
- **Códigos:**

  | Status | Qué hacer en la pantalla |
  |---|---|
  | 400 | Error del cliente. Muestre el mensaje. No reintente |
  | 401 | La sesión venció. Muestre el mensaje y el botón de iniciar sesión. Conserve el texto escrito |
  | 403 | La cuenta no tiene permiso. Muestre el mensaje |
  | 404 | No existe. Muestre el estado «no encontrado» |
  | 422 | Marque cada campo de `error.fields` |
  | 503 | El servicio falló. Muestre el mensaje y un botón para reintentar. Conserve el texto escrito |

- **Caché:** todas las respuestas traen `cache-control: private, no-store`. No las guarde en el service worker ni en
  `localStorage`.
- **Reintentos:** no reintente solo una operación que escribe, como publicar. Deshabilite el botón mientras la
  petición está en curso: el servidor no detecta una publicación repetida.
- **Valores en inglés:** los estados (`confirmed`, `developing`, `unconfirmed`) y los tipos de contenido
  (`original`, `summary`, `ai_contribution`) viajan en inglés. La pantalla los traduce.

## 2. Portal administrativo

Archivo principal: `src/components/admin/EditorialDesk/EditorialDesk.tsx`. Hoy publica en memoria con
`useDemoSession().publish`. Los pasos siguientes lo cambian por el servidor.

### Resumen: lo que cambia en el formulario

| # | Cambio | Por qué |
|---|---|---|
| 1 | **Agregar una casilla «Noticia importante»** (`important`, sí o no) | El servidor la exige. Una noticia importante aparece en el feed de todos los lectores, aunque no sea de su país ni de sus temas |
| 2 | Tomar los temas y las regiones de `GET /api/catalogs` | La lista real no es la de la demo. El servidor rechaza un tema o una región que no existe |
| 3 | Enviar los **ids** de tema y región, no los nombres | El servidor guarda ids |
| 4 | Enviar el tipo de contenido como `original`, `summary` o `ai_contribution` | Son los valores que acepta el servidor. La pantalla sigue mostrando «Original», «Resumen» y «Aporte de IA» |
| 5 | **Agregar la subida de fotos.** Un campo nuevo para subir la imagen, con su texto alternativo, autor, licencia y origen. Reemplaza las ilustraciones de la demo | Hoy el portal no puede subir archivos. El servidor guarda la foto y su procedencia, y no publica una imagen sin origen declarado |
| 6 | Enviar la fecha con hora | Sin hora, la fecha puede aparecer un día antes |
| 7 | Exigir dos fuentes para «Confirmado» | El servidor rechaza «Confirmado» con una sola fuente |
| 8 | Mostrar los errores que devuelve el servidor junto a cada campo | El servidor valida todo otra vez y dice qué campo falló |

Los apartados 2.1 a 2.8 explican cada cambio.

El frontend no calcula el orden del feed ni decide qué es importante. Solo envía lo que el editor marcó. Las dudas
sobre cómo se usa `important` en el orden del feed son de la parte de IA (`specs/recomendacion.md`).

### 2.1 Cargar el catálogo

1. Al montar el componente, pida `GET /api/catalogs`.
2. Reemplace las constantes `TOPICS` y `REGIONS` de la demo por `data.topics` y `data.regions`.
3. Guarde el **id** de cada opción. Muestre el `label`.
   - El `<select>` de tema usa `value={topic.id}`.
   - Cada casilla de región usa el `id` de la región.
4. Mientras carga, deshabilite el formulario. Si falla (503), muestre el mensaje y un botón para reintentar. No
   muestre opciones inventadas: un catálogo vacío dejaría publicar sin clasificar.

El catálogo real tiene 8 regiones (los 7 países de Centroamérica e «Internacional») y 3 temas (Tecnología, Economía
y Finanzas). La demo usaba Guatemala, México y Estados Unidos.

### 2.2 Ajustar el borrador

| Campo del borrador hoy | Cambio |
|---|---|
| `topic: Topic` | `topicId: string`. El primer tema del catálogo como valor inicial |
| `regions: Region[]` | `regionIds: string[]`. Lista vacía como valor inicial |
| `contentType` | Use `"original" \| "summary" \| "ai_contribution"`. Muestre «Original», «Resumen» y «Aporte de IA» |
| (no existe) | **Agregue `important: boolean`**, con una casilla «Noticia importante» en el paso 1. Valor inicial `false` |
| `issue` | Se queda solo en la pantalla. No se envía al servidor |
| `visual` | Reemplácelo por `image`: el `uploadId` de la foto subida (2.5.1) más `alt`, `author`, `license` y `origin` (`"event_photo"` o `"illustrative"`). La imagen es opcional |

### 2.3 Armar el cuerpo de la petición

En `submit`, cuando `step === 2`, arme un `PublishArticleInput` (de `@/types/news`):

| Campo | Valor |
|---|---|
| `title` | `draft.title.trim()` |
| `summary` | `draft.summary.trim()` |
| `body` | Los párrafos, igual que hoy: `{ type: "paragraph", text }` por línea no vacía |
| `sources` | `draft.sources` con `name` y `url` recortados |
| `publishedAt` | `new Date(draft.date + "T12:00:00").toISOString()`. Las 12:00 evitan que la fecha cambie de día por la zona horaria |
| `topicIds` | `[draft.topicId]` |
| `regionIds` | `draft.regionIds` |
| `status` | `draft.status` |
| `contentType` | `draft.contentType` |
| `reviewNote` | `draft.reviewNote.trim()` |
| `important` | `draft.important` |
| `image` | `null` sin foto. Con foto: `{ uploadId, alt, author, license, origin }`. No envíe la URL: el servidor la arma |
| `reviewConfirmed` | `true`. Solo se envía si la casilla de confirmación está marcada |

### 2.4 Validar antes de enviar

Mantenga la validación actual y agregue esta regla en el paso 1:

- Si `status === "confirmed"` y hay menos de dos fuentes, muestre «Para marcarla como confirmada se necesitan al
  menos dos fuentes.» El servidor rechaza ese caso con 422 (`RT-03`).

La validación de la pantalla mejora la experiencia. El servidor valida todo otra vez.

### 2.5 Publicar

1. Cambie `submit` a una función `async`.
2. Guarde un estado `pending`. Deshabilite «Publicar» mientras es `true`.
3. Envíe la petición:

   ```ts
   const response = await fetch("/api/admin/articles", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify(input),
   });
   const json = await response.json();
   ```

4. Trate la respuesta:

   | Status | Qué hacer |
   |---|---|
   | 201 | Guarde `json.data.id` en `publishedId`. Recargue el listado (2.7) |
   | 422 | Pase `json.error.fields` a `setErrors` con la tabla de 2.6. Vuelva al paso del primer campo con error |
   | 401, 403, 503 | Muestre `json.error.message` en el resumen de errores. Conserve el borrador |

5. Quite la llamada a `publish(article)` de `useDemoSession`.

### 2.5.1 Agregar la subida de fotos

Hoy el portal no tiene un campo para subir archivos: solo deja elegir una de las tres ilustraciones de la demo.
Hay que agregar la subida y quitar esas ilustraciones.

1. Agregue en el paso 1 un campo de archivo que acepte PNG, JPEG o WebP de 4 MB como máximo.
2. Al elegir el archivo, envíelo antes de publicar:

   ```ts
   const form = new FormData();
   form.append("file", archivo);
   const response = await fetch("/api/admin/images", { method: "POST", body: form });
   ```

   No ponga la cabecera `Content-Type`: el navegador la arma con `FormData`.
3. Con 201, guarde `data.uploadId` en el borrador y muestre `data.url` en la vista previa.
4. Con 422, muestre `error.fields.file` junto al campo.
5. Pida al editor el texto alternativo, el autor, la licencia y el origen:

   | Opción en pantalla | `origin` | Etiqueta que guarda el servidor |
   |---|---|---|
   | «Foto del hecho» | `event_photo` | «Fotografía del hecho» |
   | «Imagen ilustrativa» (foto de archivo, no del hecho) | `illustrative` | «Imagen ilustrativa» |

6. Si el editor quita la foto, envíe `image: null`.

Cuando la noticia no tiene foto, el portal recomendará una imagen de un banco (D-23). Ese endpoint todavía no
existe: ver 2.9.

### 2.6 Mostrar los errores del servidor

Las claves de `error.fields` no son iguales a los `id` del formulario. Tradúzcalas así:

| Clave del servidor | `id` del formulario | Paso |
|---|---|---|
| `title`, `summary`, `body` | Igual | 0 |
| `publishedAt` | `date` | 0 |
| `topicIds` | `topic` | 0 |
| `regionIds` | `regions` | 0 |
| `contentType` | `contentType` | 0 |
| `important` | El `id` de la casilla nueva | 1 |
| `sources` | `source-name-0` | 1 |
| `sources.N.name` | `source-name-N` | 1 |
| `sources.N.url` | `source-url-N` | 1 |
| `status`, `reviewNote` | Igual | 1 |
| `reviewConfirmed` | `consent` | 2 |
| `image.uploadId`, `image.alt`, `image.author`, `image.license`, `image.origin` | Los campos de la foto | 1 |

Una clave que no esté en la tabla va al resumen de errores con su mensaje.

### 2.7 Listar lo publicado

1. Pida `GET /api/admin/articles?limit=20` al montar y después de cada publicación.
2. Reemplace `articles` de `useDemoSession` en la sección «En esta edición» por `data.items`.
3. Cada elemento es un `ArticleSummary`. Para mostrar el tema, busque su `label` en el catálogo con `topicIds[0]`.
4. Si `meta.nextCursor` no es `null`, muestre «Cargar más». Al pulsarlo, pida
   `GET /api/admin/articles?limit=20&cursor=<nextCursor>` y agregue los resultados al final.
5. Opcional: filtros con `q` (texto en el título), `topic` (slug del tema) y `status`.

### 2.8 Cambiar los textos de la demo

| Texto actual | Cambio |
|---|---|
| «Publicar demostración» | «Publicar» |
| «Publicación simulada» y «Solo existe en esta pestaña…» | «Publicada». «La noticia ya está en la app.» |
| «Entiendo que esta publicación es temporal y simulada.» | Quite esa frase de la confirmación |
| «… noticias de ejemplo» en el listado | «… noticias» |
| El cuadro «Consumo de IA: no disponible» | Se queda igual. `GET /api/admin/ai-usage` no existe todavía |

### 2.9 Lo que el portal no puede hacer todavía

- **Cambiar el estado de una noticia publicada.** No hay endpoint ni permiso en la base. Una noticia publicada como
  «En desarrollo» no puede pasar a «Confirmado». Se acuerda antes de construirlo.
- **Recomendar una imagen** para una noticia sin foto. `POST /api/admin/images/preview` no existe: depende del
  banco de imágenes y de la función de IA que propone una.
- **Borrar o editar una noticia.** No está en el contrato.

## 3. Lector

Archivo: la página de `/noticias/[id]`. Hoy lee un `DemoArticle`.

1. Pida `GET /api/articles/<id>`. Si la página es un Server Component, puede llamar al servicio
   `getArticle()` de `src/lib/services/articles.ts` en vez de usar HTTP.
2. `data` es un `ArticleDetail`: `title`, `summary`, `body`, `sources`, `status`, `contentType`, `reviewNote`,
   `important`, `topicIds`, `regionIds`, `publishedAt`, `author` (puede ser `null`) e `image`. `image` es `null` o trae `url`, `alt`, `origin`, `author`, `license`,
   `sourceUrl` (puede ser `null`) y `label`. Muestre `label` sobre la imagen siempre (`RF-18`).
3. Con 404, muestre «no encontrado».
4. `relatedArticles` no viene todavía. Oculte esa sección o déjela vacía.

Este paso es necesario para el portal: después de publicar, el enlace «Abrir noticia» lleva a `/noticias/<id>` con
el id real. Si el lector sigue en la demo, ese enlace no encuentra la noticia.

## 4. Perfil

Pantalla: `/perfil`. Hoy la región vive en `DemoSession`.

1. Al abrir la pantalla, pida `GET /api/profile`. `data.regionId` es `null` si el lector no eligió región.
   `data.topicIds` son los temas elegidos.
2. Al cambiar la región, envíe `PATCH /api/profile` con `{ "regionId": "<id>" }`.
3. Al cambiar los temas, envíe `PATCH /api/profile` con `{ "topicIds": ["<id>", …] }`. La lista reemplaza la
   anterior: envíe todos los temas marcados. `[]` quita todos.
4. La respuesta trae el perfil completo guardado. Úsela para actualizar la pantalla.
5. Con 422, `fields.regionId` o `fields.topicIds` dicen qué falló.

Los temas elegidos vienen de D-32 y no estaban en el contrato original.

## 5. Señal de lectura

Al abrir una noticia en el lector, envíe una vez:

```ts
fetch("/api/interactions", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ articleId, type: "open", eventId: crypto.randomUUID() }),
});
```

- No espere la respuesta para mostrar la noticia. Un error no se muestra al lector.
- Si el lector ya abrió esa noticia, la respuesta trae `duplicate: true` y no suma otra señal. No hace falta evitar
  el envío en la pantalla.
- Solo se acepta `type: "open"`. `chat` se habilita cuando exista el chat.
- Quite el `markRead` que deduplica en memoria.

## 6. Feed

Pantalla: `/edicion`. Hoy usa escenarios preparados.

1. Pida `GET /api/feed`. Para un tema, `GET /api/feed?topic=<slug>`.
2. `data.items` es la lista ordenada. Cada elemento trae `article` (un `ArticleSummary`), `prominence`, `reason` y
   `components`.
3. Use `prominence` para elegir la tarjeta: `hero`, `large`, `standard` o `compact`. Son las cuatro variantes que ya
   existen.
4. Muestre `reason` en cada tarjeta (`RT-01`).
5. `data.importantItems` es el bloque de noticias importantes. Puede venir vacío: si una importante ya está arriba,
   no se repite. Muéstrelo también cuando hay filtro de tema.
6. Si `meta.nextCursor` no es `null`, pida la página siguiente con `?cursor=<nextCursor>`.
7. La región sale del perfil guardado. No la envíe en la URL.

El orden, la prominencia y el motivo los decide el servidor. La pantalla no los cambia ni los calcula. Las dudas
sobre por qué una noticia quedó en su lugar son de la parte de IA (`specs/recomendacion.md`).

`components` no estaba en el contrato. Sirve para explicar el puntaje si la pantalla lo necesita.

## 7. Chat

Pantalla: `/chat`. Hoy muestra respuestas preparadas.

1. Envíe `POST /api/chat` con `{ "question": "<texto>", "messages": [<turnos anteriores>] }`. Cada turno es
   `{ "role": "reader" | "assistant", "text" }`. La conversación sigue solo en la memoria de la pantalla.
2. Trate `data.status`:

   | `status` | Qué mostrar |
   |---|---|
   | `answered` | Cada elemento de `data.segments` tiene `text` y `citations`. Cada cita lleva `articleId`, `title`, `status` y `contentType`: enlace a `/noticias/<articleId>` con la etiqueta del estado |
   | `no_coverage` | «No hay noticias publicadas sobre ese tema.» |
   | `unavailable` | «El chat no está disponible por ahora.» Hoy siempre sale este estado: el modelo no está conectado |

3. Con 422, `fields.question` dice qué falló. No reintente solo: cada pregunta puede gastar créditos de IA.
4. El texto de la respuesta y el estado de cada cita vienen del servidor. La pantalla no los cambia.

## 8. Privacidad

Antes de publicar el perfil, las señales o el feed para otros lectores, actualice `src/app/privacidad/page.tsx`. La
app guarda la región elegida, los temas elegidos y las noticias que abre cada lector (regla 11 de `AGENTS.md`,
`RF-06`). El texto de «Cómo se ordena tu feed» está en [specs/recomendacion.md](specs/recomendacion.md).

## 9. Probar la integración

Haga estas pruebas en local y después en la preview de Vercel:

1. **Administrador:** publique una noticia desde `/admin`. Debe aparecer en «En esta edición» y abrirse en
   `/noticias/<id>`.
2. **Errores:** intente publicar «Confirmado» con una sola fuente. El campo «Estado editorial» debe mostrar el error.
3. **Sesión vencida:** cierre sesión en otra pestaña e intente publicar. Debe aparecer el mensaje de 401 y el
   borrador debe seguir escrito.
4. **Cuenta común:** `/admin` debe responder «no encontrado». El lector y el feed deben funcionar.
5. **Teléfono:** abra en un teléfono real la noticia publicada desde la computadora (`RF-15`).
6. **Perfil y feed:** cambie la región en `/perfil`. El orden de `/edicion` debe cambiar.

Las noticias de prueba se borran en el SQL Editor de Supabase. Póngales `[PRUEBA]` al principio del título:

```sql
delete from public.articles where title like '[PRUEBA]%';
```

## 10. Diferencias con el contrato de `notion-frontend.md`

| Diferencia | Razón |
|---|---|
| `important` en la publicación y en el lector | Una noticia importante aparece en el feed de todos los lectores |
| `reviewNote` en la publicación | `RT-03`. El formulario ya la tenía |
| Orígenes de imagen `event_photo` e `illustrative`, además de `stock` | `RF-18`: distinguir una foto real del hecho |
| `image` en la publicación, en lugar de `imageCandidateId` | Una foto subida necesita su procedencia. La URL la arma el servidor |
| `POST /api/admin/images` | No estaba en el contrato. Sube las fotos propias |
| `topicIds` en el perfil | D-32 |
| `components` en cada elemento del feed | `RT-01` |
| Sin `relatedArticles` en el lector | Llega con el incremento 2 de `recomendacion` (D-31) |
| Sin `reviewIssue` | El servidor solo exige dos fuentes para «Confirmado». La contradicción queda a criterio del editor |

## 11. Endpoints que todavía no existen

`POST /api/admin/images/preview`, `GET /api/admin/ai-usage`, `GET /api/articles` (búsqueda) y
`/api/bookmarks`. Las pantallas que los usan siguen con la demo. La búsqueda y los guardados no tienen requisito
en `ALCANCE.md`.
