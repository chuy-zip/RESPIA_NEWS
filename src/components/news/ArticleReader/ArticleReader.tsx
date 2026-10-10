"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDemoSession } from "@/components/news/DemoSession";
import { ArticleMeta } from "@/components/news/ArticleMeta";
import { ArticleVisual } from "@/components/news/ArticleVisual";
import { StateNotice } from "@/components/news/StateNotice";
import { Button } from "@/components/ui/Button";
import styles from "./ArticleReader.module.css";

export function ArticleReader({ id }: { id: string }) {
  const { articles, markRead, preview } = useDemoSession();
  const [shareMessage, setShareMessage] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [sharing, setSharing] = useState(false);
  const article = articles.find((item) => item.id === id);
  const visible = preview === "ready" || preview === "limit";
  useEffect(() => { if (article && visible) markRead(article.id); }, [article, markRead, visible]);

  async function shareArticle() {
    if (!article || sharing) return;
    const url = new URL(`/noticias/${encodeURIComponent(article.id)}`, window.location.origin).href;
    setSharing(true);
    setShareMessage("");
    setShareUrl("");
    try {
      if (navigator.share) {
        await navigator.share({ title: article.title, text: "Noticia ficticia de The Meridian Times", url });
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

  if (!visible) return <StateNotice headingLevel={1} />;
  if (!article) return <section className={styles.reader}><h1>Esta noticia ya no está en la demo</h1><p>Las publicaciones simuladas desaparecen al recargar la pestaña.</p><Link href="/edicion" className={styles.back}>Volver a la edición</Link></section>;
  const related = articles.filter((item) => item.id !== article.id && item.topic === article.topic).slice(0, 3);
  return (
    <article className={styles.reader}>
      <Link href="/edicion" className={styles.back}>← Volver a la edición</Link>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{article.topic} / {article.regions.join(" · ")}</p>
        <h1>{article.title}</h1>
        <p className={styles.summary}>{article.summary}</p>
        <p className={styles.byline}>Por {article.byline} <span>Firma ficticia de esta demo</span></p>
        <ArticleMeta article={article} />
      </header>
      <div className={styles.tools} aria-label="Acciones de lectura"><Button variant="ghost" onClick={shareArticle} disabled={sharing}>{sharing ? "Abriendo opciones…" : "Compartir noticia"}</Button><Link href="/guardados">Guardados <span>Próximamente</span></Link></div>
      <p className={styles.shareStatus} role="status">{shareMessage}</p>
      {shareUrl && <label className={styles.shareFallback}>Enlace de la noticia<input readOnly value={shareUrl} onFocus={(event) => event.currentTarget.select()} /></label>}
      {article.id.startsWith("demo-") && <p className={styles.shareNote}>Esta publicación solo existe en tu pestaña. Compartir el enlace no la publica para otras personas.</p>}
      <ArticleVisual visual={article.visual} />
      <div className={styles.body}>
        <p className={styles.disclosure}>Contenido ficticio. Las etiquetas representan estados de ejemplo y no verifican acontecimientos reales.</p>
        {article.body.map((block, index) => block.type === "heading" ? <h2 key={index}>{block.text}</h2> : <p key={index}>{block.text}</p>)}
      </div>
      <aside className={styles.sources} aria-labelledby="sources-title">
        <h2 id="sources-title">La información detrás del titular</h2>
        <dl><dt>Tipo de contenido</dt><dd>{article.contentType}</dd><dt>Imagen</dt><dd>Ilustración SVG del proyecto, elaborada con asistencia de Codex para esta demostración. No es una fotografía del acontecimiento.</dd><dt>Revisión editorial</dt><dd>{article.reviewNote}</dd></dl>
        <h3>Fuentes declaradas</h3>
        <ul>{article.sources.map((source, index) => <li key={index}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.name} ↗</a><p>Referencia de demostración. No acredita una noticia real.</p></li>)}</ul>
      </aside>
      {related.length > 0 && <section className={styles.related} aria-labelledby="related-title"><h2 id="related-title">Más sobre {article.topic.toLocaleLowerCase("es")}</h2><p>Noticias de demostración del mismo tema.</p><ul>{related.map((item) => <li key={item.id}><h3><Link href={`/noticias/${item.id}`}>{item.title}</Link></h3><p>{item.summary}</p></li>)}</ul></section>}
      <Link href="/chat" className={styles.back}>Abrir una conversación sobre la edición ↗</Link>
    </article>
  );
}
