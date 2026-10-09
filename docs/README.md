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

## Features

Una feature tiene dos archivos: `specs/<feature>.md` y
`docs/features/<feature>/bitacora.md`. Se crean cuando empieza su trabajo, no antes.

| Feature | Requisitos | Parte principal | Spec |
|---|---|---|---|
| `acceso` (sesión, roles y privacidad) | RF-02, RF-03, RF-06 | Back | [acceso](../specs/acceso.md) |
| `pwa` (instalación y compartir) | RF-01, RF-05 | Front | [pwa](../specs/pwa.md) |
| `plataforma` (hosting, base de datos y costo de infraestructura) | RP-04 | Infra, Datos | [plataforma](../specs/plataforma.md) |
| `ubicacion-y-perfil` (región simulada) | RF-04 | Front, Datos | aún no creada |
| `portal-admin` (crear, publicar, validar) | RF-15, RF-16, RT-03, RT-04 | Front, Back | aún no creada |
| `imagenes` (banco de imágenes; el modelo propone, D-23) | RF-17, RF-18, RT-05 | Back, Datos, IA | aún no creada |
| `recomendacion` (orden, niveles de prominencia e intereses inferidos) | RF-08, RF-10, RF-11, RT-01 | IA | [recomendacion](../specs/recomendacion.md) |
| `feed-y-lector` (endpoint del feed, pantalla y lectura) | RF-08, RF-09, RT-02, RT-06 | Front, Back | aún no creada |
| `chat` | RF-07, RF-12, RF-13, RF-14 | IA, Front | [chat](../specs/chat.md) |
| `costos-ia` (registro, tope y reserva) | RP-01, RP-02, RP-03 | IA, Datos | [costos-ia](../specs/costos-ia.md) |

Si una parte nueva no encaja en ninguna, primero revise si responde a un requisito.
Si no, falta el requisito.
