import { NextResponse } from "next/server";

import { ForbiddenError, requireAdmin, UnauthorizedError } from "@/lib/auth/dal";
import { ImageValidationError, uploadImage } from "@/lib/services/images";
import type { ApiErrorResponse } from "@/types/joke";
import type { ImageUploadResponse } from "@/types/news";

/**
 * POST /api/admin/images
 *
 * Sube una foto del administrador al bucket (RF-17). El cuerpo es
 * multipart/form-data con el campo `file`. La foto queda guardada pero sin
 * noticia: se asocia al publicar con su `uploadId`.
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
      return error(401, "UNAUTHORIZED", "Inicia sesión de nuevo para subir imágenes.");
    }
    if (failure instanceof ForbiddenError) {
      return error(403, "FORBIDDEN", "Tu cuenta no puede subir imágenes.");
    }
    console.error("[api/admin/images] no se pudo comprobar el rol", failure);
    return error(503, "SERVICE_UNAVAILABLE", "No se pudo subir la imagen. Intenta de nuevo en unos minutos.");
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return error(400, "INVALID_BODY", "Envía la imagen como multipart/form-data en el campo «file».");
  }

  try {
    const body: ImageUploadResponse = { data: await uploadImage(form.get("file")), meta: {} };
    return NextResponse.json(body, { status: 201, headers: PRIVATE });
  } catch (failure) {
    if (failure instanceof ImageValidationError) {
      return error(422, "VALIDATION_ERROR", failure.message, failure.fields);
    }
    // El detalle se queda en los logs de Vercel; el cliente recibe un mensaje que puede mostrar.
    console.error("[api/admin/images] no se pudo guardar la imagen", failure);
    return error(503, "SERVICE_UNAVAILABLE", "No se pudo subir la imagen. Intenta de nuevo en unos minutos.");
  }
}
