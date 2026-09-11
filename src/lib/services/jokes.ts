import "server-only";

import { fetchJson, HttpError } from "@/lib/http/fetchJson";
import type { Joke } from "@/types/joke";

/**
 * Servicio de chistes.
 *
 * Es un backend de mentira: sustituye al futuro servicio de noticias para
 * comprobar que la cadena navegador -> Route Handler -> proveedor externo
 * funciona en Vercel. Cuando exista el servicio real, este archivo se cambia
 * por src/lib/services/news.ts sin tocar la UI.
 *
 * "server-only" hace fallar el build si alguien lo importa desde un componente
 * de cliente, que es justo la separación que queremos mantener.
 */

const PROVIDER_ENDPOINT = "https://v2.jokeapi.dev/joke/Any";

export const JOKES_PROVIDER_NAME = "JokeAPI v2";

/** Forma cruda del proveedor. Solo se usa dentro de este archivo. */
interface JokeApiPayload {
  error: boolean;
  message?: string;
  id?: number;
  joke?: string;
  category?: string;
  lang?: string;
  safe?: boolean;
  flags?: {
    nsfw: boolean;
    religious: boolean;
    political: boolean;
    racist: boolean;
    sexist: boolean;
    explicit: boolean;
  };
}

function buildProviderUrl(): string {
  const language = process.env.JOKES_LANG ?? "es";

  const params = new URLSearchParams({
    type: "single",
    lang: language,
  });

  // safe-mode es un parámetro sin valor: filtra contenido sensible en origen.
  return `${PROVIDER_ENDPOINT}?safe-mode&${params.toString()}`;
}

/** Pide un chiste al proveedor y lo traduce al tipo del dominio. */
export async function getRandomJoke(): Promise<Joke> {
  const payload = await fetchJson<JokeApiPayload>(buildProviderUrl());

  if (payload.error) {
    throw new HttpError(
      "UPSTREAM_ERROR",
      payload.message ?? "El proveedor rechazó la petición.",
    );
  }

  if (typeof payload.joke !== "string" || payload.joke.length === 0) {
    throw new HttpError(
      "INVALID_RESPONSE",
      "El proveedor no devolvió el texto del chiste.",
    );
  }

  return {
    id: payload.id ?? 0,
    text: payload.joke,
    category: payload.category ?? "Sin categoría",
    language: payload.lang ?? "es",
    safe: payload.safe ?? false,
    flags: {
      nsfw: payload.flags?.nsfw ?? false,
      religious: payload.flags?.religious ?? false,
      political: payload.flags?.political ?? false,
      racist: payload.flags?.racist ?? false,
      sexist: payload.flags?.sexist ?? false,
      explicit: payload.flags?.explicit ?? false,
    },
  };
}
