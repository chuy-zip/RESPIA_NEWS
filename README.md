# RESPIA NEWS · Primeros pasos

PWA de noticias asistida por IA. Next.js 16 y TypeScript, Supabase (Postgres y Auth
con Google), desplegada en Vercel. Un solo repositorio para frontend, backend, datos e IA.

Producción: <https://respia-news.vercel.app>

Este manual le dice cómo empezar. Las reglas completas están en los documentos que enlaza.

## Equipo

| Persona | Parte | Carpetas principales |
|---|---|---|
| Sergio Orellana | Frontend | `src/app/**/page.tsx`, `src/components/`, `src/styles/`, `e2e/` |
| Gerardo Pineda | Backend | `src/app/api/`, `src/app/actions/`, `src/lib/services/` |
| Ricardo Chuy | Infra | Vercel, Supabase, Google Cloud, `supabase/migrations/` |
| Rodrigo Mansilla | AI Engineering | `src/lib/ia/`, `src/lib/recomendacion/` |

Las variables de entorno y los accesos a Vercel y Supabase los entrega el responsable de infra.

---

## 1. Prepare el entorno

Requisito: Node 20.9 o superior.

1. Clone el repositorio.
2. Instale las dependencias. `npm ci` no modifica `package-lock.json`:

   ```bash
   npm ci
   ```

3. Copie `.env.example` a `.env.local`.
4. Pida los valores de las variables al responsable de infra. Escríbalos en `.env.local`.
5. Inicie el servidor de desarrollo:

   ```bash
   npm run dev
   ```

6. Abra `http://localhost:3000` e inicie sesión con Google. Si el inicio de sesión
   funciona, el entorno está listo.

> **Atención:** `.env.local` no se sube al repositorio. El repositorio es público.
> Si sube un secreto por error, avise al responsable de infra: hay que revocarlo.
> Borrarlo en otro commit no es suficiente.

Para probar la PWA (el service worker no se registra en `npm run dev`):

```bash
npm run build && npm start
```

---

## 2. Lea en este orden

| # | Documento | Para qué | Tiempo |
|---|---|---|---|
| 1 | [AGENTS.md](AGENTS.md) | Dónde trabaja cada parte, qué infraestructura no se toca y las reglas para agentes | 5 min |
| 2 | [docs/PROCESO.md](docs/PROCESO.md) | Ciclo de trabajo, registro del uso de agentes, límites y Definición de Done | 10 min |
| 3 | [docs/ALCANCE.md](docs/ALCANCE.md) | Requisitos con ID. Busque los de su feature | 5 min |
| 4 | `specs/<su-feature>.md` | Qué hace hoy la feature y qué tareas tiene. Lista en [docs/README.md](docs/README.md) | 5 min |
| 5 | [docs/DECISIONES.md](docs/DECISIONES.md) | Qué ya se decidió. No lo contradiga sin proponerlo | 5 min |

Consulte [docs/INFRA_HANDOFF.md](docs/INFRA_HANDOFF.md) solo cuando toque sesión,
seguridad, base de datos o despliegue. Sus secciones 10 (recetas de seguridad) y 13
(base de datos) son las más útiles.

---

## 3. Dónde trabaja cada parte

| Parte | Carpetas |
|---|---|
| Frontend | `src/app/**/page.tsx`, `src/components/`, `src/styles/`, `e2e/` |
| Backend | `src/app/api/`, `src/app/actions/`, `src/lib/services/`, `src/types/` |
| Modelación de datos | `supabase/migrations/`, `src/types/` |
| IA | `src/lib/ia/`, `src/lib/recomendacion/` |
| Proceso | `specs/`, `docs/` |

El detalle y las reglas de cada parte están en [AGENTS.md](AGENTS.md).

---

## 4. Su primer cambio

1. Busque el requisito en `ALCANCE.md` (por ejemplo `RF-08`). Si no hay un requisito, no hay tarea.
2. Cree una rama desde `dev` actualizado:

   ```bash
   git switch dev
   git pull
   git switch -c front/feed-y-lector-tarjetas
   ```

   Formato: `<parte>/<feature>-<descripcion>`. Partes: `front`, `back`, `datos`, `ia`, `infra`, `docs`.
3. Abra `specs/<feature>.md`. Si no existe, créelo con la plantilla de `PROCESO.md` y
   cree `docs/features/<feature>/bitacora.md`.
4. Escriba el cambio en la sección «Cambio en curso»: requisitos, criterios de
   aceptación y tareas. Hágalo **antes** del código.
5. Construya el cambio, solo o con un agente (sección 5). Modifique solo las carpetas de su parte.
6. Abra un PR hacia **`dev`** (no hacia `main`). Vercel crea una preview del PR. Ejecute la prueba en la preview.
   Escriba en la tabla de tareas: fecha, dónde, qué vio y resultado.
7. Si la prueba cambió una decisión, escriba una entrada en la bitácora.
8. Verifique la Definición de Done (sección 6).
9. Cierre el cambio: actualice «Comportamiento actual» y borre «Cambio en curso». Fusione con
   **Squash and merge**. Si el PR toca carpetas de otra parte, espere la aprobación del dueño.

Reglas completas de ramas, dueños de carpetas y archivos compartidos: sección 8 de
[docs/PROCESO.md](docs/PROCESO.md).

> **Atención:** todo lo que llega a `main` se publica en producción de forma
> automática. No suba directo a `main` ni a `dev`. `dev` pasa a `main` solo con un
> release antes de cada demo. Antes de fusionar un PR, ejecute `npm run typecheck`
> y `npm run lint`.

---

## 5. Cómo trabajar con un agente de IA

El agente (Claude Code, Codex, Copilot u otro) lee `AGENTS.md` al empezar. Usted:

1. Dele el requisito y el spec. Ejemplo: «Implementa la tarea 2 de `specs/chat.md` (`RF-12`)».
2. Lea lo que propone antes de aceptarlo.
3. Verifique el resultado con una prueba, con la lectura del código o con la documentación oficial.
4. Si el ciclo cambió una decisión, registre en la bitácora los cinco campos:

| Campo | Contenido |
|---|---|
| Agente | Herramienta y modelo |
| Pedido | Qué se pidió, en resumen |
| Propuesta | Qué propuso el agente |
| Decisión | Qué aceptó, rechazó o corrigió usted, y por qué |
| Verificación | Cómo se comprobó |

Si el agente se equivocó y eso cambió una decisión, regístrelo. Es evidencia, no un fallo.

---

## 6. Definición de Done

- [ ] Cumple el criterio de aceptación.
- [ ] La prueba tiene un registro escrito.
- [ ] Está en Vercel y se probó allí. Si el requisito exige un teléfono, se probó en uno real.
- [ ] `npm run typecheck` y `npm run lint` no muestran errores.
- [ ] No contiene secretos, llaves ni correos reales.
- [ ] El spec, la bitácora y la matriz de estado de `ALCANCE.md` están actualizados.

---

## 7. No haga esto

- No suba `.env.local`, llaves, tokens ni correos reales.
- No ponga una llave secreta en una variable `NEXT_PUBLIC_`: esas variables llegan al navegador.
- No edite un script SQL ya ejecutado. Escriba uno nuevo con el número siguiente.
- No modifique la infraestructura de la tabla de `AGENTS.md` sin avisar al responsable de infra.
- No llame a la base de datos ni a un modelo de IA desde un componente cliente.
- No cree un archivo si el dato cabe en uno existente. No deje carpetas vacías.
- No mezcle en un PR reformateos, renombres o cambios que la tarea no pide. Reglas en «Cambios mínimos» de [AGENTS.md](AGENTS.md).
- No marque una tarea como hecha sin el registro de su prueba.
- No trabaje en `main` ni en `dev`, ni haga `git push --force` sobre ramas de otros.
- No ejecute un script SQL antes de que su PR llegue a `main`: `dev` y producción comparten la base.

---

## 8. Comandos

| Comando | Para qué |
|---|---|
| `npm run dev` | Desarrollo en `http://localhost:3000` |
| `npm run build && npm start` | Build de producción local. Así se prueba la PWA |
| `npm run typecheck` | Verificar tipos |
| `npm run lint` | Verificar estilo de código |
| `npm run icons` | Regenerar los íconos de la PWA |

---

## 9. Dónde está cada cosa

| Necesita | Vaya a |
|---|---|
| El porqué de una feature: investigación e hipótesis | [Notion: Investigación (R&D)](https://app.notion.com/p/bcf3b3eb862b4a0fa01d068850f4d198) |
| Qué hace una feature y sus tareas | `specs/<feature>.md` |
| Qué se decidió y por qué | [docs/DECISIONES.md](docs/DECISIONES.md) |
| Cómo funciona la sesión, la seguridad o la base | [docs/INFRA_HANDOFF.md](docs/INFRA_HANDOFF.md) |
| Qué pide el curso | [Enunciado](docs/Proyecto%202%20AI%20Assisted%20News%20App.pdf) |
