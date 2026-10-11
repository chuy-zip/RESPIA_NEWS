import Link from "next/link";
import type { CatalogItem } from "@/types/news";
import styles from "./CategoryNavigation.module.css";

export function CategoryNavigation({ activeSlug, topics }: { activeSlug?: string; topics: CatalogItem[] }) {
  return <nav className={styles.navigation} aria-label="Temas de la edición">
    <Link href="/edicion" aria-current={!activeSlug ? "page" : undefined}>Toda la edición</Link>
    {topics.map((topic) => <Link key={topic.id} href={`/temas/${encodeURIComponent(topic.slug)}`} aria-current={activeSlug === topic.slug ? "page" : undefined}>{topic.label}</Link>)}
  </nav>;
}
