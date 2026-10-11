import { test } from "node:test";
import assert from "node:assert/strict";
import { relatedArticles } from "./related.ts";

// Datos ficticios (D-15). Regiones: los 7 países de Centroamérica (D-26). "int" es una noticia internacional.
const CENTRAL_AMERICA = ["gt", "sv", "hn", "ni", "cr", "pa", "bz"];
const NOW = Date.parse("2026-10-10T12:00:00Z");

function article(id, topicIds, regionIds, ageHours) {
  return { id, topicIds, regionIds, publishedAt: new Date(NOW - ageHours * 3_600_000).toISOString() };
}

function relatedIds(opened, candidates) {
  return relatedArticles(opened, candidates, { centralAmericaRegionIds: CENTRAL_AMERICA }).map((item) => item.articleId);
}

const REMESAS = article("remesas", ["economia", "remesas"], ["gt"], 2);
const INFORME_IA = article("informe-ia", ["ia", "economia", "empleo"], CENTRAL_AMERICA, 30);
const LOCAL_RECIENTE = article("local", ["economia"], ["gt"], 1);

test("El cruce: un informe regional va antes que una noticia local más reciente", () => {
  const items = relatedArticles(REMESAS, [LOCAL_RECIENTE, INFORME_IA], { centralAmericaRegionIds: CENTRAL_AMERICA });

  assert.deepEqual(items, [
    { articleId: "informe-ia", sharedTopicIds: ["economia"], reach: "regional" },
    { articleId: "local", sharedTopicIds: ["economia"], reach: "local" },
  ]);
});

test("El cruce al revés: una noticia internacional muestra primero lo de Centroamérica", () => {
  const ia = article("ia-eeuu", ["ia", "empleo"], ["int"], 3);
  const otraInternacional = article("ia-europa", ["ia", "empleo"], ["int"], 1);

  assert.deepEqual(relatedIds(ia, [otraInternacional, INFORME_IA]), ["informe-ia", "ia-europa"]);
});

test("Con el mismo alcance, primero la que comparte más temas", () => {
  const dosTemas = article("dos", ["economia", "remesas"], ["sv"], 10);
  const unTema = article("uno", ["economia"], ["hn"], 1);

  assert.deepEqual(relatedIds(REMESAS, [unTema, dosTemas]), ["dos", "uno"]);
});

test("La noticia abierta y las que no comparten temas no aparecen", () => {
  const salud = article("salud", ["salud"], ["int"], 1);

  assert.deepEqual(relatedIds(REMESAS, [REMESAS, salud, INFORME_IA]), ["informe-ia"]);
});

test("Devuelve como máximo 3", () => {
  const candidates = ["a", "b", "c", "d", "e"].map((id, i) => article(id, ["economia"], ["int"], i + 1));

  assert.equal(relatedIds(REMESAS, candidates).length, 3);
});

test("Las mismas entradas en otro orden dan el mismo resultado", () => {
  const candidates = [
    LOCAL_RECIENTE,
    INFORME_IA,
    article("x", ["economia"], ["int"], 5),
    article("y", ["economia"], ["int"], 5),
  ];

  assert.deepEqual(relatedIds(REMESAS, [...candidates].reverse()), relatedIds(REMESAS, candidates));
});
