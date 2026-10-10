import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildFeed } from "./feed.ts";

// Datos ficticios (D-15). Regiones: los 7 países de Centroamérica (D-26). "int" es una noticia internacional.
const CENTRAL_AMERICA = ["gt", "sv", "hn", "ni", "cr", "pa", "bz"];
const NOW = new Date("2026-10-10T12:00:00Z");

function hoursAgo(hours) {
  return new Date(NOW.getTime() - hours * 3_600_000).toISOString();
}

function article(id, topicIds, regionIds, ageHours, important = false) {
  return { id, topicIds, regionIds, publishedAt: hoursAgo(ageHours), important };
}

const ARTICLES = [
  article("a01", ["deportes"], ["gt"], 1),
  article("a02", ["deportes"], ["gt"], 3),
  article("a03", ["deportes"], ["gt"], 5),
  article("a04", ["economia"], ["gt"], 2),
  article("a05", ["politica"], ["gt"], 4, true),
  article("a06", ["salud"], ["gt"], 8),
  article("a07", ["cultura"], ["gt"], 10),
  article("a08", ["tecnologia"], ["gt"], 20),
  article("a09", ["salud"], ["gt"], 40),
  article("a10", ["economia"], ["sv"], 2),
  article("a11", ["politica"], ["sv"], 3, true),
  article("a12", ["deportes"], ["sv"], 6),
  article("a13", ["salud"], ["hn"], 4),
  article("a14", ["economia"], ["hn"], 12),
  article("a15", ["cultura"], ["ni"], 7),
  article("a16", ["politica"], ["ni"], 30),
  article("a17", ["economia"], ["cr"], 1),
  article("a18", ["deportes"], ["cr"], 5),
  article("a19", ["politica"], ["cr"], 9, true),
  article("a20", ["salud"], ["cr"], 15),
  article("a21", ["tecnologia"], ["pa"], 2),
  article("a22", ["economia"], ["pa"], 26),
  article("a23", ["cultura"], ["bz"], 11),
  article("a24", ["politica"], ["int"], 3, true),
  article("a25", ["economia"], ["int"], 6),
  article("a26", ["tecnologia"], ["int"], 1),
  article("a27", ["salud"], ["int"], 20),
  article("a28", ["deportes"], ["int"], 4),
  // Una noticia internacional relevante para toda la región: el cruce que busca la app.
  article("a29", ["tecnologia", "economia"], CENTRAL_AMERICA, 6),
  article("a30", ["cultura"], ["int"], 50),
];
const BY_ID = new Map(ARTICLES.map((item) => [item.id, item]));

// Perfiles fijos de los cuatro lectores del spec. L4 equivale a 10 aperturas de deportes: el tema más leído vale 1.
const READERS = {
  L1: { regionId: "gt", topicWeights: {} },
  L2: { regionId: "gt", topicWeights: { deportes: 0.5 } },
  L3: { regionId: "cr", topicWeights: { economia: 0.5 } },
  L4: { regionId: "gt", topicWeights: { deportes: 1 } },
};

function feedFor(profile, articles = ARTICLES, extra = {}) {
  return buildFeed(articles, profile, { now: NOW, centralAmericaRegionIds: CENTRAL_AMERICA, ...extra });
}

function scopeOf(item, profile) {
  if (item.regionIds.includes(profile.regionId)) return "país";
  if (item.regionIds.some((regionId) => CENTRAL_AMERICA.includes(regionId))) return "Centroamérica";
  return "internacional";
}

test("RF-08: el feed de cada lector tiene al menos 3 niveles", () => {
  for (const [name, profile] of Object.entries(READERS)) {
    const levels = new Set(feedFor(profile).items.map((item) => item.prominence));
    assert.ok(levels.size >= 3, `${name} tiene ${levels.size} niveles`);
  }
});

test("RF-08 y RF-04: la misma noticia cambia de nivel entre L2 y L3", (t) => {
  const l2 = new Map(feedFor(READERS.L2).items.map((item) => [item.articleId, item.prominence]));
  const l3 = feedFor(READERS.L3).items;
  const changed = l3.filter((item) => l2.get(item.articleId) !== item.prominence).length;

  assert.ok(changed >= 1);
  t.diagnostic(`${changed} de ${l3.length} noticias (${Math.round((100 * changed) / l3.length)} %) cambian de nivel`);
});

test("RF-11: cada ámbito con una noticia importante queda visible", () => {
  for (const [name, profile] of Object.entries(READERS)) {
    const feed = feedFor(profile);
    const visible = new Set([
      ...feed.items.filter((item) => item.prominence === "hero" || item.prominence === "large").map((item) => item.articleId),
      ...feed.importantItems.map((item) => item.articleId),
    ]);
    const important = ARTICLES.filter((item) => item.important);

    for (const scope of new Set(important.map((item) => scopeOf(item, profile)))) {
      const covered = important.some((item) => scopeOf(item, profile) === scope && visible.has(item.id));
      assert.ok(covered, `${name}: el ámbito ${scope} no tiene una noticia importante a la vista`);
    }
  }
});

test("RF-11: tres importantes de un país no dejan fuera la internacional", () => {
  const articles = [
    article("d1", ["deportes"], ["gt"], 0.5),
    article("d2", ["deportes"], ["gt"], 0.5),
    article("d3", ["deportes"], ["gt"], 0.5),
    article("p1", ["politica"], ["gt"], 1, true),
    article("p2", ["politica"], ["gt"], 2, true),
    article("p3", ["politica"], ["gt"], 3, true),
    article("i1", ["politica"], ["int"], 10, true),
  ];
  const ids = feedFor(READERS.L4, articles).importantItems.map((item) => item.articleId);

  assert.deepEqual(ids.sort(), ["i1", "p1"]);
});

test("RF-11: un ámbito que ya tiene una importante arriba no se repite en el bloque", () => {
  const feed = feedFor(READERS.L1);
  const ids = feed.importantItems.map((item) => item.articleId);

  assert.equal(feed.items[0].articleId, "a05");
  assert.deepEqual(ids.sort(), ["a11", "a24"]);
});

test("RF-11: el filtro por tema no quita lo importante", () => {
  const feed = feedFor(READERS.L4, ARTICLES, { topicId: "deportes" });

  assert.ok(feed.items.every((item) => BY_ID.get(item.articleId).topicIds.includes("deportes")));
  assert.ok(feed.importantItems.some((item) => item.articleId === "a24"));
});

test("RT-01: cada noticia tiene motivo y sus componentes suman el puntaje", () => {
  for (const profile of Object.values(READERS)) {
    const feed = feedFor(profile);
    for (const item of [...feed.items, ...feed.importantItems]) {
      const { region, interest, recency, importance } = item.components;
      assert.ok(item.reason.length > 0);
      assert.ok(Math.abs(region + interest + recency + importance - item.score) < 1e-12);
    }
  }

  assert.match(feedFor(READERS.L1).items[0].reason, /es relevante para tu país/);
});

test("RT-01: las mismas entradas dan el mismo orden", () => {
  for (const profile of Object.values(READERS)) {
    const ids = feedFor(profile).items.map((item) => item.articleId);
    const reversed = feedFor(profile, [...ARTICLES].reverse()).items.map((item) => item.articleId);
    assert.deepEqual(reversed, ids);
  }
});

test("Diversidad: temas distintos entre las 10 primeras (se reporta)", (t) => {
  for (const [name, profile] of Object.entries(READERS)) {
    const topics = new Set(
      feedFor(profile)
        .items.slice(0, 10)
        .flatMap((item) => BY_ID.get(item.articleId).topicIds),
    );
    t.diagnostic(`${name}: ${topics.size} temas distintos entre las 10 primeras`);
  }
});

test("RF-04: noticias del país del lector entre las 10 primeras (se reporta)", (t) => {
  for (const [name, profile] of Object.entries(READERS)) {
    const own = feedFor(profile)
      .items.slice(0, 10)
      .filter((item) => BY_ID.get(item.articleId).regionIds.includes(profile.regionId)).length;
    t.diagnostic(`${name}: ${own} de 10 son relevantes para su país`);
  }
});

test("RP-03: src/lib/recomendacion/ no importa un SDK de modelo ni hace llamadas de red", () => {
  const forbidden = /^(@anthropic-ai\/|openai|@ai-sdk\/|ai$|@\/lib\/ia)/;

  for (const file of readdirSync(import.meta.dirname).filter((name) => name.endsWith(".ts"))) {
    const source = readFileSync(join(import.meta.dirname, file), "utf8");
    const specifiers = [...source.matchAll(/(?:from|import\()\s*["']([^"']+)["']/g)].map((match) => match[1]);

    assert.deepEqual(specifiers.filter((specifier) => forbidden.test(specifier)), [], file);
    assert.doesNotMatch(source, /\bfetch\(/, file);
  }
});
