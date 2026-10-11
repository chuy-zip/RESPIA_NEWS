import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Registro de costo y tope de gasto de IA (RP-01, RP-02, CIC-15).
 *
 * Es el único camino hacia el proveedor del modelo: cada función de IA llama con
 * `withSpendLimit`. Antes de llamar comprueba el tope, y después registra los
 * tokens reales. Si no puede leer el gasto, no llama: falla cerrado.
 */

export type AiFunction = "responderChat" | "elegirImagen";

/** USD por millón de tokens. Página oficial de Anthropic, revisada el 2026-10-08 (CIC-14). */
const PRICES = {
  "claude-haiku-5-5": { input: 0.1, output: 0.5, cacheRead: 0.01, cacheWrite: 0.125 },
} as const;

export type PricedModel = keyof typeof PRICES;

/** Tope de la app hasta la demo (D-30). Para la demo sube a 20. */
export const SPEND_LIMIT_USD = 14;
/** Reserva para la demo dentro de los USD 20 (D-30). */
export const DEMO_RESERVE_USD = 6;

/** Los nombres siguen el campo `usage` de la API de Anthropic. */
export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
}

/** El gasto llegó al tope. El backend responde 429 AI_LIMIT_REACHED (D-34). */
export class AiLimitError extends Error {
  readonly spentUsd: number;

  constructor(spentUsd: number) {
    super("Se alcanzó el tope de gasto de IA.");
    this.name = "AiLimitError";
    this.spentUsd = spentUsd;
  }
}

export function costOf(model: PricedModel, usage: TokenUsage): number {
  const price = PRICES[model];
  return (
    (usage.input_tokens * price.input +
      usage.output_tokens * price.output +
      (usage.cache_read_input_tokens ?? 0) * price.cacheRead +
      (usage.cache_creation_input_tokens ?? 0) * price.cacheWrite) /
    1_000_000
  );
}

function environment(): "local" | "preview" | "production" {
  const env = process.env.VERCEL_ENV;
  return env === "production" || env === "preview" ? env : "local";
}

async function readSpend(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("ai_spend_total");
  const spent = Number(data);
  if (error || data === null || !Number.isFinite(spent)) {
    throw new Error("No se pudo leer el gasto de IA: no se llama al modelo.", { cause: error });
  }
  return spent;
}

async function record(fn: AiFunction | "buscarExterno", model: string, usage: TokenUsage, costUsd: number, credits = 0) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_ai_usage", {
    p_function_name: fn,
    p_model: model,
    p_environment: environment(),
    p_input_tokens: usage.input_tokens,
    p_output_tokens: usage.output_tokens,
    p_cache_read_tokens: usage.cache_read_input_tokens ?? 0,
    p_cache_write_tokens: usage.cache_creation_input_tokens ?? 0,
    p_cost_usd: costUsd,
    p_external_credits: credits,
  });
  // La llamada ya se hizo y se pagó: un fallo del registro no debe tirar la respuesta.
  if (error) console.error("[costo] no se pudo registrar el uso", error);
}

export interface ModelCall<T> {
  result: T;
  usage: TokenUsage;
}

/**
 * Llama al modelo dentro del tope. `estimatedInputTokens` es una cota alta de la
 * entrada y `maxTokens` el mismo límite de salida que recibe la API: juntos dan
 * el costo máximo. El costo registrado sale de `usage`.
 */
export async function withSpendLimit<T>(
  options: { fn: AiFunction; model: PricedModel; estimatedInputTokens: number; maxTokens: number },
  call: () => Promise<ModelCall<T>>,
): Promise<T> {
  const spent = await readSpend();
  const maxCost = costOf(options.model, { input_tokens: options.estimatedInputTokens, output_tokens: options.maxTokens });
  if (spent + maxCost > SPEND_LIMIT_USD) {
    throw new AiLimitError(spent);
  }

  const { result, usage } = await call();
  await record(options.fn, options.model, usage, costOf(options.model, usage));
  return result;
}

/** Registra una búsqueda en Tavily: 1 crédito del plan gratis y costo 0 (D-25). */
export async function recordExternalSearch(): Promise<void> {
  await record("buscarExterno", "tavily-basic", { input_tokens: 0, output_tokens: 0 }, 0, 1);
}

/** Respuesta de GET /api/admin/ai-usage (ficha 11). Un dato que no se puede leer va como null, nunca como 0. */
export interface AiUsageSummary {
  currency: "USD";
  spent: number | null;
  remaining: number | null;
  reserved: number;
  applicationLimit: number;
  byFunction: { functionName: string; calls: number; costUsd: number; externalCredits: number }[];
  availability: "available" | "limit_reached" | "unavailable";
}

interface SummaryRow {
  function_name: string;
  calls: number | string;
  cost_usd: number | string;
  external_credits: number | string;
}

/** Resumen de gasto para el portal. La ruta verifica el rol: la base solo devuelve el desglose a administradores. */
export async function getAiUsageSummary(): Promise<AiUsageSummary> {
  const supabase = await createClient();
  const [total, byFunction] = await Promise.all([supabase.rpc("ai_spend_total"), supabase.rpc("ai_usage_summary")]);

  const spentValue = Number(total.data);
  const spent = total.error || total.data === null || !Number.isFinite(spentValue) ? null : spentValue;

  return {
    currency: "USD",
    spent,
    remaining: spent === null ? null : Math.max(0, SPEND_LIMIT_USD - spent),
    reserved: DEMO_RESERVE_USD,
    applicationLimit: SPEND_LIMIT_USD,
    byFunction: byFunction.error
      ? []
      : ((byFunction.data ?? []) as SummaryRow[]).map((row) => ({
          functionName: row.function_name,
          calls: Number(row.calls),
          costUsd: Number(row.cost_usd),
          externalCredits: Number(row.external_credits),
        })),
    availability: spent === null ? "unavailable" : spent >= SPEND_LIMIT_USD ? "limit_reached" : "available",
  };
}
