import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/dal";
import { AccessPrompt } from "@/components/auth/AccessPrompt";
import { ArticleReader } from "@/components/news/ArticleReader";

export const metadata: Metadata = { title: "Lectura", robots: { index: false, follow: false } };

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return <AccessPrompt title="Tu próxima lectura empieza aquí." description="Inicia sesión para abrir esta noticia y consultar sus fuentes." />;
  const { id } = await params;
  return <ArticleReader key={id} id={id} />;
}
