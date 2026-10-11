import Link from "next/link";
import { ArticleMeta } from "@/components/news/ArticleMeta";
import { ArticleVisual } from "@/components/news/ArticleVisual";
import type { Prominence } from "@/types/feed";
import type { ArticleSummary, CatalogItem } from "@/types/news";
import styles from "./ArticleCard.module.css";

export function ArticleCard({ article, prominence = "standard", reason, topics }: { article: ArticleSummary; prominence?: Prominence; reason?: string; topics: CatalogItem[] }) {
  const topicLabels = topics.filter((topic) => article.topicIds.includes(topic.id)).map((topic) => topic.label);
  return (
    <article className={`${styles.card} ${styles[prominence]}`}>
      {prominence !== "compact" && <ArticleVisual image={article.image} />}
      <div className={styles.copy}>
        {topicLabels.length > 0 && <p className={styles.topic}>{topicLabels.join(" / ")}</p>}
        <h3><Link href={`/noticias/${encodeURIComponent(article.id)}`}>{article.title}</Link></h3>
        {prominence !== "compact" && <p className={styles.summary}>{article.summary}</p>}
        <ArticleMeta article={article} />
        {prominence === "compact" && article.image && <p className={styles.source}>{article.image.label}</p>}
        {reason && <details className={styles.reason}>
          <summary>¿Por qué aparece?</summary>
          <p>{reason}</p>
        </details>}
      </div>
    </article>
  );
}
