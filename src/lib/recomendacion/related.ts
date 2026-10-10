/**
 * Noticias relacionadas del lector (D-31).
 *
 * Función pura: no lee la base ni llama a ningún modelo (RP-03). Relaciona por temas
 * compartidos y pone primero las de otro alcance, para que se vea el cruce entre lo
 * internacional y lo local. No afirma causas: solo dice qué temas comparten.
 */

import type { FeedArticle } from "./feed";

export type RelatedCandidate = Pick<FeedArticle, "id" | "topicIds" | "regionIds" | "publishedAt">;

/**
 * Alcance de una noticia según sus regiones de relevancia. No depende del lector: con el
 * ámbito del lector, un informe para toda Centroamérica y una noticia de su país se verían iguales.
 */
export type Reach = "local" | "regional" | "international";

export interface RelatedItem {
  articleId: string;
  /** Temas que comparte con la noticia abierta. La pantalla muestra sus etiquetas (RT-01). */
  sharedTopicIds: string[];
  reach: Reach;
}

const MAX_RELATED = 3;

function reachOf(article: RelatedCandidate, centralAmerica: Set<string>): Reach {
  const countries = article.regionIds.filter((regionId) => centralAmerica.has(regionId)).length;
  if (countries === 0) return "international";
  return countries === 1 ? "local" : "regional";
}

/**
 * Elige hasta 3 noticias que comparten temas con `article`. Primero van las de otro alcance,
 * después las que comparten más temas y después las más recientes. El ID desempata.
 * `centralAmericaRegionIds` son los países del catálogo (D-26).
 */
export function relatedArticles(
  article: RelatedCandidate,
  candidates: RelatedCandidate[],
  options: { centralAmericaRegionIds: string[] },
): RelatedItem[] {
  const centralAmerica = new Set(options.centralAmericaRegionIds);
  const openReach = reachOf(article, centralAmerica);

  return candidates
    .filter((candidate) => candidate.id !== article.id)
    .map((candidate) => ({
      candidate,
      sharedTopicIds: candidate.topicIds.filter((topicId) => article.topicIds.includes(topicId)),
      reach: reachOf(candidate, centralAmerica),
    }))
    .filter(({ sharedTopicIds }) => sharedTopicIds.length > 0)
    .sort(
      (a, b) =>
        Number(b.reach !== openReach) - Number(a.reach !== openReach) ||
        b.sharedTopicIds.length - a.sharedTopicIds.length ||
        b.candidate.publishedAt.localeCompare(a.candidate.publishedAt) ||
        a.candidate.id.localeCompare(b.candidate.id),
    )
    .slice(0, MAX_RELATED)
    .map(({ candidate, sharedTopicIds, reach }) => ({ articleId: candidate.id, sharedTopicIds, reach }));
}
