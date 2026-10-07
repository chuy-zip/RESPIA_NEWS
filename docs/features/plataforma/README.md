# Plataforma

Dónde corre todo, cuánto cuesta y cómo se cambia la base de datos.

**Requisitos:** `RP-04` · **Contrato:** [ALCANCE.md](../../ALCANCE.md) ·
**Ciclos:** [bitacora.md](bitacora.md) · **Detalle técnico y operación:** [INFRA_HANDOFF.md](../../INFRA_HANDOFF.md)

## Qué es

- **Vercel (plan Hobby):** aloja la app y despliega automáticamente cada vez que
  se sube `main`.
- **Supabase (plan Free):** base de datos Postgres y autenticación.
- **Google Cloud:** solo para el cliente OAuth de Google.

La infraestructura no tiene costo fijo: los USD 20 del presupuesto quedan íntegros
para la IA (`RP-01`).

## Decisiones y su razón

| Decisión | Razón |
|---|---|
| Vercel Hobby y Supabase Free | El enunciado pide niveles gratuitos cuando sea viable (`RP-04`) |
| El esquema de la base son **scripts SQL numerados** en `docs/sql/`, ejecutados a mano en el SQL Editor | Menos herramientas que mantener; el historial de cambios queda en los propios scripts |
| Solo dos variables de entorno, ambas públicas por diseño | La seguridad la dan las políticas RLS y la verificación en el servidor, no el secreto de la llave |
| Sin Supabase CLI ni carpeta `supabase/` | Decisión del equipo: no aporta lo suficiente para este alcance |
| Sin pruebas automatizadas | Decisión del equipo: las pruebas son manuales y repetibles, con evidencia (ver [PROCESO.md](../../PROCESO.md)) |
| Sin cabeceras de seguridad adicionales ni CSP | Decisión del equipo |
| Sin tarea programada para mantener activa la base de Supabase | Decisión del equipo; la pausa por inactividad queda como riesgo conocido |

## Cómo se prueba

- **`RP-04`**: revisar en las cuentas de Vercel y Supabase que ambos estén en su plan
  gratuito y que no haya cargos.

## Uso de IA

Ninguno dentro del producto. En el desarrollo, ver la [bitácora](bitacora.md): varias
decisiones de esta feature nacieron de que el equipo rechazó propuestas del asistente.

## Done

Aplica la [definición de Done](../../PROCESO.md#definición-de-done). **Done específico:**
todo script SQL nuevo se ejecutó en el SQL Editor y su resultado se verificó con una
consulta; los scripts se pueden volver a ejecutar sin romper nada.

## Tareas

| Estado | Tarea | Req. | Evidencia |
|---|---|---|---|
| ✅ | Despliegue automático desde `main` en Vercel | `RP-04` | Cada commit a `main` se despliega solo; ver [INFRA_HANDOFF.md](../../INFRA_HANDOFF.md) |
| ✅ | Proyecto de Supabase con acceso a la API de datos y RLS automática | `RP-04` | Estado de la base en [INFRA_HANDOFF.md](../../INFRA_HANDOFF.md) |
| ✅ | Variables de entorno cargadas en Vercel y en el entorno local | `RP-04` | La app corre en producción y en local con ellas; ver [INFRA_HANDOFF.md](../../INFRA_HANDOFF.md) |
| ✅ | Primer script de base de datos: administradores | `RP-04` | Bitácora de [acceso](../acceso/bitacora.md) 2026-10-04, `docs/sql/001_admins.sql` |
| ✅ | Documento de traspaso de infraestructura para el equipo | `RP-04` | [INFRA_HANDOFF.md](../../INFRA_HANDOFF.md) |
| ⏳ | Scripts de las tablas del producto: los escribe cada feature | `RP-04` | |
