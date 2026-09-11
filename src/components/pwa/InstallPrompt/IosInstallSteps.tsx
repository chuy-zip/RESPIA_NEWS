import styles from "./IosInstallSteps.module.css";

/**
 * Los tres pasos para instalar en iOS, con los iconos que el usuario va a ver
 * en pantalla.
 *
 * Apple no expone ninguna API de instalación, así que estas instrucciones son
 * literalmente el mecanismo de instalación en iPhone: no hay atajo posible.
 * Por eso llevan los glifos reales y no solo texto — el usuario tiene que
 * reconocer el botón a simple vista.
 */

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3.5v11" />
      <path d="M8.5 7 12 3.5 15.5 7" />
      <path d="M5.5 12v7.5a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5V12" />
    </svg>
  );
}

function AddToHomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <path d="M12 8.5v7M8.5 12h7" />
    </svg>
  );
}

export function IosInstallSteps() {
  return (
    <ol className={styles.steps}>
      <li className={styles.step}>
        <span className={styles.icon}>
          <ShareIcon />
        </span>
        <span className={styles.text}>
          Toca el botón <b>Compartir</b> en la barra del navegador.
        </span>
      </li>

      <li className={styles.step}>
        <span className={styles.icon}>
          <AddToHomeIcon />
        </span>
        <span className={styles.text}>
          Desliza la lista y elige <b>Añadir a pantalla de inicio</b>.
        </span>
      </li>

      <li className={styles.step}>
        <span className={styles.iconNumber} aria-hidden="true">
          3
        </span>
        <span className={styles.text}>
          Confirma con <b>Añadir</b>. La app queda con su propio icono.
        </span>
      </li>
    </ol>
  );
}
