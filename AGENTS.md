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
10. No ejecutes ni pidas ejecutar un script SQL antes de que su PR llegue a `main`: `dev` y
    producción comparten la base de datos.
11. Si tu cambio guarda un dato nuevo del usuario, actualiza `src/app/privacidad/page.tsx` (`RF-06`).
12. Los commits hechos con un agente llevan la línea `Co-Authored-By` del agente.
13. **No trabajes en `main`.** La documentación (`docs/`, `specs/`, `AGENTS.md`, `README.md`) va
    directo a `dev`. El código va en la rama de su feature (`chat`, `recomendacion`…), que sale de
    `dev` y vuelve por PR. No crees una rama por cada cambio pequeño. Solo un release lleva `dev` a `main`.
14. **Modifica solo las carpetas de tu parte.** Si necesitas una carpeta de otra
    parte, dilo a la persona: el cambio necesita la aprobación del dueño (tabla de la sección
    8 de `PROCESO.md` y `.github/CODEOWNERS`).

## Cambios mínimos: sin sobreingeniería

**El diff hace solo lo que pide la tarea.** Si el cambio es de una línea, el diff es de una línea.

1. **No reformatees ni reordenes código que la tarea no toca.** No cambies comillas,
   sangría, orden de imports ni finales de línea. No renombres ni muevas archivos sin pedirlo.
2. **Edita, no reescribas.** Para cambiar unas líneas, usa una edición puntual. No
   sobrescribas el archivo completo.
3. **No agregues abstracciones por si acaso.** Sin capas, helpers, configuración ni
   opciones para casos que no existen. Abstrae solo cuando hay tres casos reales.
   No escribas código para requisitos futuros.
4. **No agregues dependencias** sin que la persona lo pida. Instala con `npm ci`: no
   regenera `package-lock.json`. Solo un PR que cambia una dependencia cambia el lockfile.
5. **No dejes código muerto ni comentado.** Bórralo: Git conserva el historial.
6. **Los comentarios explican el porqué.** No narran el cambio («cambiado por…», «antes era…»).
7. **Un PR es un cambio.** Si el diff supera 400 líneas (sin contar `package-lock.json` ni
   archivos de terceros copiados sin modificar),
   divídelo o explica en el PR por qué no se puede dividir.
8. **Antes de cada commit, revisa `git diff --stat`.** Si aparece un archivo que la tarea
   no menciona, quítalo del commit.

## Documentación y comentarios

Para escribir o editar documentación, comentarios de código, mensajes de error, descripciones
de PR y prompts, usa las dos skills del repositorio:

| Skill | Para qué | Modo |
|---|---|---|
| [`asd-ste100`](.claude/skills/asd-ste100/SKILL.md) | Frases sin ambigüedad: cortas, voz activa, una instrucción por frase, sin punto y coma, listas para pasos | *Strict* para mensajes de error, prompts y procedimientos. *STE-flavored* para README, specs, bitácoras y PR |
| [`developer-documentation`](.claude/skills/developer-documentation/SKILL.md) | Tipo de documento correcto, procedimientos, ejemplos verificados y validación de Markdown | Documentos de `docs/`, `specs/` y README |

**Reglas del proyecto sobre las skills.** Estas reglas tienen prioridad sobre el texto de las skills:

- Escribe en **español**. Las reglas estructurales de STE aplican al español. Las listas de
  palabras en inglés y `scripts/ste-lint.py` no aplican: no ejecutes el linter sobre texto en español.
- La regla de «American English» de `developer-documentation` no aplica.
- Para validar Markdown, puedes ejecutar
  `python .claude/skills/developer-documentation/scripts/validate_docs.py <archivo>`.
- Si tu agente no carga skills automáticamente, lee el `SKILL.md` antes de escribir.

## Dónde trabaja cada parte

| Parte | Trabaja en | Regla |
|---|---|---|
| **Frontend** (Sergio Orellana) | `src/app/**/page.tsx` y `*.module.css` (pantallas), `src/components/`, `src/styles/`, `e2e/` | Un componente por carpeta con `index.ts`. No llames a la base de datos desde un componente cliente: pide los datos al backend |
| **Backend** (Gerardo Pineda) | `src/app/api/` (endpoints), `src/app/actions/` (server actions), `src/lib/services/` (lógica de negocio), `src/types/` | Cada ruta y página protegida verifica la sesión en el servidor con `src/lib/auth/dal.ts`. La ruta HTTP no contiene lógica de negocio: llama a un servicio |
| **Modelación de datos** (Ricardo Chuy) | `supabase/migrations/` (SQL numerado), `src/types/` | Script nuevo con el número siguiente, idempotente, con RLS, `GRANT` mínimos y una política por operación. No edites un script ya ejecutado |
| **IA (modelos y recomendador)** (Rodrigo Mansilla) | `src/lib/ia/` (llamadas a modelos, prompts, registro de costo), `src/lib/recomendacion/` (orden, niveles de prominencia e intereses del feed) | Solo el servidor llama al modelo. Registra cada llamada y su costo (`RP-02`). La llave del modelo va en una variable de entorno de servidor, nunca `NEXT_PUBLIC_`. El recomendador no llama a ningún modelo (`RP-03`). El endpoint del feed es de Backend y llama al recomendador |
| **Proceso** | `specs/`, `docs/` | Ver [docs/PROCESO.md](docs/PROCESO.md) |

Las carpetas `e2e/`, `src/lib/ia/` y `src/lib/recomendacion/` se crean con su primer archivo. No dejes carpetas vacías.

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

Revisa `git diff --stat`. Resume a la persona qué cambiaste, qué probaste, qué **no**
pudiste probar y dónde quedó el registro.
