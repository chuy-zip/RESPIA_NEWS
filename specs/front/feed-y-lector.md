# Feed y lector

**Requisitos:** RF-01, RF-08, RF-09, RF-11, RF-18, RT-01, RT-02, RT-06.
**Responsable:** Sergio Orellana (interfaz). Datos: Backend. Recomendación: IA (D-20).
**Bitácora:** [registro](../../docs/features/feed-y-lector/bitacora.md).
**Investigación:** [documento de traslado](notion-frontend.md). ID de Notion pendiente.

## Comportamiento actual

La interfaz contiene una portada pública, edición con cuatro prominencias y lector de noticias publicadas.
El chat y la edición tienen rutas separadas. La raíz con sesión dirige a `/chat`.
Los temas salen del catálogo real. Búsqueda y Guardados informan integración pendiente y no envían peticiones.
El lector muestra bloques tipados, fuentes, estado, imagen y autor cuando existen. Comparte el enlace real.
El backend ya entrega `relatedArticles`. Su presentación en el lector sigue pendiente y no forma parte del ajuste del chat.
Se retiraron los fixtures y los controles de simulación.
El contexto `ReaderSession` conserva catálogo, perfil y conversación en memoria. Se reinicia al cambiar la identidad.
Los formularios y las lecturas usan los contratos compartidos de `src/types/` y las cookies del mismo origen.
El lector abre `/chat?articleId=<id>`. El chat comprueba la noticia y muestra su título antes de permitir una pregunta contextual.
Un contexto en carga, inválido o inaccesible impide enviar. La consulta de título no registra otra apertura.
Cada pregunta contextual lleva `articleId`. El servidor registra la señal `chat`, sin otra petición de interacciones desde la pantalla.
La conversación permanece al cambiar de noticia. «Nueva conversación» borra mensajes y vuelve a `/chat` sin contexto.
Cambiar el contexto cancela peticiones pendientes. El feed se actualiza al terminar, incluso si falla o se cancela la respuesta.
La señal puede guardarse antes de ese fallo. Las animaciones solo afectan a envíos y respuestas nuevos y respetan el movimiento reducido.

### Backend

Responsable: Gerardo Pineda. Los endpoints están incorporados en esta rama y la pantalla los consume.
El lector usa `GET /api/articles/[id]`, documentado en [portal-admin](../backend/portal-admin.md).

#### `GET /api/feed`

Feed personalizado del lector (ficha 4 de [notion-frontend.md](notion-frontend.md)). Cualquier cuenta con sesión.
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
- No sustituir un servicio caído por noticias ficticias ni inventar metadatos ausentes.

## No incluido

Recomendador, base de datos, llamadas a modelos, caché privada y cambios de infraestructura.

## Dependencias

GET `/api/feed` y GET `/api/articles/[id]`: implementados por Backend y conectados en frontend.
GET `/api/articles` cubre la búsqueda propuesta. Los contratos de Guardados también permanecen pendientes.
El backend entregará el nivel y el motivo. El frontend no calcula el score.
Se reutilizan `ArticleSummary`, `ArticleDetail` y `FeedItem` de `src/types/`.

## Uso de IA en el producto

El feed no llama a modelos. El chat consume POST `/api/chat`, conectado al módulo de IA del servidor.
El código incluye respuestas con Anthropic, búsqueda externa y control de gasto. Su operación desplegada queda pendiente de prueba.
El contrato admite `answered`, `no_coverage`, `out_of_scope` y `unavailable`, además de 429 `AI_LIMIT_REACHED`.
La pantalla conserva las citas y etiquetas del servidor. El modelo no cambia el estado editorial.

## Done específico

Probar con iPhone y Android instalados y cuentas reales antes del cierre funcional.

## Tareas

| Estado | Tarea | Req. | Evidencia |
|---|---|---|---|
| En curso | Identidad editorial, navegación y cuatro variantes de tarjeta | RF-01, RF-08 | Código escrito. [Verificación local](notion-frontend.md#registro-honesto). Pruebas con sesión y móviles pendientes |
| En curso | Lector, fuentes, estados e ilustraciones identificadas | RF-09, RF-18, RT-02, RT-06 | Código escrito. Acceso anónimo comprobado. Lectura con sesión pendiente |
| En curso | Conectar feed y lector a Backend | RF-08, RF-09, RF-11, RT-01 | Código conectado. [Validación de integración](#validación-de-integración-2026-10-10). Prueba funcional pendiente |
| En curso | Separar edición, temas y chat con navegación común | RF-01, RF-07, RF-08 | Rutas implementadas. [Evidencia local](notion-frontend.md#registro-honesto). Navegación con sesión pendiente |
| En curso | Ampliar lectura, compartir y estados de ruta accesibles | RF-09, RF-05 | Código implementado. Compartir y recorrer con sesión pendientes |
| En curso | Informar el estado de Búsqueda y Guardados | Ampliación solicitada, ID pendiente | Ambas pantallas informan integración pendiente. Servicios y requisito formal pendientes |
| En curso | Conectar la conversación temporal al servidor | RF-07, RF-12, RF-13, RF-14 | Código conectado sin respuestas preparadas. Modelo incorporado. Pruebas funcionales pendientes |
| En curso | Preguntar desde una noticia y comunicar estados del chat | RF-07, RF-10, RF-12, RF-13, RF-14, RT-04, RT-06 | [Ajuste y verificación local](#validación-del-contexto-del-chat-2026-10-10). Sin prueba real ni cierre funcional |

## Cambio en curso

### Contexto del chat · 2026-10-10

Se conectará el lector con `/chat?articleId=<id>` mediante los contratos existentes.
El chat consultará el título de la noticia con GET `/api/articles/[id]` y mostrará el contexto antes de enviar.
Esa consulta no registra otra apertura. Cada pregunta contextual enviará `articleId` a POST `/api/chat`.
Solo el servicio del chat registra la señal `chat`. La interfaz actualizará el feed después de la consulta.
La conversación seguirá en memoria al cambiar de noticia. «Nueva conversación» borrará mensajes y contexto.
El envío manual conservará la pregunta ante un fallo. Los cambios de contexto cancelarán respuestas obsoletas.
Se añadirán estados explícitos, avisos accesibles y animaciones breves que respetan `prefers-reduced-motion`.
Requisitos: RF-07, RF-10, RF-12, RF-13, RF-14, RT-04 y RT-06. Ticket de frontend pendiente de asignación.
Se ejecutarán comprobaciones locales y pruebas con proveedores simulados. La validación real queda pendiente del usuario.
La instalación actualizará las dependencias del lockfile, sin cambiar versiones ni activar el script `prepare` de Git.
No se modifican servicios de Backend, modelos, SQL, autenticación ni infraestructura. No se hacen commits ni push.

### Integración con servicios · 2026-10-10

Requisitos: RF-01, RF-07, RF-08, RF-09, RF-11, RF-18, RT-01, RT-02, RT-06 y RPR-03. Ticket pendiente de asignación.
El usuario aprobó sustituir la demo por los endpoints presentes en esta rama, conservando la identidad editorial.
El feed usará el catálogo y la respuesta del servidor, incluidos motivo, prominencia, bloque importante y cursores.
El lector consultará la noticia real y registrará la apertura sin bloquear la lectura. No inventará relacionados ni metadatos.
El chat enviará preguntas y conversación temporal al endpoint existente. El modelo ya está incorporado tras la actualización de ramas.
Buscar y Guardados mostrarán integración pendiente. Se retirarán los escenarios y respuestas preparadas.
El trabajo se reparte entre agentes con archivos exclusivos. No se modifica Backend, autenticación, PWA ni SQL.
Se permiten typecheck, lint, build y validación documental, sin levantar localhost. El usuario probará en Vercel.
No se harán commits, staging, push, despliegues ni publicaciones reales. Los resultados funcionales siguen pendientes.

Los apartados fechados el 2026-10-09 describen entregas anteriores. La integración del 2026-10-10 sustituye sus datos de demo.

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
El código y los resultados técnicos se registran en [Verificación y presentación](notion-frontend.md#registro-honesto).
El usuario pidió dejar todas las pruebas con sesión pendientes. Ninguna tarea funcional se marca Done.

### Preparación de entrega local

2026-10-09, RPR-03 y RF-05: el usuario solicita Conventional Commits separados y una guía para publicar mediante `dev` y `main`.
Antes de modificar `.gitignore`, se define excluir `.agents/` y `skills-lock.json`, que son instalaciones locales.
Las skills de documentación ya versionadas en `.claude/skills/` se conservan conforme a D-18.
Se revisarán los archivos de cada commit, las exclusiones y el estado final de Git. No se incluirán archivos de entorno.
La documentación quedará en commits separados para trasladarla directamente a `dev` antes del PR de código, conforme a D-21.
La referencia remota incorpora D-27 y exige tickets de Notion. Sus IDs no se inventarán si la base no es accesible.
La guía y los límites de publicación se registran en `notion-frontend.md`. Esta preparación no acredita Done ni despliegue.

## Validación de integración 2026-10-10

Esta entrega conecta los endpoints disponibles. No declara Done de las funcionalidades.
El usuario ejecutará los recorridos con datos reales. Los agentes no levantan localhost, no ejecutan SQL y no publican noticias.
La evidencia previa de Google corresponde al reporte del usuario en Vercel, sin fecha de prueba confirmada.
No demuestra todavía la publicación, la personalización ni el chat conectado.

### Registro técnico

Entorno: Windows, rama `front/experiencia-editorial-meridian`. Fecha del registro: 2026-10-10.

| Verificación | Resultado | Límite |
|---|---|---|
| `npm run typecheck` | Pasó, salida 0 | No sustituye la prueba con sesión |
| `npm run lint` | Pasó, salida 0 | Sin desactivar reglas ni cambiar configuración |
| `npm run build` | Pasó, salida 0. Generó 20 páginas e incluyó las rutas de API y lector | El primer intento compiló pero falló con `spawn EPERM`. La repetición permitió el proceso hijo de TypeScript. No se levantó localhost |
| Cliente HTTP con `fetch` simulado | Pasaron seis escenarios: 201, éxito inesperado, 422 por campo, 401, fallo de red y cancelación | Node ejecutó el módulo en memoria, sin peticiones de red. Comprobó una sola petición al fallar, cookies del mismo origen y `no-store` |
| `validate_docs.py` en los cuatro documentos modificados | Pasó. Se corrigió un salto de nivel en un encabezado nuevo antes de repetir | Validación estructural y de enlaces. No acredita comportamiento de la aplicación |
| `node scripts/check-specs.mjs` | No pasó: 13 errores en archivos locales preexistentes y 8 avisos | Los errores están en `FRONTEND.md`, `brief.md` e `instructions.md`, que no se modificaron. Los avisos son enlaces históricos a documentos obsoletos y responsables ausentes en specs de Infra |
| `git diff --check` | Pasó | Comprueba espacios y marcadores del diff, no comportamiento |
| Revisión de contratos y permisos | Inspección estática de DTOs, rutas, guardas y errores | No se enviaron peticiones autenticadas |
| Caché y datos temporales | Inspección estática. Sin almacenamiento privado persistente añadido ni cambios al service worker | PWA instalada pendiente de prueba en teléfono |

### Comprobación funcional a cargo del usuario

Utilice el despliegue de Vercel que contenga este cambio. La URL de producción sigue siendo
`https://respia-news.vercel.app` cuando el release llegue a `main`. Una preview corresponde a su propio despliegue.
Confirme el commit mostrado en Vercel antes de evaluar la nueva interfaz.

| Recorrido | Pasos | Resultado esperado | Estado |
|---|---|---|---|
| Publicación sin foto | Entre como administrador. Abra `/admin`. Complete los tres pasos con fuentes reales, marque revisión y publique sin imagen. Recargue | Una sola confirmación tras 201. La noticia permanece en el listado y abre su lector | Pendiente |
| Publicación con foto | Seleccione PNG, JPEG o WebP de hasta 4 MB. Complete texto alternativo, autor, licencia y origen. Revise y publique | Vista previa y procedencia visibles. Imagen y etiqueta conservadas en el lector | Pendiente |
| Sustitución y límites de foto | Seleccione un archivo no admitido o mayor de 4 MB. Después cambie una foto válida por otra | No se sube el archivo inválido. La foto nueva exige completar su propia procedencia | Pendiente |
| Revisión editorial | Intente continuar con Confirmado y una sola fuente. Pruebe también una contradicción declarada. Corrija los campos | Errores visibles con foco y regreso al campo. Confirmado exige dos fuentes y revisión sin conflictos pendientes | Pendiente |
| Errores del servidor | Compruebe 422 con una respuesta controlada por Backend, sin alterar datos de producción. Revise el resumen y enlace al campo | El borrador se conserva y cada error corresponde al paso correcto | Pendiente |
| Sesión vencida | Con un borrador abierto, cierre la sesión en otra pestaña y envíe. Use el acceso en otra pestaña que aparece con 401. Regrese y consulte de nuevo si corresponde | Borrador conservado. Ninguna mutación se repite sola. La nueva petición usa la sesión recuperada | Pendiente |
| Roles | Entre con una cuenta común y visite `/admin`. Abra una noticia publicada y pruebe también como visitante | Cuenta común sin portal administrativo. Lector accesible con sesión. Visitante recibe acceso requerido | Pendiente |
| Dos cuentas y teléfono | Abra el enlace de la noticia desde otra cuenta y desde la app instalada en iPhone y Android | Mismo contenido, fuentes, imagen y navegación. Controles y teclado utilizables | Pendiente |
| Perfil persistente | Guarde región y temas. Recargue. Desmarque todos los temas y guarde. Pruebe un fallo de red durante otro cambio | El éxito refleja la respuesta guardada. La selección pendiente se conserva si falla | Pendiente |
| Personalización | Abra una noticia, vuelva a Edición y consulte su motivo. Compare dos cuentas con regiones o temas diferentes | El feed se consulta de nuevo. Motivo, orden y prominencia coinciden con el servidor | Pendiente |
| Aperturas | Abra y recargue la misma noticia. Pida a Backend comprobar la señal de esa cuenta | La base no duplica la señal. Un fallo de registro no bloquea la lectura | Pendiente |
| Filtros y paginación | Con más de 20 noticias, use Cargar más en Edición y en el portal. Cambie tema, título o estado donde estén disponibles | Cursores del servidor, sin duplicados visibles. Bloque importante conservado al filtrar temas | Pendiente |
| Vacíos y errores | Visite un tema desconocido y una noticia inexistente. Compruebe catálogo vacío o 503 en un entorno controlado. Active el modo sin conexión | Estados claros y reintento manual para lecturas. Sin datos de demo como sustituto | Pendiente |
| Conversación | Envíe una pregunta. Navegue a Edición y vuelva. Inicie otra conversación | Estado del servidor e historial temporal conservado al navegar. Reiniciar borra mensajes y contexto | Pendiente |
| Respuesta y límite | Pruebe `answered` con citas, `no_coverage`, `out_of_scope`, `unavailable` y un 429 controlado | Citas y etiquetas del servidor. Mensajes de estado sin reintentos automáticos. La implementación del control de gasto no acredita esta prueba desplegada | Pendiente |
| Contexto de una noticia | Abra el chat desde el lector. Consulte, cambie de noticia e inicie otra conversación | Título del contexto visible. `articleId` en la pregunta. Sin otra señal `open`. La señal `chat` corresponde al servidor. El reinicio elimina el contexto | Pendiente |

Por cada resultado registre fecha, URL y commit del despliegue, dispositivo, cuenta por rol, acción,
observación y resultado. No incluya correos, tokens ni datos personales. Copie la evidencia al ticket cuando tenga ID.

### Agentes, decisión y límites

| Agent | Request | Proposal | Decision | Verification |
|---|---|---|---|---|
| Codex coordinador. Modelo exacto no disponible | Integrar todos los puntos soportados del plan sin modificar Backend ni hacer commits | Contexto de lectura, errores compartidos y eliminación de fixtures. Contrastar la nota obsoleta con specs y tipos | El usuario aprobó la integración y reservó las pruebas reales para sí | Registro técnico anterior y revisión cruzada de subagentes. Prueba funcional pendiente |
| Subagente de portal | Conectar publicación, fotos y listado. Archivos de EditorialDesk | Conservar tres pasos, exigir 201, conservar borrador y asociar errores a campos | Aplicación del plan aprobado. No hay decisión humana adicional atribuida | Revisión estática y lint dirigido. Publicación real pendiente |
| Subagente de noticias | Conectar edición, temas, lector y aperturas | Reutilizar tarjetas con DTOs reales, cursores y señales no bloqueantes | Aplicación del plan aprobado. Relevancia y permisos permanecen en servidor | Revisión estática y lint dirigido. Dos cuentas y teléfonos pendientes |
| Subagente de perfil y chat | Conectar preferencias y conversación. Actualizar privacidad | Guardado explícito, historial temporal y estados de disponibilidad del servidor | Aplicación del plan aprobado. No simular respuesta del modelo | Revisión estática, typecheck y lint dirigidos. Recorrido real pendiente |

La revisión cruzada detectó que un 401 al cargar catálogo o perfil impedía continuar tras iniciar sesión en otra pestaña.
Se añadió una acción explícita para volver a consultar. También se corrigió la sustitución de fotos para borrar
la procedencia anterior. Son correcciones del agente basadas en inspección, no pruebas de navegador.

Persisten límites de Backend: la publicación no es transaccional ni idempotente, una foto sin publicar puede
permanecer en el bucket público y el orden del feed puede cambiar entre páginas. La interfaz no reintenta
escrituras automáticamente y elimina duplicados de páginas, pero no resuelve esas limitaciones del servicio.
La entrega supera 400 líneas porque reemplaza el contexto de demo compartido por datos reales en varios recorridos.
Antes del PR se debe dividir por comportamiento o justificar la unidad de integración. No se creó ningún PR en esta entrega.

## Validación del contexto del chat 2026-10-10

Esta revisión completa el contexto desde una noticia, instala las dependencias existentes y corrige el inventario documental.
El usuario aplaza los recorridos reales hasta trasladar los cambios y probarlos desde la página o la app.
Los registros técnicos de la integración anterior conservan su fecha y su alcance. No validan automáticamente esta revisión.

| Verificación | Resultado | Alcance |
|---|---|---|
| `npm ci --ignore-scripts` | Pasó. Instaló 371 paquetes del lockfile sin ejecutar `prepare` | El intento sin red falló con `ENOTCACHED`. La repetición con acceso al registro pasó. No cambió versiones ni configuración de Git |
| `npm run typecheck`, `npm run lint` | Pasaron, salida 0 | Windows, Node 24.13.1. Sin desactivar reglas |
| `npm run build` | Pasó, salida 0. Generó 21 páginas e incluyó `/chat` y `/api/chat` | Build local con procesos hijos de Next.js. Sin localhost ni despliegue. No se inspeccionaron valores de `.env.local` |
| `node --test src/lib/ia/chat.test.mjs src/lib/ia/cost.test.mjs src/lib/ia/external-search.test.mjs` | Pasaron 23 de 23 | SDK, base y búsqueda simulados. Sin llamadas reales ni consumo de créditos |
| Contrato y estados de la interfaz | Revisión estática del coordinador y un subagente, sin defectos bloqueantes encontrados | Payload con y sin noticia, historial, cancelación, reinicio, citas, errores 401/422/429 y movimiento reducido. No sustituye la prueba visual |
| `validate_docs.py` en los tres specs de frontend modificados | Pasó, salida 0 | Estructura y enlaces de feed, perfil y documento de traslado |
| `node scripts/check-specs.mjs` | No pasó: repite 13 errores preexistentes y 8 avisos | Los errores están en los archivos locales `FRONTEND.md`, `brief.md` e `instructions.md`. No se modificaron. Los avisos mantienen enlaces históricos y responsables ausentes en Infra |
| `git diff --check -- src specs` | Pasó | Revisión del diff de código y documentación. El índice permanece vacío |
| Chat en Vercel, iPhone y Android | Pendiente por decisión del usuario | No se prueba en esta revisión |

| Agent | Request | Proposal | Decision | Verification |
|---|---|---|---|---|
| Codex coordinador y subagentes. Modelo exacto no disponible | Completar los puntos 1 a 3 de la revisión del chat | Reutilizar `articleId`, instalar el lockfile y corregir documentación desactualizada | El usuario aprobó esos puntos y aplazó las pruebas reales | Resultados locales registrados arriba. Subagentes separados para interfaz, documentación y revisión. No se atribuye una prueba de producción |

La instalación informó 9 vulnerabilidades en las dependencias existentes: 8 altas y 1 crítica.
Su análisis y actualización de versiones quedan pendientes de coordinación con Infra. No se ejecutó `npm audit fix`.
La revisión visual deberá comprobar también el foco al reiniciar desde una noticia, porque la navegación remonta el formulario.
Cancelar el cliente no garantiza detener una llamada al modelo que el servidor ya inició.
No se ejecutaron SQL, publicaciones, commits, staging, push ni despliegues. Ninguna tarea se marca Done.

El contrato vigente se consulta en [chat](../ia/chat.md) y `src/types/chat.ts`. Su cabecera aún describe una demo y un modelo ausente.
Rodrigo debe conciliar esa descripción y el gasto histórico de [costos](../ia/costos-ia.md) con el código y su bitácora.
El equipo debe revisar la matriz de [ALCANCE](../../docs/ALCANCE.md) cuando aporte la evidencia pendiente.
Esta entrega no cambia sus requisitos, decisiones, saldos ni estados de cierre.
