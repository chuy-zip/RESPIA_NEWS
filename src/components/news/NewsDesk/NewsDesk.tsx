"use client";

import Link from "next/link";
import { useDemoSession } from "@/components/news/DemoSession";
import { DEMO_ORDER, DEMO_TOPICS, REGIONS, type Region, type Prominence } from "@/components/news/DemoSession/demo";
import { ArticleCard } from "@/components/news/ArticleCard";
import { CategoryNavigation } from "@/components/news/CategoryNavigation";
import { StateNotice } from "@/components/news/StateNotice";
import styles from "./NewsDesk.module.css";

export function NewsDesk({ topicSlug }: { topicSlug?: string }) {
  const { articles, region, setRegion, preview } = useDemoSession();
  const topic = DEMO_TOPICS.find((item) => item.slug === topicSlug);
  const order = DEMO_ORDER[region];
  const additions = articles.filter((article) => !order.includes(article.id) && !article.important);
  const edition = [...additions, ...order.flatMap((id) => articles.find((article) => article.id === id) ?? [])];
  const visible = edition.filter((article) => !topic || article.topic === topic.label);
  const important = articles.filter((article) => article.important);
  const showContent = preview === "ready" || preview === "limit";
  function prominence(index: number): Prominence {
    return index === 0 ? "hero" : index === 1 ? "large" : index < 5 ? "standard" : "compact";
  }

  return (
    <div className={styles.desk}>
      <header className={styles.intro}>
        <div className={styles.heading}><p className={styles.eyebrow}>La edición de demostración</p><h1>{topic ? topic.label : "El mundo, en contexto."}</h1><p>{topic?.description ?? "Tecnología, economía y finanzas. Una lectura que conecta lo cercano con lo que sucede más allá."}</p></div>
        <label className={styles.region}>Tu región simulada
          <select value={region} onChange={(event) => setRegion(event.target.value as Region)}>
            {REGIONS.map((name) => <option key={name}>{name}</option>)}
          </select>
        </label>
      </header>
      <CategoryNavigation activeSlug={topic?.slug} />
      <section aria-labelledby="edition-title">
        <div className={styles.sectionHead}><h2 id="edition-title">{topic ? `En ${topic.label.toLocaleLowerCase("es")}` : "En portada"}</h2><Link href={topic ? `/buscar?topic=${topic.slug}` : "/buscar"}>Buscar en la edición</Link></div>
        {showContent ? <>
          <p className={styles.results} role="status">{visible.length} noticias de ejemplo · escenario {region}</p>
          <div className={styles.feed}>
            {visible.map((article, index) => <ArticleCard key={article.id} article={article} prominence={prominence(index)} />)}
          </div>
          {visible.length === 0 && <StateNotice state="empty" title="Este tema aún no tiene noticias" description="Prueba otro tema del catálogo de demostración."><Link href="/edicion">Ver toda la edición</Link></StateNotice>}
        </> : <StateNotice />}
      </section>
      {showContent && important.length > 0 && <section className={styles.perspective} aria-labelledby="perspective-title">
        <div className={styles.sectionHead}><h2 id="perspective-title">La otra perspectiva</h2><span>Más allá de tus preferencias</span></div>
        <p>Una edición personal también necesita espacio para lo que no estabas buscando.</p>
        {important.map((article) => <ArticleCard key={article.id} article={article} prominence="compact" />)}
      </section>}
      <aside className={styles.conversation} aria-labelledby="question-title"><div><h2 id="question-title">Detrás de cada titular hay una pregunta.</h2><p>Explora las respuestas de ejemplo y vuelve a sus fuentes.</p></div><Link href="/chat">Abrir la conversación</Link></aside>
    </div>
  );
}
