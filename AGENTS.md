# Instrucciones para agentes de IA

Si eres un agente de IA (Claude, Codex, Copilot u otro) que trabaja en este
repositorio, estas reglas son el proceso de trabajo que exige el curso. La persona
del equipo que te lo pidió responde por el resultado.

Cada cambio debe mostrar tres datos: **qué hizo el agente, qué decidió el equipo y
qué evidencia lo respalda.**

## Proyecto

PWA de noticias asistida por IA. Next.js 16 (App Router) y TypeScript, Supabase
(Postgres y Auth con Google), desplegada en Vercel. Un solo repositorio para
frontend, backend, datos e IA.

## Antes de empezar

1. Lee [docs/ALCANCE.md](docs/ALCANCE.md): requisitos con ID y criterios de aceptación.
2. Lee [docs/PROCESO.md](docs/PROCESO.md): ciclo, registro del uso de agentes, límites y Done.
3. Lee el spec de la feature (`specs/<feature>.md`), su bitácora
   (`docs/features/<feature>/bitacora.md`) y [docs/DECISIONES.md](docs/DECISIONES.md).

## Reglas

1. **Todo trabajo responde a un requisito** (`RF-08`, `RT-03`…). Si la persona no da el
   ID, búscalo en `ALCANCE.md`. Si ninguno corresponde, dilo y propón agregarlo. No lo inventes.
2. **No cambies requisitos ni criterios de aceptación en silencio.** Propón el cambio.
   Si se aprueba, regístralo en el registro de cambios de `ALCANCE.md`.
3. **Escribe el cambio en el spec antes del código** (sección «Cambio en curso»).
4. **Registra en la bitácora solo los ciclos que cambiaron una decisión** o descartaron
   una hipótesis. Usa la plantilla de `PROCESO.md`, con los cinco campos del agente
   (agente, pedido, propuesta, decisión, verificación). Usa la fecha real. No inventes
   fechas ni resultados.
5. **Si propusiste algo incorrecto y eso cambió una decisión, regístralo.** Es evidencia.
6. **No marques una tarea como hecha sin ejecutar su prueba** y dejar el registro. Si no
   puedes probarla (cuenta real, teléfono, acceso), dilo y déjala pendiente.
7. **Respeta los límites de archivos** de `PROCESO.md`. Antes de crear un archivo,
   verifica si el dato cabe en uno existente.
8. **No contradigas una decisión vigente** de `DECISIONES.md`. Si crees que debe
   cambiar, propónlo. Si se aprueba, agrega una fila nueva y marca la anterior como
   reemplazada.
9. **El repositorio es público.** No escribas secretos, llaves, tokens, correos reales
   ni datos de personas. No leas ni muestres los valores de `.env.local`.
10. Si tu cambio guarda un dato nuevo del usuario, actualiza `src/app/privacidad/page.tsx` (`RF-06`).
11. Los commits hechos con un agente llevan la línea `Co-Authored-By` del agente.

## Dónde trabaja cada parte

| Parte | Trabaja en | Regla |
|---|---|---|
| **Frontend** | `src/app/**/page.tsx` y `*.module.css` (pantallas), `src/components/`, `src/styles/`, `e2e/` | Un componente por carpeta con `index.ts`. No llames a la base de datos desde un componente cliente: pide los datos al backend |
| **Backend** | `src/app/api/` (endpoints), `src/app/actions/` (server actions), `src/lib/services/` (lógica de negocio), `src/types/` | Cada ruta y página protegida verifica la sesión en el servidor con `src/lib/auth/dal.ts`. La ruta HTTP no contiene lógica de negocio: llama a un servicio |
| **Modelación de datos** | `supabase/migrations/` (SQL numerado), `src/types/` | Script nuevo con el número siguiente, idempotente, con RLS, `GRANT` mínimos y una política por operación. No edites un script ya ejecutado |
| **IA (modelos)** | `src/lib/ia/` (llamadas a modelos, prompts, registro de costo) | Solo el servidor llama al modelo. Registra cada llamada y su costo (`RP-02`). La llave del modelo va en una variable de entorno de servidor, nunca `NEXT_PUBLIC_` |
| **Proceso** | `specs/`, `docs/` | Ver [docs/PROCESO.md](docs/PROCESO.md) |

Las carpetas `e2e/` y `src/lib/ia/` se crean con su primer archivo. No dejes carpetas vacías.

## Infraestructura ya implementada: no modificar sin coordinar

Estos archivos sostienen la sesión, la seguridad y la PWA. Si un cambio los toca,
dilo a la persona antes de editarlos y consulta [docs/INFRA_HANDOFF.md](docs/INFRA_HANDOFF.md).

| Archivo | Qué hace |
|---|---|
| `src/proxy.ts`, `src/lib/supabase/proxy.ts` | Refrescan la sesión en cada petición |
| `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts` | Clientes de Supabase para servidor y navegador |
| `src/lib/auth/dal.ts` | Única fuente de identidad y rol (`getCurrentUser`, `isAdmin`) |
| `src/app/auth/callback/route.ts`, `src/app/actions/auth.ts` | Inicio y cierre de sesión con Google |
| `public/sw.js`, `public/offline.html`, `src/app/manifest.ts`, `public/icons/` | PWA. Si cambia el comportamiento de `sw.js`, cambia `CACHE_VERSION` |
| `supabase/migrations/001_*`, `002_*` | Scripts ya ejecutados. No se editan |
| `.env.example` | Nombres de las variables. Hoy: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |

**Llaves y variables:** los valores viven en `.env.local` (local) y en Vercel
(producción). Nunca en el repositorio. Una variable nueva se agrega con nombre y sin
valor a `.env.example`, y la persona carga el valor en Vercel. Solo es `NEXT_PUBLIC_`
lo que puede ser público.

## Verificación

```bash
npm run typecheck
```

```bash
npm run lint
```

## Al terminar

Resume a la persona qué cambiaste, qué probaste, qué **no** pudiste probar y dónde
quedó el registro.
