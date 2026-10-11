/**
 * Tipos del chat de noticias (RF-12, RF-13, RF-14).
 *
 * La primera parte sigue la ficha 7 de notion-frontend.md: lo que viaja entre la
 * pantalla y POST /api/chat. La segunda es el contrato con el módulo del modelo
 * (src/lib/ia/chat.ts), tal como lo describe specs/chat.md, incremento 2.
 */

import type { ContentType, EditorialStatus } from "@/types/news";

// Pantalla <-> POST /api/chat --------------------------------------------------

/** Un turno de la conversación. Vive solo en la memoria de la pantalla (RF-07). */
export interface ChatMessage {
  role: "reader" | "assistant";
  text: string;
}

/** Cuerpo de POST /api/chat. */
export interface ChatRequest {
  question: string;
  /** Turnos anteriores. El servidor usa solo los últimos 4. */
  messages: ChatMessage[];
}

/** El estado sale de la base, nunca del modelo (RF-13). */
export interface ArticleCitation {
  kind: "article";
  articleId: string;
  title: string;
  status: EditorialStatus;
  contentType: ContentType;
}

/** Fuente externa de un sitio permitido (D-24). Todavía no se genera. */
export interface ExternalCitation {
  kind: "external";
  url: string;
  name: string;
  /** Siempre «Fuente externa, no verificada por la redacción». */
  label: string;
}

export type ChatCitation = ArticleCitation | ExternalCitation;

export interface ChatSegment {
  text: string;
  citations: ChatCitation[];
}

/**
 * - answered: hay respuesta con sus citas.
 * - no_coverage: no hay noticias publicadas sobre la pregunta (RF-14).
 * - unavailable: el modelo no está disponible. La pantalla no inventa una respuesta.
 */
export type ChatStatus = "answered" | "no_coverage" | "unavailable";

export interface ChatResponseData {
  status: ChatStatus;
  segments: ChatSegment[];
}

export interface ChatResponse {
  data: ChatResponseData;
  meta: Record<string, never>;
}

// Backend <-> módulo del modelo (src/lib/ia/chat.ts) ---------------------------

/** Una noticia que el modelo puede citar. Los temas y regiones van con su nombre. */
export interface ChatContextArticle {
  id: string;
  title: string;
  summary: string;
  status: EditorialStatus;
  contentType: ContentType;
  publishedAt: string;
  topics: string[];
  regions: string[];
}

export interface ChatModelInput {
  question: string;
  /** Últimos 4 turnos como máximo. */
  history: ChatMessage[];
  /** Nombre de la región simulada del lector, o null si no eligió una (RF-04). */
  region: string | null;
  /** Primero las recomendaciones del lector, después las que coinciden con la pregunta. */
  articles: ChatContextArticle[];
}

export interface ChatModelOutput {
  text: string;
  /** IDs de las noticias usadas. El servidor descarta los que no estaban en `articles`. */
  articleIds: string[];
  /** false si las noticias del contexto no responden la pregunta. */
  covered: boolean;
}

/** La función que exporta src/lib/ia/chat.ts. */
export type ChatModel = (input: ChatModelInput) => Promise<ChatModelOutput>;
