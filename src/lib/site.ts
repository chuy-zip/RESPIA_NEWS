/**
 * Resuelve la URL pública del sitio.
 *
 * Se usa para los metadatos absolutos (Open Graph). En Vercel no hace falta
 * configurar nada: la plataforma inyecta VERCEL_PROJECT_PRODUCTION_URL sola.
 * NEXT_PUBLIC_SITE_URL solo hace falta el día que haya dominio propio.
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // Vercel la expone sin el esquema: "mi-proyecto.vercel.app"
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  return "http://localhost:3000";
}
