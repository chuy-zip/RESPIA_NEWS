import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/dal";
import {
  InteractionArticleNotFoundError,
  ProfileValidationError,
  recordInteraction,
  validateInteractionInput,
} from "@/lib/services/profile";
import type { ApiErrorResponse } from "@/types/joke";
import type { InteractionResponse } from "@/types/profile";

/**
 * POST /api/interactions
 *
 * Registra que el lector abrió una noticia (ficha 6 de notion-frontend.md). El
 * recomendador usa esta señal para inferir sus intereses (RF-10, D-31). La
 * identidad sale de la sesión, nunca del cuerpo.
 */

const PRIVATE = { "cache-control": "private, no-store" };

function error(status: number, code: string, message: string, fields?: Record<string, string>) {
  const body: ApiErrorResponse = { error: fields ? { code, message, fields } : { code, message } };
  return NextResponse.json(body, { status, headers: PRIVATE });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return error(401, "UNAUTHORIZED", "Inicia sesión para registrar la lectura.");
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return error(400, "INVALID_BODY", "El cuerpo de la petición no es JSON válido.");
  }

  try {
    const body: InteractionResponse = {
      data: await recordInteraction(user.id, validateInteractionInput(raw)),
      meta: {},
    };
    return NextResponse.json(body, { headers: PRIVATE });
  } catch (failure) {
    if (failure instanceof ProfileValidationError) {
      return error(422, "VALIDATION_ERROR", failure.message, failure.fields);
    }
    if (failure instanceof InteractionArticleNotFoundError) {
      return error(404, "ARTICLE_NOT_FOUND", failure.message);
    }
    // El detalle se queda en los logs de Vercel; el cliente recibe un mensaje que puede mostrar.
    console.error("[api/interactions] no se pudo registrar la señal", failure);
    return error(503, "SERVICE_UNAVAILABLE", "No se pudo registrar la lectura. Intenta de nuevo en unos minutos.");
  }
}
