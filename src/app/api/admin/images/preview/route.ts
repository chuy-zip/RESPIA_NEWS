import { NextResponse } from "next/server";

import { ForbiddenError, requireAdmin, UnauthorizedError } from "@/lib/auth/dal";
import { ImageValidationError, searchStockImages, validatePreviewInput } from "@/lib/services/images";
import type { ApiErrorResponse } from "@/types/joke";
import type { ImagePreviewResponse } from "@/types/news";

/**
 * POST /api/admin/images/preview
 *
 * Busca imágenes de Pixabay para una noticia sin foto (RF-17, D-23, D-33). El
 * administrador elige una y la envía al publicar como `image.pixabayId`.
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
      return error(401, "UNAUTHORIZED", "Inicia sesión de nuevo para buscar imágenes.");
    }
    if (failure instanceof ForbiddenError) {
      return error(403, "FORBIDDEN", "Tu cuenta no puede buscar imágenes.");
    }
    console.error("[api/admin/images/preview] no se pudo comprobar el rol", failure);
    return error(503, "SERVICE_UNAVAILABLE", "No se pudo buscar imágenes. Intenta de nuevo en unos minutos.");
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return error(400, "INVALID_BODY", "El cuerpo de la petición no es JSON válido.");
  }

  try {
    const body: ImagePreviewResponse = { data: await searchStockImages(validatePreviewInput(raw)), meta: {} };
    return NextResponse.json(body, { headers: PRIVATE });
  } catch (failure) {
    if (failure instanceof ImageValidationError) {
      return error(422, "VALIDATION_ERROR", failure.message, failure.fields);
    }
    // El detalle se queda en los logs de Vercel; el cliente recibe un mensaje que puede mostrar.
    console.error("[api/admin/images/preview] no se pudo consultar Pixabay", failure);
    return error(503, "SERVICE_UNAVAILABLE", "No se pudo buscar imágenes. Intenta de nuevo en unos minutos.");
  }
}
