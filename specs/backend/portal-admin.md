# Portal administrativo

**Requisitos:** RF-03, RF-15, RF-16, RT-03, RT-04, RP-02.
**Responsable:** Sergio Orellana (pantalla). Publicación y validación: Gerardo Pineda.
**Bitácora:** [registro](../../docs/features/portal-admin/bitacora.md).
**Investigación:** [traslado](../front/notion-frontend.md).

## Comportamiento actual

La puerta del portal verifica sesión y rol. El editor por pasos publica mediante POST `/api/admin/articles`.
Comparte el marco editorial y relaciona errores con campos. El foco pasa al resumen de errores o al paso correspondiente.
El contenido usa bloques tipados. La pantalla confirma únicamente HTTP 201 y enlaza al ID recibido.
El catálogo, la subida opcional de fotos y el listado con filtros y cursores consumen los endpoints existentes.
Ante un fallo de red al publicar, conserva el borrador y pide revisar el listado antes de reenviar.
El listado permite cambiar estado y motivo con PATCH. Confirma HTTP 200, vuelve a consultar el listado con los filtros vigentes
y actualiza el feed. Un 422 conserva los campos. Confirmado exige dos fuentes ya registradas: esta acción no añade fuentes.
En el paso de fuentes, StockImagePicker busca candidatas de Pixabay por acción explícita. Muestra autor, tipo, licencia y
sugerencia de IA cuando existe. La selección es humana. Exige texto alternativo y envía solo `pixabayId` y `alt` al publicar.
Una foto propia y una candidata son alternativas excluyentes. Las consultas obsoletas se cancelan sin reintentos automáticos.
«Consumo de IA» abre un panel sin desmontar el editor. Consulta el resumen al abrirse o por acción manual.
Muestra acumulado, gasto del día del reporte, presupuesto, llamadas, historial diario y desglose por función.
Los rangos de 7, 30 y 90 días cancelan consultas anteriores. Los valores no disponibles no se sustituyen con ceros.
El historial tiene gráfico y tabla accesible. La interfaz conserva los tokens y el tema claro u oscuro.

### Backend

Responsable: Gerardo Pineda. Los endpoints están incorporados en esta rama y el portal los consume.
Se reutilizan los tipos de `src/types/news.ts`, incluidos `important`, `reviewNote`, `image`
y los orígenes `event_photo` e `illustrative`. Esta integración no cambia los servicios ni sus contratos.

Las tablas están en `supabase/migrations/003_articles.sql`. El script se ejecutó en Supabase el 2026-10-10, antes de
llegar a `main` (excepción a la regla 10 de `AGENTS.md`). No lo edite: un cambio va en un script nuevo.

Todas las respuestas usan `cache-control: private, no-store`. Un error tiene la forma
`{ "error": { "code", "message", "fields"? } }`. `fields` solo aparece en `VALIDATION_ERROR`.

#### `GET /api/admin/ai-usage`

Solo administradores. El endpoint lee el registro de la app, sin consultar al proveedor del modelo.
Acepta `days=7`, `days=30` o `days=90`. Si se omite, usa 30. No recibe body ni IDs de usuario.
Los datos incluyen local, preview y producción. Los acumulados abarcan toda la historia, aunque cambie el rango diario.

| Campo de `data` | Significado |
|---|---|
| `currency` | USD |
| `spent`, `remaining` | Gasto estimado registrado y saldo hasta `applicationLimit`. `null` indica lectura fallida |
| `applicationLimit`, `reserved` | Tope vigente de la app y reserva informativa, definidos en servidor |
| `availability` | `available`, `limit_reached` o `unavailable`. Describe el presupuesto, no la conexión al proveedor |
| `byFunction` | Acumulados por función: `functionName`, `calls`, `costUsd`, `externalCredits` |
| `byFunctionAvailable` | Distingue un desglose vacío correcto de un fallo de lectura |
| `updatedAt` | Fecha ISO al completar la consulta. No garantiza que todas las sumas procedan de una misma transacción |
| `daily` | `null` si falla el historial. En otro caso: `timeZone`, `from`, `to` e `items` |

Cada elemento diario incluye `date`, `calls`, `costUsd`, `inputTokens`, `outputTokens`, `cacheReadTokens`,
`cacheWriteTokens` y `externalCredits`. Las fechas usan `YYYY-MM-DD` y la zona America/Guatemala.
La ventana termina hoy y contiene exactamente los días solicitados, en orden ascendente.
Hoy es parcial hasta la consulta. Solo una lectura correcta completa los días sin registros con ceros.
`calls` incluye búsquedas de Tavily. Sus créditos no son tokens ni dólares.

| Status | `code` | Cuándo |
|---|---|---|
| 200 | | Resumen completo o parcial. La interfaz distingue `null` y disponibilidad del desglose |
| 400 | `INVALID_RANGE` | `days` repetido, vacío o distinto de 7, 30 o 90 |
| 401 | `UNAUTHORIZED` | Sin sesión |
| 403 | `FORBIDDEN` | Cuenta sin rol administrativo |
| 503 | `SERVICE_UNAVAILABLE` | No se pudo comprobar el rol o completar el servicio |

El tipo `AiUsageSummary` se reutiliza desde `src/lib/ia/cost.ts` mediante importación de tipo.
No hay paginación ni filtros por usuario. El historial necesita la migración `009_ai_usage_daily.sql`.
Si aún no se aplica, el endpoint conserva los acumulados y responde `daily: null`.
La interfaz no persiste el reporte ni repite consultas automáticamente.

#### `GET /api/catalogs`

Devuelve las regiones y los temas de la base, y los estados y tipos de contenido admitidos. Requiere sesión.

| Status | `code` | Cuándo |
|---|---|---|
| 200 | | Hay sesión. `data` tiene `regions`, `topics`, `statuses` y `contentTypes` |
| 401 | `UNAUTHORIZED` | No hay sesión |
| 503 | `SERVICE_UNAVAILABLE` | La base no respondió. No se devuelven listas vacías |

Respuesta 200, recortada:

```json
{
  "data": {
    "regions": [{ "id": "<uuid>", "slug": "guatemala", "label": "Guatemala" }],
    "topics": [{ "id": "<uuid>", "slug": "tecnologia", "label": "Tecnología" }],
    "statuses": ["confirmed", "developing", "unconfirmed"],
    "contentTypes": ["original", "summary", "ai_contribution"]
  },
  "meta": {}
}
```

Hay 8 regiones (los 7 países de Centroamérica e «Internacional») y 3 temas (Tecnología, Economía y Finanzas).

#### `POST /api/admin/articles`

Publica una noticia. Solo un administrador. El cuerpo es `PublishArticleInput`:

| Campo | Regla |
|---|---|
| `title` | Obligatorio. 180 caracteres como máximo |
| `summary` | Obligatorio. 500 caracteres como máximo |
| `body` | Bloques `{ "type": "paragraph" \| "heading", "text" }`. Al menos uno. 15 000 caracteres en total |
| `sources` | Al menos una `{ "name", "url" }`. Nombre de 120 caracteres como máximo. URL `http://` o `https://` |
| `publishedAt` | Fecha ISO 8601 del hecho |
| `topicIds`, `regionIds` | Al menos un ID de cada uno, tomado de `GET /api/catalogs` |
| `status` | `confirmed` necesita al menos dos fuentes (`RT-03`) |
| `contentType` | Un valor de `contentTypes` |
| `reviewNote` | Obligatorio. 1 500 caracteres como máximo |
| `important` | `true` o `false` |
| `image` | `null` (sin imagen), una foto subida con `POST /api/admin/images`: `{ "uploadId", "alt", "author", "license", "origin" }`, o una imagen de banco de `POST /api/admin/images/preview`: `{ "pixabayId", "alt" }`. En la foto subida, `origin` es `event_photo` (foto del hecho) o `illustrative`, y los cinco campos son obligatorios (`RF-18`). Errores en `image.<campo>` |
| `reviewConfirmed` | Siempre `true`: una persona revisó la noticia (`RT-04`) |

| Status | `code` | Cuándo |
|---|---|---|
| 201 | | Se publicó. `data` es `{ "id", "publicationState": "published" }` |
| 400 | `INVALID_BODY` | El cuerpo no es JSON |
| 401 | `UNAUTHORIZED` | No hay sesión |
| 403 | `FORBIDDEN` | La cuenta no es administradora |
| 422 | `VALIDATION_ERROR` | Uno o más campos no cumplen la regla. `fields` tiene un mensaje por campo, por ejemplo `sources.0.url` |
| 503 | `SERVICE_UNAVAILABLE` | La base no respondió |

Límite conocido: la noticia, sus regiones y sus temas se guardan en tres inserciones. Si la conexión falla entre la
primera y las otras, la noticia queda sin regiones o sin temas. Una función SQL con una transacción lo evitaría.

#### `PATCH /api/admin/articles/[id]`

Cambia el estado editorial de una noticia publicada (RT-03, RT-04). Solo un administrador. El cuerpo es
`{ "status", "reviewNote" }`. Los dos son obligatorios: un estado nuevo necesita su razón.

| Status | `code` | Cuándo |
|---|---|---|
| 200 | | `data` es `{ "id", "status", "reviewNote" }` |
| 400 | `INVALID_BODY` | El cuerpo no es JSON |
| 401 | `UNAUTHORIZED` | No hay sesión |
| 403 | `FORBIDDEN` | La cuenta no es administradora |
| 404 | `ARTICLE_NOT_FOUND` | El id no existe o no es un UUID |
| 422 | `VALIDATION_ERROR` | Estado inválido, razón vacía o de más de 1 500 caracteres, o `confirmed` con menos de dos fuentes |
| 503 | `SERVICE_UNAVAILABLE` | La base no respondió |

Solo se actualizan `status` y `review_note`. El título, el contenido, las fuentes y la imagen no cambian.

#### `POST /api/admin/articles/import`

Publica varias noticias de un archivo JSON. Solo un administrador. El cuerpo es `{ "items": [...] }`, con 20
noticias como máximo. Cada noticia sigue las reglas de `POST /api/admin/articles`, con dos diferencias:

- Solo se admiten `title`, `summary`, `body`, `sources`, `publishedAt`, `topicIds`, `regionIds`, `status`,
  `contentType`, `important` e `image`. Otro campo, incluidos `reviewNote` y `reviewConfirmed`, es un error.
- El servidor guarda `reviewNote` como «Aprobado». Subir el archivo es la confirmación de la persona (`RT-04`).

Cada noticia se publica por separado, en el orden del archivo. Una noticia con errores no detiene las demás.

| Status | `code` | Cuándo |
|---|---|---|
| 200 | | `data` es `{ "published", "failed", "results" }`. Cada resultado es `{ "index", "id" }` o `{ "index", "fields" }` |
| 400 | `INVALID_BODY` | El cuerpo no es JSON |
| 401 | `UNAUTHORIZED` | No hay sesión |
| 403 | `FORBIDDEN` | La cuenta no es administradora |
| 422 | `VALIDATION_ERROR` | `items` no es una lista, está vacía o tiene más de 20 noticias. Error en `fields.items` |
| 503 | `SERVICE_UNAVAILABLE` | No se pudo comprobar el rol |

Ejemplo de archivo. Los IDs salen de `GET /api/catalogs`:

```json
{
  "items": [
    {
      "title": "Título",
      "summary": "Entradilla",
      "body": [{ "type": "paragraph", "text": "Contenido" }],
      "sources": [{ "name": "Medio", "url": "https://ejemplo.com/nota" }],
      "publishedAt": "2026-10-12T08:00:00-06:00",
      "topicIds": ["<id de tema>"],
      "regionIds": ["<id de región>"],
      "status": "developing",
      "contentType": "summary",
      "important": false,
      "image": null
    }
  ]
}
```

Límite conocido: importar dos veces el mismo archivo publica dos veces cada noticia.

#### `POST /api/admin/images`

Sube una foto del administrador al bucket `article-images` (`RF-17`). Solo un administrador. El cuerpo es
`multipart/form-data` con el campo `file`.

| Regla | Valor |
|---|---|
| Tipos | PNG, JPEG o WebP. El servidor revisa los primeros bytes: el tipo que declara el navegador no basta |
| Tamaño | 4 MB como máximo. Vercel rechaza peticiones de más de 4.5 MB |
| Nombre | Uno nuevo al azar en `uploads/`. El nombre original no se guarda |

| Status | `code` | Cuándo |
|---|---|---|
| 201 | | `data` es `{ "uploadId", "url" }`. `url` sirve para la vista previa |
| 400 | `INVALID_BODY` | El cuerpo no es `multipart/form-data` |
| 401 | `UNAUTHORIZED` | No hay sesión |
| 403 | `FORBIDDEN` | La cuenta no es administradora |
| 422 | `VALIDATION_ERROR` | Falta el archivo, el tipo o el tamaño no sirven, o no es una imagen. Error en `fields.file` |
| 503 | `SERVICE_UNAVAILABLE` | El bucket no respondió |

Al publicar, el servidor arma la URL con el `uploadId`, comprueba que el archivo existe y guarda en `articles.image`
la URL, el texto alternativo, el autor, la licencia, el origen y la etiqueta: «Fotografía del hecho» para
`event_photo` e «Imagen ilustrativa» para las demás. La URL nunca la envía el cliente.

El bucket se creó con `supabase/migrations/002_storage_article_images.sql`. El script se ejecutó en Supabase el
2026-10-10, antes de llegar a `main` (excepción a la regla 10 de `AGENTS.md`).

Límite conocido: una foto que se sube y no se publica queda en el bucket. Se borra a mano desde Supabase.

#### `POST /api/admin/images/preview`

Busca imágenes de banco para una noticia sin foto (`RF-17`, D-23, D-33). Solo un administrador. El cuerpo es
`{ "query", "article"? }`. `query` tiene de 2 a 100 caracteres. `article` es `{ "title", "summary" }` y es opcional: es la noticia que lee el modelo. El servidor busca en Pixabay con `lang=es` y `safesearch=true` y guarda cada
búsqueda en caché 24 horas. Descarta las candidatas con la etiqueta «ai generado» (`RT-05`).

| Status | `code` | Cuándo |
|---|---|---|
| 200 | | `data` es `{ "source", "license", "licenseUrl", "candidates", "suggestedId" }`. Cada candidata es `{ "id", "type", "tags", "previewUrl", "author", "pageUrl" }` |
| 400 | `INVALID_BODY` | El cuerpo no es JSON |
| 401 | `UNAUTHORIZED` | No hay sesión |
| 403 | `FORBIDDEN` | La cuenta no es administradora |
| 422 | `VALIDATION_ERROR` | Falta `query` o es muy larga. Error en `fields.query` |
| 503 | `SERVICE_UNAVAILABLE` | Falta `PIXABAY_API_KEY` o Pixabay no respondió |

`previewUrl` sirve solo para mostrar la candidata en el portal: Pixabay no permite enlazarla de forma permanente.
`suggestedId` es el ID que propone `elegirImagen` (parte de IA), o `null` si el modelo no propone ninguna o falla. La pantalla debe mostrar que las imágenes
vienen de Pixabay y su licencia.

Para publicar con una candidata, `POST /api/admin/articles` recibe `image: { "pixabayId", "alt" }`. El servidor:

1. Vuelve a pedir la imagen a Pixabay con su id. No usa datos del cliente.
2. Rechaza la imagen si tiene la etiqueta «ai generado».
3. Descarga la versión grande, revisa sus primeros bytes y la copia al bucket en `stock/`.
4. Guarda `origin: stock`, la etiqueta «Imagen ilustrativa», el autor y la página de Pixabay y la licencia
   «Pixabay Content License».

Un id que no existe da 422 con `fields["image.pixabayId"]`. Si Pixabay o el bucket no responden, la respuesta es 503.

#### `GET /api/admin/articles`

Lista las noticias publicadas, de la más reciente a la más antigua. Con la misma fecha desempata el id. Solo un
administrador.

| Parámetro | Regla |
|---|---|
| `q` | Busca el texto en el título, sin distinguir mayúsculas |
| `topic` | Slug de un tema del catálogo, por ejemplo `economia`. Cada noticia trae todos sus `topicIds` |
| `status` | `confirmed`, `developing` o `unconfirmed` |
| `limit` | De 1 a 50. Por defecto, 20 |
| `cursor` | El `meta.nextCursor` de la página anterior. `null` indica que no hay otra página |

| Status | `code` | Cuándo |
|---|---|---|
| 200 | | `data.items` es una lista de `ArticleSummary` y `meta.nextCursor` lleva a la página siguiente |
| 400 | `INVALID_FILTER` | `topic`, `status` o `limit` no son válidos |
| 400 | `INVALID_CURSOR` | El cursor no es uno que devolvió este endpoint |
| 401 | `UNAUTHORIZED` | No hay sesión |
| 403 | `FORBIDDEN` | La cuenta no es administradora |
| 503 | `SERVICE_UNAVAILABLE` | La base no respondió |

#### `GET /api/articles/[id]`

Devuelve una noticia completa para el lector. Lo puede usar cualquier cuenta con sesión, no solo un administrador.
`data` es un `ArticleDetail`: los campos de `ArticleSummary` más `author`, `regionIds`, `body`, `sources`,
`reviewNote` e `important`. No incluye `relatedArticles`: llega con el incremento 2 de `recomendacion` (D-31).

| Status | `code` | Cuándo |
|---|---|---|
| 200 | | La noticia existe |
| 401 | `UNAUTHORIZED` | No hay sesión |
| 404 | `ARTICLE_NOT_FOUND` | No hay una noticia con ese id, o el id no es un UUID |
| 503 | `SERVICE_UNAVAILABLE` | La base no respondió |

#### Probar los endpoints

Requisitos: `npm run dev` y una cuenta de Google registrada en `public.admins`.

1. Abra `http://localhost:3000` e inicie sesión. La barra superior muestra el escudo.
2. Abra `http://localhost:3000/api/catalogs`. Resultado: el JSON del catálogo.
3. Abra la consola del navegador (F12 → Console). Escriba `allow pasting` y presione Enter.
4. Pegue este código y presione Enter:

   ```js
   const cat = (await (await fetch("/api/catalogs")).json()).data;
   const base = {
     title: "[PRUEBA] Noticia de prueba del backend",
     summary: "Entradilla de prueba.",
     body: [{ type: "paragraph", text: "Contenido de prueba." }],
     sources: [{ name: "Fuente de prueba", url: "https://example.org/" }],
     publishedAt: new Date().toISOString(),
     topicIds: [cat.topics[0].id],
     regionIds: [cat.regions[0].id],
     status: "developing",
     contentType: "original",
     reviewNote: "Prueba del endpoint.",
     important: false,
     image: null,
     reviewConfirmed: true,
   };
   const post = async (b) => {
     const r = await fetch("/api/admin/articles", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify(b),
     });
     console.log(r.status, await r.json());
   };
   await post(base);
   await post({ ...base, status: "confirmed" });
   await post({ ...base, title: "", sources: [] });
   ```

   Resultado: `201`, `422` y `422`. Solo la primera noticia se guarda.

5. Pegue este código para probar el listado:

   ```js
   const get = async (qs) => {
     const r = await fetch("/api/admin/articles" + qs);
     console.log(qs || "(sin filtros)", r.status, await r.json());
   };
   await get("");
   await get("?q=prueba");
   await get("?status=foo");
   await get("?cursor=basura");
   ```

   Resultado: `200` con la noticia de prueba, `200` con la misma noticia, `400 INVALID_FILTER` y `400 INVALID_CURSOR`.

6. Pegue este código para probar el lector:

   ```js
   const read = async (id) => {
     const r = await fetch("/api/articles/" + id);
     console.log(id, r.status, await r.json());
   };
   const first = (await (await fetch("/api/admin/articles?limit=1")).json()).data.items[0];
   await read(first.id);
   await read("00000000-0000-0000-0000-000000000000");
   ```

   Resultado: `200` con la noticia completa y `404 ARTICLE_NOT_FOUND`.

7. Borre la noticia de prueba en el SQL Editor de Supabase. La base compartida sirve también a producción:

   ```sql
   delete from public.articles where title like '[PRUEBA]%';
   ```

#### Pruebas registradas

| Fecha | Dónde | Qué se hizo y qué se vio | Resultado |
|---|---|---|---|
| 2026-10-10 | Local, sin sesión y con una cookie inventada | `GET /api/catalogs` y `POST /api/admin/articles`: 401 `UNAUTHORIZED` | Pasó |
| 2026-10-10 | Local, sesión de administrador | `GET /api/catalogs`: 200 con 8 regiones, 3 temas, 3 estados y 3 tipos | Pasó |
| 2026-10-10 | Local, sesión de administrador | `POST /api/admin/articles`: 201 con una fuente y `developing`. 422 con `confirmed` y una fuente. 422 sin título ni fuentes | Pasó |
| 2026-10-10 | Local, sesión de administrador | `GET /api/admin/articles`: 200 sin filtros, con `q`, con `topic` y con `status`, cada uno con las noticias esperadas. 400 con `status`, `topic` y `cursor` inválidos | Pasó |
| 2026-10-10 | Local, sesión de administrador | `POST /api/admin/images`: 201 con un PNG. 422 con un texto declarado como PNG, con un GIF y con 5 MB. `POST /api/admin/articles` con la foto: 201, y el lector devuelve `image` con la URL del bucket, `origin: event_photo` y la etiqueta «Fotografía del hecho». 422 con un `uploadId` inexistente y con `origin: stock`. 201 con `image: null` | Pasó |
| 2026-10-10 | Local, sesión de administrador | `GET /api/articles/[id]`: 200 con `body`, `sources`, `reviewNote`, una región y un tema que coinciden con el catálogo. 404 `ARTICLE_NOT_FOUND` con un UUID inexistente y con un id que no es UUID | Pasó |
| 2026-10-12 | Local, sesión de administrador, con `008` ejecutado | `PATCH /api/admin/articles/[id]`: 422 al confirmar una noticia con una fuente, 422 con la razón vacía, 422 con un estado inválido, 404 con un UUID inexistente y 200 al confirmar una noticia con dos fuentes | Pasó |
| 2026-10-12 | Local, sesión de administrador | `POST /api/admin/articles/import` con tres noticias: una válida, una con `reviewNote` y una sin título. 200 con `published: 1`, `failed: 2`. El índice 0 trae su `id`, y los índices 1 y 2 traen `fields`. Con `items: []`, 422 `VALIDATION_ERROR` | Pasó |

Pendiente: 403 en el portal y 200 en el lector con una cuenta común, página siguiente del listado con dos noticias o más, prueba en la preview de Vercel
y prueba de la pantalla conectada. El código de integración no acredita esos resultados.

## Criterios de aceptación

- Mantener 404 para cuentas sin rol administrativo y pedir sesión a visitantes.
- Preparar contenido, fuentes, fecha, temas, regiones, estado y procedencia antes de revisar.
- Mostrar vista previa y exigir confirmación humana antes de enviar la publicación.
- Mostrar errores por campo sin descartar el texto escrito.
- Confirmar la publicación solo con HTTP 201. Mostrar consumos registrados y señalar los datos no disponibles.

## No incluido

Cambios en roles, validación editorial, precios o registro de llamadas al modelo.
La ampliación del endpoint de consumo y su consulta SQL están autorizadas para esta entrega.

## Dependencias

GET/POST `/api/admin/articles`, POST `/api/admin/images` y GET `/api/catalogs` están conectados.
También están conectados PATCH `/api/admin/articles/[id]` y POST `/api/admin/images/preview`.
GET `/api/admin/ai-usage` se amplía con historial diario. La consulta requiere `009_ai_usage_daily.sql`.
La pantalla no presenta ceros ni reservas inventadas como gasto real.

## Uso de IA en el producto

La búsqueda de candidatas llama al endpoint existente. El servidor puede pedir a Anthropic una sugerencia con el título,
la entradilla y los metadatos de las candidatas. La pantalla muestra `suggestedId` si existe y nunca selecciona automáticamente.
El control de gasto pertenece al servidor. El panel de consumo muestra el registro acumulado. Privacidad describe este envío.

## Done específico

Verificar con administrador y usuario común. Publicar y comprobar la noticia en otro teléfono en Vercel.

## Tareas

| Estado | Tarea | Req. | Evidencia |
|---|---|---|---|
| En curso | Editor por pasos, revisión y publicación real | RF-15, RF-16, RT-03, RT-04 | Código conectado. [Validación de integración](../front/feed-y-lector.md#validación-de-integración-2026-10-10). Pruebas con administrador pendientes |
| En curso | Consultar acumulados e historial diario de consumo | RF-03, RP-01, RP-02 | [Cambio y evidencia](#consumo-de-ia-en-el-portal--2026-10-14). Migración, datos reales y prueba con sesión pendientes |
| En curso | Consumir validación del servidor y mostrar errores por campo | RF-03, RF-15, RT-03 | Contratos existentes conectados. Pruebas 401, 403 y 422 pendientes en Vercel |
| En curso | Subir foto opcional y declarar su procedencia | RF-17, RF-18 | Subida y asociación implementadas. Sustituir la foto exige completar de nuevo su procedencia. Pruebas reales pendientes |
| En curso | Cambiar estado y motivo de una noticia publicada | RF-15, RF-16, RT-03, RT-04 | Código conectado. [Verificación local](#verificación-de-frontend-2026-10-14). Persistencia, roles y sesión real pendientes |
| En curso | Elegir una candidata de Pixabay y publicar con procedencia | RF-06, RF-17, RF-18, RT-05 | Código conectado y privacidad actualizada. [Verificación local](#verificación-de-frontend-2026-10-14). Proveedor y publicación reales pendientes |

## Cambio en curso

### Consumo de IA en el portal · 2026-10-14

Requisitos: RF-03, RP-01 y RP-02. Ticket de frontend pendiente. TKT-3 corresponde al módulo de costos existente.
El usuario autoriza ampliar Backend e IA para consultar consumos diarios. Los dueños revisarán esos cambios al integrar.
El portal tendrá un acceso «Consumo de IA», con acumulado, gasto de hoy, saldo hasta el tope, reserva y llamadas.
Un gráfico y una tabla mostrarán 7, 30 o 90 días, incluidos los días sin registros. La zona será America/Guatemala.
Se reutilizará GET `/api/admin/ai-usage`. El parámetro `days` será opcional, con 30 por defecto.
El servicio conservará sus campos y añadirá historial diario, fecha de consulta e indicador de disponibilidad del desglose.
La consulta agrupará los registros existentes. No pedirá la llave ni llamará al proveedor del modelo.
Los datos incluyen local, preview y producción. El saldo corresponde al presupuesto de la app, no a la cuenta del proveedor.
Un fallo del historial se mostrará como no disponible, nunca como días con costo cero. El acumulado seguirá siendo consultable.
La migración nueva será idempotente y tendrá acceso solo para administradores, sin exponer la tabla.
No se ejecutará SQL, ni se cambiará el registro de llamadas, precios, límite o reserva. La migración se aplicará tras llegar a main.
Se probarán rango, fechas, ceros reales, fallos parciales, sesión y permisos con dependencias simuladas.
La prueba con datos reales y la conciliación con el proveedor quedan pendientes del equipo.

#### Evidencia local de consumo

| Fecha | Entorno y acción | Observación | Resultado |
|---|---|---|---|
| 2026-10-14 | Node local, `node --test --test-isolation=none src/lib/ia/cost.test.mjs` | 14 pruebas con base simulada: costos y límites anteriores, rangos, fechas, ceros y fallos parciales | Pasó. Sin proveedor ni SQL real |
| 2026-10-14 | Node local, harness HTTP temporal con DAL y servicio simulados | 26 casos: 401, 403, 503, rangos válidos, inválidos y duplicados, respuesta parcial y caché privada | Pasó. No acredita sesiones reales |
| 2026-10-14 | Node local, harness del panel con hooks y cliente HTTP simulados | 10 casos: abrir y actualizar, cancelación, respuestas obsoletas, valores nulos, precisión, fechas y errores de sesión o servicio | Pasó. Sin React DOM ni hidratación real |
| 2026-10-14 | Navegador aislado con datos ficticios a 320, 390, 768 y 1366px, claro y oscuro | Gráfico, métricas, detalle y estados parciales sin desbordamiento. Revisión final de 320px y texto al 200% en 390px: importes legibles en una columna | Pasó con fixtures. Teléfono real pendiente |
| 2026-10-14 | Revisión independiente de `009_ai_usage_daily.sql` | Autorización dentro de la RPC, zona horaria, rango inclusivo, permisos mínimos y exclusión de fechas futuras | Revisión estática. SQL sin ejecutar |
| 2026-10-14 | Windows, `npm run typecheck` y `npm run lint` | Ambos terminan con salida 0 | Pasó |
| 2026-10-14 | Windows, `npm run build` | Compilación, TypeScript y generación de 23 páginas correctos | Pasó. No se inició localhost |
| 2026-10-14 | Validador Markdown en los cuatro documentos de esta entrega | Estructura y enlaces locales correctos | Pasó |
| 2026-10-14 | `node scripts/check-specs.mjs` | 13 errores y 13 avisos previos. Los errores son enlaces de FRONTEND.md y archivos locales en la raíz | No pasó globalmente. No se identificaron errores nuevos |

#### Activación y comprobación pendiente

1. Gerardo revisa la ruta, Rodrigo el servicio y Ricardo la migración nueva.
2. El equipo integra el cambio por dev y después publica el release en main.
3. Solo cuando el PR llegue a main, Ricardo aplica `009_ai_usage_daily.sql`. No se modifica ni repite `006` para este cambio.
4. Con una cuenta administradora, abrir Administración y desplegar «Consumo de IA».
5. Comparar 7, 30 y 90 días. Los acumulados no deben variar por seleccionar otro rango.
6. Comparar hoy, un día sin registros, tokens y créditos con la base y conciliar el gasto con el proveedor.
7. Comprobar sesión vencida, cuenta común, fallos de red y vista móvil en ambos temas.

Sin la migración, comprobar que el panel muestra el historial como no disponible y conserva los acumulados.
No se cambió el tope de la app. La prueba de autorización real y el criterio de diferencia menor al 5 % siguen pendientes.

### Integración de estados e imágenes en Frontend · 2026-10-14

Requisitos: RF-06, RF-15, RF-16, RF-17, RF-18, RT-03, RT-04 y RT-05. Ticket de frontend pendiente de asignación.
El usuario pidió cambiar el estado de las noticias publicadas y aprobó conectar la búsqueda de imágenes de Pixabay.
Frontend consumirá PATCH `/api/admin/articles/[id]` con estado y motivo. Confirmará el cambio solo al recibir HTTP 200.
Conservará lo escrito ante errores. Un 422 señalará el campo, un 404 retirará la noticia y un 401 permitirá recuperar la sesión.
La lista respetará sus filtros después del cambio. El servidor seguirá comprobando el rol y las fuentes necesarias para Confirmado.
El editor consultará POST `/api/admin/images/preview` por acción explícita. Mostrará candidatas, procedencia, licencia y sugerencia cuando exista.
La persona elegirá la imagen y escribirá el texto alternativo. Se publicará con `{ pixabayId, alt }`, sin enviar URLs del banco.
La foto propia y la candidata serán opciones excluyentes. Se conservarán los tres pasos y la confirmación humana antes de publicar.
Se revisarán importación y procedencia en el lector. No se modificarán contratos, servicios, migraciones ni permisos.
Los agentes verificarán con servicios simulados y comprobaciones locales. Las publicaciones y pruebas reales quedan a cargo del usuario.
Privacidad describirá las búsquedas enviadas a Pixabay y el título y la entradilla que recibe Anthropic para sugerir una candidata.

### Verificación de Frontend 2026-10-14

La revisión contrasta `update-backend-front-ia.md` con los tipos y servicios actuales. La importación JSON ya tiene
interfaz en `/admin`, y ArticleVisual ya presenta procedencia. No se reimplementaron. El servidor de imágenes ya acepta
`article` y puede devolver `suggestedId`. La nota de traspaso aún describe una versión anterior de ese comportamiento.
Relacionadas y consumo de IA tienen servicio, pero siguen pendientes de interfaz. No se cambian sus contratos.

| Fecha | Entorno y acción | Observación | Resultado |
|---|---|---|---|
| 2026-10-14 | Node local, TSX real transpilado con hooks y API simulados | 16 comprobaciones de StockImagePicker y ArticleStatusEditor: petición manual, payload, doble envío, validación, errores 401/422/503, 404, aborto, selección humana y preview rota | Pasaron 16 |
| 2026-10-14 | Node local, EditorialDesk con hooks y API simulados | Alt obligatorio, payload sin URL, elección repetida, sustitución por foto, quitar imagen, error `image.pixabayId` y filtros vigentes después de PATCH | Pasaron 7 |
| 2026-10-14 | Revisión estática del coordinador y subagentes | Se corrigió el callback para respetar filtros que cambiaron durante PATCH. Repetir una selección ya no borra su alt. Se mantienen el DAL, el cliente HTTP y los tipos existentes | Correcciones incorporadas |
| 2026-10-14 | Windows, `npm run typecheck`, `npm run lint` y `npm run build` | Salida 0. Build final con 23 páginas generadas. Sin servidor local ni despliegue | Pasaron |
| 2026-10-14 | `validate_docs.py` sobre los tres documentos modificados y `git diff --check` | Estructura y enlaces correctos. Sin errores de espacios en el diff revisado | Pasaron |
| 2026-10-14 | `node scripts/check-specs.mjs` | 13 errores y 13 avisos preexistentes. Los errores corresponden a enlaces y ubicación de `FRONTEND.md`, `brief.md` e `instructions.md` | No pasó globalmente. Esos archivos no se modificaron |

Las comprobaciones aisladas se ejecutaron en archivos temporales, sin instalar un framework. No acreditan React DOM,
foco real, autorización ni respuestas de proveedores. Los subagentes no llamaron a Pixabay, Anthropic o la base.
No se levantó localhost, no se publicaron noticias y no se ejecutaron SQL. No se inspeccionó `.env.local`.

| Recorrido en Vercel | Qué comprobar | Estado |
|---|---|---|
| Cambiar estado | Como administrador, abrir Cambiar estado, elegir un valor y escribir el motivo. Guardar, recargar y abrir el lector. Repetir con filtro por estado | Pendiente |
| Fuentes y errores | Intentar Confirmado con una fuente. Comprobar 422 y conservación del motivo. Revisar sesión vencida y cuenta común en un entorno controlado | Pendiente |
| Pixabay | Buscar en el paso de fuentes. Revisar licencia, autor y sugerencia. Elegir una candidata, describirla y publicar. Comprobar imagen, procedencia y etiqueta en lector | Pendiente |
| Sustituir imagen | Elegir candidata, volver a elegir la misma, cambiar por foto propia y quitarla. Confirmar que cada vista previa representa solo la selección vigente | Pendiente |
| Fallos de imágenes | Revisar consulta sin resultados, imagen retirada y proveedor no disponible. Conservar borrador y permitir continuar sin imagen | Pendiente |
| Teléfono y teclado | Completar selección y cambio de estado en pantalla pequeña. Revisar foco, controles, errores y navegación | Pendiente |

| Agent | Request | Proposal | Decision | Verification |
|---|---|---|---|---|
| Codex coordinador y tres subagentes. Modelo exacto no disponible | Refinar interfaz, cambiar estados y revisar brechas de Backend | Reutilizar contratos con dos componentes delimitados. Pedir elección humana de imagen y confirmar escrituras solo con respuesta | El usuario pidió estados y aprobó explícitamente conectar Pixabay. No se atribuye aceptación de pruebas reales | Código, revisión cruzada y comprobaciones aisladas anteriores. Capturas en el spec de frontend |

La implementación permanece en el directorio de trabajo. No hay commits, staging, push ni despliegue.
Las tareas siguen En curso. Los tickets de frontend están pendientes de asignación. No se inventan ciclos ni resultados reales.

### Cambiar el estado de una noticia publicada · 2026-10-12

Requisitos: RT-03 y RT-04. Ticket pendiente (`TKT-NN`).
Hoy el estado solo se elige al publicar. `PATCH /api/admin/articles/[id]` deja que un administrador lo cambie después,
por ejemplo de `developing` a `confirmed` cuando aparece la segunda fuente. Cada cambio exige una razón nueva (RT-03).
No hay borradores: la noticia sigue publicada. Solo cambian `status` y `review_note`.
Necesita `supabase/migrations/008_article_status_update.sql`, que da permiso de actualizar solo esas dos columnas.
El script se ejecutó en Supabase el 2026-10-12, antes de llegar a `main` (excepción a la regla 10 de `AGENTS.md`).

### Importar noticias desde un archivo · 2026-10-12

Requisitos: RF-15 y RF-16. Ticket pendiente (`TKT-NN`).
El administrador publica varias noticias con un JSON en `POST /api/admin/articles/import`.
Cada noticia acepta solo los campos permitidos. Un campo desconocido es un error de esa noticia.
Por pedido del usuario, la importación aprueba de una vez: el servidor pone `reviewNote` en «Aprobado» y
`reviewConfirmed` en `true`. Quien sube el archivo es la persona que revisó y decidió el estado (`RT-04`).
«Aprobado» no explica por qué la noticia tiene su estado, como pide `RT-03`. El equipo debe aceptar esa diferencia.

### Integración de la pantalla · 2026-10-10

Requisitos: RF-03, RF-15, RF-16, RF-17, RF-18, RT-03 y RT-04. Ticket de frontend pendiente de asignación.
El usuario aprobó conectar la pantalla a los endpoints existentes sin modificar su contrato ni sus servicios.
Se conservarán los tres pasos y la revisión humana. Se cargarán catálogos, se enviarán IDs y se añadirá la marca de importancia.
La foto será opcional, con subida PNG/JPEG/WebP de hasta 4 MB y procedencia obligatoria cuando exista.
Solo una respuesta 201 confirmará la publicación. Los errores conservarán el borrador y señalarán campo y paso.
El listado tendrá filtros y paginación del servidor. Consumo de IA y sugerencias de imágenes seguirán pendientes.
El usuario hará las publicaciones de prueba en Vercel. Los agentes solo implementarán y comprobarán el código, sin localhost ni commits.

La [validación de integración](../front/feed-y-lector.md#validación-de-integración-2026-10-10) distingue las comprobaciones técnicas de las pruebas funcionales pendientes.
Los registros del 2026-10-09 que siguen describen la demo anterior.

2026-10-09: construir una demo protegida sin operaciones remotas.
La regla demostrativa impide Confirmado mientras el editor declare fuente insuficiente o contradicción sin resolver.
Esta regla de interfaz es una propuesta. Backend debe acordarla y aplicarla en servidor antes de publicar de verdad.
El portal requiere una fuente con URL HTTP(S), revisión humana y origen de imagen declarado.
La noticia simulada aparece en el contexto de la pestaña. Una recarga la elimina.

2026-10-09: unificar acceso, formularios y mensajes con el layout editorial compartido.
Conservar la comprobación de rol en servidor, la revisión humana y todas las validaciones actuales.
Adaptar el contenido de la demo a bloques tipados para el lector. Mantener errores por campo y el texto escrito.
El usuario autoriza verificaciones locales. No se conectan servicios nuevos ni se hacen commits.
Se retiró la carga global de la raíz para evitar que el streaming anticipe HTTP 200 antes de `notFound()`.
La carga de ruta se limita a chat, edición y búsqueda. El control administrativo sigue en servidor.
El acceso anónimo se comprobó. La respuesta 404 con cuenta común y la publicación con administrador siguen pendientes por petición del usuario.
La evidencia está en [el registro local](../front/notion-frontend.md#registro-honesto). La inspección estática no demuestra esas pruebas de roles.
