import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresca la sesión en cada petición.
 *
 * El access token de Supabase dura alrededor de una hora. Sin esta función, el
 * usuario quedaría deslogueado al expirar aunque siguiera usando la app. Aquí se
 * renueva y se reescriben las cookies.
 *
 * **Esto NO es la capa de autorización.** A propósito no redirige ni bloquea
 * nada: cada Route Handler y cada Server Component que toque datos protegidos
 * debe verificar la sesión por su cuenta. Si el bloqueo viviera solo aquí,
 * bastaría con que una ruta se escapara del matcher para dejar los datos al
 * aire.
 *
 * En concreto, `/api/joke` debe responder **401**, no un redirect a una página
 * de login: es una API, y quien la llama espera un código de estado.
 */

const hasEnvVars =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Sin variables de entorno la app sigue sirviendo las páginas públicas en
  // lugar de reventar con un error críptico.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // Igual que en el cliente de servidor: un cliente nuevo por petición, nunca
  // uno global, por la concurrencia de Fluid compute.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // No meter código entre createServerClient y getClaims(). Un descuido aquí
  // provoca que los usuarios se deslogueen de forma aleatoria, y es un error
  // dificilísimo de diagnosticar después.
  await supabase.auth.getClaims();

  // Hay que devolver EXACTAMENTE este objeto. Si se construyera otra respuesta,
  // habría que copiarle las cookies; si no, el navegador y el servidor quedan
  // desincronizados y la sesión se corta antes de tiempo.
  return supabaseResponse;
}
