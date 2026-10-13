import { NextResponse } from "next/server";

import { ForbiddenError, requireAdmin, UnauthorizedError } from "@/lib/auth/dal";
import { ArticleValidationError, importArticles } from "@/lib/services/articles";
import type { ApiErrorResponse } from "@/types/joke";
import type { ArticleImportResponse } from "@/types/news";

/**
 * POST /api/admin/articles/import
 *
 * Publica varias noticias de un archivo JSON (RF-15). Solo para
 * administradores. Responde 200 aunque alguna noticia falle: `results` dice
 * cuál se publicó y cuál no.
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
      return error(401, "UNAUTHORIZED", "Inicia sesión de nuevo para importar noticias.");
    }
    if (failure instanceof ForbiddenError) {
      return error(403, "FORBIDDEN", "Tu cuenta no puede publicar noticias.");
    }
    console.error("[api/admin/articles/import] no se pudo comprobar el rol", failure);
    return error(503, "SERVICE_UNAVAILABLE", "No se pudo importar. Intenta de nuevo en unos minutos.");
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return error(400, "INVALID_BODY", "El cuerpo de la petición no es JSON válido.");
  }

  try {
    const results = await importArticles(raw);
    const published = results.filter((result) => "id" in result).length;
    const body: ArticleImportResponse = {
      data: { published, failed: results.length - published, results },
      meta: {},
    };

    return NextResponse.json(body, { headers: PRIVATE });
  } catch (failure) {
    if (failure instanceof ArticleValidationError) {
      return error(422, "VALIDATION_ERROR", failure.message, failure.fields);
    }
    console.error("[api/admin/articles/import] no se pudo importar", failure);
    return error(503, "SERVICE_UNAVAILABLE", "No se pudo importar. Intenta de nuevo en unos minutos.");
  }
}
