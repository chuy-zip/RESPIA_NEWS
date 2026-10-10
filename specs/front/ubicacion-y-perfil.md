# Ubicación y perfil

**Requisitos:** RF-04, RF-06. Señales de RF-10: dependencia de recomendación (D-20).
**Responsable:** Sergio Orellana (interfaz).
**Bitácora:** [registro](../../docs/features/ubicacion-y-perfil/bitacora.md).
**Investigación:** [traslado a Notion](notion-frontend.md).

## Comportamiento actual

Existe un selector de región y un perfil de demostración en memoria. No hay persistencia de perfil de noticias.
La pantalla comparte el marco editorial y agrupa cuenta, región, instalación y enlace a Guardados.
No permite editar la identidad de Google. El tema sigue la configuración del dispositivo.

### Backend

Responsable: Gerardo Pineda. El código está en la rama `feat/back-chat`. Todavía no llega a `dev`: la pantalla no
lo usa. Los tipos están en `src/types/profile.ts`. Siguen las fichas 2 y 3 de [notion-frontend.md](notion-frontend.md),
más los temas elegidos de D-32: `topicIds` no estaba en el contrato.

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
| `type` | Solo `open`. `chat` se habilita cuando exista el chat |
| `eventId` | Texto de 100 caracteres como máximo. Obligatorio por el contrato, pero no se guarda |

La señal cuenta una vez por lector, noticia y tipo. Si ya existía, la respuesta es `duplicate: true` y no se
guarda otra. El cliente no envía ningún peso: el recomendador lo calcula con la fecha de la señal.

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

Pendiente: prueba con una cuenta común, prueba en la preview de Vercel, conexión de la pantalla y actualización
de `/privacidad`.

## Criterios de aceptación

Cambiar entre escenarios de región sin solicitar GPS. Mantener la selección al navegar dentro de la demo.
Explicar que se pierde al recargar. Mostrar lecturas de ejemplo sin presentarlas como intereses inferidos.
La integración real debe guardar la región y actualizar privacidad conforme al esquema aprobado.

## No incluido

Persistencia, GPS, edición de identidad y cálculo de intereses.

## Dependencias

GET `/api/catalogs`, GET/PATCH `/api/profile` y POST `/api/interactions`, propuestos a Backend.

## Uso de IA en el producto

Ninguno.

## Done específico

Comprobar cambio de región con dos cuentas y datos reales después de integrar Backend.

## Tareas

| Estado | Tarea | Req. | Evidencia |
|---|---|---|---|
| En curso | Selector, perfil y explicación de datos temporales | RF-04, RF-06 | Código unificado. [Verificación local](notion-frontend.md#registro-honesto). Pruebas con sesión pendientes |
| Pendiente | Guardar región y enviar señales según contrato aprobado | RF-04, RF-10 | Backend y recomendación pendientes |

## Cambio en curso

2026-10-09: añadir perfil protegido y selector compartido mediante estado en memoria.
Las lecturas se deduplican por ID durante la demo. No se envían eventos ni preguntas a un servicio.
La privacidad distingue esta memoria temporal de la futura persistencia y explica los parámetros de búsqueda en la URL.

2026-10-09: integrar perfil y acceso requerido en el marco editorial compartido.
Agrupar cuenta, región, instalación y enlace a Guardados. No crear edición de identidad ni preferencias sin servicio.
Los formularios conservan etiquetas, foco y estados accesibles. El usuario autoriza verificaciones locales.
No se guarda ningún dato nuevo en el servidor ni se modifica la autenticación. La implementación quedó sin commits. La entrega posterior autoriza commits locales separados.
El acceso anónimo se comprobó en producción local. La región, la cuenta y la instalación con sesión quedan pendientes por petición del usuario.
La evidencia de esta revisión se conserva en [el registro local](notion-frontend.md#registro-honesto).
