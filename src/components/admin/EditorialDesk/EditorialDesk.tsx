"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { useDemoSession } from "@/components/news/DemoSession";
import { ArticleMeta } from "@/components/news/ArticleMeta";
import { ArticleVisual } from "@/components/news/ArticleVisual";
import { REGIONS, TOPICS, STATUS_LABELS, type DemoArticle, type EditorialStatus, type Region, type Topic, type Visual } from "@/components/news/DemoSession/demo";
import styles from "./EditorialDesk.module.css";

interface Draft {
  title: string;
  summary: string;
  body: string;
  date: string;
  topic: Topic;
  regions: Region[];
  contentType: DemoArticle["contentType"];
  sources: DemoArticle["sources"];
  status: EditorialStatus;
  issue: "none" | "insufficient" | "conflict";
  reviewNote: string;
  visual: Visual | "";
}

const INITIAL: Draft = {
  title: "", summary: "", body: "", date: "2026-10-09", topic: "Tecnología", regions: ["Guatemala"],
  contentType: "Original", sources: [{ name: "", url: "" }], status: "developing", issue: "none", reviewNote: "", visual: "",
};
const visualNames: Record<Visual, string> = { network: "Tecnología y redes", trade: "Conexiones regionales", orbit: "Perspectiva global" };

export function EditorialDesk() {
  const { articles, publish } = useDemoSession();
  const [draft, setDraft] = useState<Draft>(INITIAL);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const editor = useRef<HTMLElement>(null);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setConsent(false);
  }

  function validate(stage: number) {
    const next: Record<string, string> = {};
    if (stage === 0) {
      if (!draft.title.trim()) next.title = "Escribe el título.";
      if (!draft.summary.trim()) next.summary = "Escribe la entradilla.";
      if (!draft.body.trim()) next.body = "Escribe el contenido.";
      if (!draft.date || !/^\d{4}-\d{2}-\d{2}$/.test(draft.date) || Number.isNaN(Date.parse(draft.date))) next.date = "Selecciona una fecha válida.";
      if (!draft.regions.length) next.regions = "Selecciona al menos una región.";
    }
    if (stage === 1) {
      draft.sources.forEach((source, index) => {
        if (!source.name.trim()) next[`source-name-${index}`] = "Escribe el nombre de cada fuente.";
        try {
          const url = new URL(source.url);
          if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error();
        } catch { next[`source-url-${index}`] = "Escribe una URL HTTP o HTTPS sin credenciales."; }
      });
      if (!draft.reviewNote.trim()) next.reviewNote = "Explica tu revisión editorial.";
      if (draft.status === "confirmed" && draft.issue !== "none") next.status = "Resuelve la insuficiencia o contradicción antes de marcar Confirmado.";
      if (!draft.visual) next.visual = "Selecciona una ilustración de demostración.";
    }
    if (stage === 2 && !consent) next.consent = "Confirma la revisión antes de publicar la demostración.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate(step)) { editor.current?.scrollIntoView({ block: "start" }); return; }
    if (step < 2) { setStep(step + 1); editor.current?.scrollIntoView({ block: "start" }); return; }
    if (!draft.visual || publishedId) return;
    const article: DemoArticle = {
      id: `demo-${crypto.randomUUID()}`, title: draft.title.trim(), summary: draft.summary.trim(),
      body: draft.body.split(/\n+/).map((line) => line.trim()).filter(Boolean), date: draft.date,
      topic: draft.topic, regions: [...draft.regions], contentType: draft.contentType,
      sources: draft.sources.map((source) => ({ name: source.name.trim(), url: source.url.trim() })),
      status: draft.status, visual: draft.visual, reviewNote: draft.reviewNote.trim(), important: false,
    };
    publish(article);
    setPublishedId(article.id);
    editor.current?.scrollIntoView({ block: "start" });
  }

  function reset() {
    setDraft(INITIAL); setStep(0); setErrors({}); setConsent(false); setPublishedId(null);
  }

  return (
    <div className={styles.desk}>
      <header className={styles.intro}><p className={styles.eyebrow}>Mesa de edición</p><h1>El criterio es humano.</h1><p>Prepara una noticia, revisa sus fuentes y decide cómo presentarla.</p></header>
      <div className={styles.budget}><strong>Consumo de IA: no disponible</strong><span>Presupuesto del proyecto: USD 20. El gasto y la reserva se consultarán al servidor.</span><span>Esta demo no realiza llamadas a modelos.</span></div>
      <section ref={editor} className={styles.editor} aria-labelledby="editor-title">
        {publishedId ? <div className={styles.success} role="status"><p className={styles.eyebrow}>Publicación simulada</p><h2 id="editor-title">Tu noticia ya está en esta edición.</h2><p>Solo existe en esta pestaña. No se guardó en el servidor y desaparecerá al recargar.</p><Link href={`/noticias/${publishedId}`}>Abrir noticia →</Link><Link href="/">Ver la edición →</Link><Button onClick={reset}>Preparar otra noticia</Button></div> : <>
          <h2 id="editor-title">Preparar una noticia</h2>
          <ol className={styles.steps} aria-label="Pasos de publicación">{["Contenido", "Fuentes y revisión", "Vista previa"].map((name, index) => <li key={name} aria-current={step === index ? "step" : undefined}><span>{index + 1}</span>{name}</li>)}</ol>
          <p className={styles.note}>Usa únicamente datos de ejemplo. No incluyas información personal ni secretos.</p>
          {Object.keys(errors).length > 0 && <div className={styles.errors} role="alert"><strong>Revisa estos campos:</strong><ul>{Object.entries(errors).map(([field, message]) => <li key={field}><a href={`#${field}`}>{message}</a></li>)}</ul></div>}
          <form onSubmit={submit} noValidate>
            {step === 0 && <div className={styles.fields}>
              <label htmlFor="title">Título<input id="title" value={draft.title} onChange={(event) => update("title", event.target.value)} maxLength={180} aria-invalid={!!errors.title} placeholder="El titular que abre la conversación" /></label>
              <label htmlFor="summary">Entradilla<textarea id="summary" rows={2} value={draft.summary} onChange={(event) => update("summary", event.target.value)} maxLength={500} aria-invalid={!!errors.summary} placeholder="La idea principal y por qué importa" /></label>
              <label htmlFor="body">Contenido<textarea id="body" rows={9} value={draft.body} onChange={(event) => update("body", event.target.value)} maxLength={15000} aria-invalid={!!errors.body} placeholder="Escribe los párrafos de la noticia. El contenido se presenta como texto, sin HTML." /></label>
              <div className={styles.row}>
                <label htmlFor="topic">Tema<select id="topic" value={draft.topic} onChange={(event) => update("topic", event.target.value as Topic)}>{TOPICS.map((topic) => <option key={topic}>{topic}</option>)}</select></label>
                <label htmlFor="date">Fecha de la noticia<input id="date" type="date" value={draft.date} onChange={(event) => update("date", event.target.value)} aria-invalid={!!errors.date} /></label>
                <label htmlFor="contentType">Tipo de contenido<select id="contentType" value={draft.contentType} onChange={(event) => update("contentType", event.target.value as Draft["contentType"])}>{["Original", "Resumen", "Aporte de IA"].map((type) => <option key={type}>{type}</option>)}</select></label>
              </div>
              <fieldset id="regions" className={styles.checks}><legend>Regiones de relevancia</legend>{REGIONS.map((region) => <label key={region}><input type="checkbox" checked={draft.regions.includes(region)} onChange={(event) => update("regions", event.target.checked ? [...draft.regions, region] : draft.regions.filter((item) => item !== region))} />{region}</label>)}</fieldset>
            </div>}
            {step === 1 && <div className={styles.fields}>
              <fieldset className={styles.sourceFields}><legend>Fuentes declaradas</legend>
                {draft.sources.map((source, index) => <div className={styles.sourceRow} key={index}>
                  <label htmlFor={`source-name-${index}`}>Nombre de la fuente {index + 1}<input id={`source-name-${index}`} value={source.name} maxLength={120} aria-invalid={!!errors[`source-name-${index}`]} onChange={(event) => update("sources", draft.sources.map((item, position) => position === index ? { ...item, name: event.target.value } : item))} /></label>
                  <label htmlFor={`source-url-${index}`}>Enlace<input id={`source-url-${index}`} type="url" value={source.url} maxLength={1000} placeholder="https://example.org/" aria-invalid={!!errors[`source-url-${index}`]} onChange={(event) => update("sources", draft.sources.map((item, position) => position === index ? { ...item, url: event.target.value } : item))} /></label>
                  {draft.sources.length > 1 && <Button variant="ghost" onClick={() => update("sources", draft.sources.filter((_, position) => position !== index))} aria-label={`Quitar fuente ${index + 1}`}>Quitar</Button>}
                </div>)}
                <Button variant="ghost" onClick={() => update("sources", [...draft.sources, { name: "", url: "" }])}>Añadir fuente</Button>
              </fieldset>
              <div className={styles.row}>
                <label htmlFor="issue">Resultado de tu revisión<select id="issue" value={draft.issue} onChange={(event) => update("issue", event.target.value as Draft["issue"])}><option value="none">Sin conflictos pendientes</option><option value="insufficient">Fuente insuficiente</option><option value="conflict">Fuentes contradictorias</option></select></label>
                <label htmlFor="status">Estado editorial<select id="status" value={draft.status} aria-invalid={!!errors.status} onChange={(event) => update("status", event.target.value as EditorialStatus)}>{Object.entries(STATUS_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
              </div>
              <label htmlFor="reviewNote">Razón del estado asignado<textarea id="reviewNote" rows={3} value={draft.reviewNote} onChange={(event) => update("reviewNote", event.target.value)} maxLength={1500} aria-invalid={!!errors.reviewNote} placeholder="Describe lo que revisaste y qué sigue sin confirmarse." /></label>
              <fieldset id="visual" className={styles.visuals}><legend>Una imagen con su procedencia</legend><p className={styles.note}>Selecciona una ilustración local para esta demo. Las candidatas de banco, su autor y licencia requieren conexión con Backend.</p>
                <div className={styles.visualGrid}>{(Object.keys(visualNames) as Visual[]).map((visual) => <div key={visual} data-selected={draft.visual === visual}><ArticleVisual visual={visual} /><label htmlFor={`visual-${visual}`}><input id={`visual-${visual}`} type="radio" name="article-visual" checked={draft.visual === visual} onChange={() => update("visual", visual)} />{visualNames[visual]}</label></div>)}</div>
                <p className={styles.note}>Origen: ilustración SVG local del proyecto, elaborada con asistencia de Codex. Uso: demostración. No se consultó un servicio de imágenes ni se compraron recursos.</p>
              </fieldset>
            </div>}
            {step === 2 && <div className={styles.preview}>
              <p className={styles.eyebrow}>{draft.topic} / {draft.regions.join(" · ")}</p><h2>{draft.title}</h2><p>{draft.summary}</p>
              <p>{STATUS_LABELS[draft.status]} · {draft.contentType} · {draft.date}</p>
              <ArticleVisual visual={draft.visual || "network"} />
              {draft.body.split(/\n+/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              <h3>Fuentes y revisión</h3><ul>{draft.sources.map((source, index) => <li key={index}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.name} ↗</a></li>)}</ul><p>{draft.reviewNote}</p>
              <label className={styles.consent} htmlFor="consent"><input id="consent" type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} aria-invalid={!!errors.consent} />Revisé las fuentes, el estado y el origen de la imagen. Entiendo que esta publicación es temporal y simulada.</label>
            </div>}
            <div className={styles.formActions}>{step > 0 && <Button variant="ghost" onClick={() => { setStep(step - 1); setErrors({}); setConsent(false); }}>← Volver</Button>}<Button type="submit">{step === 2 ? "Publicar demostración" : "Continuar →"}</Button></div>
          </form>
        </>}
      </section>
      <section className={styles.list} aria-labelledby="published-title"><div className={styles.listHeading}><h2 id="published-title">En esta edición</h2><span>{articles.length} noticias de ejemplo</span></div>
        {articles.map((article) => <article key={article.id}><div><p className={styles.eyebrow}>{article.topic}</p><h3><Link href={`/noticias/${article.id}`}>{article.title}</Link></h3></div><ArticleMeta article={article} /></article>)}
      </section>
    </div>
  );
}
