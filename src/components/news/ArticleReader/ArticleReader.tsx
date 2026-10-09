"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useDemoSession } from "@/components/news/DemoSession";
import { ArticleMeta } from "@/components/news/ArticleMeta";
import { ArticleVisual } from "@/components/news/ArticleVisual";
import { StateNotice } from "@/components/news/StateNotice";
import styles from "./ArticleReader.module.css";

export function ArticleReader({ id }: { id: string }) {
  const { articles, markRead, preview } = useDemoSession();
  const article = articles.find((item) => item.id === id);
  const visible = preview === "ready" || preview === "limit";
  useEffect(() => { if (article && visible) markRead(article.id); }, [article, markRead, visible]);

  if (!visible) return <StateNotice />;
  if (!article) return <section className={styles.reader}><h1>Esta noticia ya no está en la demo</h1><p>Las publicaciones simuladas desaparecen al recargar la pestaña.</p><Link href="/">Volver a la edición</Link></section>;
  return (
    <article className={styles.reader}>
      <Link href="/" className={styles.back}>← Volver a la edición</Link>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{article.topic} / {article.regions.join(" · ")}</p>
        <h1>{article.title}</h1>
        <p className={styles.summary}>{article.summary}</p>
        <ArticleMeta article={article} />
      </header>
      <ArticleVisual visual={article.visual} />
      <div className={styles.body}>
        <p className={styles.disclosure}>Contenido ficticio. Las etiquetas representan estados de ejemplo y no verifican acontecimientos reales.</p>
        {article.body.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      </div>
      <aside className={styles.sources} aria-labelledby="sources-title">
        <h2 id="sources-title">La información detrás del titular</h2>
        <dl><dt>Tipo de contenido</dt><dd>{article.contentType}</dd><dt>Imagen</dt><dd>Ilustración SVG del proyecto, elaborada con asistencia de Codex para esta demostración. No es una fotografía del acontecimiento.</dd><dt>Revisión editorial</dt><dd>{article.reviewNote}</dd></dl>
        <h3>Fuentes declaradas</h3>
        <ul>{article.sources.map((source, index) => <li key={index}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.name} ↗</a><p>Referencia de demostración. No acredita una noticia real.</p></li>)}</ul>
      </aside>
      <Link href="/#conversacion" className={styles.back}>Volver al chat de la edición ↗</Link>
    </article>
  );
}
