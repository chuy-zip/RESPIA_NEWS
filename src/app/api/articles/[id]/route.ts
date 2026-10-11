import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/dal";
import { getArticle } from "@/lib/services/articles";
import type { ApiErrorResponse } from "@/types/joke";
import type { ArticleDetailResponse } from "@/types/news";

/**
 * GET /api/articles/[id]
 *
 * Una noticia publicada con su contenido, fuentes, estado e imagen (ficha 5 de
 * notion-frontend.md). Lo usan el lector y los enlaces de las citas del chat.
 * Requiere sesión: el contenido completo no se entrega sin ella (RF-02).
 */

const PRIVATE = { "cache-control": "private, no-store" };

function error(status: number, code: string, message: string) {
  const body: ApiErrorResponse = { error: { code, message } };
  return NextResponse.json(body, { status, headers: PRIVATE });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();

  if (!user) {
    return error(401, "UNAUTHORIZED", "Inicia sesión para leer la noticia.");
  }

  const { id } = await params;

  try {
    const article = await getArticle(id);

    if (!article) {
      return error(404, "ARTICLE_NOT_FOUND", "La noticia no existe o ya no está disponible.");
    }

    const body: ArticleDetailResponse = { data: article, meta: {} };
    return NextResponse.json(body, { headers: PRIVATE });
  } catch (failure) {
    // El detalle se queda en los logs de Vercel; el cliente recibe un mensaje que puede mostrar.
    console.error("[api/articles/[id]] no se pudo leer la noticia", failure);
    return error(503, "SERVICE_UNAVAILABLE", "No se pudo cargar la noticia. Intenta de nuevo en unos minutos.");
  }
}
