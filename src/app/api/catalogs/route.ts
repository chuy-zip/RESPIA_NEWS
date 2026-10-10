import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/dal";
import { getCatalog } from "@/lib/services/catalogs";
import type { ApiErrorResponse } from "@/types/joke";
import type { CatalogResponse } from "@/types/news";

/**
 * GET /api/catalogs
 *
 * Regiones, temas, estados y tipos de contenido admitidos. Lo usan el portal,
 * el perfil y la navegación por temas (ficha 1 de notion-frontend.md).
 *
 * Requiere sesión: el catálogo no es secreto, pero la base solo deja leer a
 * cuentas con sesión (RF-02), así que sin sesión no se consulta.
 */

const PRIVATE = { "cache-control": "private, no-store" };

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    const body: ApiErrorResponse = {
      error: {
        code: "UNAUTHORIZED",
        message: "Inicia sesión para usar esta función.",
      },
    };

    return NextResponse.json(body, { status: 401, headers: PRIVATE });
  }

  try {
    const body: CatalogResponse = { data: await getCatalog(), meta: {} };

    return NextResponse.json(body, { headers: PRIVATE });
  } catch (error) {
    // El detalle se queda en los logs de Vercel; el cliente recibe un mensaje que puede mostrar.
    console.error("[api/catalogs] no se pudo leer el catálogo", error);

    const body: ApiErrorResponse = {
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "El catálogo no está disponible. Intenta de nuevo en unos minutos.",
      },
    };

    return NextResponse.json(body, { status: 503, headers: PRIVATE });
  }
}
