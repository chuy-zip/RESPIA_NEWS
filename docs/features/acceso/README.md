# Acceso

Sesión con Google, quién es administrador y qué se entrega sin sesión.

**Requisitos:** `RF-02`, `RF-03`, `RF-06` · **Contrato:** [ALCANCE.md](../../ALCANCE.md) ·
**Ciclos:** [bitacora.md](bitacora.md) · **Detalle técnico:** [INFRA_HANDOFF.md](../../INFRA_HANDOFF.md)

## Qué es

- Inicio de sesión con Google mediante Supabase Auth.
- Una sola fuente de identidad en el servidor (`src/lib/auth/dal.ts`).
- Un rol de administrador guardado en la base, no en el navegador.
- Un icono de escudo en la barra superior y la pantalla `/admin`, solo para
  administradores.

## Decisiones y su razón

| Decisión | Razón |
|---|---|
| **Supabase Auth en lugar de Firebase Auth** | Datos relacionales, RLS y sesión en servidor con Next.js. Aprobado por el catedrático el 22-sep-2026. La justificación completa está en [INFRA_HANDOFF.md](../../INFRA_HANDOFF.md) |
| La identidad se verifica con `getClaims()`, nunca con `getSession()` | `getSession()` lee la cookie sin validar la firma: se podría fabricar. `getClaims()` verifica el token |
| El proxy solo refresca la sesión; **cada página y ruta decide** el acceso | Un único guardián global es fácil de saltar con una ruta nueva olvidada |
| El administrador se identifica por `user_id` en `public.admins`, nunca por correo ni por `user_metadata` | El correo puede cambiar y `user_metadata` lo edita el propio usuario. El correo guardado es solo una copia legible |
| La tabla `admins` solo se puede **leer** (su propia fila) desde la app; se modifica desde el SQL Editor | Nadie puede darse permisos desde el navegador |
| La comprobación falla **cerrado** | Si la consulta da error, no hay acceso |
| `/admin` responde 404 a quien no es administrador | No se confirma a un usuario común que la ruta existe |
| El icono de administración es comodidad, no seguridad | El control real está en la página y en la base |
| Proveedor Email de Supabase desactivado | Dejaba crear cuentas por la API sin pasar por Google |
| La pantalla de consentimiento de Google se queda en *Testing* y no se agregan permisos | Con solo nombre, correo y perfil, Testing no restringe quién entra. Un permiso adicional sí lo haría |

## Cómo se prueba

- **`RF-02`**: iniciar sesión en un iPhone y un Android con la app instalada; cerrar y abrir
  de nuevo. Abrir la ruta protegida sin sesión: el servidor debe rechazarla.
- **`RF-03`**: entrar con una cuenta administradora (se ve el escudo y abre el panel) y con
  una común (no hay escudo y `/admin` da "no encontrado").
- **`RF-06`**: iniciar sesión con una cuenta de Google que no sea del equipo.

## Uso de IA

No hay IA dentro del producto en esta feature. En el desarrollo se usó un asistente de
IA (Claude Code); cada ciclo en la [bitácora](bitacora.md) indica qué propuso y qué
decidió el equipo.

## Done

Aplica la [definición de Done](../../PROCESO.md#definición-de-done). **Done específico:**
toda pantalla o ruta que dependa del rol se probó con una cuenta administradora y con
una común.

## Tareas

| Estado | Tarea | Req. | Evidencia |
|---|---|---|---|
| ✅ | Inicio de sesión con Google y callback | `RF-02` | Bitácora 2026-09-23 (primer inicio de sesión), commit `3df4657` |
| ✅ | Sesión verificada en iPhone con la app instalada | `RF-02` | Bitácora 2026-09-23: la sesión volvió activa con la PWA abierta desde el icono |
| ✅ | Sesión verificada en Android con la app instalada | `RF-02` | Tabla de pruebas de [INFRA_HANDOFF.md](../../INFRA_HANDOFF.md): confirmado el 4-oct-2026 |
| ✅ | Contenido protegido: 401 o pantalla bloqueada sin sesión | `RF-02` | Prueba del 2026-09-23: la API responde 401 sin sesión. Ver [INFRA_HANDOFF.md](../../INFRA_HANDOFF.md) |
| ✅ | Tabla de administradores, `private.is_admin()` y administradores cargados | `RF-03` | Bitácora 2026-10-04, script `docs/sql/001_admins.sql`, commit `8b26007`; verificación del equipo en el SQL Editor el 4-oct |
| ✅ | Proveedor Email desactivado | `RF-03` | Bitácora 2026-10-04: el endpoint público de ajustes devuelve solo Google |
| ✅ | Icono de administración y pantalla `/admin` | `RF-03` | Bitácora 2026-10-04, commit `766ddf0`. Probado sin sesión; falta la prueba con cuentas |
| ⏳ | Probar `RF-03` con una cuenta administradora y una común, y anotar el resultado | `RF-03` | |
| ⏳ | Crear `/privacidad` y enlazarla desde la portada | `RF-06` | Creada el 2026-10-07 (`src/app/privacidad/page.tsx`) y compilada; el servidor local responde 200. Se enlaza desde el pie de la portada y bajo el botón de iniciar sesión (que aparece en `/`, `/contenido` y `/admin` sin sesión). Falta probarla desplegada |
| — | ~~Publicar la pantalla de consentimiento de Google~~ | `RF-06` | Descartada el 2026-10-07: con permisos básicos no hace falta. Bitácora 2026-10-07 |
| ✅ | Probar el inicio de sesión con una cuenta ajena al equipo | `RF-06` | Prueba del equipo reportada el 2026-10-07: una cuenta que no es del equipo ni está definida en Google Cloud inició sesión sin problema |
| ⏳ | Mantener `/privacidad` al día: cada feature que guarde un dato nuevo del usuario la actualiza en el mismo cambio | `RF-06` | Tarea permanente |
