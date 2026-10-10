# Portal administrativo

**Requisitos:** RF-03, RF-15, RF-16, RT-03, RT-04, RP-02.
**Responsable:** Sergio Orellana (pantalla). Publicación y validación: Gerardo Pineda.
**Bitácora:** [registro](../docs/features/portal-admin/bitacora.md).
**Investigación:** [traslado](../notion-frontend.md).

## Comportamiento actual

La puerta del portal verifica sesión y rol. El editor por pasos publica únicamente noticias ficticias en memoria.
Comparte el marco editorial y relaciona errores con campos. El foco pasa al resumen de errores o al paso correspondiente.
El contenido publicado usa bloques tipados para el lector. No hay publicación remota implementada.

### Backend

Responsable: Gerardo Pineda. El código está en la rama `feat/backend`. Todavía no llega a `dev`: el portal no
lo usa. Los tipos están en `src/types/news.ts`. Siguen el contrato de [notion-frontend.md](../notion-frontend.md),
fichas 1 y 9, con estas diferencias: `important`, `reviewNote` en la publicación, `image` en lugar de `imageCandidateId`
y los orígenes de imagen `event_photo` e `illustrative`.

Las tablas están en `supabase/migrations/003_articles.sql`. El script se ejecutó en Supabase el 2026-10-10, antes de
llegar a `main` (excepción a la regla 10 de `AGENTS.md`). No lo edite: un cambio va en un script nuevo.

Todas las respuestas usan `cache-control: private, no-store`. Un error tiene la forma
`{ "error": { "code", "message", "fields"? } }`. `fields` solo aparece en `VALIDATION_ERROR`.

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
| `image` | `null` (sin imagen) o una foto subida con `POST /api/admin/images`: `{ "uploadId", "alt", "author", "license", "origin" }`. `origin` es `event_photo` (foto del hecho) o `illustrative`. Los cinco campos son obligatorios (`RF-18`). Errores en `image.<campo>` |
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

Pendiente: 403 en el portal y 200 en el lector con una cuenta común, página siguiente del listado con dos noticias o más, prueba en la preview de Vercel
y conexión del portal.

## Criterios de aceptación

- Mantener 404 para cuentas sin rol administrativo y pedir sesión a visitantes.
- Preparar contenido, fuentes, fecha, temas, regiones, estado y procedencia antes de revisar.
- Mostrar vista previa y exigir confirmación humana para la publicación simulada.
- Mostrar errores por campo sin descartar el texto escrito.
- Identificar la simulación. No prometer escritura en Supabase ni consumo medido.

## No incluido

Endpoints, permisos nuevos, roles, archivos SQL, validación editorial del servidor y consumo de modelos.

## Dependencias

GET/POST `/api/admin/articles` y GET `/api/admin/ai-usage`, propuestos a Gerardo y Rodrigo.
Los límites se consultarán al servidor. La demo no presenta ceros como gasto real.

## Uso de IA en el producto

Ninguno en esta entrega.

## Done específico

Verificar con administrador y usuario común. Publicar y comprobar la noticia en otro teléfono cuando exista Backend.

## Tareas

| Estado | Tarea | Req. | Evidencia |
|---|---|---|---|
| En curso | Editor por pasos, revisión y publicación temporal | RF-15, RF-16, RT-03, RT-04 | Código actualizado. [Verificación local](../notion-frontend.md#registro-honesto). Pruebas con administrador pendientes |
| En curso | Mostrar consumo no disponible y dependencia del servidor | RP-02 | Código conservado. Prueba con sesión pendiente |
| Pendiente | Integración y validación editorial en servidor | RF-03, RF-15, RT-03 | Contratos pendientes |

## Cambio en curso

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
La evidencia está en [el registro local](../notion-frontend.md#registro-honesto). La inspección estática no demuestra esas pruebas de roles.
