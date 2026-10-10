import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { AccessPrompt } from "@/components/auth/AccessPrompt";
import { NewsDesk } from "@/components/news/NewsDesk";
import { DEMO_TOPICS } from "@/components/news/DemoSession/demo";

export const metadata: Metadata = { title: "Temas de la edición", robots: { index: false, follow: false } };

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  if (!user) return <AccessPrompt title="Sigue el hilo de las noticias." description="Entra con Google para explorar los temas de tu edición." />;
  const { slug } = await params;
  const topic = DEMO_TOPICS.find((item) => item.slug === slug);
  if (!topic) notFound();
  return <NewsDesk topicSlug={topic.slug} />;
}
