import { NextResponse } from "next/server";

import { ForbiddenError, requireAdmin, UnauthorizedError } from "@/lib/auth/dal";
import { ArticleValidationError, publishArticle, validatePublishInput } from "@/lib/services/articles";
import type { ApiErrorResponse } from "@/types/joke";
import type { PublicationResponse } from "@/types/news";

/**
 * POST /api/admin/articles
 *
 * Publica una noticia revisada por una persona (ficha 9 de notion-frontend.md).
 * Solo para administradores: 401 sin sesión y 403 con una cuenta común. La
 * página /admin responde 404 a esa cuenta, pero una API devuelve su código real.
 */

const PRIVATE = { "cache-control": "private, no-store" };

function error(status: number, code: string, message: string, fields?: Record<string, string>) {
  const body: ApiErrorResponse = { error: fields ? { code, message, fields } : { code, message } };
  return NextResponse.json(body, { status, headers: PRIVATE });
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch (failure) {
    if (failure instanceof UnauthorizedError) {
      return error(401, "UNAUTHORIZED", "Inicia sesión de nuevo para publicar.");
    }
    if (failure instanceof ForbiddenError) {
      return error(403, "FORBIDDEN", "Tu cuenta no puede publicar noticias.");
    }
    console.error("[api/admin/articles] no se pudo comprobar el rol", failure);
    return error(503, "SERVICE_UNAVAILABLE", "No se pudo publicar. Intenta de nuevo en unos minutos.");
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return error(400, "INVALID_BODY", "El cuerpo de la petición no es JSON válido.");
  }

  try {
    const result = await publishArticle(validatePublishInput(raw));
    const body: PublicationResponse = { data: result, meta: {} };

    return NextResponse.json(body, { status: 201, headers: PRIVATE });
  } catch (failure) {
    if (failure instanceof ArticleValidationError) {
      return error(422, "VALIDATION_ERROR", failure.message, failure.fields);
    }
    // El detalle se queda en los logs de Vercel; el cliente recibe un mensaje que puede mostrar.
    console.error("[api/admin/articles] no se pudo guardar la noticia", failure);
    return error(503, "SERVICE_UNAVAILABLE", "No se pudo publicar. Intenta de nuevo en unos minutos.");
  }
}
