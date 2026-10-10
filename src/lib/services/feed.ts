import "server-only";

import { buildFeed, topicWeights, type FeedArticle, type RankedItem, type Signal } from "@/lib/recomendacion/feed";
import { getCatalog } from "@/lib/services/catalogs";
import { getProfile } from "@/lib/services/profile";
import { createClient } from "@/lib/supabase/server";
import type { FeedData, FeedItem } from "@/types/feed";
import type { ArticleSummary, ContentType, EditorialStatus, ImageProvenance, PageMeta } from "@/types/news";

/**
 * Feed personalizado del lector (ficha 4 de notion-frontend.md).
 *
 * El backend junta los datos y el recomendador decide el orden (D-20): este
 * servicio lee las noticias, el perfil y las señales, llama a `topicWeights` y
 * `buildFeed`, y traduce el resultado al contrato. No llama a ningún modelo (RP-03).
 */

const LIMIT = { default: 20, max: 50 };

/**
 * Noticias que entran al cálculo, las más recientes. La recencia pierde la mitad
 * cada 24 horas: una noticia de hace semanas ya no compite por los primeros lugares.
 */
const CANDIDATES = 200;

/** El slug de la región que no es un país de Centroamérica (D-26). */
const INTERNATIONAL_SLUG = "internacional";

/** Un filtro o un cursor que no se puede usar. La ruta lo traduce a 400. */
export class FeedQueryError extends Error {
  constructor(readonly code: "INVALID_FILTER" | "INVALID_CURSOR", message: string) {
    super(message);
    this.name = "FeedQueryError";
  }
}

/** La base no respondió. La ruta lo traduce a 503 sin mostrar el detalle. */
export class FeedStoreError extends Error {
  constructor(cause: unknown) {
    super("No se pudo armar el feed.", { cause });
    this.name = "FeedStoreError";
  }
}

export interface FeedQuery {
  topicSlug: string | null;
  limit: number;
  /** Posición en el orden donde empieza la página. */
  offset: number;
}

// El cursor es opaco para el cliente: la posición de la página siguiente, en base64url.
const encodeCursor = (offset: number) => Buffer.from(JSON.stringify({ offset })).toString("base64url");

function decodeCursor(cursor: string): number {
  try {
    const value: unknown = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    const offset = (value as { offset?: unknown } | null)?.offset;
    if (typeof offset === "number" && Number.isInteger(offset) && offset >= 0) {
      return offset;
    }
  } catch {
    // Cae al error de abajo.
  }
  throw new FeedQueryError("INVALID_CURSOR", "La página pedida no es válida. Vuelve al inicio del feed.");
}

/** Lee los filtros de la URL. Lanza `FeedQueryError` si alguno no es válido. */
export function parseFeedQuery(params: URLSearchParams): FeedQuery {
  const rawLimit = params.get("limit");
  const limit = rawLimit === null ? LIMIT.default : Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > LIMIT.max) {
    throw new FeedQueryError("INVALID_FILTER", `El límite debe ser un número entre 1 y ${LIMIT.max}.`);
  }

  const cursor = params.get("cursor");

  return {
    topicSlug: params.get("topic")?.trim() || null,
    limit,
    offset: cursor ? decodeCursor(cursor) : 0,
  };
}

interface ArticleRow {
  id: string;
  title: string;
  summary: string;
  published_at: string;
  status: EditorialStatus;
  content_type: ContentType;
  image: ImageProvenance | null;
  important: boolean;
  topics: { topic_id: string }[];
  regions: { region_id: string }[];
}

interface InteractionRow {
  article_id: string;
  type: Signal["type"];
  created_at: string;
  article: { topics: { topic_id: string }[] } | null;
}

/**
 * El orden se recalcula en cada página: si llega una noticia nueva entre dos
 * páginas, el lector puede ver una repetida o perder una. Con un feed corto de
 * demo es aceptable. Un orden fijo por sesión necesitaría guardarlo.
 */
export async function getFeed(userId: string, query: FeedQuery, now = new Date()): Promise<{ data: FeedData; meta: PageMeta }> {
  const catalog = await getCatalog();

  let topicId: string | undefined;
  if (query.topicSlug) {
    topicId = catalog.topics.find((topic) => topic.slug === query.topicSlug)?.id;
    if (!topicId) {
      throw new FeedQueryError("INVALID_FILTER", "El tema del filtro no existe.");
    }
  }

  const supabase = await createClient();
  const [profile, articles, interactions] = await Promise.all([
    getProfile(userId),
    supabase
      .from("articles")
      .select(
        "id, title, summary, published_at, status, content_type, image, important, " +
          "topics:article_topics(topic_id), regions:article_regions(region_id)",
      )
      .order("published_at", { ascending: false })
      .limit(CANDIDATES),
    supabase
      .from("interactions")
      .select("article_id, type, created_at, article:articles(topics:article_topics(topic_id))")
      .eq("user_id", userId),
  ]);

  if (articles.error || interactions.error) {
    throw new FeedStoreError(articles.error ?? interactions.error);
  }

  const rows = articles.data as unknown as ArticleRow[];
  const signals: Signal[] = (interactions.data as unknown as InteractionRow[]).map((row) => ({
    articleId: row.article_id,
    topicIds: row.article?.topics.map((topic) => topic.topic_id) ?? [],
    type: row.type,
    createdAt: row.created_at,
  }));

  const feedArticles: FeedArticle[] = rows.map((row) => ({
    id: row.id,
    topicIds: row.topics.map((topic) => topic.topic_id),
    regionIds: row.regions.map((region) => region.region_id),
    publishedAt: row.published_at,
    important: row.important,
  }));

  const feed = buildFeed(
    feedArticles,
    { regionId: profile.regionId, topicWeights: topicWeights(signals, profile.topicIds, now) },
    {
      now,
      centralAmericaRegionIds: catalog.regions.filter((region) => region.slug !== INTERNATIONAL_SLUG).map((region) => region.id),
      topicId,
    },
  );

  const byId = new Map(rows.map((row) => [row.id, row]));
  const toItem = (ranked: RankedItem): FeedItem => {
    const row = byId.get(ranked.articleId)!;
    const article: ArticleSummary = {
      id: row.id,
      title: row.title,
      summary: row.summary,
      topicIds: row.topics.map((topic) => topic.topic_id),
      publishedAt: row.published_at,
      status: row.status,
      contentType: row.content_type,
      image: row.image,
    };
    return { article, prominence: ranked.prominence, reason: ranked.reason, components: ranked.components };
  };

  const end = query.offset + query.limit;

  return {
    data: {
      items: feed.items.slice(query.offset, end).map(toItem),
      // El bloque importante va en todas las páginas: no depende de la paginación ni del filtro (RF-11).
      importantItems: feed.importantItems.map(toItem),
    },
    meta: { nextCursor: end < feed.items.length ? encodeCursor(end) : null },
  };
}
