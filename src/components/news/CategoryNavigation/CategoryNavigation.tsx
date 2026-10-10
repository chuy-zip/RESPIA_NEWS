import Link from "next/link";
import { DEMO_TOPICS } from "@/components/news/DemoSession/demo";
import styles from "./CategoryNavigation.module.css";

export function CategoryNavigation({ activeSlug }: { activeSlug?: string }) {
  return <nav className={styles.navigation} aria-label="Temas de la edición">
    <Link href="/edicion" aria-current={!activeSlug ? "page" : undefined}>Toda la edición</Link>
    {DEMO_TOPICS.map((topic) => <Link key={topic.slug} href={`/temas/${topic.slug}`} aria-current={activeSlug === topic.slug ? "page" : undefined}>{topic.label}</Link>)}
  </nav>;
}
