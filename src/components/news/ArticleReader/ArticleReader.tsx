"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useReaderSession } from "@/components/news/ReaderSession";
import { apiRequest, asApiError, isAbortError, type ApiError } from "@/components/news/ReaderSession/api";
import { ApiErrorNotice } from "@/components/news/ApiErrorNotice";
import { ArticleMeta, CONTENT_TYPE_LABELS } from "@/components/news/ArticleMeta";
import { ArticleVisual } from "@/components/news/ArticleVisual";
import { StateNotice } from "@/components/news/StateNotice";
import { Button } from "@/components/ui/Button";
import type { ArticleDetail, ArticleDetailResponse } from "@/types/news";
import type { InteractionInput, InteractionResponse } from "@/types/profile";
import styles from "./ArticleReader.module.css";

export function ArticleReader({ id }: { id: string }) {
  const { catalog, catalogError, reloadCatalog, refreshFeed } = useReaderSession();
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const recorded = useRef(false);
  const [shareMessage, setShareMessage] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [sharing, setSharing] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    apiRequest<ArticleDetailResponse>(`/api/articles/${encodeURIComponent(id)}`, { signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) setArticle(data); })
      .catch((failure: unknown) => { if (!controller.signal.aborted && !isAbortError(failure)) setError(asApiError(failure)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, revision]);

  useEffect(() => {
    if (!article || recorded.current) return;
    recorded.current = true;
    async function recordOpen(articleId: string) {
      try {
        const body: InteractionInput = { articleId, type: "open", eventId: crypto.randomUUID() };
        await apiRequest<InteractionResponse>("/api/interactions", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
      } catch {
        // Una señal fallida no interrumpe la lectura ni se repite automáticamente.
      } finally {
        refreshFeed();
      }
    }
    void recordOpen(article.id);
  }, [article, refreshFeed]);

  function reloadArticle() {
    setError(null);
    setLoading(true);
    setRevision((current) => current + 1);
  }

  async function shareArticle() {
    if (!article || sharing) return;
    const url = new URL(`/noticias/${encodeURIComponent(article.id)}`, window.location.origin).href;
    setSharing(true);
    setShareMessage("");
    setShareUrl("");
    try {
      if (navigator.share) {
        await navigator.share({ title: article.title, text: article.summary, url });
        setShareMessage("Opciones de compartir abiertas.");
      } else {
        await navigator.clipboard.writeText(url);
        setShareMessage("Enlace copiado.");
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setShareMessage("No se pudo compartir el enlace. Puedes seleccionarlo y copiarlo aquí.");
        setShareUrl(url);
      }
    } finally {
      setSharing(false);
    }
  }

  if (loading) return <StateNotice state="loading" title="Abriendo la noticia" headingLevel={1} />;
  if (error?.status === 404) return <StateNotice state="empty" title="No encontramos esta noticia" description="El enlace no corresponde a una noticia publicada." headingLevel={1}><Link href="/edicion" className={styles.back}>Volver a la edición</Link></StateNotice>;
  if (error) return <section className={styles.reader}><h1>La noticia no está disponible</h1><ApiErrorNotice error={error} retry={reloadArticle} /><Link href="/edicion" className={styles.back}>Volver a la edición</Link></section>;
  if (!article) return null;
  const topicLabels = catalog?.topics.filter((topic) => article.topicIds.includes(topic.id)).map((topic) => topic.label) ?? [];
  const regionLabels = catalog?.regions.filter((region) => article.regionIds.includes(region.id)).map((region) => region.label) ?? [];
  return (
    <article className={styles.reader}>
      <Link href="/edicion" className={styles.back}>← Volver a la edición</Link>
      <header className={styles.header}>
        {topicLabels.length > 0 && <p className={styles.eyebrow}>{topicLabels.join(" / ")}</p>}
        <h1>{article.title}</h1>
        <p className={styles.summary}>{article.summary}</p>
        {article.author && <p className={styles.byline}>Por {article.author}</p>}
        <ArticleMeta article={article} />
      </header>
      <div className={styles.tools} aria-label="Acciones de lectura"><Button variant="ghost" onClick={shareArticle} disabled={sharing}>{sharing ? "Abriendo opciones…" : "Compartir noticia"}</Button><Link href="/guardados">Guardados <span>Próximamente</span></Link></div>
      <p className={styles.shareStatus} role="status">{shareMessage}</p>
      {shareUrl && <label className={styles.shareFallback}>Enlace de la noticia<input readOnly value={shareUrl} onFocus={(event) => event.currentTarget.select()} /></label>}
      <ArticleVisual image={article.image} />
      <div className={styles.body}>
        {article.body.map((block, index) => block.type === "heading" ? <h2 key={index}>{block.text}</h2> : <p key={index}>{block.text}</p>)}
      </div>
      <aside className={styles.sources} aria-labelledby="sources-title">
        <h2 id="sources-title">La información detrás del titular</h2>
        <dl><dt>Tipo de contenido</dt><dd>{CONTENT_TYPE_LABELS[article.contentType]}</dd>{regionLabels.length > 0 && <><dt>Regiones de relevancia</dt><dd>{regionLabels.join(" · ")}</dd></>}<dt>Imagen</dt><dd>{article.image ? `${article.image.label}. Autor: ${article.image.author}. Licencia: ${article.image.license}.` : "Esta noticia se publicó sin imagen."}</dd><dt>Revisión editorial</dt><dd>{article.reviewNote}</dd>{article.important && <><dt>Importancia editorial</dt><dd>La redacción marcó esta noticia como importante.</dd></>}</dl>
        {catalogError && <ApiErrorNotice error={catalogError} retry={reloadCatalog} />}
        <h3>Fuentes declaradas</h3>
        <ul>{article.sources.map((source, index) => <li key={index}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.name} ↗</a></li>)}</ul>
      </aside>
      <Link href={`/chat?articleId=${encodeURIComponent(article.id)}`} className={styles.back}>Preguntar sobre esta noticia ↗</Link>
    </article>
  );
}
