import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

/**
 * Proxy de Next.js 16 (antes se llamaba middleware).
 *
 * Su única responsabilidad es refrescar la sesión de Supabase. La autorización
 * vive en cada ruta, no aquí: ver el comentario en src/lib/supabase/proxy.ts.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Corre en todas las rutas menos:
     * - _next/static y _next/image: archivos generados por el build
     * - favicon.ico e imágenes sueltas
     * - los archivos de la PWA: el manifiesto, el service worker y la página
     *   offline. Estos los pide el navegador sin sesión y deben servirse tal
     *   cual, sin que el proxy les toque las cabeceras de caché.
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|offline.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
