import styles from "./SiteHeader.module.css";

interface SiteHeaderProps {
  /** Texto corto a la derecha: en qué estado está lo que se está viendo. */
  badge?: string;
}

export function SiteHeader({ badge }: SiteHeaderProps) {
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

      {badge ? <span className={styles.badge}>{badge}</span> : null}
    </header>
  );
}
