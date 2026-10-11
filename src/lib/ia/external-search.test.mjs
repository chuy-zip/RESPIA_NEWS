import { afterEach, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Node no resuelve el alias @/ de Next ni las importaciones sin extensión, y server-only
// falla fuera de Next. Este resolvedor los traduce para que la prueba corra con node --test.
const src = path.resolve(import.meta.dirname, "../..");
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { url: "data:text/javascript,", shortCircuit: true };
    const base = specifier.startsWith("@/")
      ? path.join(src, specifier.slice(2))
      : specifier.startsWith(".") && context.parentURL
        ? path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier)
        : null;
    if (base && !path.extname(base) && existsSync(`${base}.ts`)) {
      return nextResolve(pathToFileURL(`${base}.ts`).href, context);
    }
    return nextResolve(specifier, context);
  },
});

const { searchExternal } = await import("./external-search.ts");

const FEED = `<?xml version="1.0"?><rss><channel><item>
<title>Elecciones en Honduras: el CNE anuncia resultados preliminares</title>
<link>https://proceso.hn/elecciones-resultados</link>
<description>El Consejo Nacional Electoral publicó los primeros datos.</description>
<pubDate>Fri, 10 Oct 2026 10:00:00 GMT</pubDate>
</item></channel></rss>`;

const realFetch = globalThis.fetch;
const realWarn = console.warn;
let calls;

/** Simula los feeds y Tavily. Solo Proceso Digital responde. Los demás feeds fallan, como en la vida real. */
function mockFetch({ feed = "", tavily = { status: 200, body: { results: [] } } } = {}) {
  calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    if (String(url).startsWith("https://api.tavily.com")) {
      return new Response(JSON.stringify(tavily.body), { status: tavily.status });
    }
    return String(url).includes("proceso.hn") ? new Response(feed) : new Response("", { status: 404 });
  };
}

const tavilyCalls = () => calls.filter((call) => call.url.startsWith("https://api.tavily.com"));

beforeEach(() => {
  process.env.TAVILY_API_KEY = "tvly-prueba";
  console.warn = () => {};
});

afterEach(() => {
  globalThis.fetch = realFetch;
  console.warn = realWarn;
  delete process.env.TAVILY_API_KEY;
});

test("Con resultados del RSS no llama a Tavily", async () => {
  mockFetch({ feed: FEED });
  const results = await searchExternal("elecciones en Honduras");

  assert.equal(results.length, 1);
  assert.equal(results[0].source, "rss");
  assert.equal(results[0].site, "Proceso Digital");
  assert.equal(tavilyCalls().length, 0);
});

test("Sin resultados del RSS busca en Tavily, solo en los sitios permitidos", async () => {
  mockFetch({
    tavily: {
      status: 200,
      body: {
        results: [
          { title: "Acuerdo comercial en la región", url: "https://www.bbc.com/mundo/articles/x1", content: "Texto", published_date: "2026-10-09" },
          { title: "Sitio fuera de la lista", url: "https://example.com/nota", content: "Texto" },
          { title: "Dominio parecido", url: "https://bbc.com.falso.net/nota", content: "Texto" },
          { title: "", url: "https://www.dw.com/es/nota", content: "Sin título" },
        ],
      },
    },
  });
  const results = await searchExternal("acuerdo comercial regional");
  const [call] = tavilyCalls();
  const body = JSON.parse(call.init.body);

  assert.deepEqual(results.map((result) => [result.site, result.source]), [["BBC Mundo", "tavily"]]);
  assert.equal(call.init.headers.authorization, "Bearer tvly-prueba");
  assert.equal(body.search_depth, "basic");
  assert.equal(body.topic, "news");
  assert.equal(body.max_results, 5);
  assert.ok(body.include_domains.includes("prensalibre.com"));
});

test("Una pregunta larga no entra al RSS por dos palabras genéricas: pasa a Tavily", async () => {
  // Caso real del 2026-10-10: «sur» y «centro» trajeron un terremoto en Panamá.
  const feed = FEED.replace(
    "El Consejo Nacional Electoral publicó los primeros datos.",
    "Un sismo sacudió el sur de Centroamérica esta mañana.",
  );
  mockFetch({ feed });
  await searchExternal("tratado de libre comercio entre Centroamérica y Corea del Sur");

  assert.equal(tavilyCalls().length, 1);
});

test("Si Tavily falla, devuelve una lista vacía", async () => {
  mockFetch({ tavily: { status: 432, body: { detail: "sin créditos" } } });

  assert.deepEqual(await searchExternal("acuerdo comercial regional"), []);
});

test("Sin llave de Tavily no la llama", async () => {
  delete process.env.TAVILY_API_KEY;
  mockFetch();

  assert.deepEqual(await searchExternal("acuerdo comercial regional"), []);
  assert.equal(tavilyCalls().length, 0);
});
