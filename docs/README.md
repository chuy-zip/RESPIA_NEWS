# Documentación

Punto de entrada. Cada documento responde una pregunta. Las reglas para agentes de
IA están en [AGENTS.md](../AGENTS.md).

| Documento | Pregunta que responde |
|---|---|
| [ALCANCE.md](ALCANCE.md) | ¿Qué debe cumplir y probar el sistema? |
| [PROCESO.md](PROCESO.md) | ¿Cómo trabajamos con agentes y cómo dejamos evidencia? |
| [DECISIONES.md](DECISIONES.md) | ¿Qué se decidió, por qué y qué decisión reemplazó a cuál? |
| [`specs/`](../specs/) | ¿Qué hace cada feature hoy, cómo se prueba y qué tareas tiene? |
| `features/<feature>/bitacora.md` | ¿Qué ciclos cambiaron una decisión y qué hizo el agente? |
| [INFRA_HANDOFF.md](INFRA_HANDOFF.md) | ¿Cómo está montada la infraestructura y cómo se opera? |
| [`supabase/migrations/`](../supabase/migrations/) | ¿Cómo se crea la base? Scripts numerados que se ejecutan a mano en Supabase |
| [Enunciado del curso](Proyecto%202%20AI%20Assisted%20News%20App.pdf) | ¿Qué pide el curso? |

## Features por módulo

Una feature tiene dos archivos: `specs/<parte>/<feature>.md` y
`docs/features/<feature>/bitacora.md`. Se crean cuando empieza su trabajo, no antes.
La carpeta del spec es la parte de su responsable: `ia`, `front`, `backend` o `infra` (D-35).
Cada funcionalidad tiene un ticket en la base [Tickets](https://app.notion.com/p/e7bcbe3443c343b2873a2b5b97eb474c) de Notion, creado por su responsable (D-28). Sin ticket, el spec mantiene su tabla de tareas.

### `specs/ia/` · Rodrigo Mansilla

| Feature | Requisitos | Spec |
|---|---|---|
| `chat` (respuestas con fuentes y búsqueda externa) | RF-07, RF-12, RF-13, RF-14 | [chat](../specs/ia/chat.md) |
| `recomendacion` (orden, prominencia, intereses y relacionadas) | RF-08, RF-10, RF-11, RT-01 | [recomendacion](../specs/ia/recomendacion.md) |
| `imagenes` (banco Pixabay; el modelo propone, D-23, D-33) | RF-17, RF-18, RT-05 | [imágenes](../specs/ia/imagenes.md) |
| `costos-ia` (registro, tope y reserva) | RP-01, RP-02, RP-03 | [costos-ia](../specs/ia/costos-ia.md) |

### `specs/front/` · Sergio Orellana

| Feature | Requisitos | Spec |
|---|---|---|
| `feed-y-lector` (pantalla del feed y lectura) | RF-08, RF-09, RT-02, RT-06 | [feed y lector](../specs/front/feed-y-lector.md) |
| `ubicacion-y-perfil` (región simulada, temas y señales) | RF-04, RF-06 | [ubicación y perfil](../specs/front/ubicacion-y-perfil.md) |

### `specs/backend/` · Gerardo Pineda

| Feature | Requisitos | Spec |
|---|---|---|
| `portal-admin` (crear, publicar, validar y subir fotos) | RF-15, RF-16, RT-03, RT-04 | [portal administrativo](../specs/backend/portal-admin.md) |

### `specs/infra/` · Ricardo Chuy

| Feature | Requisitos | Spec |
|---|---|---|
| `acceso` (sesión, roles y privacidad) | RF-02, RF-03, RF-06 | [acceso](../specs/infra/acceso.md) |
| `pwa` (instalación y compartir) | RF-01, RF-05 | [pwa](../specs/infra/pwa.md) |
| `plataforma` (hosting, base de datos y costo de infraestructura) | RP-04 | [plataforma](../specs/infra/plataforma.md) |

### Documentos obsoletos

Se conservan como rastro, con un aviso al inicio que dice dónde está lo vigente. No se actualizan ni reciben enlaces nuevos (D-35).

| Documento | Qué era |
|---|---|
| [notion-frontend.md](../specs/front/notion-frontend.md) | Investigación y contratos de Frontend, copia de traslado a Notion |
| [frontend-update-backend.md](../specs/front/frontend-update-backend.md) | Nota de traspaso de Backend para conectar la pantalla |
| [ia-update-backend.md](../specs/ia/ia-update-backend.md) | Nota de traspaso de Backend para conectar la parte de IA |

Si una parte nueva no encaja en ninguna, primero revise si responde a un requisito.
Si no, falta el requisito.
