import type { ArticleSummary, ContentType, EditorialStatus } from "@/types/news";
import styles from "./ArticleMeta.module.css";

export const STATUS_LABELS: Record<EditorialStatus, string> = {
  confirmed: "Confirmado",
  developing: "En desarrollo",
  unconfirmed: "No confirmado",
};

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  original: "Contenido original",
  summary: "Resumen",
  ai_contribution: "Aporte de IA",
};

export function ArticleMeta({ article }: { article: Pick<ArticleSummary, "status" | "contentType" | "publishedAt"> }) {
  return (
    <div className={styles.meta}>
      <span className={styles.status} data-status={article.status}>
        <span aria-hidden="true">{article.status === "confirmed" ? "✓" : article.status === "developing" ? "◷" : "△"}</span>
        {STATUS_LABELS[article.status]}
      </span>
      <span>{CONTENT_TYPE_LABELS[article.contentType]}</span>
      <time dateTime={article.publishedAt}>{new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date(article.publishedAt))}</time>
    </div>
  );
}
