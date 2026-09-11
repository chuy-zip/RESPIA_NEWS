import styles from "./InstallHint.module.css";

/**
 * Explica cómo instalar la app en cada sistema.
 *
 * Android ofrece el aviso de instalación solo; iOS nunca lo hace y exige que el
 * usuario use el menú Compartir de Safari, así que hay que decírselo.
 */
export function InstallHint() {
  return (
    <section className={styles.hint} aria-labelledby="install-title">
      <h2 id="install-title" className={styles.title}>
        Instalar en el teléfono
      </h2>

      <dl className={styles.list}>
        <div className={styles.row}>
          <dt className={styles.platform}>Android</dt>
          <dd className={styles.steps}>
            Abre el sitio en Chrome y toca <b>Instalar app</b> en el aviso o en
            el menú de tres puntos.
          </dd>
        </div>

        <div className={styles.row}>
          <dt className={styles.platform}>iOS</dt>
          <dd className={styles.steps}>
            Abre el sitio en Safari, toca <b>Compartir</b> y elige{" "}
            <b>Añadir a pantalla de inicio</b>. Safari es el único navegador de
            iOS que lo permite.
          </dd>
        </div>
      </dl>
    </section>
  );
}
