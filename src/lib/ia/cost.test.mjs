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

const { AiLimitError, SPEND_LIMIT_USD, costOf, getAiUsageSummary, parseAiUsageDays, recordExternalSearch, withSpendLimit } = await import(
  "./cost.ts"
);

let recorded;
let queries;

function dailyRows(days, lastDate = "2026-10-14") {
  const last = Date.parse(`${lastDate}T00:00:00Z`);
  return Array.from({ length: days }, (_, index) => ({
    date: new Date(last - (days - 1 - index) * 86_400_000).toISOString().slice(0, 10),
    calls: "0", cost_usd: "0.000000", input_tokens: "0", output_tokens: "0",
    cache_read_tokens: "0", cache_write_tokens: "0", external_credits: "0",
  }));
}

/** Simula las funciones de la base. No ejecuta SQL ni consulta proveedores. */
function mockDatabase({ spent = 0, totalError = null, summary = [], summaryError = null, daily, dailyError = null, dailyReject = false } = {}) {
  recorded = [];
  queries = [];
  globalThis.fakeRpc = async (name, args) => {
    queries.push({ name, args });
    if (name === "ai_spend_total") return { data: totalError ? null : spent, error: totalError };
    if (name === "ai_usage_summary") return { data: summaryError ? null : summary, error: summaryError };
    if (name === "ai_usage_daily") {
      if (dailyReject) throw new Error("Sin conexión con el historial");
      return { data: dailyError ? null : daily ?? dailyRows(args.p_days), error: dailyError };
    }
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
  assert.equal(summary.byFunctionAvailable, true);
  assert.deepEqual(summary.byFunction, [{ functionName: "responderChat", calls: 120, costUsd: 2.5, externalCredits: 0 }]);
});

test("RP-02: si la base falla, el resumen dice null, nunca 0", async () => {
  mockDatabase({ totalError: { message: "sin conexión" }, summaryError: { message: "sin conexión" }, dailyError: { message: "sin conexión" } });
  const summary = await getAiUsageSummary();

  assert.equal(summary.spent, null);
  assert.equal(summary.remaining, null);
  assert.equal(summary.availability, "unavailable");
  assert.equal(summary.byFunctionAvailable, false);
  assert.equal(summary.daily, null);
  assert.deepEqual(summary.byFunction, []);
});

test("RP-02: la ventana diaria admite solo 7, 30 y 90 días y rechaza duplicados", () => {
  assert.equal(parseAiUsageDays(new URLSearchParams()), 30);
  for (const days of [7, 30, 90]) assert.equal(parseAiUsageDays(new URLSearchParams({ days: String(days) })), days);
  for (const query of ["days=", "days=0", "days=-7", "days=31", "days=7.0", "days=07", "days=abc", "days=7&days=7", "days=7&days=30"]) {
    assert.throws(() => parseAiUsageDays(new URLSearchParams(query)), RangeError);
  }
});

test("RP-02: una ventana inválida no consulta la base", async () => {
  mockDatabase();
  await assert.rejects(getAiUsageSummary(8), RangeError);
  assert.equal(queries.length, 0);
});

test("RP-02: el historial usa las fechas de Guatemala del servidor y conserva tokens y créditos", async () => {
  const rows = dailyRows(7, "2026-03-01");
  rows[6] = { ...rows[6], calls: "2", cost_usd: "0.001500", input_tokens: "1000", output_tokens: "500", cache_read_tokens: "200", cache_write_tokens: "10", external_credits: "1" };
  mockDatabase({ spent: 2.5, daily: rows });
  const before = Date.now();
  const summary = await getAiUsageSummary(7);

  assert.equal(summary.daily.timeZone, "America/Guatemala");
  assert.equal(summary.daily.from, "2026-02-23");
  assert.equal(summary.daily.to, "2026-03-01");
  assert.deepEqual(summary.daily.items[6], {
    date: "2026-03-01", calls: 2, costUsd: 0.0015, inputTokens: 1000, outputTokens: 500,
    cacheReadTokens: 200, cacheWriteTokens: 10, externalCredits: 1,
  });
  assert.deepEqual(queries.find((query) => query.name === "ai_usage_daily").args, { p_days: 7 });
  assert.ok(Date.parse(summary.updatedAt) >= before && Date.parse(summary.updatedAt) <= Date.now());
  assert.equal(new Date(summary.updatedAt).toISOString(), summary.updatedAt);
  assert.equal(summary.spent, 2.5);
  assert.equal(summary.remaining, SPEND_LIMIT_USD - 2.5);
});

test("RP-02: días sin registros son ceros reales y no cambian el acumulado ni el desglose", async () => {
  for (const days of [7, 30, 90]) {
    mockDatabase({ spent: 2.5 });
    const summary = await getAiUsageSummary(days);
    assert.equal(summary.daily.items.length, days);
    assert.ok(summary.daily.items.every((item) => item.calls === 0 && item.costUsd === 0 && item.externalCredits === 0));
    assert.equal(summary.spent, 2.5);
    assert.equal(summary.byFunctionAvailable, true);
    assert.deepEqual(summary.byFunction, []);
  }
});

test("RP-02: la RPC diaria ausente o rechazada no borra los acumulados", async () => {
  for (const failure of [{ dailyError: { code: "PGRST202", message: "RPC no instalada" } }, { dailyReject: true }]) {
    mockDatabase({ spent: 3, ...failure });
    const summary = await getAiUsageSummary();
    assert.equal(summary.daily, null);
    assert.equal(summary.spent, 3);
    assert.equal(summary.remaining, SPEND_LIMIT_USD - 3);
    assert.equal(summary.availability, "available");
    assert.equal(summary.byFunctionAvailable, true);
  }
});

test("RP-02: un desglose fallido no se presenta como una lista vacía disponible", async () => {
  mockDatabase({ spent: 3, summaryError: { message: "No se pudo leer el desglose" } });
  const summary = await getAiUsageSummary(7);
  assert.equal(summary.byFunctionAvailable, false);
  assert.deepEqual(summary.byFunction, []);
  assert.equal(summary.spent, 3);
  assert.equal(summary.daily.items.length, 7);
});

test("RP-02: fechas incompletas o inválidas y valores ausentes no se sustituyen con ceros", async () => {
  const invalid = [[], dailyRows(6)];
  const duplicate = dailyRows(7);
  duplicate[3].date = duplicate[2].date;
  invalid.push(duplicate);
  const impossibleDate = dailyRows(7, "2026-03-01");
  impossibleDate[5].date = "2026-02-30";
  invalid.push(impossibleDate);
  for (const value of [null, "", "abc", -1, Number.MAX_SAFE_INTEGER + 1]) {
    const rows = dailyRows(7);
    rows[0].calls = value;
    invalid.push(rows);
  }
  for (const daily of invalid) {
    mockDatabase({ spent: 1, daily });
    const summary = await getAiUsageSummary(7);
    assert.equal(summary.daily, null);
    assert.equal(summary.spent, 1);
  }
});
