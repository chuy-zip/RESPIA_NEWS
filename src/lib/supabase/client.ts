import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para el navegador.
 *
 * Se usa solo desde Client Components (por ejemplo, el botón que inicia el
 * login con Google). Lee la sesión de las cookies que mantiene el proxy.
 *
 * La llave publicable está pensada para viajar al navegador: no es un secreto.
 * Lo que protege los datos es RLS en la base y la verificación en el servidor,
 * no esconder esta llave.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
