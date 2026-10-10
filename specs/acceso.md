# Acceso

Sesión con Google, quién es administrador y qué se entrega sin sesión.

**Requisitos:** `RF-02`, `RF-03`, `RF-06` · **Bitácora:** [bitacora.md](../docs/features/acceso/bitacora.md) ·
**Decisiones:** D-03, D-04, D-06, D-07, D-12 · **Investigación:** [Notion](https://app.notion.com/p/bcf3b3eb862b4a0fa01d068850f4d198) ·
**Detalle técnico:** [INFRA_HANDOFF.md](../docs/INFRA_HANDOFF.md)

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

Están en la base [Tickets](https://app.notion.com/p/49bcd1575a0543399a87a1db2f1c341f) de Notion, feature `acceso` (D-27). Cada ticket tiene responsable, estado, bloqueos y evidencia.

## Cambio en curso

Ninguno.
