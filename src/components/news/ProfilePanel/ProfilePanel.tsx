"use client";

import Link from "next/link";
import { useDemoSession } from "@/components/news/DemoSession";
import { REGIONS, type Region } from "@/components/news/DemoSession/demo";
import styles from "./ProfilePanel.module.css";

export function ProfilePanel() {
  const { region, setRegion, articles, readIds } = useDemoSession();
  return (
    <div className={styles.panel}>
      <section><p className={styles.eyebrow}>Una perspectiva situada</p><h1>Tu lugar en el mundo.</h1><p>Una ubicación elegida por ti. Ningún permiso de GPS.</p>
        <fieldset className={styles.regions}><legend>Elige tu región simulada</legend>
          {REGIONS.map((name) => <label key={name} data-selected={region === name}><input type="radio" name="profile-region" value={name} checked={region === name} onChange={(event) => setRegion(event.target.value as Region)} /><span>{name}</span><span aria-hidden="true">↗</span></label>)}
        </fieldset>
        <p role="status" className={styles.note}>Escenario activo: {region}. La selección vive en esta pestaña y se pierde al recargar.</p>
        <div className={styles.links}><Link className={styles.link} href="/edicion">Explorar esta edición</Link><Link className={styles.link} href="/chat">Abrir conversación</Link></div>
      </section>
      <section className={styles.readings}><h2>Lo que exploraste</h2><p>Lecturas de esta demo. No se enviaron al servidor ni se usaron para inferir tus intereses.</p>
        {readIds.length === 0 ? <p className={styles.note}>Aún no abriste noticias en esta pestaña.</p> : <ul>{readIds.map((id) => {
          const article = articles.find((item) => item.id === id);
          return article ? <li key={id}><Link href={`/noticias/${id}`}>{article.title}</Link></li> : null;
        })}</ul>}
        <p className={styles.note}>La personalización real requiere conectar el perfil y las señales de lectura. La edición actual usa ejemplos preparados.</p>
        <div className={styles.saved}><h2>Tu biblioteca</h2><p>Guardar noticias todavía no está disponible. No se conserva una lista entre sesiones.</p><Link className={styles.link} href="/guardados">Consultar el estado de Guardados</Link></div>
      </section>
    </div>
  );
}
