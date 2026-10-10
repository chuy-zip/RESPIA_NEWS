"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { useDemoSession } from "@/components/news/DemoSession";
import { DEMO_TOPICS } from "@/components/news/DemoSession/demo";
import { ArticleMeta } from "@/components/news/ArticleMeta";
import { StateNotice } from "@/components/news/StateNotice";
import { Button } from "@/components/ui/Button";
import styles from "./SearchPanel.module.css";

interface SearchPanelProps {
  query: string;
  topicSlug: string;
  sort: "recent" | "oldest";
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
}

export function SearchPanel({ query, topicSlug, sort }: SearchPanelProps) {
  const router = useRouter();
  const { articles, preview } = useDemoSession();
  const [draft, setDraft] = useState(query);
  const [pending, startTransition] = useTransition();
  const topic = DEMO_TOPICS.find((item) => item.slug === topicSlug);
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  const results = articles.filter((article) => {
    const text = normalize([article.title, article.summary, ...article.body.map((block) => block.text)].join(" "));
    return (!topic || article.topic === topic.label) && terms.every((term) => text.includes(term));
  }).sort((a, b) => (sort === "oldest" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)) || a.title.localeCompare(b.title, "es"));
  const showContent = preview === "ready" || preview === "limit";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    const nextQuery = draft.trim();
    const nextTopic = data.get("topic");
    if (nextQuery) params.set("q", nextQuery);
    if (typeof nextTopic === "string" && DEMO_TOPICS.some((item) => item.slug === nextTopic)) params.set("topic", nextTopic);
    params.set("sort", data.get("sort") === "oldest" ? "oldest" : "recent");
    startTransition(() => router.push(`/buscar?${params.toString()}`));
  }

  return <div className={styles.search}>
    <header className={styles.intro}>
      <div><p className={styles.kicker}>El archivo de demostración</p><h1>Encuentra el hilo.</h1></div>
      <p>Busca en los titulares, resúmenes y textos de esta edición ficticia. Prueba un tema o una idea.</p>
    </header>
    <form className={styles.form} onSubmit={submit} role="search" aria-label="Buscar noticias de demostración">
      <label className={styles.query}>Qué quieres leer
        <input type="search" name="q" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Por ejemplo: energía o comercio" maxLength={200} autoComplete="off" enterKeyHint="search" />
      </label>
      <div className={styles.controls}>
        <label>Tema<select name="topic" defaultValue={topicSlug}><option value="">Todos los temas</option>{DEMO_TOPICS.map((item) => <option key={item.slug} value={item.slug}>{item.label}</option>)}</select></label>
        <label>Orden<select name="sort" defaultValue={sort}><option value="recent">Más recientes primero</option><option value="oldest">Más antiguas primero</option></select></label>
        <Button type="submit" disabled={pending}>{pending ? "Buscando…" : "Buscar noticias"}</Button>
      </div>
      <p className={styles.note}>La búsqueda usa solo los ejemplos de esta demo. Las noticias reales aún no están conectadas.</p>
    </form>
    <section className={styles.results} aria-labelledby="results-title" aria-busy={pending}>
      <div className={styles.resultsHead}><h2 id="results-title">{query ? `Resultados para «${query}»` : "Explora la edición"}</h2><Link href="/edicion">Volver a la edición</Link></div>
      {pending ? <StateNotice state="loading" title="Actualizando la búsqueda" description="Conservamos tus opciones mientras se abre el resultado." /> : !showContent ? <StateNotice /> : <>
        <p className={styles.count} role="status">{results.length} {results.length === 1 ? "noticia de ejemplo" : "noticias de ejemplo"}{topic ? ` en ${topic.label}` : ""}</p>
        {results.length === 0 ? <StateNotice state="empty" title="No encontramos ese hilo" description="Prueba otra palabra o amplía el tema. La búsqueda cubre únicamente las noticias ficticias de esta edición." action={{ label: "Quitar filtros", onClick: () => router.push("/buscar") }} /> : <div className={styles.list}>
          {results.map((article) => <article key={article.id} className={styles.result}>
            <div className={styles.context}><span>{article.topic}</span><span>{article.regions.join(" · ")}</span></div>
            <div className={styles.copy}><h3><Link href={`/noticias/${article.id}`}>{article.title}</Link></h3><p>{article.summary}</p><ArticleMeta article={article} /><p className={styles.source}>Fuente: {article.sources[0]?.name}</p></div>
          </article>)}
        </div>}
      </>}
    </section>
  </div>;
}
