import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/dal";
import { AccessPrompt } from "@/components/auth/AccessPrompt";
import { UserBadge } from "@/components/auth/UserBadge";
import { ProfilePanel } from "@/components/news/ProfilePanel";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Tu región y perfil", robots: { index: false, follow: false } };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) return <AccessPrompt title="Tu edición empieza contigo." description="Inicia sesión para elegir tu región y gestionar tu sesión." />;
  return <>
    <ProfilePanel />
    <div className={styles.settings}>
      <section className={styles.account} aria-labelledby="account-title"><h2 id="account-title">Tu cuenta</h2><UserBadge user={user} /><p>La sesión de Google es real. Tu nombre se consulta desde esa cuenta y no se modifica en esta demo.</p><p>El tema claro u oscuro sigue la configuración de tu dispositivo.</p></section>
      <div className={styles.install}><InstallPrompt /></div>
    </div>
  </>;
}
