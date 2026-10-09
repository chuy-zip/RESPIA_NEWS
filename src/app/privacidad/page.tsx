import type { Metadata } from "next";
import Link from "next/link";

import { EditorialShell } from "@/components/layout/EditorialShell";

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
const LAST_UPDATE = "9 de octubre de 2026";

export default function PrivacidadPage() {
  return (
    <EditorialShell>
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
            </ul>
          </section>

          <section className={styles.block}>
            <h2 className={styles.subhead}>Para qué se usan</h2>
            <p className={styles.text}>
              Solo para iniciar tu sesión, mantenerla y distinguir a los
              administradores de los demás usuarios. Tu nombre y tu foto se
              muestran en la app mientras estás conectado.
            </p>
          </section>

          <section className={styles.block}>
            <h2 className={styles.subhead}>Con quién se comparten</h2>
            <p className={styles.text}>
              No vendemos ni cedemos tus datos. Para funcionar dependemos de tres
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
            </ul>
            <p className={styles.text}>La interfaz de noticias usa ejemplos locales. No envía tus preguntas a un proveedor de IA ni consulta fuentes externas automáticamente. Si abres un enlace de fuente, visitas ese sitio y se aplican sus propias condiciones.</p>
          </section>

          <section className={styles.block}>
            <h2 className={styles.subhead}>En tu dispositivo</h2>
            <p className={styles.text}>La demo mantiene en memoria la región elegida, las noticias abiertas, la conversación y las publicaciones simuladas. No guarda esos datos en la base, localStorage ni sessionStorage. Se pierden al recargar o cerrar la pestaña. No introduzcas datos personales en los ejemplos.</p>
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
    </EditorialShell>
  );
}
