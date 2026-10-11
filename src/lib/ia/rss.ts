import "server-only";

import { XMLParser } from "fast-xml-parser";

/**
 * Lector RSS de la búsqueda externa del chat (D-25).
 *
 * Solo lee los feeds de la lista de sitios permitidos (D-26) y busca por
 * palabras, sin llamar a ningún modelo (RP-03). Tavily entra después, y solo si
 * esta búsqueda no devuelve nada.
 */

export interface AllowedSite {
  name: string;
  /** Los enlaces de sus noticias deben ser de este dominio o de un subdominio. */
  domain: string;
  /** Código ISO del país. "CA" es un medio regional e "INT", uno internacional. */
  country: string;
  feedUrl: string;
}

export interface RssItem {
  title: string;
  url: string;
  summary: string;
  /** Fecha ISO, o null si el feed no trae una fecha válida. */
  publishedAt: string | null;
  site: string;
  country: string;
}

/**
 * Cada sitio entró en la lista porque su feed respondió con USER_AGENT el
 * 2026-10-09. La Prensa Gráfica, El Faro, El Heraldo y CRHoy no están porque
 * bloquean o no tienen RSS. La Prensa de Nicaragua tampoco: tarda de 6 a 8 s y
 * haría esperar cada búsqueda. Los medios de Belice publican en inglés.
 */
export const ALLOWED_SITES: readonly AllowedSite[] = [
  { name: "Prensa Libre", domain: "prensalibre.com", country: "GT", feedUrl: "https://www.prensalibre.com/feed/" },
  { name: "La Hora", domain: "lahora.gt", country: "GT", feedUrl: "https://lahora.gt/feed/" },
  { name: "Gato Encerrado", domain: "gatoencerrado.news", country: "SV", feedUrl: "https://gatoencerrado.news/feed/" },
  { name: "Revista Factum", domain: "revistafactum.com", country: "SV", feedUrl: "https://www.revistafactum.com/feed/" },
  { name: "Proceso Digital", domain: "proceso.hn", country: "HN", feedUrl: "https://proceso.hn/feed/" },
  { name: "Criterio.hn", domain: "criterio.hn", country: "HN", feedUrl: "https://criterio.hn/feed/" },
  { name: "Confidencial", domain: "confidencial.digital", country: "NI", feedUrl: "https://confidencial.digital/feed/" },
  { name: "Divergentes", domain: "divergentes.com", country: "NI", feedUrl: "https://www.divergentes.com/feed/" },
  { name: "La Nación", domain: "nacion.com", country: "CR", feedUrl: "https://www.nacion.com/arc/outboundfeeds/rss/?outputType=xml" },
  { name: "Delfino", domain: "delfino.cr", country: "CR", feedUrl: "https://delfino.cr/feed" },
  { name: "Semanario Universidad", domain: "semanariouniversidad.com", country: "CR", feedUrl: "https://semanariouniversidad.com/feed/" },
  { name: "La Prensa (Panamá)", domain: "prensa.com", country: "PA", feedUrl: "https://www.prensa.com/arc/outboundfeeds/rss/?outputType=xml" },
  { name: "TVN Noticias", domain: "tvn-2.com", country: "PA", feedUrl: "https://www.tvn-2.com/rss/" },
  { name: "Crítica", domain: "critica.com.pa", country: "PA", feedUrl: "https://www.critica.com.pa/rss.xml" },
  { name: "Amandala", domain: "amandala.com.bz", country: "BZ", feedUrl: "https://amandala.com.bz/news/feed/" },
  { name: "Breaking Belize News", domain: "breakingbelizenews.com", country: "BZ", feedUrl: "https://www.breakingbelizenews.com/feed/" },
  { name: "Expediente Público", domain: "expedientepublico.org", country: "CA", feedUrl: "https://www.expedientepublico.org/feed/" },
  { name: "BBC Mundo", domain: "bbc.com", country: "INT", feedUrl: "https://feeds.bbci.co.uk/mundo/rss.xml" },
  { name: "DW", domain: "dw.com", country: "INT", feedUrl: "https://rss.dw.com/xml/rss-sp-all" },
  { name: "France 24", domain: "france24.com", country: "INT", feedUrl: "https://www.france24.com/es/rss" },
  { name: "El País", domain: "elpais.com", country: "INT", feedUrl: "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada" },
  { name: "Infobae", domain: "infobae.com", country: "INT", feedUrl: "https://www.infobae.com/arc/outboundfeeds/rss/" },
  { name: "Euronews", domain: "euronews.com", country: "INT", feedUrl: "https://es.euronews.com/rss" },
];

const USER_AGENT = "RESPIA-News/1.0 (+https://respia-news.vercel.app)";
const FEED_TIMEOUT_MS = 5000;
/** Next guarda cada feed este tiempo: así no se descarga en cada pregunta. */
const FEED_CACHE_SECONDS = 900;
const MAX_ITEMS_PER_FEED = 50;
const MAX_SUMMARY_LENGTH = 300;
const MAX_RESULTS = 5;

/**
 * Palabras que no distinguen una noticia de otra. Incluye las de pregunta
 * («qué pasa», «novedades») porque casi todas las consultas del chat las traen.
 */
const STOPWORDS = new Set([
  "a", "al", "algo", "ante", "como", "con", "cual", "cuales", "cuando", "de", "del", "desde", "donde",
  "dime", "el", "ella", "ellos", "en", "entre", "es", "esa", "ese", "eso", "esta", "estan", "este",
  "esto", "explica", "explicame", "fue", "han", "hay", "hoy", "la", "las", "lo", "los", "mas", "me",
  "mi", "muy", "nueva", "nuevas", "nuevo", "nuevos", "noticia", "noticias", "novedades", "o", "para",
  "pasa", "paso", "pero", "por", "que", "quien", "resume", "resumen", "se", "sobre", "su", "sus",
  "the", "un", "una", "ultima", "ultimas", "ultimo", "ultimos", "y", "ya",
]);

/**
 * Nombres de lugar de varias palabras. Cuentan como una sola coincidencia: si
 * no, «Costa Rica» sola cumpliría el mínimo de 2 palabras de searchRss.
 */
const PHRASES = [
  "costa rica",
  "estados unidos",
  "naciones unidas",
  "puerto rico",
  "reino unido",
  "republica dominicana",
  "union europea",
];

const parser = new XMLParser({
  ignoreAttributes: true,
  // Un título como «2026» debe seguir siendo texto, no un número.
  parseTagValue: false,
  htmlEntities: true,
  isArray: (name) => name === "item",
});

/**
 * Lleva el texto a una forma comparable: sin tildes y en minúsculas.
 */
function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/**
 * Raíz corta de una palabra. Con las 6 primeras letras, «elección» y
 * «elecciones» o «Honduras» y «hondureño» coinciden sin un modelo de lenguaje.
 */
function stem(word: string): string {
  return word.length > 6 ? word.slice(0, 6) : word;
}

/** Palabras clave de un texto: las frases de PHRASES enteras y el resto como raíces. */
function keywordsOf(text: string): string[] {
  let rest = normalize(text);
  const phrases = PHRASES.filter((phrase) => rest.includes(phrase));

  for (const phrase of phrases) {
    rest = rest.replaceAll(phrase, " ");
  }

  const words = rest.split(/[^\p{L}\p{N}]+/u);
  const stems = words.filter((word) => word.length >= 3 && !STOPWORDS.has(word)).map(stem);
  return [...new Set([...phrases, ...stems])];
}

function toText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function cleanSummary(html: string): string {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > MAX_SUMMARY_LENGTH ? `${text.slice(0, MAX_SUMMARY_LENGTH)}…` : text;
}

function isFromDomain(url: string, domain: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    return (protocol === "https:" || protocol === "http:") && (hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

function toIsoDate(value: string): string | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * Descarga y lee un feed. Descarta las noticias sin título y las que enlazan
 * fuera del dominio del sitio: un feed no puede meter enlaces de otros sitios.
 */
export async function readFeed(site: AllowedSite): Promise<RssItem[]> {
  const response = await fetch(site.feedUrl, {
    headers: { "user-agent": USER_AGENT, accept: "application/rss+xml, application/xml, text/xml" },
    signal: AbortSignal.timeout(FEED_TIMEOUT_MS),
    next: { revalidate: FEED_CACHE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`${site.name} respondió ${response.status}.`);
  }

  const feed = parser.parse(await response.text());
  const rawItems: unknown[] = feed?.rss?.channel?.item ?? [];

  return rawItems.slice(0, MAX_ITEMS_PER_FEED).flatMap((raw) => {
    const entry = raw as Record<string, unknown>;
    const title = toText(entry.title).trim();
    const url = toText(entry.link).trim();

    if (!title || !isFromDomain(url, site.domain)) {
      return [];
    }

    return [
      {
        title,
        url,
        summary: cleanSummary(toText(entry.description)),
        publishedAt: toIsoDate(toText(entry.pubDate)),
        site: site.name,
        country: site.country,
      },
    ];
  });
}

/**
 * Busca la consulta en los feeds de todos los sitios permitidos.
 *
 * Una noticia entra si coincide con la mitad de las palabras de la consulta, y
 * nunca con menos de 2 (o con la única que tenga). Con una sola palabra en común,
 * «Honduras» traería cualquier noticia de Honduras aunque la pregunta sea sobre sus
 * elecciones. Con 2 fijas, una pregunta larga coincidía con palabras genéricas como
 * «sur» y «centro» (de «Centroamérica»). Las palabras del título valen el doble.
 * Ante un empate gana la más reciente.
 */
export async function searchRss(query: string): Promise<RssItem[]> {
  const keywords = keywordsOf(query);

  if (keywords.length === 0) {
    return [];
  }

  const minMatches = Math.max(Math.min(2, keywords.length), Math.ceil(keywords.length / 2));
  const results = await Promise.allSettled(ALLOWED_SITES.map(readFeed));
  const scored: { item: RssItem; score: number }[] = [];

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.warn(`[rss] no se pudo leer ${ALLOWED_SITES[index]?.name}`, result.reason);
      return;
    }

    for (const item of result.value) {
      const titleWords = new Set(keywordsOf(item.title));
      const summaryWords = new Set(keywordsOf(item.summary));
      let score = 0;
      let matches = 0;

      for (const keyword of keywords) {
        if (titleWords.has(keyword)) {
          score += 2;
          matches += 1;
        } else if (summaryWords.has(keyword)) {
          score += 1;
          matches += 1;
        }
      }

      if (matches >= minMatches) {
        scored.push({ item, score });
      }
    }
  });

  scored.sort(
    (a, b) => b.score - a.score || (b.item.publishedAt ?? "").localeCompare(a.item.publishedAt ?? ""),
  );

  return scored.slice(0, MAX_RESULTS).map(({ item }) => item);
}
