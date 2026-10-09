import Link from "next/link";

import { getCurrentUser, isAdmin } from "@/lib/auth/dal";

import styles from "./SiteHeader.module.css";

interface SiteHeaderProps {
  /** Texto corto a la derecha: en qué estado está lo que se está viendo. */
  badge?: string;
}

/**
 * Barra superior.
 *
 * Es un componente de servidor: pregunta `isAdmin()` y solo entonces escribe el
 * icono del portal administrativo en el HTML. Para cualquier otra persona ese
 * enlace no existe en la página (no está escondido con CSS ni con JavaScript).
 *
 * Esto es comodidad, no seguridad: quien escriba /admin a mano llega igual, y es
 * `app/admin/page.tsx` quien lo rechaza con su propia comprobación.
 */
export async function SiteHeader({ badge }: SiteHeaderProps) {
  const admin = await isAdmin();
  const user = await getCurrentUser();

  return (
    <header className={styles.header}>
      <div className={styles.utility}>
        <span>Tecnología · Economía · Finanzas</span>
        <span>{badge ?? "Una perspectiva más amplia"}</span>
      </div>
      <Link href="/" className={styles.brand} aria-label="The Meridian Times, inicio">
        <svg
          className={styles.mark}
          viewBox="0 0 24 24"
          width="22"
          height="22"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" />
          <path d="M8 17V7l4 6 4-6v10M17 1 7 23" fill="none" stroke="currentColor" />
        </svg>
        <span className={styles.wordmark}>
          The Meridian Times
          <span className={styles.tagline}>El mundo cambia. Entiende lo que significa para ti.</span>
        </span>
      </Link>

      <nav className={styles.actions} aria-label="Navegación principal">
        <Link href="/">La edición</Link>
        {user ? <Link href="/#conversacion">Preguntar</Link> : <Link href="/#acceso">Iniciar sesión</Link>}
        {user ? <Link href="/perfil">Mi región y perfil</Link> : <Link href="/#instalar">Instalar</Link>}

        {admin ? (
          <Link
            href="/admin"
            className={styles.adminLink}
            aria-label="Panel de administración"
            title="Panel de administración"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3 4.5 6v5.5c0 4.4 3.1 8.2 7.5 9.5 4.4-1.3 7.5-5.1 7.5-9.5V6L12 3Z" />
              <path d="m9 12 2.2 2.2L15.2 10" />
            </svg>
            Redacción
          </Link>
        ) : null}
      </nav>
    </header>
  );
}
