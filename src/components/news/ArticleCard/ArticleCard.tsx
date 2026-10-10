import Link from "next/link";
import { ArticleMeta } from "@/components/news/ArticleMeta";
import { ArticleVisual } from "@/components/news/ArticleVisual";
import type { DemoArticle, Prominence } from "@/components/news/DemoSession/demo";
import styles from "./ArticleCard.module.css";

export function ArticleCard({ article, prominence = "standard" }: { article: DemoArticle; prominence?: Prominence }) {
  return (
    <article className={`${styles.card} ${styles[prominence]}`}>
      {prominence !== "compact" && <ArticleVisual visual={article.visual} />}
      <div className={styles.copy}>
        <p className={styles.topic}>{article.topic} <span aria-hidden="true">/</span> {article.regions[0]}</p>
        <h3><Link href={`/noticias/${article.id}`}>{article.title}</Link></h3>
        {prominence !== "compact" && <p className={styles.summary}>{article.summary}</p>}
        <ArticleMeta article={article} />
        <p className={styles.source}>Fuente: {article.sources[0]?.name}</p>
        <details className={styles.reason}>
          <summary>¿Por qué aparece?</summary>
          <p>{article.important ? "Este ejemplo permanece visible para representar información importante fuera de tus preferencias." : "Esta posición forma parte de un escenario fijo de demostración. El backend determinará la relevancia real."}</p>
        </details>
      </div>
    </article>
  );
}
