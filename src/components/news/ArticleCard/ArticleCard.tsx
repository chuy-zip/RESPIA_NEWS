import Link from "next/link";
import { ArticleMeta } from "@/components/news/ArticleMeta";
import { ArticleVisual } from "@/components/news/ArticleVisual";
import type { Prominence } from "@/types/feed";
import type { ArticleSummary, CatalogItem } from "@/types/news";
import styles from "./ArticleCard.module.css";

export function ArticleCard({ article, prominence = "standard", reason, topics, mobileRow = false }: { article: ArticleSummary; prominence?: Prominence; reason?: string; topics: CatalogItem[]; mobileRow?: boolean }) {
  const topicLabels = topics.filter((topic) => article.topicIds.includes(topic.id)).map((topic) => topic.label);
  return (
    <article className={`${styles.card} ${styles[prominence]}${mobileRow ? ` ${styles.mobileRow}` : ""}`}>
      {article.image ? <ArticleVisual image={article.image} mobileThumbnail={mobileRow} /> : <div className={styles.noImage}>Sin imagen</div>}
      <div className={styles.copy}>
        {topicLabels.length > 0 && <p className={styles.topic}>{topicLabels.join(" / ")}</p>}
        <h3><Link href={`/noticias/${encodeURIComponent(article.id)}`}>{article.title}</Link></h3>
        <p className={styles.summary}>{article.summary}</p>
        <div className={styles.metadata}><ArticleMeta article={article} /></div>
        {reason && <details className={styles.reason}>
          <summary>¿Por qué aparece?</summary>
          <p>{reason}</p>
        </details>}
      </div>
    </article>
  );
}
