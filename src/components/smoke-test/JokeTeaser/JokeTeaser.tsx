import styles from "./JokeTeaser.module.css";

/**
 * Adelanto público, con un dato fijo, no en vivo.
 *
 * Simula el patrón "ver un adelanto sin sesión, contenido completo solo con
 * sesión" que va a tener el portal real (ver SUPABASE_AUTH.md, sección 2). No
 * llama a ningún backend: es texto quemado a propósito, para que quede claro
 * que esto NO es la prueba de la cadena de datos — esa vive en /contenido, y
 * ahí sí es en vivo y ahí sí exige sesión.
 *
 * El texto va en inglés a propósito, para que combine con lo que de verdad
 * devuelve /contenido: el proveedor solo tiene 6 chistes en español que pasan
 * el filtro seguro (ver el comentario en lib/services/jokes.ts), así que en
 * la práctica casi todo lo que trae la API real sale en inglés. Un ejemplo en
 * español al lado de resultados en inglés se sentía como un dato distinto en
 * vez de una muestra de lo mismo.
 *
 * El chiste no sale de la API: es uno propio, elegido por ser amable y sin la
 * traducción atropellada que suelen traer los del proveedor.
 */
export function JokeTeaser() {
  return (
    <article className={styles.card} aria-labelledby="teaser-title">
      <p className={styles.eyebrow}>Ejemplo · sin conexión al backend</p>
      <p id="teaser-title" className={styles.joke}>
        Why do programmers prefer dark mode? Because light attracts bugs.
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
