import "server-only";

import { getCatalog } from "@/lib/services/catalogs";
import { isUploadId, resolveUploadedImage, UploadNotFoundError } from "@/lib/services/images";
import { createClient } from "@/lib/supabase/server";
import type {
  ArticleDetail,
  ArticleSummary,
  ContentBlock,
  ContentType,
  EditorialStatus,
  ImageProvenance,
  PageMeta,
  PublicationResult,
  PublishArticleInput,
  PublishImageInput,
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
const MAX_IMAGE = { alt: 300, author: 120, license: 200 };
const IMAGE_ORIGINS: PublishImageInput["origin"][] = ["event_photo", "illustrative"];

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

  let image: PublishImageInput | null = null;
  if (raw.image !== null && raw.image !== undefined) {
    const input = isRecord(raw.image) ? raw.image : {};
    const uploadId = text(input.uploadId);
    const alt = text(input.alt);
    const author = text(input.author);
    const license = text(input.license);
    const origin = input.origin as PublishImageInput["origin"];

    if (!isUploadId(uploadId)) fields["image.uploadId"] = "Sube la imagen antes de publicar.";
    if (!alt || alt.length > MAX_IMAGE.alt) fields["image.alt"] = "Describe la imagen para quien no puede verla.";
    if (!author || author.length > MAX_IMAGE.author) fields["image.author"] = "Indica el autor de la imagen.";
    if (!license || license.length > MAX_IMAGE.license) fields["image.license"] = "Indica la licencia o el permiso de uso.";
    // RF-18: no se publica una imagen sin origen declarado.
    if (!IMAGE_ORIGINS.includes(origin)) fields["image.origin"] = "Indica si es una foto del hecho o una imagen ilustrativa.";

    image = { uploadId, alt, author, license, origin };
  }

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
    image,
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

  let image: ImageProvenance | null = null;
  if (input.image) {
    try {
      image = await resolveUploadedImage(input.image);
    } catch (failure) {
      if (failure instanceof UploadNotFoundError) {
        throw new ArticleValidationError({ "image.uploadId": failure.message });
      }
      throw new ArticleStoreError(failure);
    }
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
      image,
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

// Listado del portal --------------------------------------------------------

const LIST_LIMIT = { default: 20, max: 50 };

/** Un filtro o un cursor que no se puede usar. La ruta lo traduce a 400. */
export class ArticleQueryError extends Error {
  constructor(readonly code: "INVALID_FILTER" | "INVALID_CURSOR", message: string) {
    super(message);
    this.name = "ArticleQueryError";
  }
}

export interface ArticleListQuery {
  q: string | null;
  topicSlug: string | null;
  status: EditorialStatus | null;
  limit: number;
  /** Última noticia de la página anterior. */
  after: { publishedAt: string; id: string } | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// El cursor es opaco para el cliente: la última noticia vista, en base64url.
const encodeCursor = (publishedAt: string, id: string) =>
  Buffer.from(JSON.stringify({ publishedAt, id })).toString("base64url");

function decodeCursor(cursor: string): ArticleListQuery["after"] {
  try {
    const value: unknown = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (
      isRecord(value) &&
      typeof value.publishedAt === "string" &&
      !Number.isNaN(Date.parse(value.publishedAt)) &&
      typeof value.id === "string" &&
      UUID.test(value.id)
    ) {
      return { publishedAt: new Date(value.publishedAt).toISOString(), id: value.id };
    }
  } catch {
    // Cae al error de abajo.
  }
  throw new ArticleQueryError("INVALID_CURSOR", "La página pedida no es válida. Vuelve al inicio del listado.");
}

/** Lee los filtros de la URL. Lanza `ArticleQueryError` si alguno no es válido. */
export function parseListQuery(params: URLSearchParams): ArticleListQuery {
  const q = params.get("q")?.trim() || null;
  const topicSlug = params.get("topic")?.trim() || null;

  const rawStatus = params.get("status");
  if (rawStatus !== null && !STATUSES.includes(rawStatus as EditorialStatus)) {
    throw new ArticleQueryError("INVALID_FILTER", "El estado del filtro no existe.");
  }

  const rawLimit = params.get("limit");
  const limit = rawLimit === null ? LIST_LIMIT.default : Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > LIST_LIMIT.max) {
    throw new ArticleQueryError("INVALID_FILTER", `El límite debe ser un número entre 1 y ${LIST_LIMIT.max}.`);
  }

  const cursor = params.get("cursor");

  return {
    q,
    topicSlug,
    status: (rawStatus as EditorialStatus | null) ?? null,
    limit,
    after: cursor ? decodeCursor(cursor) : null,
  };
}

interface ArticleSummaryRow {
  id: string;
  title: string;
  summary: string;
  published_at: string;
  status: EditorialStatus;
  content_type: ContentType;
  image: ImageProvenance | null;
  topics: { topic_id: string }[];
}

/**
 * Noticias publicadas, de la más reciente a la más antigua. El orden es estable:
 * con la misma fecha desempata el id, así el cursor no repite ni salta noticias.
 */
export async function listArticles(query: ArticleListQuery): Promise<{ items: ArticleSummary[]; meta: PageMeta }> {
  let topicId: string | null = null;
  if (query.topicSlug) {
    const catalog = await getCatalog();
    topicId = catalog.topics.find((topic) => topic.slug === query.topicSlug)?.id ?? null;
    if (!topicId) {
      throw new ArticleQueryError("INVALID_FILTER", "El tema del filtro no existe.");
    }
  }

  const supabase = await createClient();

  // `topics` trae todos los temas de cada noticia. `topic_filter` es la misma
  // relación con inner join, solo para filtrar sin recortar `topics`.
  const columns = "id, title, summary, published_at, status, content_type, image, topics:article_topics(topic_id)";
  let request = supabase
    .from("articles")
    .select(topicId ? `${columns}, topic_filter:article_topics!inner(topic_id)` : columns)
    .order("published_at", { ascending: false })
    .order("id", { ascending: false })
    // Una de más para saber si hay otra página.
    .limit(query.limit + 1);

  if (topicId) request = request.eq("topic_filter.topic_id", topicId);
  if (query.status) request = request.eq("status", query.status);
  if (query.q) {
    // Los comodines que escribe la persona se buscan como texto.
    request = request.ilike("title", `%${query.q.replace(/[\\%_]/g, (char) => `\\${char}`)}%`);
  }
  if (query.after) {
    // Los dos valores ya se validaron como fecha ISO y UUID.
    const { publishedAt, id } = query.after;
    request = request.or(`published_at.lt.${publishedAt},and(published_at.eq.${publishedAt},id.lt.${id})`);
  }

  const { data, error } = await request;
  if (error) {
    throw new ArticleStoreError(error);
  }

  const rows = data as unknown as ArticleSummaryRow[];
  const page = rows.slice(0, query.limit);
  const last = page.at(-1);

  return {
    items: page.map((row) => ({
      id: row.id,
      title: row.title,
      summary: row.summary,
      topicIds: row.topics.map((topic) => topic.topic_id),
      publishedAt: row.published_at,
      status: row.status,
      contentType: row.content_type,
      image: row.image,
    })),
    meta: { nextCursor: rows.length > query.limit && last ? encodeCursor(last.published_at, last.id) : null },
  };
}

// Lector ----------------------------------------------------------------------

interface ArticleDetailRow extends ArticleSummaryRow {
  author: string | null;
  body: ContentBlock[];
  sources: Source[];
  review_note: string;
  important: boolean;
  regions: { region_id: string }[];
}

/**
 * Una noticia completa, o null si no existe. Lo usa el lector con cualquier
 * cuenta con sesión: RLS no entrega nada sin sesión (RF-02).
 */
export async function getArticle(id: string): Promise<ArticleDetail | null> {
  // Un id que no es UUID no existe. Consultarlo daría un error de la base, no un 404.
  if (!UUID.test(id)) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select(
      "id, title, summary, published_at, status, content_type, image, author, body, sources, review_note, important, " +
        "topics:article_topics(topic_id), regions:article_regions(region_id)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new ArticleStoreError(error);
  }
  if (!data) {
    return null;
  }

  const row = data as unknown as ArticleDetailRow;

  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    topicIds: row.topics.map((topic) => topic.topic_id),
    publishedAt: row.published_at,
    status: row.status,
    contentType: row.content_type,
    image: row.image,
    author: row.author,
    regionIds: row.regions.map((region) => region.region_id),
    body: row.body,
    sources: row.sources,
    reviewNote: row.review_note,
    important: row.important,
  };
}
