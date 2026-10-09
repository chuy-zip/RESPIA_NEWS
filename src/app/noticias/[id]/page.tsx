import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/dal";
import { EditorialShell } from "@/components/layout/EditorialShell";
import { SignInButton } from "@/components/auth/SignInButton";
import { ArticleReader } from "@/components/news/ArticleReader";

export const metadata: Metadata = { title: "Lectura", robots: { index: false, follow: false } };

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return <EditorialShell><h1>Tu próxima lectura empieza aquí.</h1><p>Inicia sesión para abrir esta noticia.</p><SignInButton /></EditorialShell>;
  const { id } = await params;
  return <EditorialShell demo><ArticleReader id={id} /></EditorialShell>;
}
