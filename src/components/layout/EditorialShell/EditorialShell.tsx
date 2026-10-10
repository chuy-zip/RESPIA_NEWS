import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { DemoBanner } from "@/components/news/DemoBanner";
import styles from "./EditorialShell.module.css";

export function EditorialShell({ children, signedIn, admin }: { children: ReactNode; signedIn: boolean; admin: boolean }) {
  return (
    <div className={styles.shell} data-editorial-shell>
      <a href="#principal" className={styles.skip}>Saltar al contenido</a>
      <SiteHeader signedIn={signedIn} admin={admin} />
      <main id="principal" className={styles.main} tabIndex={-1}>
        {signedIn && <DemoBanner />}
        {children}
      </main>
      <footer className={styles.footer}>
        <div><strong>The Meridian Times</strong><p>Una perspectiva más amplia.</p></div>
        <Link href="/privacidad">Privacidad</Link>
        <span>Proyecto académico · RESPIA News</span>
      </footer>
    </div>
  );
}
