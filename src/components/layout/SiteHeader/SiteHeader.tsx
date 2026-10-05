import Link from "next/link";

import { isAdmin } from "@/lib/auth/dal";

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

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        {/* Tres líneas de texto que se acortan, y el punto de señal en vivo. */}
        <svg
          className={styles.mark}
          viewBox="0 0 24 24"
          width="22"
          height="22"
          aria-hidden="true"
        >
          <rect x="2" y="4" width="20" height="3" rx="1.5" fill="currentColor" />
          <rect
            x="2"
            y="10.5"
            width="14"
            height="3"
            rx="1.5"
            fill="currentColor"
          />
          <rect x="2" y="17" width="9" height="3" rx="1.5" fill="currentColor" />
          <circle cx="19.5" cy="18.5" r="2.5" className={styles.markDot} />
        </svg>
        <span className={styles.wordmark}>
          RESPIA <span className={styles.wordmarkLight}>News</span>
        </span>
      </div>

      <div className={styles.actions}>
        {badge ? <span className={styles.badge}>{badge}</span> : null}

        {admin ? (
          <Link
            href="/admin"
            className={styles.adminLink}
            aria-label="Panel de administración"
            title="Panel de administración"
          >
            {/* Escudo con palomita. */}
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
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
          </Link>
        ) : null}
      </div>
    </header>
  );
}
