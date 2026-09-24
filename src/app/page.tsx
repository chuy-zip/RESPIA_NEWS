import Link from "next/link";

import { SignInButton } from "@/components/auth/SignInButton";
import { UserBadge } from "@/components/auth/UserBadge";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { JokeTeaser } from "@/components/smoke-test/JokeTeaser";
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
    <div className={styles.page}>
      <div className={styles.container}>
        <SiteHeader badge="prueba técnica" />

        <main className={styles.main}>
          <section className={styles.hero}>
            <p className={styles.eyebrow}>Deploy 001 · verificación</p>
            <h1 className={styles.headline}>
              {user
                ? "Sesión iniciada. Ya puedes entrar al contenido protegido."
                : "Un adelanto público. El resto pide sesión."}
            </h1>
            <p className={styles.lead}>
              {user
                ? "El backend ya te reconoce. Entra a la pantalla protegida para hacer la llamada real."
                : "Esta portada es pública, como el resto de la app. Inicia sesión con Google para entrar a la pantalla protegida."}
            </p>

            <div className={styles.session}>
              {user ? <UserBadge user={user} /> : <SignInButton />}
            </div>

            {authError ? (
              <p className={styles.authError} role="alert">
                No se pudo iniciar sesión: {authError}
              </p>
            ) : null}
          </section>

          <JokeTeaser />

          {/*
            El enlace se muestra siempre, con o sin sesión. Si solo apareciera
            para usuarios logueados, el "bloqueo" sería nada más un enlace
            escondido: cualquiera que escribiera /contenido a mano lo vería
            igual. Mostrarlo siempre y dejar que /contenido haga la
            verificación de verdad es lo que demuestra que el control está en
            el servidor.
          */}
          <Link href="/contenido" className={styles.protectedLink}>
            Ver contenido protegido →
          </Link>

          <InstallPrompt />
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
