# Imágenes

Una noticia sin imagen recibe una imagen adecuada desde el portal. Nunca se publica una imagen rota, y una imagen que
no es foto del hecho no se confunde con evidencia.

**Requisitos:** `RF-17`, `RF-18`, `RT-05` · **Bitácora:** [bitacora.md](../../docs/features/imagenes/bitacora.md) ·
**Decisiones:** D-23, D-33 · **Investigación (Notion):** [CIC-27](https://app.notion.com/p/3f4f573ce6df81249b7dd2fce334a4ee) ·
**Responsable:** Rodrigo Mansilla (IA). Ruta y bucket: Gerardo Pineda. Pantalla: Sergio Orellana.

## Comportamiento actual

- El administrador sube su propia foto con `POST /api/admin/images` y la publica con su procedencia: `event_photo`
  (foto del hecho) o `illustrative`. La foto queda en el bucket `article-images` del script 002. Detalle en la sección
  «Backend» de [portal-admin.md](../backend/portal-admin.md).
- No hay recomendación de imagen para una noticia sin foto: `POST /api/admin/images/preview` no existe.
- La pantalla usa ilustraciones SVG locales de demo, escritas con asistencia de IA y etiquetadas así. No son
  fotografías del hecho.

## Criterios de aceptación

- **`RF-17`**: al guardar una noticia sin imagen, el portal ofrece candidatas del banco, muestra que vienen de Pixabay
  y sus condiciones de uso, y marca la que propone el modelo. Si no hay ninguna aceptable, el portal no publica una
  imagen rota.
- **`RF-18`**: toda imagen que no es foto del hecho lleva «Imagen ilustrativa» en el feed y en el lector. La etiqueta
  sale del origen guardado, no del modelo. No se publica una imagen sin origen declarado.
- **`RT-05`**: el modelo no propone candidatas con la etiqueta «ai generado», personas reconocibles ajenas a la
  noticia, ni lugares, banderas o logos de otra región.

## No incluido

- Generar imágenes con un modelo (D-23). Cuesta de 100 a más de 4 000 veces más por noticia que elegir de un banco
  (CIC-27).
- Leer las miniaturas con visión. Solo si las etiquetas no alcanzan en la prueba de 10 noticias.

## Dependencias

- Backend: `POST /api/admin/images/preview` busca en Pixabay con `lang=es` y `safesearch=true`, guarda la búsqueda en
  caché 24 horas y llama a `elegirImagen`. Al publicar, copia la imagen elegida al bucket del script 002, porque
  Pixabay no permite enlazar sus URLs de forma permanente (D-33).
- Datos: `articles.image` guarda el origen `stock`, el autor, `pageURL` y la licencia (Pixabay Content License).
- Infra: `PIXABAY_API_KEY`, variable de servidor. Rodrigo carga el valor en Vercel. El nombre va en `.env.example`.
- Frontend: la pantalla del portal con las candidatas, la sugerida y el aviso de Pixabay. La etiqueta en el feed y en
  el lector.
- `costos-ia`: `elegirImagen` registra su costo como el chat.

## Uso de IA en el producto

| Función | Modelo | Para qué | Alternativa más barata considerada | Costo estimado |
|---|---|---|---|---|
| `elegirImagen` | Claude Haiku 5.5 (D-30) | Proponer una candidata, o ninguna, leyendo el tipo y las etiquetas | El administrador elige sin sugerencia | USD 0.00015 por noticia |

## Done específico

- La prueba de 10 noticias con trampas da al menos 9 elecciones aceptables y ninguna persona reconocible ajena.

## Tareas

Están en el ticket [TKT-4](https://app.notion.com/p/3f5f573ce6df81feb6e3fb92c207a067) de la base [Tickets](https://app.notion.com/p/e7bcbe3443c343b2873a2b5b97eb474c) de Notion (D-28).

## Cambio en curso

### Buscar en Pixabay y copiar al bucket (backend, rama `feat/back-import`) · 2026-10-12

Requisitos: `RF-17`, `RF-18`, `RT-05`. Decisiones: D-23, D-33. Responsable: Gerardo Pineda.

- `POST /api/admin/images/preview` busca candidatas en Pixabay y descarta las que tienen la etiqueta «ai generado».
  Devuelve `suggestedId: null` hasta que exista `elegirImagen`. El contrato no cambia cuando llegue.
- `POST /api/admin/articles` acepta `image: { "pixabayId", "alt" }`. El servidor vuelve a pedir la imagen a Pixabay,
  la copia al bucket y guarda el autor, la página y la licencia que da Pixabay, no los del cliente.
- Detalle de los endpoints en la sección «Backend» de [portal-admin.md](../backend/portal-admin.md).

### Elegir la imagen con el modelo (rama `imagenes`, espera créditos)

Requisitos: `RF-17`, `RT-05`. Decisiones: D-23, D-33. Ticket: TKT-4. Ciclo: CIC-27.

- `src/lib/ia/imagenes.ts` exporta `elegirImagen`. Recibe la noticia (título, resumen, temas y regiones) y unas 10
  candidatas con su ID, su tipo (`photo`, `illustration` o `vector/svg`) y sus etiquetas. Pixabay no trae descripción.
- Devuelve el ID elegido, o ninguno, con una razón corta. El servidor descarta un ID que no estaba en la lista.
- Criterios de rechazo: la etiqueta «ai generado», personas reconocibles ajenas a la noticia, lugares, banderas o logos
  de otra región, y escenas que podrían pasar por el hecho real. Buscar solo «ai» da falsos positivos (CIC-27).
- Si hay empate, se prefiere una ilustración o un vector: nadie los confunde con una foto del hecho. La prueba decide.
- **Prueba:** 10 noticias de ejemplo con trampas y candidatas reales de Pixabay. Se arma antes de comprar créditos.
- **Hecho (2026-10-12):** `elegirImagen(article, candidates)` en `src/lib/ia/imagenes.ts`, con pruebas simuladas en
  `imagenes.test.mjs`. Nunca lanza: ante un fallo, el tope de gasto o un ID ajeno devuelve `id: null`. Quedó
  conectada en `searchStockImages`, y el cuerpo de la preview acepta `article: { title, summary }`. Frontend debe enviarlo.
  La prueba de 10 noticias con el modelo real sigue pendiente.
