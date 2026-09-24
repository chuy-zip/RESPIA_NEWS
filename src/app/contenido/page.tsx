import Link from "next/link";

import { SignInButton } from "@/components/auth/SignInButton";
import { UserBadge } from "@/components/auth/UserBadge";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { JokeProbe } from "@/components/smoke-test/JokeProbe";
import { getCurrentUser } from "@/lib/auth/dal";

import styles from "./page.module.css";

/**
 * Pantalla protegida.
 *
 * A propósito es una ruta aparte de "/" y no una sección que aparece y
 * desaparece en la misma página: así el bloqueo se puede comprobar navegando
 * directo a /contenido sin sesión, tal como pide el criterio de aceptación en
 * POC_ALCANCE.md.
 *
 * El bloqueo real ocurre aquí, en el servidor, con `getCurrentUser()` — no es
 * un enlace que se esconde en el cliente. Alguien podría escribir esta URL a
 * mano sin haber pasado por la portada, y de todos modos se topa con esta
 * verificación antes de que se renderice nada del contenido.
 */
export default async function ContenidoPage() {
  const user = await getCurrentUser();

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <SiteHeader badge="contenido protegido" />

        <main className={styles.main}>
          {user ? (
            <>
              <section className={styles.intro}>
                <p className={styles.eyebrow}>Verificado en el servidor</p>
                <h1 className={styles.headline}>Esto solo lo ves con sesión.</h1>
                <p className={styles.lead}>
                  El servidor comprobó tu identidad antes de mandar esta
                  página. Prueba la llamada real al backend abajo.
                </p>
                <UserBadge user={user} />
              </section>

              <JokeProbe />
            </>
          ) : (
            <section className={styles.locked}>
              <p className={styles.eyebrow}>Acceso restringido</p>
              <h1 className={styles.headline}>Necesitas iniciar sesión.</h1>
              <p className={styles.lead}>
                Esta pantalla y la ruta <code>/api/joke</code> que usa están
                protegidas en el servidor. Sin sesión válida, ninguna de las
                dos entrega el contenido — esto no es un candado de interfaz.
              </p>
              <SignInButton />
            </section>
          )}

          <Link href="/" className={styles.back}>
            ← Volver al inicio
          </Link>
        </main>
      </div>
    </div>
  );
}
