import { SiteHeader } from "@/components/layout/SiteHeader";
import { InstallHint } from "@/components/pwa/InstallHint";
import { JokeProbe } from "@/components/smoke-test/JokeProbe";

import styles from "./page.module.css";

export default function HomePage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <SiteHeader badge="prueba técnica" />

        <main className={styles.main}>
          <section className={styles.hero}>
            <p className={styles.eyebrow}>Deploy 001 · verificación</p>
            <h1 className={styles.headline}>
              La app se instala y ya habla con su backend.
            </h1>
            <p className={styles.lead}>
              Esta pantalla es provisional. Existe para confirmar tres cosas
              antes de construir el portal: que Vercel sirve la aplicación, que
              el backend responde y que un teléfono la puede instalar como app.
            </p>
          </section>

          <JokeProbe />

          <InstallHint />
        </main>

        <footer className={styles.footer}>
          <span>RESPIA News</span>
          <span className={styles.footerNote}>
            Pantalla temporal de infraestructura
          </span>
        </footer>
      </div>
    </div>
  );
}
