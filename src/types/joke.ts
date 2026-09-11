/**
 * Tipos del dominio.
 *
 * Son los tipos que viajan entre el backend y la UI. A propósito NO son la
 * forma cruda que devuelve la API externa: esa se traduce a esta forma en
 * src/lib/services/jokes.ts, para que cambiar de proveedor no obligue a tocar
 * los componentes.
 */

/** Marcadores de contenido sensible que reporta el proveedor. */
export interface ContentFlags {
  nsfw: boolean;
  religious: boolean;
  political: boolean;
  racist: boolean;
  sexist: boolean;
  explicit: boolean;
}

export interface Joke {
  id: number;
  text: string;
  category: string;
  language: string;
  /** El proveedor marcó el contenido como apto para todo público. */
  safe: boolean;
  flags: ContentFlags;
}

/** Respuesta de /api/joke cuando la petición funciona. */
export interface JokeResponse {
  data: Joke;
  meta: {
    source: string;
    fetchedAt: string;
    durationMs: number;
  };
}

/** Respuesta de cualquier ruta de la API cuando algo falla. */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
