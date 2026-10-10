# Plataforma

Dónde corre todo, cuánto cuesta y cómo se cambia la base de datos.

**Requisitos:** `RP-04` · **Bitácora:** [bitacora.md](../../docs/features/plataforma/bitacora.md) ·
**Decisiones:** D-02, D-08, D-11, D-14, D-15 · **Investigación:** [Notion](https://app.notion.com/p/bcf3b3eb862b4a0fa01d068850f4d198) ·
**Detalle técnico y operación:** [INFRA_HANDOFF.md](../../docs/INFRA_HANDOFF.md)

## Comportamiento actual

- **Vercel (plan Hobby):** aloja la app y despliega automáticamente cada vez que se sube `main`.
- **Supabase (plan Free):** base de datos Postgres y autenticación.
- **Google Cloud:** solo para el cliente OAuth de Google.
- La infraestructura no tiene costo fijo: los USD 20 del presupuesto quedan para la IA (`RP-01`).
- El esquema se cambia con scripts SQL numerados en `supabase/migrations/`, ejecutados a
  mano en el SQL Editor, sin Supabase CLI (D-14). Procedimiento en la sección 13 de
  [INFRA_HANDOFF.md](../../docs/INFRA_HANDOFF.md).
- Variables de entorno: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  (D-08). Los valores viven en `.env.local` y en Vercel, nunca en el repositorio.

## Criterios de aceptación

- **`RP-04`**: revisar en las cuentas de Vercel y Supabase que ambos estén en su plan
  gratuito y que no haya cargos.

## No incluido

- Supabase CLI, cabeceras de seguridad adicionales, CSP y tarea programada para mantener
  activa la base (D-11, D-14). La pausa por inactividad es un riesgo conocido.

## Dependencias

- Todas las features usan esta plataforma.

## Uso de IA en el producto

Ninguno.

## Done específico

Todo script SQL nuevo se ejecutó en el SQL Editor y su resultado se verificó con una
consulta. Los scripts se pueden volver a ejecutar sin romper nada.

## Tareas

| Estado | Tarea | Req. | Evidencia |
|---|---|---|---|
| ✅ | Despliegue automático desde `main` en Vercel | `RP-04` | Cada commit a `main` se despliega solo; ver [INFRA_HANDOFF.md](../../docs/INFRA_HANDOFF.md) |
| ✅ | Proyecto de Supabase con acceso a la API de datos y RLS automática | `RP-04` | Estado de la base en [INFRA_HANDOFF.md](../../docs/INFRA_HANDOFF.md) |
| ✅ | Variables de entorno cargadas en Vercel y en el entorno local | `RP-04` | La app corre en producción y en local con ellas; ver [INFRA_HANDOFF.md](../../docs/INFRA_HANDOFF.md) |
| ✅ | Primer script de base de datos: administradores | `RP-04` | Bitácora de [acceso](../../docs/features/acceso/bitacora.md) 2026-10-04, `supabase/migrations/001_admins.sql` |
| ✅ | Documento de traspaso de infraestructura para el equipo | `RP-04` | [INFRA_HANDOFF.md](../../docs/INFRA_HANDOFF.md) |
| ⏳ | Scripts de las tablas del producto: los escribe cada feature | `RP-04` | |

## Cambio en curso

Ninguno.
