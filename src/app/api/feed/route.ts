import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/dal";
import { FeedQueryError, getFeed, parseFeedQuery } from "@/lib/services/feed";
import type { FeedResponse } from "@/types/feed";
import type { ApiErrorResponse } from "@/types/joke";

/**
 * GET /api/feed
 *
 * Feed personalizado del lector (ficha 4 de notion-frontend.md): noticias
 * ordenadas, prominencia, motivo y bloque de noticias importantes. La región sale
 * del perfil guardado, nunca de la URL ni del GPS (RF-04).
 */

const PRIVATE = { "cache-control": "private, no-store" };

function error(status: number, code: string, message: string) {
  const body: ApiErrorResponse = { error: { code, message } };
  return NextResponse.json(body, { status, headers: PRIVATE });
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return error(401, "UNAUTHORIZED", "Inicia sesión para ver tu edición.");
  }

  try {
    const body: FeedResponse = await getFeed(user.id, parseFeedQuery(new URL(request.url).searchParams));
    return NextResponse.json(body, { headers: PRIVATE });
  } catch (failure) {
    if (failure instanceof FeedQueryError) {
      return error(400, failure.code, failure.message);
    }
    // El detalle se queda en los logs de Vercel; el cliente recibe un mensaje que puede mostrar.
    console.error("[api/feed] no se pudo armar el feed", failure);
    return error(503, "SERVICE_UNAVAILABLE", "Tu edición no está disponible. Intenta de nuevo en unos minutos.");
  }
}
