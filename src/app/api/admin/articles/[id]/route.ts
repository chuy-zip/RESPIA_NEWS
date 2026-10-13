import { NextResponse } from "next/server";

import { ForbiddenError, requireAdmin, UnauthorizedError } from "@/lib/auth/dal";
import { ArticleValidationError, updateArticleStatus, validateStatusUpdate } from "@/lib/services/articles";
import type { ApiErrorResponse } from "@/types/joke";
import type { StatusUpdateResponse } from "@/types/news";

/**
 * PATCH /api/admin/articles/[id]
 *
 * Cambia el estado editorial de una noticia publicada y su razón (RT-03,
 * RT-04). Solo para administradores. No edita el contenido ni la despublica.
 */

const PRIVATE = { "cache-control": "private, no-store" };

function error(status: number, code: string, message: string, fields?: Record<string, string>) {
  const body: ApiErrorResponse = { error: fields ? { code, message, fields } : { code, message } };
  return NextResponse.json(body, { status, headers: PRIVATE });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch (failure) {
    if (failure instanceof UnauthorizedError) {
      return error(401, "UNAUTHORIZED", "Inicia sesión de nuevo para cambiar el estado.");
    }
    if (failure instanceof ForbiddenError) {
      return error(403, "FORBIDDEN", "Tu cuenta no puede cambiar el estado de las noticias.");
    }
    console.error("[api/admin/articles/[id]] no se pudo comprobar el rol", failure);
    return error(503, "SERVICE_UNAVAILABLE", "No se pudo cambiar el estado. Intenta de nuevo en unos minutos.");
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return error(400, "INVALID_BODY", "El cuerpo de la petición no es JSON válido.");
  }

  const { id } = await params;

  try {
    const updated = await updateArticleStatus(id, validateStatusUpdate(raw));
    if (!updated) {
      return error(404, "ARTICLE_NOT_FOUND", "La noticia no existe o ya no está disponible.");
    }

    const body: StatusUpdateResponse = { data: updated, meta: {} };
    return NextResponse.json(body, { headers: PRIVATE });
  } catch (failure) {
    if (failure instanceof ArticleValidationError) {
      return error(422, "VALIDATION_ERROR", failure.message, failure.fields);
    }
    // El detalle se queda en los logs de Vercel; el cliente recibe un mensaje que puede mostrar.
    console.error("[api/admin/articles/[id]] no se pudo cambiar el estado", failure);
    return error(503, "SERVICE_UNAVAILABLE", "No se pudo cambiar el estado. Intenta de nuevo en unos minutos.");
  }
}
