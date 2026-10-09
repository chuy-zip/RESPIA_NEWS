import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/dal";
import { EditorialShell } from "@/components/layout/EditorialShell";
import { SignInButton } from "@/components/auth/SignInButton";
import { UserBadge } from "@/components/auth/UserBadge";
import { ProfilePanel } from "@/components/news/ProfilePanel";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Tu región y perfil", robots: { index: false, follow: false } };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) return <EditorialShell><h1>Tu edición empieza contigo.</h1><p>Inicia sesión para elegir tu región.</p><SignInButton /></EditorialShell>;
  return <EditorialShell demo><ProfilePanel /><section className={styles.account}><h2>Tu cuenta</h2><UserBadge user={user} /><p>La sesión de Google es real. Los datos de noticias de esta edición son de demostración.</p></section><InstallPrompt /></EditorialShell>;
}
