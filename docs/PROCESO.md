# Proceso de trabajo con agentes de IA

Versión 0.3 · 2026-10-09. Cubre `RPR-01` a `RPR-03` de [ALCANCE.md](ALCANCE.md).

Cada cambio debe mostrar tres datos: **qué hizo el agente, qué decidió el equipo y
qué evidencia lo respalda.**

Cada parte trabaja en sus carpetas. El código va en la rama de su feature (sección 8). La evidencia
vive en la documentación; Git evita que dos partes se pisen.

## 1. Dónde va cada dato

| Lugar | Contenido |
|---|---|
| **Notion** | El porqué: investigación (R&D) por área, teoría, alternativas e hipótesis completas. [Página del proyecto](https://app.notion.com/p/3f3f573ce6df81b8bf09c7294f924875) · [Investigación (R&D)](https://app.notion.com/p/bcf3b3eb862b4a0fa01d068850f4d198) · [Frameworks](https://app.notion.com/p/3f3f573ce6df8157b385d2313b050874). Las tareas: [Tickets](https://app.notion.com/p/e7bcbe3443c343b2873a2b5b97eb474c), un ticket por funcionalidad con su lista de tareas y evidencia (D-28) |
| **Repositorio** | El qué y el cómo: specs, bitácoras, decisiones y código |

- Registre cada dato en un solo lugar. Use enlaces; no copie.
- Use el mismo ID de ciclo (`CIC-NNN`) en Notion y en la bitácora. Notion asigna el número al crear la fila.
- Cite el ID del ticket (`TKT-NN`) en el commit, el PR y la bitácora.
- Cite los requisitos por su ID (`RF-08`). No copie su texto.

| Archivo | Contenido |
|---|---|
| [ALCANCE.md](ALCANCE.md) | Requisitos con ID, criterios de aceptación y matriz de estado |
| `specs/<parte>/<feature>.md` | Spec de la feature: comportamiento actual, criterios y cambio en curso. La parte es la del responsable: `ia`, `front`, `backend` o `infra` (D-35) |
| `docs/features/<feature>/bitacora.md` | Ciclos que cambiaron una decisión, con el registro del agente |
| [DECISIONES.md](DECISIONES.md) | Todas las decisiones duraderas, una fila por decisión |

## 2. Ciclo de trabajo

**Comprensión → Hipótesis → Construcción → Prueba → Observación → Corrección**

1. Escriba el cambio en `specs/<parte>/<feature>.md`, sección «Cambio en curso»: requisitos y
   criterios de aceptación. Si la funcionalidad no tiene ticket, créelo y escriba sus tareas en él.
2. Construya con el agente. El agente lee [AGENTS.md](../AGENTS.md) y el spec.
3. Ejecute la prueba. Registre la fecha, el entorno, lo observado y el resultado.
4. Si la evidencia cambia una decisión, registre el ciclo en la bitácora. Si la
   decisión es duradera, agregue una fila en [DECISIONES.md](DECISIONES.md).
5. Cierre el cambio: actualice «Comportamiento actual», marque las tareas del ticket con su
   evidencia y borre «Cambio en curso». Git conserva el historial.

No todo cambio es un ciclo. Registre solo los ciclos que cambiaron una decisión o
descartaron una hipótesis.

## 3. Registro del uso de agentes

Cada entrada de bitácora hecha con un agente incluye estos campos:

| Campo | Contenido |
|---|---|
| **Agente** | Herramienta y modelo |
| **Pedido** | Qué se pidió, en resumen. Sin datos sensibles |
| **Propuesta** | Qué propuso el agente |
| **Decisión** | Qué aceptó, rechazó o corrigió el equipo, y por qué |
| **Verificación** | Cómo se comprobó: prueba, lectura del código o documentación oficial |

> **Importante:** si el agente propuso algo incorrecto y eso cambió una decisión,
> regístrelo. Es evidencia, no un fallo.

Los commits hechos con un agente llevan la línea `Co-Authored-By` del agente.

El uso de IA **dentro del producto** (qué función llama a un modelo, cuánto cuesta y
por qué) se documenta en el spec de cada feature, sección «Uso de IA en el producto».

## 4. Frameworks y qué demuestran

| Framework | Qué demuestra | Dónde se ve |
|---|---|---|
| First principles, Lean, Systems thinking | El problema se analizó antes de elegir la solución | Notion (hechos base); spec («No incluido», «Dependencias») |
| SDD (spec-driven) | El plan existe antes del código | `specs/<parte>/<feature>.md` |
| TDD (test-driven) | El criterio de aceptación existe antes del código | Criterios del spec, `*.test.ts`, `e2e/` |
| EDD (evidence-driven) | Cada cierre y cada decisión tienen evidencia | Bitácora, `DECISIONES.md` |
| Context engineering | Qué información recibe el agente | `AGENTS.md`, spec |
| Harness engineering | Qué puede hacer el agente y qué se verifica | `.claude/skills/`, hooks, `tsc`, `eslint` |
| Loop engineering | Cuándo termina un ciclo | Definición de Done |
| Memory engineering | Qué se conserva entre sesiones | Spec, `DECISIONES.md`, bitácora |

## 5. Límites

> **Regla:** antes de crear un archivo, verifique si el dato cabe en un archivo existente.
>
> **Regla:** el diff hace solo lo que pide la tarea. Sin reformateos, abstracciones ni código "por si acaso". Reglas completas en [AGENTS.md](../AGENTS.md), sección «Cambios mínimos».

| Tipo | Límite |
|---|---|
| Spec | 1 por feature |
| Bitácora | 1 por feature. Solo ciclos que cambiaron algo |
| Decisiones | 1 archivo. 1 fila por decisión difícil de revertir o que afecta a 2 partes o más |
| Test de lógica | 1 archivo por módulo con riesgo: costo de IA, roles, validaciones, feed. 1 test por criterio. Al lado del módulo (`*.test.ts`) |
| Test e2e | 5 como máximo, con Playwright, en `e2e/`. Solo el camino principal del flujo. Sin estilos ni snapshots |
| UI sin e2e | Prueba manual en Vercel y en un teléfono real. Pruebe carga, vacío, error, sin conexión y cada rol |
| Skills | 3 como máximo, en `.claude/skills/`. Solo para un procedimiento que se repite 3 veces o más. Hoy hay 2: `asd-ste100` y `developer-documentation` (ver [AGENTS.md](../AGENTS.md)) |
| Capturas | 0 por defecto. Si hace falta una: `docs/features/<feature>/evidencia/AAAA-MM-DD-descripcion.ext`, sin llaves, tokens, cookies ni correos |
| Tamaño de un PR | Un cambio por PR. 400 líneas como máximo, sin contar `package-lock.json` ni archivos de terceros copiados sin modificar. Si es mayor, divídalo o explique en el PR por qué no se puede dividir |

## 6. Definición de Done

Una tarea está terminada cuando todo esto es cierto:

1. Cumple el criterio de aceptación.
2. La prueba tiene un registro escrito.
3. Está en Vercel y se probó allí. Si el requisito exige un dispositivo, se probó en uno real.
4. `npm run typecheck` y `npm run lint` no muestran errores.
5. No contiene secretos, llaves ni correos reales.
6. La tarea está marcada en el ticket de la funcionalidad, con su evidencia.
7. El spec, la bitácora y la matriz de estado de `ALCANCE.md` están actualizados.

Cada spec puede agregar un **Done específico**.

## 7. Evidencia

La evidencia es un **registro escrito de la prueba**. Debe decir:

- **Cuándo:** la fecha.
- **Dónde:** el entorno y el dispositivo («iPhone real, app instalada», «producción en Vercel»).
- **Qué se hizo y qué se vio.** Lo observado, no solo «funciona».
- **Resultado:** pasó o falló.

Escríbala junto a la tarea, en la lista del ticket de la funcionalidad. Si la funcionalidad
todavía no tiene ticket, escríbala en la tabla de tareas del spec. Si la prueba enseñó algo,
escriba una entrada en la bitácora y enlácela. Una tarea no se da por hecha sin su registro.

## 8. Git y propiedad de carpetas

### Ramas

```
documentación        --commit directo-->    dev
<feature>            --PR, merge commit-->  dev  --PR, merge commit-->  main (producción)
hotfix/<descripcion> --PR, squash-->        main  --merge-->  dev
```

| Rama | Para qué | Cómo entra un cambio |
|---|---|---|
| `main` | Producción y demos. Vercel la publica en <https://respia-news.vercel.app> | Solo por PR de *release* desde `dev` (merge commit) o de `hotfix/` (squash) |
| `dev` | Integración. Vercel la publica en una URL de preview fija. El equipo prueba aquí junto | Documentación: commit directo. Código: PR desde la rama de su feature (merge commit) |
| `<feature>` | Una funcionalidad mayor, por ejemplo `chat` o `recomendacion`. Sale de `dev` | Commits de quienes trabajan en la feature |

- **Nadie sube directo a `main`.**
- **La documentación va directo a `dev`**, sin rama ni PR: `docs/`, `specs/`, `AGENTS.md` y `README.md`. Antes de subir, ejecute `git pull` y revise `git diff --stat`.
- **El código va en la rama de su feature.** La rama se llama como la feature de [docs/README.md](README.md): `chat`, `recomendacion`, `portal-admin`. No cree una rama por cada cambio pequeño.
- La rama vive hasta que la feature está terminada. Después, bórrela. Traiga `dev` a su rama cada día:

```bash
git pull origin dev
```

**Release (`dev` → `main`).** Haga un release antes de cada demo o entrega, y solo si la preview
de `dev` pasó la prueba del equipo. Use **Create a merge commit**, nunca squash: con squash, `dev` y
`main` divergen y cada release trae conflictos.

**Hotfix.** Si producción falla: cree `hotfix/<descripcion>` desde `main`, abra un PR a `main` y,
después de fusionarlo, fusione `main` en `dev`.

> **Atención:** hay una sola base de Supabase. La preview de `dev` y producción usan los mismos datos.
> Ejecute un script de `supabase/migrations/` solo cuando su PR llega a `main`. Marque como prueba
> los datos que cree en `dev`.

### Dueño de cada carpeta

Cada persona modifica solo las carpetas de su parte, aunque comparta la rama de una feature. Si necesita cambiar una carpeta de otra parte, haga una de dos cosas:
(a) pida el cambio al dueño, o (b) inclúyalo en su PR y espere la aprobación del dueño. `.github/CODEOWNERS` pide esa revisión automáticamente.

| Carpeta | Dueño |
|---|---|
| `src/app/**/page.tsx`, `*.module.css`, `src/app/layout.tsx`, `src/components/`, `src/styles/`, `public/` (excepto `sw.js`), `e2e/` | Frontend · Sergio Orellana |
| `src/app/api/`, `src/app/actions/` (excepto `auth.ts`), `src/lib/services/`, `src/lib/http/`, `src/types/` | Backend · Gerardo Pineda |
| `src/lib/ia/`, `src/lib/recomendacion/` | IA · Rodrigo Mansilla |
| `supabase/migrations/`, `src/lib/supabase/`, `src/lib/auth/`, `src/proxy.ts`, `src/app/auth/`, `src/app/actions/auth.ts`, `public/sw.js`, `src/app/manifest.ts`, `next.config.ts`, `.env.example`, `package.json` | Infra · Ricardo Chuy |
| `specs/<parte>/<feature>.md`, `docs/features/<feature>/` | Responsable de la feature |
| `AGENTS.md`, `docs/PROCESO.md`, `docs/ALCANCE.md`, `docs/DECISIONES.md` | Todo el equipo |

### Archivos compartidos: reglas para evitar conflictos

| Archivo | Regla |
|---|---|
| `src/types/` | Es el contrato entre frontend y backend. Un cambio de tipo va en un PR pequeño y propio, antes del código que lo usa |
| `supabase/migrations/` | Use el número siguiente. Fusione el PR del script pronto. Si dos PR usan el mismo número, el último en fusionarse cambia su número |
| `package.json`, `package-lock.json` | Una dependencia nueva por PR, con aviso al equipo. Si `package-lock.json` tiene conflicto, no lo edite a mano: tome el de `main` y ejecute `npm install` |
| `docs/ALCANCE.md`, `docs/DECISIONES.md` | Agregue filas al final. No reordene ni edite filas de otros |

### Commits y pull requests

- Mensaje de commit: `<parte>(<feature>): descripción [requisito, ticket]`. Ejemplo: `ia(chat): cita las fuentes en la respuesta [RF-13, TKT-1]`.
- Título del PR: el mismo formato. Descripción: requisito, qué cambió, cómo se probó (URL de la preview de Vercel) y qué no se probó. El PR de una rama de feature apunta a `dev`, no a `main`.
- Abra un PR cuando una parte de la feature funciona. Antes de fusionar: la preview de Vercel compila, `npm run typecheck` y `npm run lint` no muestran errores, y la prueba se hizo en la preview.
- Fusione las ramas de feature con **Create a merge commit**. Con squash, la rama diverge de `dev` después del primer PR y cada PR siguiente trae conflictos.
- Si el PR solo toca carpetas de su parte, el autor puede fusionarlo. Si toca carpetas de otra parte, espere la aprobación del dueño.

### Configuración de GitHub (la hace el dueño del repositorio)

En Settings → Branches, cree una regla para `main` y otra para `dev`:

1. Solo en `main`: active «Require a pull request before merging», con 0 aprobaciones obligatorias. En `dev` no la active: bloquearía los commits directos de documentación.
2. En las dos: active «Block force pushes» y no permita borrar la rama.
3. En Settings → General, deje activos «Allow squash merging» y «Allow merge commits». Desactive «Allow rebase merging».
4. Deje `main` como rama por defecto. Al abrir un PR de feature, cambie la rama base a `dev`.

No active «Require review from Code Owners»: bloquearía los PR en los que el autor es el único dueño.

### Configuración de Vercel (la hace el dueño de la cuenta)

| Ajuste | Valor | Razón |
|---|---|---|
| Settings → Environments → Production | Rama `main` | Solo `main` publica en <https://respia-news.vercel.app> |
| Settings → Git → Ignored Build Step | **Automatic** | Vercel construye una preview de `dev` y de cada PR. No use «Only build production»: apaga esas previews y el trabajo integrado se probaría por primera vez en producción |
| Settings → Deployment Protection | El equipo puede abrir la preview de `dev` | Si «Vercel Authentication» está activo, solo el dueño de la cuenta ve las previews |

> **Atención:** en el plan Hobby, Vercel puede bloquear el despliegue de un commit cuyo autor no
> es el dueño de la cuenta ([INFRA_HANDOFF.md](INFRA_HANDOFF.md), sección 6.1). Si una preview sale
> «blocked», pruebe en local con `npm run dev`. Si el release a `main` se bloquea, el dueño de la
> cuenta hace el merge del PR de release.

## 9. Plantillas

### Spec (`specs/<parte>/<feature>.md`)

```markdown
# <Feature>

**Requisitos:** `RF-xx` · **Bitácora:** [bitacora.md](../../docs/features/<feature>/bitacora.md) ·
**Investigación:** <enlace a Notion> · **Responsable:** <nombre>

## Comportamiento actual
Qué hace hoy la feature y las reglas menores con su razón.

## Criterios de aceptación
Cómo se prueba cada requisito.

## No incluido
Lo que la feature no hace, a propósito.

## Dependencias
Otras features, tablas o servicios de los que depende.

## Uso de IA en el producto
Función, modelo, para qué, alternativa más barata considerada y costo. «Ninguno» si no aplica.

## Done específico
Condiciones adicionales a la definición de Done, si hay.

## Tareas
Enlace al ticket de la funcionalidad en [Tickets](https://app.notion.com/p/e7bcbe3443c343b2873a2b5b97eb474c).
Si todavía no hay ticket, una tabla con las columnas Estado, Tarea, Req. y Evidencia.

## Cambio en curso
Vacío si no hay un cambio abierto.
```

### Entrada de bitácora

Las entradas anteriores al 2026-10-08 usan un solo campo «Uso de IA». No se reescriben.

```markdown
## 2026-10-08 · CIC-NNN · Título corto de lo que pasó

**Requisitos:** `RF-08` · **Notion:** <enlace> · **Commit:** abc1234 (opcional) ·
**Decisión:** D-NN (si aplica)

- **Comprensión:** …
- **Hipótesis:** una línea. El detalle está en Notion.
- **Construcción:** …
- **Prueba:** cómo se probó.
- **Observación:** lo que se vio, aunque contradiga la hipótesis.
- **Corrección:** qué cambió por eso.
- **Agente:** herramienta y modelo.
- **Pedido:** …
- **Propuesta:** …
- **Decisión:** qué aceptó, rechazó o corrigió el equipo, y por qué.
- **Verificación:** …
- **Evidencia:** cuándo, dónde, qué se vio y resultado.
```

Las entradas llevan la fecha en que ocurrió el hecho. Si una entrada se escribe
después, márquela como *reconstruida*.
