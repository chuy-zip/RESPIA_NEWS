import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { AccessPrompt } from "@/components/auth/AccessPrompt";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Lecturas guardadas", robots: { index: false, follow: false } };

export default async function SavedPage() {
  const user = await getCurrentUser();
  if (!user) return <AccessPrompt title="Un lugar para retomar la lectura." description="Entra con Google para consultar el estado de las lecturas guardadas." />;
  return <section className={styles.saved} aria-labelledby="saved-title">
    <header><p className={styles.kicker}>Tu espacio de lectura</p><h1 id="saved-title">Lecturas para volver.</h1><p className={styles.lead}>Algunas noticias merecen una segunda mirada.</p></header>
    <div className={styles.notice}>
      <svg viewBox="0 0 40 48" width="40" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M8 4h24v38L20 33 8 42V4Z" /><path d="M14 13h12M14 19h12" /></svg>
      <div><h2>El guardado todavía no está disponible.</h2><p>Esta función está pendiente de integración. La demo no guarda noticias en tu cuenta ni en el dispositivo.</p><Link href="/edicion">Explorar la edición</Link></div>
    </div>
    <p className={styles.note}>Puedes seguir abriendo noticias y consultando sus fuentes. Tus lecturas temporales aparecen en <Link href="/perfil">tu perfil</Link> mientras mantengas abierta esta demo.</p>
  </section>;
}
