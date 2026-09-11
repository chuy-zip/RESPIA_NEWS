import { NextResponse } from "next/server";

import { HttpError } from "@/lib/http/fetchJson";
import { getRandomJoke, JOKES_PROVIDER_NAME } from "@/lib/services/jokes";
import type { ApiErrorResponse, JokeResponse } from "@/types/joke";

/**
 * GET /api/joke
 *
 * Frontera HTTP del backend. Su única responsabilidad es traducir entre el
 * mundo HTTP (status, JSON) y el servicio: no contiene lógica de negocio ni
 * conoce al proveedor externo.
 */

// Cada visita debe traer un chiste distinto, así que no se prerenderiza.
export const dynamic = "force-dynamic";

/** Un fallo del proveedor no es culpa del cliente: se responde 502 o 504. */
function statusForError(error: HttpError): number {
  switch (error.code) {
    case "TIMEOUT":
      return 504;
    case "UPSTREAM_ERROR":
    case "INVALID_RESPONSE":
    case "NETWORK":
      return 502;
  }
}

export async function GET() {
  const startedAt = Date.now();

  try {
    const joke = await getRandomJoke();

    const body: JokeResponse = {
      data: joke,
      meta: {
        source: JOKES_PROVIDER_NAME,
        fetchedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
      },
    };

    return NextResponse.json(body, {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    const isKnown = error instanceof HttpError;

    // El detalle técnico se queda en los logs de Vercel; el cliente recibe un
    // mensaje que puede mostrar tal cual.
    console.error("[api/joke] falló la petición al proveedor", error);

    const body: ApiErrorResponse = {
      error: {
        code: isKnown ? error.code : "UNKNOWN",
        message: isKnown
          ? error.message
          : "Ocurrió un error inesperado al pedir el chiste.",
      },
    };

    return NextResponse.json(body, {
      status: isKnown ? statusForError(error) : 500,
      headers: { "cache-control": "no-store" },
    });
  }
}
