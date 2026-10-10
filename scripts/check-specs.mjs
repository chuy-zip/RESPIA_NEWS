/*
 * Revisa las specs y los enlaces de la documentación, sin dependencias (D-36).
 *
 *   node scripts/check-specs.mjs          informe completo
 *   node scripts/check-specs.mjs --hook   modo del hook de commit: solo errores y un resumen
 *
 * Los errores bloquean el commit: enlaces rotos, specs fuera de su carpeta de parte y
 * archivos .md sueltos en la raíz. Los avisos no bloquean: los limpia /killspec.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { posix as path } from "node:path";

const PARTS = ["ia", "front", "backend", "infra"];
const ROOT_FILES = ["README.md", "AGENTS.md", "CLAUDE.md"];
const REQUIRED_SECTIONS = ["## Comportamiento actual", "## Criterios de aceptación", "## Cambio en curso"];
const DEPRECATED_MARK = /^> \*\*Obsoleto desde/m;

const hookMode = process.argv.includes("--hook");
const errors = [];
const warnings = [];

const files = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard", "*.md"], {
  encoding: "utf8",
})
  .split("\0")
  .filter((file) => file && existsSync(file));

const read = (file) => readFileSync(file, "utf8");
// Los bloques de código muestran ejemplos y plantillas: sus rutas no son enlaces reales.
const withoutCode = (text) => text.replace(/```[\s\S]*?```/g, "");
const deprecated = new Set(files.filter((file) => DEPRECATED_MARK.test(read(file))));

function links(file) {
  return [...withoutCode(read(file)).matchAll(/\]\(([^)\s]+)\)/g)]
    .map((match) => match[1])
    .filter((target) => !/^(https?:|mailto:|#)/.test(target) && !target.includes("<"));
}

const resolve = (file, target) => path.normalize(path.join(path.dirname(file), decodeURIComponent(target.split("#")[0])));

// Enlaces rotos, y specs que todavía enlazan documentos obsoletos. El índice de docs/README.md
// los lista a propósito y una bitácora es un registro histórico: ahí no se avisa.
for (const file of files) {
  let toDeprecated = 0;
  for (const target of links(file)) {
    const destination = resolve(file, target);
    if (!existsSync(destination)) errors.push(["E-ENLACE", file, `enlace roto «${target}»`]);
    else if (deprecated.has(destination) && file.startsWith("specs/") && !deprecated.has(file)) toDeprecated += 1;
  }
  if (toDeprecated > 0) {
    warnings.push(["A-OBSOLETO", file, `${toDeprecated} enlace(s) a un documento obsoleto. Enlace lo vigente que dice su aviso`]);
  }
}

// Archivos sueltos en la raíz y specs fuera de su carpeta de parte (D-35).
for (const file of files) {
  if (!file.includes("/") && !ROOT_FILES.includes(file)) {
    errors.push(["E-RAIZ", file, "archivo .md en la raíz. Muévalo a specs/<parte>/ y, si es una nota de traspaso, márquelo obsoleto"]);
  }
  if (file.startsWith("specs/")) {
    const [, part, name] = file.split("/");
    if (!name || !PARTS.includes(part)) {
      errors.push(["E-UBICACION", file, `spec fuera de una carpeta de parte (${PARTS.join(", ")})`]);
    }
  }
}

// Decisiones reemplazadas: D-24 → D-34 si su estado dice «Reemplazada por D-34».
const replacedBy = new Map();
for (const line of read("docs/DECISIONES.md").split("\n")) {
  const cells = line.split("|").map((cell) => cell.trim());
  const id = cells[1];
  const state = cells.at(-2) ?? "";
  const next = state.match(/Reemplazada por (D-\d+)/)?.[1];
  if (/^D-\d+$/.test(id ?? "") && next) replacedBy.set(id, next);
}
const latest = (id) => (replacedBy.has(id) ? latest(replacedBy.get(id)) : id);

const specs = files.filter((file) => /^specs\/[^/]+\/[^/]+\.md$/.test(file) && !deprecated.has(file));
const features = new Set(specs.map((file) => path.basename(file, ".md")));

for (const spec of specs) {
  const text = read(spec);
  const header = text.split(/^## /m)[0];
  const cited = new Set(header.match(/D-\d+/g) ?? []);

  for (const id of cited) {
    const current = latest(id);
    if (current !== id && !cited.has(current)) {
      warnings.push(["A-DECISION", spec, `cita ${id}, que fue reemplazada por ${current}. Revise el texto que depende de ${id}`]);
    }
  }
  if (!/Responsable/.test(header)) warnings.push(["A-RESPONSABLE", spec, "el encabezado no dice quién es el responsable"]);
  for (const section of REQUIRED_SECTIONS) {
    if (!text.includes(section)) warnings.push(["A-SECCION", spec, `falta la sección «${section.slice(3)}» de la plantilla`]);
  }
  const feature = path.basename(spec, ".md");
  if (!existsSync(`docs/features/${feature}/bitacora.md`)) {
    warnings.push(["A-BITACORA", spec, `no existe docs/features/${feature}/bitacora.md`]);
  }
}

for (const file of files) {
  const feature = file.match(/^docs\/features\/([^/]+)\/bitacora\.md$/)?.[1];
  if (feature && !features.has(feature)) {
    warnings.push(["A-BITACORA", file, `no hay una spec specs/<parte>/${feature}.md para esta bitácora`]);
  }
}

const print = (list) => list.forEach(([code, file, message]) => console.log(`${code.padEnd(14)} ${file}: ${message}`));

if (hookMode) {
  if (errors.length > 0) {
    console.log(`Revisión de specs: ${errors.length} error(es). El commit se detiene.\n`);
    print(errors);
    console.log("\nCorríjalos o ejecute /killspec. Detalle: node scripts/check-specs.mjs");
  } else if (warnings.length > 0) {
    console.log(`Revisión de specs: ${warnings.length} aviso(s). Ejecute /killspec para limpiarlos.`);
  }
} else {
  console.log(`Revisión de specs (D-36): ${errors.length} error(es), ${warnings.length} aviso(s).\n`);
  print(errors);
  print(warnings);
  if (errors.length + warnings.length > 0) console.log("\nPara limpiar: /killspec (.claude/skills/killspec/SKILL.md).");
}

process.exitCode = errors.length > 0 ? 1 : 0;
