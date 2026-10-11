/**
 * Tipos del feed personalizado (RF-08, RF-11, RT-01).
 *
 * Siguen la ficha 4 de notion-frontend.md. El orden, la prominencia y el motivo
 * los calcula el recomendador (src/lib/recomendacion, D-20, D-31).
 */

import type { ArticleSummary, PageMeta } from "@/types/news";

/** Variante visual de la tarjeta. Sale de la posición en el orden. */
export type Prominence = "hero" | "large" | "standard" | "compact";

/** Aporte de cada componente al puntaje. La suma es el puntaje (RT-01). */
export interface ScoreComponents {
  region: number;
  interest: number;
  recency: number;
  importance: number;
}

export interface FeedItem {
  article: ArticleSummary;
  prominence: Prominence;
  /** Frase legible: por qué la noticia quedó en su lugar (RT-01). */
  reason: string;
  components: ScoreComponents;
}

export interface FeedData {
  items: FeedItem[];
  /** Una noticia importante por ámbito que no quedó arriba. No depende del filtro (RF-11). */
  importantItems: FeedItem[];
}

export interface FeedResponse {
  data: FeedData;
  meta: PageMeta;
}
