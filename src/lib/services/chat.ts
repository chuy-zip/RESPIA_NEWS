import "server-only";

import { responderChat } from "@/lib/ia/chat";
import { getCatalog } from "@/lib/services/catalogs";
import { getFeed } from "@/lib/services/feed";
import { getProfile } from "@/lib/services/profile";
import { createClient } from "@/lib/supabase/server";
import type {
  ArticleCitation,
  ChatContextArticle,
  ChatMessage,
  ChatModel,
  ChatRequest,
  ChatResponseData,
} from "@/types/chat";
import type { ContentType, EditorialStatus } from "@/types/news";

/**
 * Chat de noticias: la parte de backend (D-24).
 *
 * Arma el contexto con datos de la base y valida la salida del modelo. No
 * escribe prompts ni llama al modelo: eso es de src/lib/ia/chat.ts. Buscar y
 * ordenar noticias no usa ningún modelo (RP-03).
 */

const MAX_QUESTION = 500;
const MAX_TURN = 2000;
const HISTORY_TURNS = 4;
const RECOMMENDED = 10;
const SEARCHED = 5;

export class ChatValidationError extends Error {
  constructor(readonly fields: Record<string, string>) {
    super("Revisa los campos marcados.");
    this.name = "ChatValidationError";
  }
}

/** La base no respondió. La ruta lo traduce a 503 sin mostrar el detalle. */
export class ChatStoreError extends Error {
  constructor(cause: unknown) {
    super("No se pudo preparar la respuesta.", { cause });
    this.name = "ChatStoreError";
  }
}

/** El módulo del modelo es de IA: src/lib/ia/chat.ts (D-34). */
function getChatModel(): ChatModel | null {
  return responderChat;
}

export function validateChatRequest(raw: unknown): ChatRequest {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new ChatValidationError({ body: "El cuerpo de la petición no es válido." });
  }

  const { question, messages } = raw as Record<string, unknown>;
  const fields: Record<string, string> = {};

  const text = typeof question === "string" ? question.trim() : "";
  if (!text) fields.question = "Escribe una pregunta.";
  else if (text.length > MAX_QUESTION) fields.question = `La pregunta admite ${MAX_QUESTION} caracteres.`;

  const history: ChatMessage[] = [];
  if (messages !== undefined && !Array.isArray(messages)) {
    fields.messages = "El historial no es válido.";
  } else {
    for (const message of (messages as unknown[] | undefined) ?? []) {
      const { role, text: turn } = (message ?? {}) as Record<string, unknown>;
      if ((role !== "reader" && role !== "assistant") || typeof turn !== "string" || turn.length > MAX_TURN) {
        fields.messages = "El historial no es válido.";
        break;
      }
      history.push({ role, text: turn });
    }
  }

  if (Object.keys(fields).length > 0) {
    throw new ChatValidationError(fields);
  }

  // Solo los últimos turnos: acota el costo y la conversación no se guarda (RF-07).
  return { question: text, messages: history.slice(-HISTORY_TURNS) };
}

interface ContextRow {
  id: string;
  title: string;
  summary: string;
  status: EditorialStatus;
  content_type: ContentType;
  published_at: string;
  topics: { topic_id: string }[];
  regions: { region_id: string }[];
}

/**
 * Noticias que el modelo puede citar: primero las recomendaciones del lector
 * (consultas sobre su región) y después las que coinciden con la pregunta
 * (recientes, de otro país o de un tema).
 */
async function buildContext(userId: string, question: string) {
  const supabase = await createClient();
  const [catalog, profile, feed, search] = await Promise.all([
    getCatalog(),
    getProfile(userId),
    getFeed(userId, { topicSlug: null, limit: RECOMMENDED, offset: 0 }),
    supabase
      .from("articles")
      .select("id")
      .textSearch("search", question, { type: "websearch", config: "spanish" })
      .limit(SEARCHED),
  ]);

  if (search.error) {
    throw new ChatStoreError(search.error);
  }

  const ids = [
    ...new Set([
      ...feed.data.items.map((item) => item.article.id),
      ...feed.data.importantItems.map((item) => item.article.id),
      ...search.data.map((row) => row.id as string),
    ]),
  ];

  const regionLabels = new Map(catalog.regions.map((region) => [region.id, region.label]));
  const region = profile.regionId ? (regionLabels.get(profile.regionId) ?? null) : null;

  if (ids.length === 0) {
    return { region, articles: [] };
  }

  const { data, error } = await supabase
    .from("articles")
    .select(
      "id, title, summary, status, content_type, published_at, " +
        "topics:article_topics(topic_id), regions:article_regions(region_id)",
    )
    .in("id", ids);

  if (error) {
    throw new ChatStoreError(error);
  }

  const topicLabels = new Map(catalog.topics.map((topic) => [topic.id, topic.label]));
  const rows = new Map((data as unknown as ContextRow[]).map((row) => [row.id, row]));
  const articles: ChatContextArticle[] = ids.flatMap((id) => {
    const row = rows.get(id);
    if (!row) return [];
    return [
      {
        id: row.id,
        title: row.title,
        summary: row.summary,
        status: row.status,
        contentType: row.content_type,
        publishedAt: row.published_at,
        topics: row.topics.flatMap((topic) => topicLabels.get(topic.topic_id) ?? []),
        regions: row.regions.flatMap((item) => regionLabels.get(item.region_id) ?? []),
      },
    ];
  });

  return { region, articles };
}

export async function answerQuestion(userId: string, request: ChatRequest): Promise<ChatResponseData> {
  const { region, articles } = await buildContext(userId, request.question);

  // Sin noticias no hay de dónde responder: no se llama al modelo (RF-14, CIC-20).
  if (articles.length === 0) {
    return { status: "no_coverage", segments: [] };
  }

  const model = getChatModel();
  if (!model) {
    return { status: "unavailable", segments: [] };
  }

  let output;
  try {
    output = await model({ question: request.question, history: request.messages, region, articles });
  } catch (failure) {
    console.error("[chat] el modelo no respondió", failure);
    return { status: "unavailable", segments: [] };
  }

  // Solo se citan noticias que estaban en el contexto. El estado sale de la base, no del modelo (RF-13).
  const byId = new Map(articles.map((article) => [article.id, article]));
  const citations: ArticleCitation[] = [...new Set(output.articleIds)].flatMap((id) => {
    const article = byId.get(id);
    return article
      ? [{ kind: "article", articleId: id, title: article.title, status: article.status, contentType: article.contentType }]
      : [];
  });

  // Una respuesta sin una noticia que la respalde no se muestra: nada se afirma sin fuente (RF-14).
  if (!output.covered || citations.length === 0 || !output.text.trim()) {
    return { status: "no_coverage", segments: [] };
  }

  return { status: "answered", segments: [{ text: output.text.trim(), citations }] };
}
