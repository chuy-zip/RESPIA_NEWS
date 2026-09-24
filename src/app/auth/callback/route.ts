import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * GET /auth/callback
 *
 * Último salto del login: Google devuelve al usuario a Supabase, y Supabase lo
 * manda aquí con un `code` de un solo uso. Aquí se canjea por una sesión, que
 * queda guardada en cookies httpOnly.
 *
 * Termine bien o mal, siempre se vuelve a la portada. Si algo falla, el motivo
 * viaja en `?auth_error=` para que la pantalla lo muestre en vez de dejar al
 * usuario en una página en blanco preguntándose qué pasó.
 */

/**
 * Detrás del proxy de Vercel, `origin` puede ser el host interno en vez del
 * dominio público. `x-forwarded-host` trae el real.
 */
function resolveBaseUrl(request: Request, origin: string): string {
  if (process.env.NODE_ENV === "development") {
    return origin;
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  return forwardedHost ? `https://${forwardedHost}` : origin;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const baseUrl = resolveBaseUrl(request, origin);

  const failure = (reason: string) =>
    NextResponse.redirect(`${baseUrl}/?auth_error=${encodeURIComponent(reason)}`);

  // Google avisa aquí si el usuario canceló o si rechazó los permisos.
  const providerError =
    searchParams.get("error_description") ?? searchParams.get("error");
  if (providerError) {
    return failure(providerError);
  }

  const code = searchParams.get("code");
  if (!code) {
    return failure("El proveedor no devolvió el código de autenticación.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] falló el canje del código", error);
    return failure(error.message);
  }

  return NextResponse.redirect(`${baseUrl}/`);
}
