# Feed y lector

**Requisitos:** RF-01, RF-08, RF-09, RF-11, RF-18, RT-01, RT-02, RT-06.
**Responsable:** Sergio Orellana (interfaz). Datos: Backend. Recomendación: IA (D-20).
**Bitácora:** [registro](../docs/features/feed-y-lector/bitacora.md).
**Investigación:** [documento de traslado](../notion-frontend.md). ID de Notion pendiente.

## Comportamiento actual

La interfaz contiene una portada pública, edición con cuatro prominencias y lector de noticias ficticias.
El chat y la edición tienen rutas separadas. La raíz con sesión dirige a `/chat`.
Hay rutas de temas, búsqueda y Guardados. Guardados informa integración pendiente, sin simular persistencia.
El lector incluye bloques tipados, firma ficticia, compartir y relacionados de demo. No hay endpoints de noticias conectados.

### Backend

Responsable: Gerardo Pineda. El código está en la rama `feat/back-chat`. Todavía no llega a `dev`: la pantalla no
lo usa. El lector usa `GET /api/articles/[id]`, documentado en [portal-admin](portal-admin.md).

#### `GET /api/feed`

Feed personalizado del lector (ficha 4 de [notion-frontend.md](../notion-frontend.md)). Cualquier cuenta con sesión.
El servicio lee las noticias, el perfil y las señales del lector. El orden, la prominencia, el motivo y los pesos de
los temas los calcula el recomendador (`buildFeed` y `topicWeights` de `src/lib/recomendacion/feed.ts`, D-20, D-31).
No llama a ningún modelo (`RP-03`). La región sale del perfil guardado, nunca de la URL (`RF-04`).

| Parámetro | Regla |
|---|---|
| `topic` | Slug de un tema del catálogo. Filtra `items`. `importantItems` no cambia (`RF-11`) |
| `limit` | De 1 a 50. Por defecto, 20 |
| `cursor` | El `meta.nextCursor` de la página anterior. `null` indica que no hay otra página |

Cada elemento de `items` e `importantItems` tiene:

| Campo | Contenido |
|---|---|
| `article` | La noticia como `ArticleSummary` |
| `prominence` | `hero`, `large`, `standard` o `compact`. Sale de la posición en el orden |
| `reason` | Frase con los componentes que más aportaron, por ejemplo «Destacada porque es relevante para tu país…» |
| `components` | Aporte de `region`, `interest`, `recency` e `importance`. Su suma es el puntaje (`RT-01`). No estaba en el contrato |

| Status | `code` | Cuándo |
|---|---|---|
| 200 | | `data` tiene `items` e `importantItems`. `meta.nextCursor` lleva a la página siguiente |
| 400 | `INVALID_FILTER` | `topic` o `limit` no son válidos |
| 400 | `INVALID_CURSOR` | El cursor no es uno que devolvió este endpoint |
| 401 | `UNAUTHORIZED` | No hay sesión |
| 503 | `SERVICE_UNAVAILABLE` | La base no respondió |

Límites conocidos:

- Solo entran al cálculo las 200 noticias más recientes. La recencia pierde la mitad cada 24 horas.
- El orden se recalcula en cada página. Si llega una noticia nueva entre dos páginas, una puede repetirse o faltar.
- `importantItems` va completo en todas las páginas.

#### Probar el feed

Requisitos: `npm run dev`, una sesión de administrador y el perfil con una región guardada
([ubicacion-y-perfil](ubicacion-y-perfil.md)). El código publica cuatro noticias `[PRUEBA]` y pide el feed:

```js
const cat = (await (await fetch("/api/catalogs")).json()).data;
const region = (slug) => cat.regions.find((r) => r.slug === slug).id;
const topic = (slug) => cat.topics.find((t) => t.slug === slug).id;
const publish = async (title, regionSlug, topicSlug, important) => {
  const r = await fetch("/api/admin/articles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "[PRUEBA] " + title,
      summary: "Entradilla de prueba.",
      body: [{ type: "paragraph", text: "Contenido de prueba." }],
      sources: [{ name: "Fuente de prueba", url: "https://example.org/" }],
      publishedAt: new Date().toISOString(),
      topicIds: [topic(topicSlug)],
      regionIds: [region(regionSlug)],
      status: "developing",
      contentType: "original",
      reviewNote: "Prueba del feed.",
      important,
      imageCandidateId: null,
      reviewConfirmed: true,
    }),
  });
  console.log("publicar", title, r.status);
};
await publish("Guatemala y tecnología", "guatemala", "tecnologia", false);
await publish("Costa Rica y finanzas", "costa-rica", "finanzas", false);
await publish("Internacional importante", "internacional", "economia", true);
await publish("Honduras y economía", "honduras", "economia", false);
const feed = async (qs = "") => {
  const r = await fetch("/api/feed" + qs);
  const j = await r.json();
  console.log(qs || "(sin filtros)", r.status, j);
  return j;
};
const all = await feed();
console.table(all.data.items.map((i) => ({ titulo: i.article.title, prominencia: i.prominence, motivo: i.reason })));
await feed("?topic=finanzas");
await feed("?limit=2");
await feed("?topic=no-existe");
await feed("?cursor=basura");
```

Resultado: cuatro `201`, tres `200` y dos `400`. La noticia de la región del perfil queda primera. Borre las
noticias de prueba en el SQL Editor: `delete from public.articles where title like '[PRUEBA]%';`.

#### Pruebas registradas

| Fecha | Dónde | Qué se hizo y qué se vio | Resultado |
|---|---|---|---|
| 2026-10-10 | Local, sin sesión | `GET /api/feed`: 401 `UNAUTHORIZED` | Pasó |
| 2026-10-10 | Local, sesión de administrador con perfil Guatemala, tema Tecnología y una apertura de Economía | Cinco noticias en tres niveles: `hero` la de Guatemala y Tecnología, `large` dos de Economía (una importante) y `standard` dos. Cada una con motivo. `?topic=finanzas` y `?limit=2`: 200. `topic` y `cursor` inválidos: 400 | Pasó |

Observación para `recomendacion`: con una sola apertura, Economía pesó más que Tecnología, el tema elegido.
`topicWeights` normaliza las señales al máximo: una apertura vale 1 y un tema elegido vale 0.5.

Pendiente: prueba con dos cuentas de regiones distintas (`RF-08`), con 10 noticias o más para ver `compact`, en la
preview de Vercel y con la pantalla conectada.

## Criterios de aceptación

- Mostrar cuatro niveles de tarjeta y conservar el bloque de información importante al filtrar.
- Mostrar contenido completo, fuentes, fecha, estado, tipo y origen de imagen al abrir una noticia.
- Verificar la sesión en el servidor antes de entregar la pantalla.
- Probar carga, vacío, error, desconexión y navegación con teclado en teléfono y escritorio.
- La demo debe identificarse y no acreditar personalización ni publicación reales.

## No incluido

Recomendador, base de datos, llamadas a modelos, caché privada y cambios de infraestructura.

## Dependencias

GET `/api/feed` y GET `/api/articles/[id]`: contratos propuestos a Gerardo.
GET `/api/articles` cubre la búsqueda propuesta. Los contratos de Guardados también permanecen pendientes.
El backend entregará el nivel y el motivo. El frontend no calcula el score.
Los tipos locales de demostración no son contratos publicados en `src/types/`.

## Uso de IA en el producto

Ninguno en esta entrega. La demo no llama a modelos.

## Done específico

Probar con iPhone y Android instalados. Integrar el contrato aprobado y retirar los ejemplos antes del cierre funcional.

## Tareas

| Estado | Tarea | Req. | Evidencia |
|---|---|---|---|
| En curso | Identidad editorial, navegación y cuatro variantes de tarjeta | RF-01, RF-08 | Código escrito. [Verificación local](../notion-frontend.md#registro-honesto). Pruebas con sesión y móviles pendientes |
| En curso | Lector, fuentes, estados e ilustraciones identificadas | RF-09, RF-18, RT-02, RT-06 | Código escrito. Acceso anónimo comprobado. Lectura con sesión pendiente |
| Pendiente | Conectar feed y lector a Backend | RF-08, RF-09, RF-11, RT-01 | Endpoints pendientes |
| En curso | Separar edición, temas y chat con navegación común | RF-01, RF-07, RF-08 | Rutas implementadas. [Evidencia local](../notion-frontend.md#registro-honesto). Navegación con sesión pendiente |
| En curso | Ampliar lectura, compartir y estados de ruta accesibles | RF-09, RF-05 | Código implementado. Compartir y recorrer con sesión pendientes |
| En curso | Búsqueda de demo y pantalla de Guardados sin persistencia | Ampliación solicitada, ID pendiente | Código implementado. Pruebas con sesión y requisito formal pendientes |

## Cambio en curso

2026-10-09: implementar The Meridian Times en `front/experiencia-editorial-meridian`.
Usar Georgia para titulares e Inter para controles. Mantener CSS Modules, tokens y el breakpoint de 40rem.
La demostración usa escenarios fijos de región, nunca un recomendador presentado como real.
El contexto React conserva datos solo durante la vida de la pestaña y reinicia al cambiar la identidad.
La portada pública no muestra datos de cuentas ni noticias privadas.
El compositor permanece en el panel de chat. La conversación tiene desplazamiento propio y ya no prolonga la edición.
La instrucción inicial de no ejecutar fue reemplazada el 2026-10-09: el usuario autoriza tipos, lint, build y revisión local.

El conjunto constituye una primera demo navegable con sesión compartida entre lector, perfil y portal.
Si el PR supera 400 líneas, su descripción justificará esta unidad de revisión y señalará los módulos por recorrido.
No se fusionará sin las pruebas exigidas.

### Evolución editorial aprobada

2026-10-09: mantener la identidad existente y separar `/chat`, `/edicion`, `/temas/[slug]`, `/buscar` y `/guardados`.
La raíz autenticada dirige al chat para conservar RF-07. Todas las rutas privadas comprueban sesión en servidor.
El layout compartido presenta cabecera, navegación activa, pie y estados de ruta. No se modifica el DAL.
La búsqueda usa fixtures identificados. Su URL conserva `q`, `topic` y `sort`. Los temas salen del catálogo de demo.
Guardados muestra integración pendiente y nunca confirma una escritura. Búsqueda y Guardados son ampliaciones solicitadas, pendientes de requisito formal del equipo.
El lector utiliza bloques de texto tipados, firma ficticia, compartir y relacionados de demo. No representa HTML arbitrario.
La búsqueda acota el texto presentado a 200 caracteres y admite orden reciente o antiguo.
La privacidad explica que sus parámetros pueden quedar en el historial del navegador y en los enlaces compartidos.
El frontend no calcula recomendaciones reales ni llama a endpoints inexistentes.
Cada subagente recibe archivos exclusivos. La documentación de contratos vive en `notion-frontend.md`.
La fase de implementación quedó sin staging ni commits. La entrega posterior autoriza commits locales separados, sin push ni merge automático.
El código y los resultados técnicos se registran en [Verificación y presentación](../notion-frontend.md#registro-honesto).
El usuario pidió dejar todas las pruebas con sesión pendientes. Ninguna tarea funcional se marca Done.

### Preparación de entrega local

2026-10-09, RPR-03 y RF-05: el usuario solicita Conventional Commits separados y una guía para publicar mediante `dev` y `main`.
Antes de modificar `.gitignore`, se define excluir `.agents/` y `skills-lock.json`, que son instalaciones locales.
Las skills de documentación ya versionadas en `.claude/skills/` se conservan conforme a D-18.
Se revisarán los archivos de cada commit, las exclusiones y el estado final de Git. No se incluirán archivos de entorno.
La documentación quedará en commits separados para trasladarla directamente a `dev` antes del PR de código, conforme a D-21.
La referencia remota incorpora D-27 y exige tickets de Notion. Sus IDs no se inventarán si la base no es accesible.
La guía y los límites de publicación se registran en `notion-frontend.md`. Esta preparación no acredita Done ni despliegue.
