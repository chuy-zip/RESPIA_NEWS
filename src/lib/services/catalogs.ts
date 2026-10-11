import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { CatalogData, CatalogItem, ContentType, EditorialStatus } from "@/types/news";

/**
 * Catálogo editorial: las opciones válidas para clasificar una noticia.
 *
 * Regiones y temas viven en la base (supabase/migrations/003_articles.sql). Los
 * estados y tipos de contenido son fijos: la base los restringe con un CHECK, y
 * aquí se repiten para que el portal no los escriba a mano.
 */

const STATUSES: EditorialStatus[] = ["confirmed", "developing", "unconfirmed"];
const CONTENT_TYPES: ContentType[] = ["original", "summary", "ai_contribution"];

/** La base no respondió. La ruta lo traduce a 503 sin mostrar el detalle. */
export class CatalogUnavailableError extends Error {
  constructor(cause: unknown) {
    super("No se pudo leer el catálogo.", { cause });
    this.name = "CatalogUnavailableError";
  }
}

export async function getCatalog(): Promise<CatalogData> {
  const supabase = await createClient();

  // Con la sesión del usuario: RLS solo deja leer a cuentas con sesión.
  const [regions, topics] = await Promise.all([
    supabase.from("regions").select("id, slug, label").order("label"),
    supabase.from("topics").select("id, slug, label").order("label"),
  ]);

  // Sin datos no se inventan opciones: un catálogo vacío dejaría publicar sin clasificar.
  if (regions.error || topics.error) {
    throw new CatalogUnavailableError(regions.error ?? topics.error);
  }

  return {
    regions: regions.data as CatalogItem[],
    topics: topics.data as CatalogItem[],
    statuses: STATUSES,
    contentTypes: CONTENT_TYPES,
  };
}
