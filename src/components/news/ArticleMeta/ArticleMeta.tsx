import { STATUS_LABELS, formatArticleDate, type DemoArticle } from "@/components/news/DemoSession/demo";
import styles from "./ArticleMeta.module.css";

export function ArticleMeta({ article }: { article: DemoArticle }) {
  return (
    <div className={styles.meta}>
      <span className={styles.status} data-status={article.status}>
        <span aria-hidden="true">{article.status === "confirmed" ? "✓" : article.status === "developing" ? "◷" : "△"}</span>
        {STATUS_LABELS[article.status]}
      </span>
      <span>{article.contentType}</span>
      <time dateTime={article.date}>{formatArticleDate(article.date)}</time>
    </div>
  );
}
