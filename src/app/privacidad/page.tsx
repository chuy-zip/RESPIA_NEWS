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
const LAST_UPDATE = "14 de octubre de 2026";

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
                <strong>Tu región simulada y los temas que eliges</strong>, asociados
                a tu cuenta. Puedes cambiar estas preferencias en tu perfil. Elegirlas es opcional.
              </li>
              <li>
                <strong>Las noticias que abres y desde cuáles preguntas al chat</strong>: guardamos el identificador de
                la noticia, tu identificador de cuenta, el tipo de interacción y la fecha.
                Se guarda una señal por noticia, tipo y cuenta. Recargar no suma otra apertura.
                Estas señales se borran con tu cuenta.
              </li>
              <li>
                <strong>Si publicas noticias</strong>, guardamos tu identificador como
                responsable de la publicación, el contenido, sus fuentes y la revisión editorial.
                Las imágenes subidas se guardan en un espacio público de Supabase, incluso antes de publicar la noticia.
                La noticia conserva el origen, el autor, la licencia y el texto alternativo de su imagen.
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
                simulada es una opción que tú eliges.
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
              Los datos de cuenta mantienen tu sesión y permiten comprobar quién puede publicar.
              Tu nombre y tu foto se muestran en la app mientras estás conectado.
              La región, los temas elegidos y las aperturas permiten personalizar el orden de las noticias.
              Las fuentes y la procedencia de las imágenes permiten conocer el origen de lo publicado.
            </p>
          </section>

          <section className={styles.block}>
            <h2 className={styles.subhead}>Cómo se ordena tu edición</h2>
            <p className={styles.text}>
              El puntaje combina región (35 %), intereses (30 %), actualidad (20 %) e importancia editorial (15 %).
              La región corresponde al país que elegiste, no a tu ubicación real.
              Los temas elegidos empiezan con un peso de 0.5. Tus lecturas pueden aumentarlo hasta 1.
            </p>
            <p className={styles.text}>
              El peso de actualidad pierde la mitad cada 24 horas. El peso de las señales de lectura pierde la mitad cada siete días.
              La posición determina la prominencia visual. Cada tarjeta explica su relevancia.
              Un bloque adicional conserva noticias importantes aunque no coincidan con tus preferencias.
              Este cálculo no llama a un modelo de IA.
            </p>
          </section>

          <section className={styles.block}>
            <h2 className={styles.subhead}>Con quién se comparten</h2>
            <p className={styles.text}>
              No vendemos tus datos. Para funcionar dependemos de seis
              proveedores que los procesan por nosotros:
            </p>
            <ul className={styles.list}>
              <li>
                <strong>Google</strong>, que autentica tu cuenta.
              </li>
              <li>
                <strong>Supabase</strong>, donde se guardan los datos de tu
                cuenta, sesión, preferencias, aperturas, noticias e imágenes.
              </li>
              <li>
                <strong>Vercel</strong>, donde está alojada la aplicación.
              </li>
              <li>
                <strong>Anthropic</strong>, cuyo modelo de IA redacta las
                respuestas del chat y sugiere imágenes para las noticias.
              </li>
              <li>
                <strong>Tavily</strong>, un buscador de noticias que el chat usa
                en algunos casos.
              </li>
              <li>
                <strong>Pixabay</strong>, donde buscamos imágenes ilustrativas para las noticias.
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
            <p className={styles.text}>Si abres un enlace de fuente, visitas ese sitio y se aplican sus propias condiciones.</p>
            <p className={styles.text}>
              Si buscas una imagen en el portal, Pixabay recibe las palabras de búsqueda.
              Tu navegador carga las vistas previas desde su servicio de imágenes.
              Para sugerir una candidata, Anthropic recibe el título y la entradilla del borrador,
              junto con los identificadores, tipos y etiquetas de las candidatas. No enviamos datos de tu cuenta.
              La elección es tuya. Al publicar, el servidor copia la imagen elegida al espacio público de Supabase.
            </p>
          </section>

          <section className={styles.block}>
            <h2 className={styles.subhead}>En tu dispositivo</h2>
            <p className={styles.text}>Los borradores sin enviar y la conversación viven en la memoria de la app. Se pierden al recargar o cerrar la pestaña. La conversación también se vacía al iniciar una nueva o cambiar de sesión. No se guardan en localStorage ni sessionStorage. Evita incluir datos personales en tus preguntas.</p>
            <p className={styles.text}>La región y los temas confirmados, las aperturas y las publicaciones permanecen en el servidor. Las fotografías se envían al seleccionar la acción de subida, antes de confirmar la publicación. Buscar y Guardados todavía no están conectados y no guardan una lista de noticias.</p>
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
