import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/dal";
import { getProfile, ProfileValidationError, updateProfile, validateProfileInput } from "@/lib/services/profile";
import type { ApiErrorResponse } from "@/types/joke";
import type { ProfileResponse } from "@/types/profile";

/**
 * /api/profile
 *
 * GET devuelve la región y los temas del lector. PATCH los cambia (fichas 2 y
 * 3 de notion-frontend.md, más los temas de D-32). Cada cuenta solo ve y
 * cambia su propio perfil: la identidad sale de la sesión, nunca del cuerpo.
 */

const PRIVATE = { "cache-control": "private, no-store" };

function error(status: number, code: string, message: string, fields?: Record<string, string>) {
  const body: ApiErrorResponse = { error: fields ? { code, message, fields } : { code, message } };
  return NextResponse.json(body, { status, headers: PRIVATE });
}

const unavailable = () =>
  error(503, "SERVICE_UNAVAILABLE", "El perfil no está disponible. Intenta de nuevo en unos minutos.");

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return error(401, "UNAUTHORIZED", "Inicia sesión para ver tu perfil.");
  }

  try {
    const body: ProfileResponse = { data: await getProfile(user.id), meta: {} };
    return NextResponse.json(body, { headers: PRIVATE });
  } catch (failure) {
    console.error("[api/profile] no se pudo leer el perfil", failure);
    return unavailable();
  }
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return error(401, "UNAUTHORIZED", "Inicia sesión para cambiar tu perfil.");
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return error(400, "INVALID_BODY", "El cuerpo de la petición no es JSON válido.");
  }

  try {
    const body: ProfileResponse = { data: await updateProfile(user.id, validateProfileInput(raw)), meta: {} };
    return NextResponse.json(body, { headers: PRIVATE });
  } catch (failure) {
    if (failure instanceof ProfileValidationError) {
      return error(422, "VALIDATION_ERROR", failure.message, failure.fields);
    }
    // El detalle se queda en los logs de Vercel; el cliente recibe un mensaje que puede mostrar.
    console.error("[api/profile] no se pudo guardar el perfil", failure);
    return unavailable();
  }
}
