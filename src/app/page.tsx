import { SignInButton } from "@/components/auth/SignInButton";
import { EditorialShell } from "@/components/layout/EditorialShell";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { NewsDesk } from "@/components/news/NewsDesk";
import { ArticleVisual } from "@/components/news/ArticleVisual";
import { getCurrentUser } from "@/lib/auth/dal";

import styles from "./page.module.css";

interface HomePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  // La verificación ocurre en el servidor: el HTML que sale ya sabe si hay
  // sesión. No se manda contenido protegido para esconderlo después con CSS.
  const user = await getCurrentUser();

  // El callback deja aquí el motivo cuando el login falla.
  const params = await searchParams;
  const authError =
    typeof params.auth_error === "string" ? params.auth_error : null;

  return (
    <EditorialShell demo={!!user}>
      {user ? <NewsDesk /> : <>
        <section className={styles.hero} aria-labelledby="welcome-title">
          <div className={styles.copy}>
            <p className={styles.eyebrow}>Una edición para ampliar tu perspectiva</p>
            <h1 id="welcome-title" className={styles.headline}>Lejos de aquí.<br /><em>Cerca de ti.</em></h1>
            <p className={styles.lead}>Tecnología, economía y finanzas. Entiende cómo las noticias del mundo se conectan con tu región.</p>
            <div id="acceso" className={styles.session}><SignInButton label="Explorar con Google" /></div>
            {authError && <p className={styles.authError} role="alert">No pudimos iniciar sesión. Inténtalo de nuevo con Google.</p>}
            <p className={styles.note}>Edición de demostración · noticias ficticias · sin costo de IA</p>
          </div>
          <aside className={styles.frontplate} aria-label="Concepto editorial">
            <p className={styles.eyebrow}>El hilo que conecta las noticias</p>
            <ArticleVisual visual="orbit" />
            <h2>Menos ruido.<br />Más contexto.</h2>
            <p>Una pregunta puede cambiar tu forma de leer el mundo.</p>
            <span className={styles.seal}>M / T</span>
          </aside>
        </section>
        <section className={styles.principles} aria-label="Nuestra propuesta editorial">
          <article><span>01 / PERSPECTIVA</span><h2>Tu región, en el mapa.</h2><p>Elige una ubicación simulada y explora distintas ediciones. Nunca te pediremos GPS.</p></article>
          <article><span>02 / TRANSPARENCIA</span><h2>Las fuentes, a la vista.</h2><p>Reconoce qué se sabe, qué sigue en desarrollo y de dónde viene cada noticia.</p></article>
          <article><span>03 / CONTEXTO</span><h2>Pregunta. Conecta. Comprende.</h2><p>Lee una noticia o abre una conversación. Las respuestas conservan sus referencias.</p></article>
        </section>
        <section id="instalar" className={styles.install}><div><p className={styles.eyebrow}>Tu edición, contigo</p><h2>Un lugar en tu pantalla de inicio.</h2><p>Instala la app desde tu navegador en iPhone o Android.</p></div><InstallPrompt /></section>
      </>}
    </EditorialShell>
  );
}
