import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/dal";
import { AccessPrompt } from "@/components/auth/AccessPrompt";
import { NewsDesk } from "@/components/news/NewsDesk";

export const metadata: Metadata = { title: "La edición", robots: { index: false, follow: false } };

export default async function EditionPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await getCurrentUser();
  if (!user) return <AccessPrompt title="Abre una perspectiva más amplia." description="Entra con Google para explorar la edición y leer las noticias completas." />;
  const params = await searchParams;
  const topicSlug = typeof params.topic === "string" ? params.topic : undefined;
  return <NewsDesk key={topicSlug ?? "all"} topicSlug={topicSlug} />;
}
