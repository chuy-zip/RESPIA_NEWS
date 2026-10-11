export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number = 0,
    readonly code: string = "NETWORK_ERROR",
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

export function asApiError(error: unknown): ApiError {
  return error instanceof ApiError
    ? error
    : new ApiError("No se pudo completar la petición. Comprueba tu conexión e inténtalo de nuevo.");
}

/** Conserva los errores por campo del contrato. Nunca repite una petición que escribe. */
export async function apiRequest<T>(path: string, init: RequestInit = {}, expectedStatus?: number): Promise<T> {
  let response: Response;
  try {
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    response = await fetch(path, { ...init, headers, credentials: "same-origin", cache: "no-store" });
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw asApiError(error);
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = body && typeof body === "object" && "error" in body ? body.error : null;
    if (detail && typeof detail === "object" && "message" in detail && typeof detail.message === "string") {
      const fields = "fields" in detail && detail.fields && typeof detail.fields === "object"
        ? Object.fromEntries(Object.entries(detail.fields).filter((entry): entry is [string, string] => typeof entry[1] === "string"))
        : undefined;
      throw new ApiError(detail.message, response.status, "code" in detail && typeof detail.code === "string" ? detail.code : "API_ERROR", fields);
    }
    throw new ApiError(response.status === 401 ? "Tu sesión venció. Inicia sesión para continuar." : "El servicio no pudo completar la petición.", response.status, "API_ERROR");
  }
  if ((expectedStatus !== undefined && response.status !== expectedStatus) || !body || typeof body !== "object" || !("data" in body)) {
    throw new ApiError("El servidor devolvió una respuesta inesperada. No se pudo confirmar la operación.", 502, "INVALID_RESPONSE");
  }
  return body as T;
}
