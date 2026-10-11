# Acceso

Sesión con Google, quién es administrador y qué se entrega sin sesión.

**Requisitos:** `RF-02`, `RF-03`, `RF-06` · **Bitácora:** [bitacora.md](../../docs/features/acceso/bitacora.md) ·
**Decisiones:** D-03, D-04, D-06, D-07, D-12 · **Investigación:** [Notion](https://app.notion.com/p/bcf3b3eb862b4a0fa01d068850f4d198) ·
**Detalle técnico:** [INFRA_HANDOFF.md](../../docs/INFRA_HANDOFF.md)

## Comportamiento actual

- Inicio de sesión con Google mediante Supabase Auth (D-03).
- Una sola fuente de identidad en el servidor: `src/lib/auth/dal.ts` (D-04).
- Rol de administrador guardado en `public.admins`, no en el navegador (D-06).
- Un icono de escudo en la barra superior y la pantalla `/admin`, solo para administradores.
- `/privacidad` describe qué datos del usuario se guardan.

| Regla menor | Razón |
|---|---|
| `/admin` responde 404 a quien no es administrador | No se confirma a un usuario común que la ruta existe |
| El icono de administración es comodidad, no seguridad | El control real está en la página y en la base |

## Criterios de aceptación

- **`RF-02`**: iniciar sesión en un iPhone y un Android con la app instalada; cerrar y abrir
  de nuevo. Abrir la ruta protegida sin sesión: el servidor debe rechazarla.
- **`RF-03`**: entrar con una cuenta administradora (se ve el escudo y abre el panel) y con
  una común (no hay escudo y `/admin` da «no encontrado»).
- **`RF-06`**: iniciar sesión con una cuenta de Google que no sea del equipo.

## No incluido

- Otros proveedores de inicio de sesión (Email está desactivado, D-07).
- Administración de roles desde la app: los administradores se agregan en el SQL Editor.

## Dependencias

- Plataforma: Supabase Auth y el cliente OAuth de Google Cloud.
- `supabase/migrations/001_admins.sql`.

## Uso de IA en el producto

Ninguno.

## Done específico

Toda pantalla o ruta que dependa del rol se probó con una cuenta administradora y con una común.

## Tareas

| Estado | Tarea | Req. | Evidencia |
|---|---|---|---|
| ✅ | Inicio de sesión con Google y callback | `RF-02` | Bitácora 2026-09-23 (primer inicio de sesión), commit `3df4657` |
| ✅ | Sesión verificada en iPhone con la app instalada | `RF-02` | Bitácora 2026-09-23: la sesión volvió activa con la PWA abierta desde el icono |
| ✅ | Sesión verificada en Android con la app instalada | `RF-02` | Tabla de pruebas de [INFRA_HANDOFF.md](../../docs/INFRA_HANDOFF.md): confirmado el 4-oct-2026 |
| ✅ | Contenido protegido: 401 o pantalla bloqueada sin sesión | `RF-02` | Prueba del 2026-09-23: la API responde 401 sin sesión. Ver [INFRA_HANDOFF.md](../../docs/INFRA_HANDOFF.md) |
| ✅ | Tabla de administradores, `private.is_admin()` y administradores cargados | `RF-03` | Bitácora 2026-10-04, script `supabase/migrations/001_admins.sql`, commit `8b26007`; verificación del equipo en el SQL Editor el 4-oct |
| ✅ | Proveedor Email desactivado | `RF-03` | Bitácora 2026-10-04: el endpoint público de ajustes devuelve solo Google |
| ✅ | Icono de administración y pantalla `/admin` | `RF-03` | Bitácora 2026-10-04, commit `766ddf0`. Probado sin sesión; falta la prueba con cuentas |
| ⏳ | Probar `RF-03` con una cuenta administradora y una común, y anotar el resultado | `RF-03` | |
| ⏳ | Crear `/privacidad` y enlazarla desde la portada | `RF-06` | Creada el 2026-10-07 (`src/app/privacidad/page.tsx`) y compilada; el servidor local responde 200. Se enlaza desde el pie de la portada y bajo el botón de iniciar sesión (que aparece en `/`, `/contenido` y `/admin` sin sesión). Falta probarla desplegada |
| — | ~~Publicar la pantalla de consentimiento de Google~~ | `RF-06` | Descartada el 2026-10-07: con permisos básicos no hace falta. Bitácora 2026-10-07, D-12 |
| ✅ | Probar el inicio de sesión con una cuenta ajena al equipo | `RF-06` | Prueba del equipo reportada el 2026-10-07: una cuenta que no es del equipo ni está definida en Google Cloud inició sesión sin problema |
| ⏳ | Mantener `/privacidad` al día: cada feature que guarde un dato nuevo del usuario la actualiza en el mismo cambio | `RF-06` | Tarea permanente |

## Cambio en curso

Ninguno.
