import styles from "./JokeTeaser.module.css";

/**
 * Adelanto público, con un dato fijo, no en vivo.
 *
 * Simula el patrón "ver un adelanto sin sesión, contenido completo solo con
 * sesión" que va a tener el portal real (ver SUPABASE_AUTH.md, sección 2). No
 * llama a ningún backend: es texto quemado a propósito, para que quede claro
 * que esto NO es la prueba de la cadena de datos — esa vive en /contenido, y
 * ahí sí es en vivo y ahí sí exige sesión.
 */
export function JokeTeaser() {
  return (
    <article className={styles.card} aria-labelledby="teaser-title">
      <p className={styles.eyebrow}>Ejemplo · sin conexión al backend</p>
      <p id="teaser-title" className={styles.joke}>
        No te despedirán del trabajo, si nunca comentas tu código y además
        eres el único que sabe cómo funciona.
      </p>
      <footer className={styles.meta}>
        <span className={styles.tag}>Programming</span>
        <span className={styles.note}>
          Así se ve el contenido. Lo real está detrás del login.
        </span>
      </footer>
    </article>
  );
}
