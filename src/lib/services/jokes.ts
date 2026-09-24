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

const PROVIDER_BASE = "https://v2.jokeapi.dev/joke";

export const JOKES_PROVIDER_NAME = "JokeAPI v2";

/**
 * Categorías que de verdad tienen chistes de tipo simple y contenido apto.
 *
 * El catálogo completo del proveedor incluye Dark, Spooky y Christmas, pero
 * ninguna de las tres tiene un solo chiste que cumpla `type=single` +
 * `safe-mode` a la vez (verificado contra la API: las tres devuelven "No
 * matching joke found" de forma consistente). Pedirlas sería un 502
 * garantizado, así que ni se listan.
 *
 * Tampoco se usa /joke/Any: ese endpoint devuelve las categorías ponderadas
 * por cuántos chistes tiene cada una, y Programming por sí sola es la mitad
 * del catálogo seguro — de ahí que casi siempre saliera "Programming". Elegir
 * la categoría nosotros mismos, al azar y con el mismo peso para cada una,
 * reparte la variedad de verdad.
 */
const CATEGORIES = ["Programming", "Misc", "Pun"] as const;

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
  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  const params = new URLSearchParams({ type: "single" });

  // El pool en español es minúsculo: JokeAPI solo tiene 6 chistes en "es" que
  // pasan el filtro seguro (contra 183 en inglés, su idioma por defecto). Con
  // un fondo de 6, la repetición es casi inmediata. Por eso no se fija "es" a
  // menos que alguien lo pida explícitamente con JOKES_LANG — sin ese
  // parámetro, el proveedor devuelve inglés, que sí tiene variedad real.
  if (process.env.JOKES_LANG) {
    params.set("lang", process.env.JOKES_LANG);
  }

  // safe-mode es un parámetro sin valor: filtra contenido sensible en origen,
  // en cualquier idioma y categoría que se pida.
  return `${PROVIDER_BASE}/${category}?safe-mode&${params.toString()}`;
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
