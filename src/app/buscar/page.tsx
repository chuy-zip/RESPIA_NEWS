import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/dal";
import { AccessPrompt } from "@/components/auth/AccessPrompt";
import { SearchPanel } from "@/components/news/SearchPanel";

export const metadata: Metadata = { title: "Buscar noticias", robots: { index: false, follow: false } };

export default async function SearchPage() {
  const user = await getCurrentUser();
  if (!user) return <AccessPrompt title="Encuentra tu próxima lectura." description="Entra con Google para buscar noticias y explorar los temas de la edición." />;
  return <SearchPanel />;
}
