import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/dal";
import { HttpError } from "@/lib/http/fetchJson";
import { getRandomJoke, JOKES_PROVIDER_NAME } from "@/lib/services/jokes";
import type { ApiErrorResponse, JokeResponse } from "@/types/joke";

/**
 * GET /api/joke
 *
 * Frontera HTTP del backend. Traduce entre el mundo HTTP (status, JSON) y el
 * servicio: no contiene lógica de negocio ni conoce al proveedor externo.
 *
 * **Requiere sesión.** El bloqueo se decide aquí, en el servidor: sin sesión no
 * se llama siquiera al proveedor y se responde 401. No es un ocultamiento en la
 * interfaz — quien haga `curl` a esta ruta sin cookies recibe 401, no el
 * chiste. Cuando esto sea el servicio de noticias, el mismo patrón protegerá el
 * cuerpo de los artículos.
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

  const user = await getCurrentUser();

  if (!user) {
    const body: ApiErrorResponse = {
      error: {
        code: "UNAUTHORIZED",
        message: "Inicia sesión para usar esta función.",
      },
    };

    return NextResponse.json(body, {
      status: 401,
      headers: { "cache-control": "private, no-store" },
    });
  }

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

    // `private` además de `no-store`: la respuesta depende de quién la pidió,
    // así que ninguna caché intermedia debe guardarla y servírsela a otro.
    return NextResponse.json(body, {
      headers: { "cache-control": "private, no-store" },
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
