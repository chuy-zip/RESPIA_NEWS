import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/dal";
import { AiLimitError } from "@/lib/ia/cost";
import { answerQuestion, ChatValidationError, validateChatRequest } from "@/lib/services/chat";
import type { ChatResponse } from "@/types/chat";
import type { ApiErrorResponse } from "@/types/joke";

/**
 * POST /api/chat
 *
 * Responde preguntas sobre las noticias publicadas (ficha 7 de
 * notion-frontend.md). La conversación no se guarda: llega en cada petición
 * (RF-07). Con el tope de gasto de IA alcanzado, responde 429 (D-34).
 */

const PRIVATE = { "cache-control": "private, no-store" };

function error(status: number, code: string, message: string, fields?: Record<string, string>) {
  const body: ApiErrorResponse = { error: fields ? { code, message, fields } : { code, message } };
  return NextResponse.json(body, { status, headers: PRIVATE });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return error(401, "UNAUTHORIZED", "Inicia sesión para usar el chat.");
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return error(400, "INVALID_BODY", "El cuerpo de la petición no es JSON válido.");
  }

  try {
    const body: ChatResponse = { data: await answerQuestion(user.id, validateChatRequest(raw)), meta: {} };
    return NextResponse.json(body, { headers: PRIVATE });
  } catch (failure) {
    if (failure instanceof ChatValidationError) {
      return error(422, "VALIDATION_ERROR", failure.message, failure.fields);
    }
    if (failure instanceof AiLimitError) {
      return error(429, "AI_LIMIT_REACHED", "El chat llegó a su límite de uso. Intenta de nuevo más tarde.");
    }
    // El detalle se queda en los logs de Vercel; el cliente recibe un mensaje que puede mostrar.
    console.error("[api/chat] no se pudo preparar la respuesta", failure);
    return error(503, "SERVICE_UNAVAILABLE", "El chat no está disponible. Intenta de nuevo en unos minutos.");
  }
}
