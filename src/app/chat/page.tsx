import type { Metadata } from "next";
import Link from "next/link";
import { AccessPrompt } from "@/components/auth/AccessPrompt";
import { ChatPanel } from "@/components/news/ChatPanel";
import { getCurrentUser } from "@/lib/auth/dal";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Conversación", robots: { index: false, follow: false } };

export default async function ChatPage() {
  const user = await getCurrentUser();
  if (!user) return <AccessPrompt title="Una conversación con contexto." description="Inicia sesión para preguntar sobre tu edición y consultar sus fuentes." />;

  return <>
    <header className={styles.intro}>
      <div><h1>Entiende lo que está pasando.</h1><p>Explora las noticias con sus fuentes y su contexto.</p></div>
      <nav aria-label="Explorar desde la conversación"><Link href="/edicion">Leer la edición</Link><Link href="/perfil">Cambiar región</Link></nav>
    </header>
    <ChatPanel />
  </>;
}
