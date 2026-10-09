"use client";

import { useState } from "react";
import { useDemoSession } from "@/components/news/DemoSession";
import { DEMO_ORDER, REGIONS, TOPICS, type Region, type Topic, type Prominence } from "@/components/news/DemoSession/demo";
import { ArticleCard } from "@/components/news/ArticleCard";
import { ChatPanel } from "@/components/news/ChatPanel";
import { StateNotice } from "@/components/news/StateNotice";
import styles from "./NewsDesk.module.css";

export function NewsDesk() {
  const { articles, region, setRegion, preview } = useDemoSession();
  const [topic, setTopic] = useState<Topic | "Todo">("Todo");
  const order = DEMO_ORDER[region];
  const additions = articles.filter((article) => !order.includes(article.id) && !article.important);
  const edition = [...additions, ...order.flatMap((id) => articles.find((article) => article.id === id) ?? [])];
  const visible = edition.filter((article) => topic === "Todo" || article.topic === topic);
  const important = articles.filter((article) => article.important);
  const showContent = preview === "ready" || preview === "limit";
  function prominence(index: number): Prominence {
    return index === 0 ? "hero" : index === 1 ? "large" : index < 5 ? "standard" : "compact";
  }

  return (
    <div className={styles.desk}>
      <header className={styles.intro}>
        <div><p className={styles.eyebrow}>Tu mesa de noticias</p><h1>El mundo, en contexto.</h1><p>Explora tu edición o empieza con una pregunta.</p></div>
        <label className={styles.region}>Tu región simulada
          <select value={region} onChange={(event) => setRegion(event.target.value as Region)}>
            {REGIONS.map((name) => <option key={name}>{name}</option>)}
          </select>
        </label>
      </header>
      <ChatPanel />
      <section aria-labelledby="edition-title">
        <div className={styles.sectionHead}><h2 id="edition-title">La edición</h2><span>Escenarios ficticios · octubre de 2026</span></div>
        <div className={styles.filters} role="group" aria-label="Filtrar noticias por tema">
          {(["Todo", ...TOPICS] as const).map((value) => <button key={value} type="button" aria-pressed={topic === value} onClick={() => setTopic(value)}>{value}</button>)}
        </div>
        {showContent ? <>
          <p className={styles.results} role="status">{visible.length} noticias de ejemplo · escenario {region}</p>
          <div className={styles.feed}>
            {visible.map((article, index) => <ArticleCard key={article.id} article={article} prominence={prominence(index)} />)}
          </div>
          {visible.length === 0 && <p>No hay noticias de demostración en este tema.</p>}
        </> : <StateNotice />}
      </section>
      {showContent && <section className={styles.perspective} aria-labelledby="perspective-title">
        <div className={styles.sectionHead}><h2 id="perspective-title">La otra perspectiva</h2><span>Más allá de tus preferencias</span></div>
        <p>Una edición personal también necesita espacio para lo que no estabas buscando.</p>
        {important.map((article) => <ArticleCard key={article.id} article={article} prominence="compact" />)}
      </section>}
    </div>
  );
}
