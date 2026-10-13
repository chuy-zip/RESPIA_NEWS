# Cambios del backend para Frontend e IA (2026-10-12)

Este documento explica qué cambió en el backend en la rama `feat/back-import` y qué falta en el frontend y en la parte
de IA para usarlo. Los endpoints llegan a `dev` con el PR de esa rama.

El detalle de cada endpoint (campos, reglas y códigos) está en la sección «Backend» de
[portal-admin.md](specs/backend/portal-admin.md). El plan de imágenes está en [imagenes.md](specs/ia/imagenes.md).

## Qué hay de nuevo

| Endpoint | Para qué | Probado |
|---|---|---|
| `POST /api/admin/articles/import` | Publicar hasta 20 noticias de un archivo JSON. Solo acepta los campos permitidos y aprueba cada noticia con la razón «Aprobado» | Sí, local |
| `POST /api/admin/images/preview` | Buscar imágenes de Pixabay para una noticia sin foto. Descarta las marcadas «ai generado» | No todavía |
| `POST /api/admin/articles` con `image: { "pixabayId", "alt" }` | Publicar con una imagen de banco. El servidor la copia al bucket con `origin: "stock"` | No todavía |
| `PATCH /api/admin/articles/[id]` | Cambiar el estado editorial y su razón de una noticia publicada | Sí, local |

Los tipos nuevos están en `src/types/news.ts`: `ArticleImportItem`, `ArticleImportResponse`, `StockImageCandidate`,
`ImagePreviewResult`, `ImagePreviewResponse`, `PublishStockImageInput`, `StatusUpdateInput` y `StatusUpdateResponse`.
Importe esos tipos. No copie las formas a mano.

## Frontend

### Resumen

| # | Qué hacer | Sección |
|---|---|---|
| 1 | Revisar el panel «Importar noticias» que se agregó en `/admin` | F1 |
| 2 | **Agregar al editor la búsqueda de imágenes de banco** para una noticia sin foto | F2 |
| 3 | **Agregar al listado del portal el cambio de estado** de una noticia | F3 |
| 4 | Mostrar el autor y la licencia de una imagen de banco en el lector | F4 |

### F1. Panel de importación

Backend agregó un panel pequeño para usar la importación mientras no hay una pantalla definitiva:

- `src/components/admin/ArticleImport/`: un campo de archivo `.json`, un botón y la lista de resultados.
- `src/app/admin/page.tsx`: muestra el panel debajo de `EditorialDesk`, solo con sesión.

Estos archivos son de Frontend. Revíselos en el PR. Puede cambiar su diseño o moverlo a otro lugar.

Cómo usa el panel el endpoint:

1. Lea el archivo y conviértalo con `JSON.parse`. Si falla, avise sin llamar al servidor.
2. Envíe el contenido:

   ```ts
   const response = await fetch("/api/admin/articles/import", {
     method: "POST",
     headers: { "content-type": "application/json" },
     body: JSON.stringify({ items }), // de 1 a 20 noticias
   });
   ```

3. Con 200, `data` es `{ published, failed, results }`. Cada resultado es `{ index, id }` (publicada) o
   `{ index, fields }` (con errores). Muestre una línea por noticia.
4. Con 422, `items` no es una lista, está vacía o tiene más de 20 noticias. Muestre `fields.items`.

Cada noticia lleva los mismos campos que `PublishArticleInput`, sin `reviewNote` ni `reviewConfirmed`: el servidor los
pone. Un campo que no está permitido es un error de esa noticia. El formato completo y un ejemplo de archivo están en
la sección «`POST /api/admin/articles/import`» de [portal-admin.md](specs/backend/portal-admin.md).

### F2. Imágenes de banco en el editor

Cuando el editor no sube una foto, el portal puede ofrecer imágenes de Pixabay (`RF-17`, D-23, D-33).

1. Agregue en el paso 1 un campo de búsqueda, por ejemplo «Buscar imagen ilustrativa».
2. Envíe la búsqueda:

   ```ts
   const response = await fetch("/api/admin/images/preview", {
     method: "POST",
     headers: { "content-type": "application/json" },
     body: JSON.stringify({ query }),
   });
   ```

3. Con 200, muestre `data.candidates` en una cuadrícula con `previewUrl`, `author` y `type`.
4. Muestre siempre que las imágenes vienen de Pixabay, con un enlace a `data.licenseUrl` (D-33).
5. Si `data.suggestedId` no es `null`, marque esa candidata como «Sugerida». Hoy siempre es `null`: ver la sección
   I1.
6. Cuando el editor elija una, pídale el texto alternativo y guarde el id en el borrador.
7. Al publicar, envíe:

   ```ts
   image: { pixabayId: candidata.id, alt: textoAlternativo }
   ```

   No envíe la URL, el autor ni la licencia: el servidor los toma de Pixabay.
8. Muestre los errores:

   | Respuesta | Qué mostrar |
   |---|---|
   | 422 con `fields.query` | El mensaje junto al campo de búsqueda |
   | 422 con `fields["image.pixabayId"]` | El mensaje junto a la imagen. Pida elegir otra |
   | 422 con `fields["image.alt"]` | El mensaje junto al texto alternativo |
   | 503 | «No se pudo buscar imágenes». El editor puede publicar sin imagen |

`previewUrl` sirve solo para la vista previa. No la guarde: Pixabay no permite enlazarla de forma permanente.

Agregue `image.pixabayId` al mapa de errores de `EditorialDesk`, en el paso 1, igual que `image.uploadId`.

### F3. Cambiar el estado de una noticia

En el listado del portal, agregue a cada noticia una acción «Cambiar estado» (RT-03, RT-04):

1. Pida el estado nuevo (`confirmed`, `developing` o `unconfirmed`) y una razón. Los dos son obligatorios.
2. Envíe:

   ```ts
   const response = await fetch(`/api/admin/articles/${id}`, {
     method: "PATCH",
     headers: { "content-type": "application/json" },
     body: JSON.stringify({ status, reviewNote }),
   });
   ```

3. Con 200, actualice la noticia en el listado con `data.status`.
4. Con 422, muestre `fields.status` o `fields.reviewNote`. El servidor rechaza `confirmed` si la noticia tiene menos
   de dos fuentes.
5. Con 404, quite la noticia del listado.

Solo cambian el estado y la razón. El título, el contenido, las fuentes y la imagen no se editan.

### F4. Imagen de banco en el lector

Una imagen de banco llega con `origin: "stock"`, `label: "Imagen ilustrativa"`, `author`, `license` y `sourceUrl`
(la página en Pixabay).

- Muestre `label` sobre la imagen, igual que con las demás (`RF-18`).
- Muestre el autor y un enlace a `sourceUrl`, por ejemplo «Foto: autor, en Pixabay».

## IA

### Resumen

| # | Qué hacer | Sección |
|---|---|---|
| 1 | **Escribir `elegirImagen`** y conectarla en `searchStockImages` | I1 |
| 2 | Cargar `PIXABAY_API_KEY` en Vercel | I2 |
| 3 | Usar el endpoint de búsqueda para armar la prueba de 10 noticias | I3 |

### I1. Conectar `elegirImagen`

El backend ya busca en Pixabay, descarta las candidatas con la etiqueta «ai generado» y copia la elegida al bucket.
Falta la sugerencia del modelo.

- **Dónde:** `searchStockImages` en `src/lib/services/images.ts` devuelve hoy `suggestedId: null`. Cambie esa
  línea por la llamada a `elegirImagen` desde `src/lib/ia/imagenes.ts`.
- **Entrada:** las candidatas ya filtradas, con `id`, `type` y `tags` (`StockImageCandidate`). Pixabay no trae
  descripción.
- **Salida:** un id de la lista, o `null`, con una razón corta. Descarte un id que no esté en la lista.
- **Contexto de la noticia:** hoy el cuerpo de `/api/admin/images/preview` solo trae `query`. Para que el modelo lea
  el título y la entradilla, acuerde con Backend agregar `article: { title, summary }` al cuerpo. Frontend lo enviaría
  desde el borrador.
- **Lo que el modelo sigue revisando (RT-05):** personas reconocibles ajenas a la noticia, y lugares, banderas o
  logos de otra región. La etiqueta «ai generado» ya la filtra el backend.
- **Costo:** registre cada llamada con `src/lib/ia/cost.ts`. `"elegirImagen"` ya está en `AiFunction`.
- **Si el modelo falla:** devuelva `null`. El administrador elige sin sugerencia y la búsqueda no debe responder 503.

### I2. Llave de Pixabay

Según [imagenes.md](specs/ia/imagenes.md), usted carga `PIXABAY_API_KEY` en Vercel. Sin la llave, la búsqueda
responde 503 en la preview y en producción. El nombre ya está en `.env.example`.

### I3. Prueba de 10 noticias

Para armar la prueba con candidatas reales, use el endpoint desde la consola de `/admin`:

```js
const r = await fetch("/api/admin/images/preview", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ query: "remesas" }),
}).then((res) => res.json());
console.log(r.data.candidates.map((c) => [c.id, c.type, c.tags.join(", ")]));
```

La misma búsqueda queda en caché 24 horas: repetirla no gasta el límite de Pixabay.

## Lo que no cambia

- El modelo no cambia el estado ni publica (`RT-04`). `PATCH /api/admin/articles/[id]` es solo para administradores.
- La carga masiva aprueba cada noticia con la razón «Aprobado». Si la parte de IA genera texto para publicar, ese
  texto va con `contentType: "ai_contribution"` y lo revisa una persona antes de importarlo.
