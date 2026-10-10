---
name: killspec
description: Audita y limpia las specs de RESPIA NEWS. Corrige enlaces rotos, mueve specs a su carpeta de parte, marca como obsoletos los documentos muertos y actualiza specs que citan decisiones reemplazadas. Úsala cuando el usuario escriba /killspec, pida limpiar o deprecar specs, o cuando el hook de commit se detenga por la revisión de specs.
metadata:
  version: "1.0.0"
---

# killspec

Limpia las specs con la revisión de `scripts/check-specs.mjs` (D-36). Nunca borra un documento: lo marca como
obsoleto y deja el rastro (D-35).

## Procedimiento

1. Ejecute la revisión:

   ```bash
   node scripts/check-specs.mjs
   ```

2. Corrija primero los errores (`E-`) y después los avisos (`A-`). Use la tabla «Acción por código».
3. Antes de cambiar una spec de otra parte, revise su responsable en el encabezado (regla 14 de `AGENTS.md`):
   - Un enlace o una ruta: corríjalo y dígalo en el resumen.
   - Un cambio de contenido: no lo haga. Propóngalo a la persona y nombre al dueño.
4. Ejecute la revisión otra vez. El resultado debe tener 0 errores.
5. Valide cada archivo que cambió:

   ```bash
   python .claude/skills/developer-documentation/scripts/validate_docs.py <archivo>
   ```

6. Revise `git diff --stat`. Haga un commit directo a `dev`, con el formato
   `docs(proceso): limpieza de specs [RPR-02]` y la línea `Co-Authored-By` del agente.
7. Dé un resumen a la persona: qué corrigió, qué marcó como obsoleto y qué propone a cada dueño.

## Acción por código

| Código | Qué significa | Acción |
|---|---|---|
| `E-ENLACE` | Un enlace relativo apunta a un archivo que no existe | Busque el archivo con `git log --follow --name-status -- <ruta vieja>`. Corrija la ruta. Si el archivo se borró, enlace el documento que lo reemplaza |
| `E-RAIZ` | Hay un `.md` suelto en la raíz | Muévalo con `git mv` a `specs/<parte>/`, según su autor o su tema. Si es una nota de traspaso, márquelo obsoleto |
| `E-UBICACION` | Una spec no está en `specs/ia/`, `specs/front/`, `specs/backend/` ni `specs/infra/` | Muévala con `git mv` a la carpeta de la parte de su responsable. Corrija los enlaces que se rompan |
| `A-DECISION` | La spec cita una decisión reemplazada | Lea la decisión nueva en `docs/DECISIONES.md`. Actualice el encabezado y el texto que dependía de la vieja. Si toda la spec describe lo reemplazado, reescriba «Comportamiento actual» y «Cambio en curso» |
| `A-OBSOLETO` | La spec enlaza un documento obsoleto | Cambie el enlace por el documento vigente que nombra el aviso del obsoleto |
| `A-RESPONSABLE` | El encabezado no dice quién es el responsable | Use la tabla «Dónde trabaja cada parte» de `AGENTS.md`. Si no está claro, pregunte a la persona |
| `A-SECCION` | Falta una sección de la plantilla de `docs/PROCESO.md` | Agregue la sección. Si no hay contenido, escriba «Ninguno» |
| `A-BITACORA` | Hay una spec sin bitácora o una bitácora sin spec | Si falta la bitácora, créela con el título `# Bitácora de <feature>`. Si falta la spec, la feature murió: no borre la bitácora, avise a la persona |

## Marcar un documento como obsoleto

Cuando un documento ya no describe lo vigente:

1. Muévalo a `specs/<parte>/` si todavía no está ahí.
2. Agregue este aviso debajo del título:

   ```markdown
   > **Obsoleto desde el AAAA-MM-DD (D-NN).** <Qué era>. Ya no se actualiza. Se conserva como rastro.
   > Lo vigente está en: <enlaces>.
   ```

3. Agréguelo a la tabla «Documentos obsoletos» de `docs/README.md`.
4. No le agregue enlaces nuevos.

## Reglas

- No borre documentos ni bitácoras. Git guarda el historial, pero el curso pide ver el rastro.
- No cambie requisitos ni criterios de aceptación (regla 2 de `AGENTS.md`).
- No edite filas de `docs/DECISIONES.md`. Solo cambie la columna de estado de una decisión reemplazada.
- Escriba en español, con frases cortas (skill `asd-ste100`).
