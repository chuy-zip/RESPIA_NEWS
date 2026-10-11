"use client";

import Link from "next/link";
import { StateNotice } from "@/components/news/StateNotice";
import styles from "./SearchPanel.module.css";

export function SearchPanel() {
  return <div className={styles.search}>
    <header className={styles.intro}>
      <div><p className={styles.kicker}>Explorar las noticias</p><h1>Encuentra el hilo.</h1></div>
      <p>La edición reúne las noticias publicadas y permite recorrerlas por tema.</p>
    </header>
    <StateNotice state="empty" title="La búsqueda todavía no está disponible" description="Estamos preparando la búsqueda de noticias. Mientras tanto, puedes explorar la edición y sus temas.">
      <Link href="/edicion" className={styles.link}>Explorar la edición</Link>
    </StateNotice>
  </div>;
}
