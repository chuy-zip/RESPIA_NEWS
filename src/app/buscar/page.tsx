import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/dal";
import { AccessPrompt } from "@/components/auth/AccessPrompt";
import { DEMO_TOPICS } from "@/components/news/DemoSession/demo";
import { SearchPanel } from "@/components/news/SearchPanel";

export const metadata: Metadata = { title: "Buscar noticias", robots: { index: false, follow: false } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await getCurrentUser();
  if (!user) return <AccessPrompt title="Encuentra tu próxima lectura." description="Entra con Google para buscar noticias y explorar los temas de la edición." />;
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 200) : "";
  const topicSlug = DEMO_TOPICS.find((item) => item.slug === params.topic)?.slug ?? "";
  const sort = params.sort === "oldest" ? "oldest" : "recent";
  return <SearchPanel key={JSON.stringify([query, topicSlug, sort])} query={query} topicSlug={topicSlug} sort={sort} />;
}
