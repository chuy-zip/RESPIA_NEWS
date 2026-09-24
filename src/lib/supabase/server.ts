import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente de Supabase para el servidor: Server Components, Route Handlers y
 * Server Actions.
 *
 * Importante con Fluid compute (que Vercel activa por defecto): **no guardar
 * este cliente en una variable global**. Una misma instancia puede atender
 * varias peticiones concurrentes, y compartir el cliente mezclaría la sesión de
 * un usuario con la de otro. Por eso se crea uno nuevo en cada función.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Un Server Component no puede escribir cookies. Se ignora sin
            // problema porque el proxy ya refresca la sesión en cada petición.
          }
        },
      },
    },
  );
}
