import "server-only";

import { getCatalog } from "@/lib/services/catalogs";
import { createClient } from "@/lib/supabase/server";
import type {
  ContentBlock,
  ContentType,
  EditorialStatus,
  PublicationResult,
  PublishArticleInput,
  Source,
} from "@/types/news";

/**
 * Publicación de noticias desde el portal (RF-15, RF-16, RT-03, RT-04).
 *
 * La ruta ya comprobó que quien llama es administrador. Aquí se valida cada
 * campo, porque la validación del formulario mejora la experiencia pero no
 * protege nada: cualquiera puede enviar el JSON a mano.
 */

// Los mismos límites que el formulario del portal, para no rechazar lo que la interfaz deja escribir.
const MAX = { title: 180, summary: 500, body: 15000, sourceName: 120, sourceUrl: 1000, reviewNote: 1500 };

const STATUSES: EditorialStatus[] = ["confirmed", "developing", "unconfirmed"];
const CONTENT_TYPES: ContentType[] = ["original", "summary", "ai_contribution"];

/** Errores por campo, con un mensaje que el portal puede mostrar junto al campo. */
export type FieldErrors = Record<string, string>;

export class ArticleValidationError extends Error {
  constructor(readonly fields: FieldErrors) {
    super("Revisa los campos marcados.");
    this.name = "ArticleValidationError";
  }
}

/** La base no respondió. La ruta lo traduce a 503 sin mostrar el detalle. */
export class ArticleStoreError extends Error {
  constructor(cause: unknown) {
    super("No se pudo guardar la noticia.", { cause });
    this.name = "ArticleStoreError";
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function stringList(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : null;
}

/**
 * Revisa la forma del cuerpo sin consultar la base. Devuelve la entrada limpia
 * o lanza `ArticleValidationError` con todos los campos que fallan a la vez.
 */
export function validatePublishInput(raw: unknown): PublishArticleInput {
  if (!isRecord(raw)) {
    throw new ArticleValidationError({ body: "El cuerpo de la petición no es válido." });
  }

  const fields: FieldErrors = {};

  const title = text(raw.title);
  if (!title) fields.title = "Escribe el título.";
  else if (title.length > MAX.title) fields.title = `El título admite ${MAX.title} caracteres.`;

  const summary = text(raw.summary);
  if (!summary) fields.summary = "Escribe la entradilla.";
  else if (summary.length > MAX.summary) fields.summary = `La entradilla admite ${MAX.summary} caracteres.`;

  const body: ContentBlock[] = [];
  if (!Array.isArray(raw.body)) {
    fields.body = "Escribe el contenido.";
  } else {
    for (const block of raw.body) {
      const blockText = isRecord(block) ? text(block.text) : "";
      if (!isRecord(block) || (block.type !== "paragraph" && block.type !== "heading") || !blockText) {
        fields.body = "El contenido tiene un bloque vacío o de un tipo no admitido.";
        break;
      }
      body.push({ type: block.type, text: blockText });
    }
    const length = body.reduce((total, block) => total + block.text.length, 0);
    if (!fields.body && body.length === 0) fields.body = "Escribe el contenido.";
    else if (!fields.body && length > MAX.body) fields.body = `El contenido admite ${MAX.body} caracteres.`;
  }

  const sources: Source[] = [];
  if (!Array.isArray(raw.sources) || raw.sources.length === 0) {
    fields.sources = "Agrega al menos una fuente.";
  } else {
    raw.sources.forEach((source, index) => {
      const name = isRecord(source) ? text(source.name) : "";
      const url = isRecord(source) ? text(source.url) : "";
      if (!name || name.length > MAX.sourceName) {
        fields[`sources.${index}.name`] = `Escribe el nombre de la fuente ${index + 1}.`;
      }
      if (!url || url.length > MAX.sourceUrl || !isHttpUrl(url)) {
        fields[`sources.${index}.url`] = `El enlace de la fuente ${index + 1} debe empezar con http:// o https://.`;
      }
      sources.push({ name, url });
    });
  }

  const publishedAt = text(raw.publishedAt);
  if (!publishedAt || Number.isNaN(Date.parse(publishedAt))) fields.publishedAt = "Indica la fecha de la noticia.";

  const topicIds = stringList(raw.topicIds);
  if (!topicIds?.length) fields.topicIds = "Selecciona al menos un tema.";

  const regionIds = stringList(raw.regionIds);
  if (!regionIds?.length) fields.regionIds = "Selecciona al menos una región.";

  const status = raw.status as EditorialStatus;
  if (!STATUSES.includes(status)) fields.status = "Selecciona un estado editorial.";
  // RT-03: una sola fuente no basta para confirmar. La base repite esta regla.
  else if (status === "confirmed" && sources.length < 2) {
    fields.status = "Para marcarla como confirmada se necesitan al menos dos fuentes.";
  }

  const contentType = raw.contentType as ContentType;
  if (!CONTENT_TYPES.includes(contentType)) fields.contentType = "Selecciona el tipo de contenido.";

  const reviewNote = text(raw.reviewNote);
  if (!reviewNote) fields.reviewNote = "Explica por qué la noticia tiene este estado.";
  else if (reviewNote.length > MAX.reviewNote) fields.reviewNote = `La razón admite ${MAX.reviewNote} caracteres.`;

  if (typeof raw.important !== "boolean") fields.important = "Indica si la noticia es importante.";

  // El servicio de imágenes aún no existe: no hay candidatas que resolver.
  if (raw.imageCandidateId !== null) fields.imageCandidateId = "Las imágenes todavía no están disponibles. Publica sin imagen.";

  // RT-04: la publicación la decide una persona.
  if (raw.reviewConfirmed !== true) fields.reviewConfirmed = "Confirma que revisaste la noticia antes de publicar.";

  if (Object.keys(fields).length > 0) {
    throw new ArticleValidationError(fields);
  }

  return {
    title,
    summary,
    body,
    sources,
    publishedAt: new Date(publishedAt).toISOString(),
    topicIds: [...new Set(topicIds)],
    regionIds: [...new Set(regionIds)],
    status,
    contentType,
    reviewNote,
    important: raw.important as boolean,
    imageCandidateId: null,
    reviewConfirmed: true,
  };
}

/**
 * Guarda la noticia y la deja visible en la app.
 *
 * Los IDs de tema y región se comprueban contra el catálogo antes de escribir:
 * la noticia y sus relaciones se guardan en tres inserciones, y un ID inválido a
 * mitad del proceso dejaría una noticia sin clasificar.
 */
export async function publishArticle(input: PublishArticleInput): Promise<PublicationResult> {
  const catalog = await getCatalog();
  const validTopics = new Set(catalog.topics.map((topic) => topic.id));
  const validRegions = new Set(catalog.regions.map((region) => region.id));

  const fields: FieldErrors = {};
  if (!input.topicIds.every((id) => validTopics.has(id))) fields.topicIds = "Un tema seleccionado no existe.";
  if (!input.regionIds.every((id) => validRegions.has(id))) fields.regionIds = "Una región seleccionada no existe.";
  if (Object.keys(fields).length > 0) {
    throw new ArticleValidationError(fields);
  }

  // Con la sesión del administrador: RLS vuelve a comprobar el rol en cada inserción.
  const supabase = await createClient();

  const { data: article, error } = await supabase
    .from("articles")
    .insert({
      title: input.title,
      summary: input.summary,
      body: input.body,
      sources: input.sources,
      published_at: input.publishedAt,
      status: input.status,
      content_type: input.contentType,
      review_note: input.reviewNote,
      important: input.important,
    })
    .select("id")
    .single();

  if (error || !article) {
    throw new ArticleStoreError(error);
  }

  const [regions, topics] = await Promise.all([
    supabase.from("article_regions").insert(input.regionIds.map((region_id) => ({ article_id: article.id, region_id }))),
    supabase.from("article_topics").insert(input.topicIds.map((topic_id) => ({ article_id: article.id, topic_id }))),
  ]);

  if (regions.error || topics.error) {
    throw new ArticleStoreError(regions.error ?? topics.error);
  }

  return { id: article.id, publicationState: "published" };
}
