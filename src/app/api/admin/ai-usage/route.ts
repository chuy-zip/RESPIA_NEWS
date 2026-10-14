import { NextResponse } from "next/server";

import { ForbiddenError, requireAdmin, UnauthorizedError } from "@/lib/auth/dal";
import { getAiUsageSummary, parseAiUsageDays, type AiUsageDays, type AiUsageSummary } from "@/lib/ia/cost";
import type { ApiErrorResponse } from "@/types/joke";

/**
 * GET /api/admin/ai-usage
 *
 * Gasto, saldo, reserva, costo por función y disponibilidad de la IA (ficha 11
 * de notion-frontend.md). Solo administradores. Un dato que no se puede leer va
 * como `null`: nunca se reemplaza por un 0 que parezca saldo disponible.
 */

const PRIVATE = { "cache-control": "private, no-store" };

function error(status: number, code: string, message: string) {
  const body: ApiErrorResponse = { error: { code, message } };
  return NextResponse.json(body, { status, headers: PRIVATE });
}

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch (failure) {
    if (failure instanceof UnauthorizedError) {
      return error(401, "UNAUTHORIZED", "Inicia sesión de nuevo para ver el consumo de IA.");
    }
    if (failure instanceof ForbiddenError) {
      return error(403, "FORBIDDEN", "Tu cuenta no puede ver el consumo de IA.");
    }
    console.error("[api/admin/ai-usage] no se pudo comprobar el rol", failure);
    return error(503, "SERVICE_UNAVAILABLE", "No se pudo leer el consumo de IA. Intenta de nuevo en unos minutos.");
  }

  let days: AiUsageDays;
  try {
    days = parseAiUsageDays(new URL(request.url).searchParams);
  } catch {
    return error(400, "INVALID_RANGE", "Selecciona un período de 7, 30 o 90 días. No repitas el parámetro days.");
  }

  try {
    const body: { data: AiUsageSummary; meta: Record<string, never> } = { data: await getAiUsageSummary(days), meta: {} };
    return NextResponse.json(body, { headers: PRIVATE });
  } catch (failure) {
    // El detalle se queda en los logs de Vercel; el cliente recibe un mensaje que puede mostrar.
    console.error("[api/admin/ai-usage] no se pudo leer el consumo", failure);
    return error(503, "SERVICE_UNAVAILABLE", "No se pudo leer el consumo de IA. Intenta de nuevo en unos minutos.");
  }
}
