"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useDemoSession } from "@/components/news/DemoSession";
import { ArticleMeta } from "@/components/news/ArticleMeta";
import { Button } from "@/components/ui/Button";
import styles from "./ChatPanel.module.css";

const questions = ["Resume lo reciente", "¿Qué importa en mi región?", "Explícame una noticia de otro país", "Novedades de tecnología"];

export function ChatPanel() {
  const { articles, region, messages, addMessages, clearMessages, preview } = useDemoSession();
  const [question, setQuestion] = useState("");
  const [showExamples, setShowExamples] = useState(messages.length === 0);
  const conversation = useRef<HTMLElement>(null);
  const transcript = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const followReply = useRef(false);
  const paused = preview === "loading" || preview === "error" || preview === "offline" || preview === "limit";

  useEffect(() => {
    const panel = conversation.current;
    if (!panel) return;
    const viewport = window.visualViewport;
    // El formulario permanece en el flujo al reducirse el espacio por el teclado.
    const reposition = () => {
      const top = Math.max(0, panel.getBoundingClientRect().top - (viewport?.offsetTop ?? 0));
      panel.style.setProperty("--chat-height", `${Math.max(272, (viewport?.height ?? window.innerHeight) - top - 16)}px`);
    };
    reposition();
    window.addEventListener("resize", reposition);
    viewport?.addEventListener("resize", reposition);
    viewport?.addEventListener("scroll", reposition);
    return () => {
      window.removeEventListener("resize", reposition);
      viewport?.removeEventListener("resize", reposition);
      viewport?.removeEventListener("scroll", reposition);
    };
  }, []);

  useEffect(() => {
    if (!followReply.current || !transcript.current) return;
    transcript.current.scrollTop = transcript.current.scrollHeight;
    followReply.current = false;
  }, [messages.length]);

  function send(text: string, example?: number) {
    if (!text.trim() || paused) return;
    let selected = articles.slice(0, 3);
    if (example === 1) selected = articles.filter((article) => article.regions.includes(region)).slice(0, 3);
    if (example === 2) selected = articles.filter((article) => !article.regions.includes(region)).slice(0, 1);
    if (example === 3) selected = articles.filter((article) => article.topic === "Tecnología").slice(0, 3);
    const available = example !== undefined && preview !== "empty" && selected.length > 0;
    const reply = available
      ? `Respuesta preparada de demostración: ${selected.map((article) => article.summary).join(" ")} Estas noticias son ficticias. Sus etiquetas no constituyen una verificación del chat.`
      : preview === "empty"
        ? "No hay noticias publicadas en este escenario de demostración. No puedo elaborar una respuesta con fuentes."
        : "Esta demostración no procesa consultas libres. Puedes explorar las cuatro preguntas de ejemplo. La respuesta real quedará disponible al conectar el servicio de noticias.";
    followReply.current = true;
    addMessages([
      { id: crypto.randomUUID(), role: "reader", text: text.trim(), articleIds: [] },
      { id: crypto.randomUUID(), role: "assistant", text: reply, articleIds: available ? selected.map((article) => article.id) : [] },
    ]);
    setQuestion("");
    if (example !== undefined) transcript.current?.focus({ preventScroll: true });
    setShowExamples(false);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const index = questions.indexOf(question.trim());
    send(question, index < 0 ? undefined : index);
  }

  return (
    <section id="conversacion" ref={conversation} className={styles.chat} aria-labelledby="chat-title">
      <div className={styles.heading}><h2 id="chat-title">Tu conversación</h2>
        {messages.length > 0 && <button type="button" onClick={() => { clearMessages(); setShowExamples(true); input.current?.focus({ preventScroll: true }); }}>Nueva conversación</button>}
      </div>
      <div ref={transcript} className={styles.transcript} role="region" tabIndex={0} aria-label="Historial de esta conversación">
        <div className={styles.context}><p className={styles.region}>Edición de {region}</p><p className={styles.hint}>El chat resume noticias, no las verifica. Las respuestas de esta demo están preparadas y sus noticias son ficticias.</p>
          <button className={styles.examplesToggle} type="button" aria-expanded={showExamples} aria-controls="chat-examples" onClick={() => setShowExamples((current) => !current)}>{showExamples ? "Ocultar preguntas de ejemplo" : "Ver preguntas de ejemplo"}</button>
          <div id="chat-examples" className={styles.suggestions} hidden={!showExamples} aria-label="Consultas de demostración">
            {questions.map((text, index) => <button key={text} type="button" disabled={paused} onClick={() => send(text, index)}>{text} <span aria-hidden="true">↗</span></button>)}
          </div>
        </div>
        <div className={styles.messages} role="log" aria-label="Conversación temporal" aria-live="polite" aria-relevant="additions">
        {messages.map((message) => <article key={message.id} className={styles.message} data-role={message.role}>
          <p className={styles.author}>{message.role === "reader" ? "Tu pregunta" : "Meridian · respuesta de ejemplo"}</p>
          <p>{message.text}</p>
          {message.articleIds.length > 0 && <ul className={styles.citations} aria-label="Fuentes de esta respuesta">
            {message.articleIds.map((id) => {
              const article = articles.find((item) => item.id === id);
              return article ? <li key={id}><Link href={`/noticias/${id}`}>{article.title} ↗</Link><ArticleMeta article={article} /></li> : null;
            })}
          </ul>}
        </article>)}
        </div>
      </div>
      <form className={styles.dock} onSubmit={submit}>
        <label htmlFor="news-question">Pregunta sobre tu edición</label>
        <div className={styles.inputRow}>
          <input ref={input} id="news-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="¿Qué está cambiando?" maxLength={1000} disabled={paused} required autoComplete="off" enterKeyHint="send" aria-describedby="chat-note" />
          <Button type="submit" disabled={paused || !question.trim()}>Enviar <span aria-hidden="true">↗</span></Button>
        </div>
        <p id="chat-note" role="status">{preview === "limit" ? "Límite de IA simulado. Puedes seguir leyendo. No se hará ningún reintento automático." : paused ? "Consulta pausada por el estado de demostración. Usa «Probar estados» para volver al contenido." : "Demo sin IA conectada · conversación temporal · no es asesoría de inversión"}</p>
      </form>
    </section>
  );
}
