import type { Metadata } from "next";
import Link from "next/link";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Privacidad",
  description:
    "Qué datos trata The Meridian Times, la experiencia editorial de RESPIA News.",
};

/**
 * Política de privacidad (requisito RF-06 de docs/ALCANCE.md).
 *
 * Debe describir lo que la app **realmente** guarda. Cada vez que una función
 * guarde un dato nuevo (ubicación simulada, intereses, noticias leídas…), hay que
 * actualizar esta página y la fecha de abajo en el mismo cambio.
 */
const LAST_UPDATE = "10 de octubre de 2026";

export default function PrivacidadPage() {
  return (
        <div className={styles.main}>
          <section className={styles.intro}>
            <p className={styles.eyebrow}>Última actualización: {LAST_UPDATE}</p>
            <h1 className={styles.headline}>Privacidad</h1>
            <p className={styles.lead}>
              The Meridian Times es la experiencia editorial de RESPIA News, un proyecto académico del curso Responsible AI: un
              prototipo, no un servicio comercial. Esta página explica qué datos
              guarda, para qué y con quién se comparten.
            </p>
          </section>

          <section className={styles.block}>
            <h2 className={styles.subhead}>Qué datos guardamos</h2>
            <ul className={styles.list}>
              <li>
                <strong>Los datos básicos de tu cuenta de Google</strong> cuando
                inicias sesión: tu nombre, tu correo, tu foto de perfil y un
                identificador de tu cuenta. También se guarda la fecha de tu
                último inicio de sesión.
              </li>
              <li>
                <strong>Una cookie de sesión</strong> en tu dispositivo, que
                sirve únicamente para mantenerte conectado.
              </li>
              <li>
                <strong>Si eres administrador</strong>, tu identificador y tu
                correo quedan en una lista que indica quién puede entrar al
                portal administrativo.
              </li>
              <li>
                <strong>Tu región de demostración y tus temas de interés</strong>,
                si los eliges. Los puedes cambiar en tu perfil.
              </li>
              <li>
                <strong>Qué noticias abres y desde cuáles preguntas al chat.</strong>{" "}
                Se guarda una señal por noticia y por tipo, con su fecha. Se
                borra con tu cuenta.
              </li>
            </ul>
          </section>

          <section className={styles.block}>
            <h2 className={styles.subhead}>Qué no hacemos</h2>
            <ul className={styles.list}>
              <li>
                No pedimos tu contraseña: el inicio de sesión lo hace Google.
              </li>
              <li>
                No usamos el GPS ni la ubicación de tu dispositivo. La región
                de demostración es una opción que tú eliges.
              </li>
              <li>
                No usamos publicidad, analítica ni cookies de seguimiento.
              </li>
              <li>
                No guardamos el texto de tus preguntas al chat ni la
                conversación. El registro de costo de la IA no guarda tu cuenta
                ni tus preguntas.
              </li>
            </ul>
          </section>

          <section className={styles.block}>
            <h2 className={styles.subhead}>Para qué se usan</h2>
            <p className={styles.text}>
              Para iniciar tu sesión, mantenerla y distinguir a los
              administradores de los demás usuarios. Tu nombre y tu foto se
              muestran en la app mientras estás conectado.
            </p>
            <p className={styles.text}>
              Tu región, tus temas y las noticias que abres ordenan tu feed. El
              orden suma cuatro cosas: tu región (35 %), tus intereses (30 %), qué
              tan reciente es la noticia (20 %) y si la redacción la marcó como
              importante (15 %). Tus intereses pierden la mitad de su peso cada
              siete días. Cada tarjeta dice por qué quedó en su lugar.
            </p>
          </section>

          <section className={styles.block}>
            <h2 className={styles.subhead}>Con quién se comparten</h2>
            <p className={styles.text}>
              No vendemos ni cedemos tus datos. Para funcionar dependemos de cinco
              proveedores que los procesan por nosotros:
            </p>
            <ul className={styles.list}>
              <li>
                <strong>Google</strong>, que autentica tu cuenta.
              </li>
              <li>
                <strong>Supabase</strong>, donde se guardan los datos de tu
                cuenta y la sesión.
              </li>
              <li>
                <strong>Vercel</strong>, donde está alojada la aplicación.
              </li>
              <li>
                <strong>Anthropic</strong>, cuyo modelo de IA redacta las
                respuestas del chat.
              </li>
              <li>
                <strong>Tavily</strong>, un buscador de noticias que el chat usa
                en algunos casos.
              </li>
            </ul>
            <p className={styles.text}>
              Cuando el chat responde con el servicio de IA, Anthropic recibe tu
              pregunta, los últimos cuatro mensajes de la conversación, el
              nombre de tu región y el texto de las noticias que sirven de
              contexto. No recibe tu nombre, tu correo ni tu identificador.
            </p>
            <p className={styles.text}>
              Si la app no tiene noticias sobre tu pregunta, el servidor busca en
              los feeds públicos de una lista fija de medios. Esa descarga no
              incluye tu pregunta. Si los feeds no encuentran nada, el servidor
              envía tu pregunta a Tavily, limitada a esos mismos medios. Las
              respuestas con estas fuentes llevan la etiqueta «Fuente externa, no
              verificada por la redacción».
            </p>
            <p className={styles.text}>La interfaz de demostración usa ejemplos locales y no envía tus preguntas a ningún proveedor. Si abres un enlace de fuente, visitas ese sitio y se aplican sus propias condiciones.</p>
          </section>

          <section className={styles.block}>
            <h2 className={styles.subhead}>En tu dispositivo</h2>
            <p className={styles.text}>La demo mantiene en memoria la región elegida, las noticias abiertas, la conversación y las publicaciones simuladas. No guarda esos datos en la base, localStorage ni sessionStorage. Se pierden al recargar o cerrar la pestaña. No introduzcas datos personales en los ejemplos.</p>
            <p className={styles.text}>La dirección de la página de búsqueda incluye el término, el tema y el orden elegidos. Esos valores pueden quedar en el historial del navegador y se incluyen si compartes el enlace. No escribas datos personales en la búsqueda. Guardados todavía no almacena noticias.</p>
            <p className={styles.text}>
              Al instalar la app, tu navegador guarda archivos de la propia
              aplicación (imágenes, estilos y una pantalla de aviso sin
              conexión) para que cargue más rápido. No guarda las páginas que
              muestran tus datos.
            </p>
          </section>

          <section className={styles.block}>
            <h2 className={styles.subhead}>Cómo borrar tus datos</h2>
            <p className={styles.text}>
              Pídele al equipo del proyecto que elimine tu cuenta, por el mismo
              canal por el que recibiste el enlace de la app. También puedes
              retirar el acceso de RESPIA News desde la configuración de tu
              cuenta de Google.
            </p>
          </section>

          <section className={styles.block}>
            <h2 className={styles.subhead}>Cambios</h2>
            <p className={styles.text}>
              Si la aplicación empieza a guardar algo nuevo, esta página se
              actualiza antes y cambia la fecha de arriba.
            </p>
          </section>

          <Link href="/" className={styles.back}>
            ← Volver al inicio
          </Link>
        </div>
  );
}
