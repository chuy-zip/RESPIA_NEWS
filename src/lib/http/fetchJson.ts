/**
 * Cliente HTTP mínimo para consumir servicios externos desde el servidor.
 *
 * Existe para que los servicios (src/lib/services) no repitan el manejo de
 * timeouts, códigos de estado y parseo de JSON en cada llamada.
 */

/** Error con causa identificable, para que la ruta HTTP decida qué responder. */
export class HttpError extends Error {
  readonly code: "TIMEOUT" | "UPSTREAM_ERROR" | "INVALID_RESPONSE" | "NETWORK";
  readonly status?: number;

  constructor(
    code: HttpError["code"],
    message: string,
    options?: { status?: number; cause?: unknown },
  ) {
    super(message, { cause: options?.cause });
    this.name = "HttpError";
    this.code = code;
    this.status = options?.status;
  }
}

interface FetchJsonOptions {
  /** Corta la petición si el proveedor no responde a tiempo. */
  timeoutMs?: number;
  headers?: Record<string, string>;
}

export async function fetchJson<T>(
  url: string,
  { timeoutMs = 6000, headers = {} }: FetchJsonOptions = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      headers: { accept: "application/json", ...headers },
      signal: AbortSignal.timeout(timeoutMs),
      // Cada llamada trae contenido nuevo: no queremos la caché de Next.
      cache: "no-store",
    });
  } catch (cause) {
    if (cause instanceof Error && cause.name === "TimeoutError") {
      throw new HttpError(
        "TIMEOUT",
        `El proveedor no respondió en ${timeoutMs} ms.`,
        { cause },
      );
    }
    throw new HttpError("NETWORK", "No se pudo contactar al proveedor.", {
      cause,
    });
  }

  if (!response.ok) {
    throw new HttpError(
      "UPSTREAM_ERROR",
      `El proveedor respondió ${response.status}.`,
      { status: response.status },
    );
  }

  try {
    return (await response.json()) as T;
  } catch (cause) {
    throw new HttpError(
      "INVALID_RESPONSE",
      "El proveedor devolvió una respuesta que no es JSON válido.",
      { cause },
    );
  }
}
