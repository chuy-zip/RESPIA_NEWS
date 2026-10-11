# Ubicación y perfil

**Requisitos:** RF-04, RF-06. Señales de RF-10: dependencia de recomendación (D-20).
**Responsable:** Sergio Orellana (interfaz).
**Bitácora:** [registro](../../docs/features/ubicacion-y-perfil/bitacora.md).
**Investigación:** [traslado a Notion](notion-frontend.md).

## Comportamiento actual

El selector y el perfil consultan catálogos reales y guardan región y temas en la cuenta mediante PATCH.
La pantalla confirma la respuesta del servidor. Un error conserva la selección pendiente.
La pantalla comparte el marco editorial y agrupa cuenta, región, instalación y enlace a Guardados.
No permite editar la identidad de Google. El tema sigue la configuración del dispositivo.

### Backend

Responsable: Gerardo Pineda. Los endpoints están incorporados en esta rama y la pantalla los consume.
Se reutilizan los tipos de `src/types/profile.ts`, incluidos los temas elegidos de D-32.

Las tablas están en `supabase/migrations/004_reader_profile.sql`: `profiles`, `reader_topics` e `interactions`. El
script se ejecutó en Supabase el 2026-10-10, antes de llegar a `main` (excepción a la regla 10 de `AGENTS.md`). No
lo edite: un cambio va en un script nuevo. Cada lector solo lee y cambia sus propias filas.

> **Atención:** el perfil guarda la región y los temas del lector. `/privacidad` debe decirlo antes de que otros
> lectores usen la función (regla 11 de `AGENTS.md`, `RF-06`).

#### `GET /api/profile` y `PATCH /api/profile`

Cualquier cuenta con sesión. La identidad sale de la sesión: el cuerpo nunca lleva un id de usuario.

`GET` devuelve `{ "regionId": <uuid> | null, "topicIds": [<uuid>] }`. `regionId` es `null` mientras el lector no
elige región.

`PATCH` acepta uno de los dos campos, o los dos:

| Campo | Regla |
|---|---|
| `regionId` | Un id de `regions` de `GET /api/catalogs` |
| `topicIds` | Ids de `topics` de `GET /api/catalogs`. Reemplaza la lista completa. `[]` quita todos los temas |

Un campo que no se envía no cambia. La respuesta es el perfil completo después de guardar.

| Status | `code` | Cuándo |
|---|---|---|
| 200 | | `data` es el perfil |
| 400 | `INVALID_BODY` | El cuerpo no es JSON |
| 401 | `UNAUTHORIZED` | No hay sesión |
| 422 | `VALIDATION_ERROR` | El cuerpo está vacío, o una región o un tema no existen. `fields` dice cuál |
| 503 | `SERVICE_UNAVAILABLE` | La base no respondió |

#### `POST /api/interactions`

Registra que el lector abrió una noticia (`RF-10`). El recomendador usa la señal para inferir sus intereses (D-31).
Cualquier cuenta con sesión.

| Campo | Regla |
|---|---|
| `articleId` | Id de una noticia publicada |
| `type` | Solo `open`. La señal `chat` se registra dentro de POST `/api/chat`, no en esta ruta |
| `eventId` | Texto de 100 caracteres como máximo. Obligatorio por el contrato, pero no se guarda |

La señal cuenta una vez por lector, noticia y tipo. Si ya existía, la respuesta es `duplicate: true` y no se
guarda otra. El cliente no envía ningún peso: el recomendador lo calcula con la fecha de la señal.
Preguntar desde una noticia envía su `articleId` al chat. Consultar el título para mostrar ese contexto no genera una apertura.
El frontend no envía una segunda petición para la señal `chat`. `/privacidad` explica su uso en la personalización.

| Status | `code` | Cuándo |
|---|---|---|
| 200 | | `data` es `{ "accepted": true, "duplicate": <bool> }` |
| 400 | `INVALID_BODY` | El cuerpo no es JSON |
| 401 | `UNAUTHORIZED` | No hay sesión |
| 404 | `ARTICLE_NOT_FOUND` | La noticia no existe, o el id no es un UUID |
| 422 | `VALIDATION_ERROR` | Falta un campo o el tipo no es `open`. `fields` dice cuál |
| 503 | `SERVICE_UNAVAILABLE` | La base no respondió |

#### Probar el perfil

Requisitos: `npm run dev` y una sesión con cualquier cuenta. Abra la consola del navegador y pegue:

```js
const cat = (await (await fetch("/api/catalogs")).json()).data;
const call = async (method, body) => {
  const r = await fetch("/api/profile", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body && JSON.stringify(body),
  });
  console.log(method, JSON.stringify(body ?? ""), r.status, await r.json());
};
await call("GET");
await call("PATCH", { regionId: cat.regions[3].id });
await call("PATCH", { topicIds: [cat.topics[0].id, cat.topics[1].id] });
await call("PATCH", { topicIds: [cat.topics[2].id] });
await call("GET");
await call("PATCH", { regionId: "no-existe" });
await call("PATCH", {});
```

Resultado: cinco `200` y dos `422`. El último `GET` tiene la región y un solo tema.

Para probar las señales, pegue este código. Necesita una noticia publicada:

```js
const first = (await (await fetch("/api/admin/articles?limit=1")).json()).data.items[0];
const signal = async (body) => {
  const r = await fetch("/api/interactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  console.log(JSON.stringify(body), r.status, await r.json());
};
await signal({ articleId: first.id, type: "open", eventId: "e1" });
await signal({ articleId: first.id, type: "open", eventId: "e2" });
await signal({ articleId: "00000000-0000-0000-0000-000000000000", type: "open", eventId: "e3" });
await signal({ articleId: first.id, type: "chat", eventId: "e4" });
await signal({ articleId: first.id, type: "open" });
```

Resultado: `200` con `duplicate: false`, `200` con `duplicate: true`, `404` y dos `422`. La tabla `interactions`
tiene una sola fila para esa noticia.

#### Pruebas registradas

| Fecha | Dónde | Qué se hizo y qué se vio | Resultado |
|---|---|---|---|
| 2026-10-10 | Local, sin sesión | `GET` y `PATCH /api/profile`: 401 `UNAUTHORIZED` | Pasó |
| 2026-10-10 | Local, sesión de administrador | Perfil vacío al inicio. Región guardada. Dos temas y luego uno: la lista se reemplaza. El `GET` final conserva la región y un tema. 422 con región inexistente y con cuerpo vacío | Pasó |
| 2026-10-10 | Local, sesión de administrador | `POST /api/interactions`: 200 con `duplicate: false` la primera vez y `duplicate: true` la segunda. 404 con una noticia inexistente. 422 con `type: chat` y sin `eventId` | Pasó |

La pantalla está conectada y `/privacidad` describe los datos guardados. Pendiente: prueba de esta integración
con una cuenta común y en Vercel. Las pruebas anteriores de Backend no validan la pantalla nueva.

## Criterios de aceptación

Elegir región sin solicitar GPS. Guardar región y temas en la cuenta y conservarlos después de recargar.
Confirmar solo los valores que devuelve el servidor y mantener el borrador si falla el guardado.
Registrar la apertura sin bloquear la lectura. Explicar perfil, señales y personalización en privacidad.

## No incluido

Cambios en el servicio de persistencia, GPS, edición de identidad y cálculo de intereses.

## Dependencias

GET `/api/catalogs`, GET/PATCH `/api/profile` y POST `/api/interactions` ya están conectados.
La deduplicación persistente de aperturas corresponde al servidor. No se guarda historial privado en el navegador.

## Uso de IA en el producto

Ninguno.

## Done específico

Comprobar cambio de región con dos cuentas y datos reales después de integrar Backend.

## Tareas

| Estado | Tarea | Req. | Evidencia |
|---|---|---|---|
| En curso | Selector, perfil y explicación de datos guardados | RF-04, RF-06 | Código y privacidad actualizados. [Validación técnica](feed-y-lector.md#validación-de-integración-2026-10-10). Prueba con sesión pendiente |
| En curso | Guardar región y temas y enviar aperturas | RF-04, RF-10 | Servicios conectados. Persistencia, deduplicación y efecto en el feed pendientes de prueba en Vercel |

## Cambio en curso

### Señal del chat desde una noticia · 2026-10-10

Requisitos: RF-06 y RF-10. El usuario aprobó conectar el contexto de una noticia sin cambiar el contrato de interacciones.
Se documentará la señal `chat` en privacidad. Solo el servidor la registra al recibir `articleId` en POST `/api/chat`.
La consulta del título no envía `open`. La interfaz actualizará el feed después de la pregunta contextual.
El [registro del chat](feed-y-lector.md#validación-del-contexto-del-chat-2026-10-10) conservará la evidencia local.
La comprobación con cuentas y datos reales queda pendiente. No se ejecutará en esta entrega.

### Integración con servicios · 2026-10-10

Requisitos: RF-04, RF-06 y señales de RF-10. Ticket pendiente de asignación.
Se cargarán región y temas desde GET /api/profile y GET /api/catalogs. PATCH guardará solo los valores elegidos.
La interfaz confirmará la respuesta del servidor, conservará los cambios pendientes ante errores y actualizará el feed.
Se retirará el historial ficticio. La conversación permanecerá en memoria y no se guardará en el navegador.
Privacidad describirá perfil, aperturas, publicación e imágenes y los componentes del recomendador.
El usuario confirmó que Google funciona en Vercel. Esa observación no valida aún la integración del perfil.
Las pruebas funcionales y los teléfonos quedan a cargo del usuario en Vercel. No se levantará localhost ni se harán commits.

Los registros del 2026-10-09 que siguen son históricos. Esta integración reemplaza el perfil de demo.

2026-10-09: añadir perfil protegido y selector compartido mediante estado en memoria.
Las lecturas se deduplican por ID durante la demo. No se envían eventos ni preguntas a un servicio.
La privacidad distingue esta memoria temporal de la futura persistencia y explica los parámetros de búsqueda en la URL.

2026-10-09: integrar perfil y acceso requerido en el marco editorial compartido.
Agrupar cuenta, región, instalación y enlace a Guardados. No crear edición de identidad ni preferencias sin servicio.
Los formularios conservan etiquetas, foco y estados accesibles. El usuario autoriza verificaciones locales.
No se guarda ningún dato nuevo en el servidor ni se modifica la autenticación. La implementación quedó sin commits. La entrega posterior autoriza commits locales separados.
El acceso anónimo se comprobó en producción local. La región, la cuenta y la instalación con sesión quedan pendientes por petición del usuario.
La evidencia de esta revisión se conserva en [el registro local](notion-frontend.md#registro-honesto).
