import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

/**
 * Data Access Layer de autenticación.
 *
 * Es el **único** lugar del que el resto del servidor debe obtener la identidad
 * del usuario. Centralizarlo evita que cada ruta improvise su propia
 * verificación, que es como se cuelan los agujeros.
 *
 * Dos reglas que no hay que romper:
 *
 * 1. **Nunca usar `getSession()` en el servidor.** Lee la cookie sin validar la
 *    firma, así que un atacante podría fabricarla. `getClaims()` sí verifica el
 *    JWT, y con llaves asimétricas lo hace localmente, sin llamar a Supabase.
 * 2. **Nunca autorizar con `user_metadata`.** El propio usuario puede editarlo.
 *    Sirve para mostrar el nombre en pantalla, nada más.
 */

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  /** Solo para mostrar. No usar para decidir permisos. */
  displayName: string | null;
  avatarUrl: string | null;
}

/**
 * Devuelve el usuario de la petición actual, o null si no hay sesión válida.
 *
 * Va envuelto en `cache` de React para que, aunque varios componentes de la
 * misma página lo pidan, la verificación ocurra una sola vez por petición.
 */
export const getCurrentUser = cache(
  async (): Promise<AuthenticatedUser | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();

    if (error || !data?.claims) {
      return null;
    }

    const claims = data.claims;
    const metadata = (claims.user_metadata ?? {}) as Record<string, unknown>;

    const pick = (key: string): string | null => {
      const value = metadata[key];
      return typeof value === "string" ? value : null;
    };

    return {
      id: claims.sub,
      email: typeof claims.email === "string" ? claims.email : null,
      displayName: pick("full_name") ?? pick("name"),
      avatarUrl: pick("avatar_url") ?? pick("picture"),
    };
  },
);

/** Error que lanza `requireUser` cuando no hay sesión. */
export class UnauthorizedError extends Error {
  constructor() {
    super("Necesitas iniciar sesión para usar esta función.");
    this.name = "UnauthorizedError";
  }
}

/**
 * Igual que `getCurrentUser`, pero falla en vez de devolver null.
 *
 * Para rutas donde no tener sesión es un error, no un caso alternativo: el
 * llamador atrapa `UnauthorizedError` y responde 401.
 */
export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  return user;
}
