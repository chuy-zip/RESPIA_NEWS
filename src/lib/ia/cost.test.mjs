import { afterEach, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";

// La base se simula: @/lib/supabase/server devuelve un cliente cuyo rpc responde con globalThis.fakeRpc.
// server-only falla fuera de Next, así que se reemplaza por un módulo vacío.
const fakeSupabase = "export async function createClient() { return { rpc: (name, args) => globalThis.fakeRpc(name, args) }; }";
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { url: "data:text/javascript,", shortCircuit: true };
    if (specifier === "@/lib/supabase/server") {
      return { url: `data:text/javascript,${encodeURIComponent(fakeSupabase)}`, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { AiLimitError, SPEND_LIMIT_USD, costOf, getAiUsageSummary, recordExternalSearch, withSpendLimit } = await import(
  "./cost.ts"
);

let recorded;

/** Simula las tres funciones de la base del script 006. */
function mockDatabase({ spent = 0, totalError = null, summary = [], summaryError = null } = {}) {
  recorded = [];
  globalThis.fakeRpc = async (name, args) => {
    if (name === "ai_spend_total") return { data: totalError ? null : spent, error: totalError };
    if (name === "ai_usage_summary") return { data: summaryError ? null : summary, error: summaryError };
    if (name === "record_ai_usage") {
      recorded.push(args);
      return { data: null, error: null };
    }
    throw new Error(`rpc inesperado: ${name}`);
  };
}

const realError = console.error;
beforeEach(() => {
  console.error = () => {};
  delete process.env.VERCEL_ENV;
});
afterEach(() => {
  console.error = realError;
});

const OPTIONS = { fn: "responderChat", model: "claude-haiku-5-5", estimatedInputTokens: 4000, maxTokens: 2000 };
const USAGE = { input_tokens: 3100, output_tokens: 820, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };

test("RP-02: el costo sale de los tokens reales y del precio de Haiku 5.5", () => {
  const cost = costOf("claude-haiku-5-5", {
    input_tokens: 1000,
    output_tokens: 500,
    cache_read_input_tokens: 2000,
    cache_creation_input_tokens: 100,
  });

  assert.ok(Math.abs(cost - 0.0003825) < 1e-12);
});

test("RP-02: dentro del tope llama una vez y registra la llamada con su costo", async () => {
  mockDatabase({ spent: 1.5 });
  let calls = 0;
  const result = await withSpendLimit(OPTIONS, async () => {
    calls += 1;
    return { result: "respuesta", usage: USAGE };
  });

  assert.equal(result, "respuesta");
  assert.equal(calls, 1);
  assert.equal(recorded.length, 1);
  assert.equal(recorded[0].p_function_name, "responderChat");
  assert.equal(recorded[0].p_environment, "local");
  assert.equal(recorded[0].p_input_tokens, 3100);
  assert.ok(Math.abs(recorded[0].p_cost_usd - costOf("claude-haiku-5-5", USAGE)) < 1e-12);
});

test("RP-02: con el tope forzado no llama al modelo y lanza AiLimitError", async () => {
  mockDatabase({ spent: SPEND_LIMIT_USD - 0.001 });
  let calls = 0;

  await assert.rejects(
    withSpendLimit(OPTIONS, async () => {
      calls += 1;
      return { result: "no debería", usage: USAGE };
    }),
    AiLimitError,
  );
  assert.equal(calls, 0);
  assert.equal(recorded.length, 0);
});

test("RP-02: si no puede leer el gasto, no llama al modelo (falla cerrado)", async () => {
  mockDatabase({ totalError: { message: "sin conexión" } });
  let calls = 0;

  await assert.rejects(
    withSpendLimit(OPTIONS, async () => {
      calls += 1;
      return { result: "no debería", usage: USAGE };
    }),
    /No se pudo leer el gasto/,
  );
  assert.equal(calls, 0);
});

test("D-25: una búsqueda en Tavily se registra con 1 crédito y costo 0", async () => {
  mockDatabase();
  process.env.VERCEL_ENV = "production";
  await recordExternalSearch();

  assert.equal(recorded[0].p_function_name, "buscarExterno");
  assert.equal(recorded[0].p_external_credits, 1);
  assert.equal(recorded[0].p_cost_usd, 0);
  assert.equal(recorded[0].p_environment, "production");
});

test("RP-02: el resumen trae gasto, saldo de la app y costo por función", async () => {
  mockDatabase({
    spent: "2.500000",
    summary: [{ function_name: "responderChat", calls: "120", cost_usd: "2.500000", external_credits: "0" }],
  });
  const summary = await getAiUsageSummary();

  assert.equal(summary.spent, 2.5);
  assert.equal(summary.remaining, SPEND_LIMIT_USD - 2.5);
  assert.equal(summary.availability, "available");
  assert.deepEqual(summary.byFunction, [{ functionName: "responderChat", calls: 120, costUsd: 2.5, externalCredits: 0 }]);
});

test("RP-02: si la base falla, el resumen dice null, nunca 0", async () => {
  mockDatabase({ totalError: { message: "sin conexión" }, summaryError: { message: "sin conexión" } });
  const summary = await getAiUsageSummary();

  assert.equal(summary.spent, null);
  assert.equal(summary.remaining, null);
  assert.equal(summary.availability, "unavailable");
  assert.deepEqual(summary.byFunction, []);
});
