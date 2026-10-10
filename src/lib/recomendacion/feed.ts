/**
 * Recomendador del feed (D-20).
 *
 * Funciones puras: no leen la base ni llaman a ningún modelo (RP-03). El servicio
 * del feed les pasa las noticias y el perfil, y traduce el resultado al contrato
 * de GET /api/feed: prominencia, motivo y bloque importantItems.
 */

export type Prominence = "hero" | "large" | "standard" | "compact";

export interface FeedArticle {
  id: string;
  topicIds: string[];
  /** Regiones de relevancia (RF-16), no el lugar del hecho (D-31). */
  regionIds: string[];
  /** Fecha ISO de publicación. */
  publishedAt: string;
  /** Lo marca una persona en el portal, nunca el modelo (RT-04). */
  important: boolean;
}

export interface ReaderProfile {
  regionId: string | null;
  /** Peso de 0 a 1 por ID de tema. */
  topicWeights: Record<string, number>;
}

/** Aporte de cada componente al puntaje. La suma es el puntaje (RT-01). */
export interface ScoreComponents {
  region: number;
  interest: number;
  recency: number;
  importance: number;
}

export interface RankedItem {
  articleId: string;
  prominence: Prominence;
  score: number;
  components: ScoreComponents;
  reason: string;
}

export interface Feed {
  items: RankedItem[];
  /** Una noticia importante por ámbito, si el ámbito no tiene una arriba. No depende del filtro (RF-11). */
  importantItems: RankedItem[];
}

const WEIGHTS: ScoreComponents = { region: 0.35, interest: 0.3, recency: 0.2, importance: 0.15 };
const RECENCY_HALF_LIFE_HOURS = 24;

/** Ámbito de una noticia para un lector. El bloque importante lleva una por ámbito (D-31). */
type Scope = "country" | "centralAmerica" | "international";
const SCOPES: Scope[] = ["country", "centralAmerica", "international"];

/**
 * La prominencia sale de la posición y no de franjas de puntaje: con franjas, un
 * feed de puntajes parecidos quedaría en un solo nivel y no cumpliría RF-08.
 */
function prominenceAt(position: number): Prominence {
  if (position === 0) return "hero";
  if (position < 3) return "large";
  if (position < 9) return "standard";
  return "compact";
}

const PROMINENCE_LABELS: Record<Prominence, string> = {
  hero: "Destacada",
  large: "En primer plano",
  standard: "En la edición",
  compact: "Más abajo",
};

const COMPONENT_PHRASES: Record<keyof ScoreComponents, string> = {
  region: "es relevante para tu país",
  interest: "trata temas que lees",
  recency: "es reciente",
  importance: "la redacción la marcó como importante",
};

/** Un componente entra en el motivo si aporta al menos esto. */
const MIN_CONTRIBUTION_FOR_REASON = 0.05;

function halfLife(age: number, period: number): number {
  return Math.pow(0.5, Math.max(0, age) / period);
}

function scoreArticle(article: FeedArticle, profile: ReaderProfile, now: Date): ScoreComponents {
  const isLocal = profile.regionId !== null && article.regionIds.includes(profile.regionId);
  const interest = Math.max(0, ...article.topicIds.map((topicId) => profile.topicWeights[topicId] ?? 0));
  const ageHours = (now.getTime() - new Date(article.publishedAt).getTime()) / 3_600_000;

  return {
    region: WEIGHTS.region * (isLocal ? 1 : 0),
    interest: WEIGHTS.interest * Math.min(1, interest),
    recency: WEIGHTS.recency * halfLife(ageHours, RECENCY_HALF_LIFE_HOURS),
    importance: WEIGHTS.importance * (article.important ? 1 : 0),
  };
}

function scopeOf(article: FeedArticle, profile: ReaderProfile, centralAmerica: Set<string>): Scope {
  if (profile.regionId !== null && article.regionIds.includes(profile.regionId)) return "country";
  if (article.regionIds.some((regionId) => centralAmerica.has(regionId))) return "centralAmerica";
  return "international";
}

function reasonFor(prominence: Prominence, components: ScoreComponents): string {
  const phrases = (Object.keys(components) as (keyof ScoreComponents)[])
    .filter((key) => components[key] >= MIN_CONTRIBUTION_FOR_REASON)
    .sort((a, b) => components[b] - components[a])
    .map((key) => COMPONENT_PHRASES[key]);

  if (phrases.length === 0) {
    return `${PROMINENCE_LABELS[prominence]}: no coincide con tu región ni con los temas que lees.`;
  }

  const joined = phrases.length === 1 ? phrases[0] : `${phrases.slice(0, -1).join(", ")} y ${phrases.at(-1)}`;
  return `${PROMINENCE_LABELS[prominence]} porque ${joined}.`;
}

function rank(articles: FeedArticle[], profile: ReaderProfile, now: Date): RankedItem[] {
  const scored = articles.map((article) => {
    const components = scoreArticle(article, profile, now);
    const score = components.region + components.interest + components.recency + components.importance;
    return { article, components, score };
  });

  // Ante un empate gana la más reciente, y después el ID, para que el orden sea estable.
  scored.sort(
    (a, b) =>
      b.score - a.score ||
      b.article.publishedAt.localeCompare(a.article.publishedAt) ||
      a.article.id.localeCompare(b.article.id),
  );

  return scored.map(({ article, components, score }, position) => {
    const prominence = prominenceAt(position);
    return { articleId: article.id, prominence, score, components, reason: reasonFor(prominence, components) };
  });
}

/**
 * Ordena las noticias para un lector. Con topicId, `items` solo trae ese tema,
 * pero `importantItems` se calcula sobre todas: el filtro no oculta lo importante.
 * `centralAmericaRegionIds` son los países del catálogo (D-26). Definen el ámbito.
 */
export function buildFeed(
  articles: FeedArticle[],
  profile: ReaderProfile,
  options: { now: Date; centralAmericaRegionIds: string[]; topicId?: string },
): Feed {
  const { now, centralAmericaRegionIds, topicId } = options;
  const visible = topicId ? articles.filter((article) => article.topicIds.includes(topicId)) : articles;
  const items = rank(visible, profile, now);
  const prominent = new Set(
    items.filter((item) => item.prominence === "hero" || item.prominence === "large").map((item) => item.articleId),
  );

  // Una por ámbito: tres importantes de un país no dejan fuera la internacional (RF-11).
  // Si un ámbito ya tiene una importante arriba, está a la vista y no se repite.
  const centralAmerica = new Set(centralAmericaRegionIds);
  const importantIds = new Set<string>();
  for (const scope of SCOPES) {
    const inScope = articles
      .filter((article) => article.important && scopeOf(article, profile, centralAmerica) === scope)
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    const latest = inScope[0];
    if (!latest || inScope.some((article) => prominent.has(article.id))) continue;
    importantIds.add(latest.id);
  }
  const importantItems = rank(articles, profile, now).filter((item) => importantIds.has(item.articleId));

  return { items, importantItems };
}
