import "server-only";

import { ALLOWED_SITES, cleanSummary, isFromDomain, searchRss, type RssItem } from "@/lib/ia/rss";

/**
 * Búsqueda externa del chat (D-25, D-34).
 *
 * El módulo del modelo la llama solo cuando la búsqueda de texto de la app no
 * encontró noticias. Primero busca en el RSS de los sitios permitidos, que es
 * gratis. Solo si el RSS no encuentra nada, usa Tavily. Ningún paso llama a un
 * modelo (RP-03).
 */

export interface ExternalResult extends RssItem {
  source: "rss" | "tavily";
}

const TAVILY_URL = "https://api.tavily.com/search";
const TAVILY_TIMEOUT_MS = 8000;
const MAX_RESULTS = 5;

interface TavilyResult {
  title?: unknown;
  url?: unknown;
  content?: unknown;
  published_date?: unknown;
}

/**
 * Busca en Tavily, limitado a los dominios de la lista. "basic" cuesta 1 crédito
 * del plan gratis de 1 000 por mes. Sin llave no se llama: devuelve una lista vacía.
 */
async function searchTavily(query: string): Promise<ExternalResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return [];
  }

  const response = await fetch(TAVILY_URL, {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      query,
      search_depth: "basic",
      topic: "news",
      max_results: MAX_RESULTS,
      include_domains: ALLOWED_SITES.map((site) => site.domain),
    }),
    signal: AbortSignal.timeout(TAVILY_TIMEOUT_MS),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Tavily respondió ${response.status}.`);
  }

  const data = (await response.json()) as { results?: TavilyResult[] };

  // include_domains es un pedido a Tavily, no una garantía: el dominio se comprueba aquí.
  return (data.results ?? []).flatMap((result) => {
    const url = typeof result.url === "string" ? result.url : "";
    const title = typeof result.title === "string" ? result.title.trim() : "";
    const site = ALLOWED_SITES.find((allowed) => isFromDomain(url, allowed.domain));
    if (!site || !title) {
      return [];
    }

    const published = typeof result.published_date === "string" ? new Date(result.published_date) : null;
    return [
      {
        title,
        url,
        summary: cleanSummary(typeof result.content === "string" ? result.content : ""),
        publishedAt: published && !Number.isNaN(published.getTime()) ? published.toISOString() : null,
        site: site.name,
        country: site.country,
        source: "tavily" as const,
      },
    ];
  });
}

/**
 * Busca fuentes externas para una pregunta: primero el RSS y, si no hay nada,
 * Tavily. Si Tavily falla o se acabaron sus créditos, devuelve una lista vacía
 * y el chat responde «sin cobertura». La consulta no se guarda.
 */
export async function searchExternal(query: string): Promise<ExternalResult[]> {
  const fromRss = await searchRss(query);
  if (fromRss.length > 0) {
    return fromRss.map((item) => ({ ...item, source: "rss" as const }));
  }

  try {
    return await searchTavily(query);
  } catch (failure) {
    console.warn("[tavily] la búsqueda falló", failure);
    return [];
  }
}
