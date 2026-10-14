"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useReaderSession } from "@/components/news/ReaderSession";
import { apiRequest, ApiError, asApiError, isAbortError } from "@/components/news/ReaderSession/api";
import { ApiErrorNotice } from "@/components/news/ApiErrorNotice";
import { CONTENT_TYPE_LABELS, STATUS_LABELS } from "@/components/news/ArticleMeta";
import { Button } from "@/components/ui/Button";
import type { ChatCitation, ChatRequest, ChatResponse } from "@/types/chat";
import type { ArticleDetailResponse } from "@/types/news";
import styles from "./ChatPanel.module.css";

const questions = ["Resume lo reciente", "¿Qué importa en mi región?", "Explícame una noticia de otro país", "Novedades de tecnología"];

function Citation({ citation }: { citation: ChatCitation }) {
  if (citation.kind === "article") return <>
    <Link href={`/noticias/${encodeURIComponent(citation.articleId)}`}>{citation.title} ↗</Link>
    <p className={styles.citationLabel}>{STATUS_LABELS[citation.status]} · {CONTENT_TYPE_LABELS[citation.contentType]}</p>
  </>;
  let href: string | undefined;
  try {
    const url = new URL(citation.url);
    if (url.protocol === "https:" || url.protocol === "http:") href = url.href;
  } catch { /* Una cita inválida no debe convertirse en un enlace ejecutable. */ }
  return <>
    {href ? <a href={href} target="_blank" rel="noopener noreferrer">{citation.name} ↗</a> : <span>{citation.name}</span>}
    <p className={styles.citationLabel}>{citation.label}</p>
  </>;
}

export function ChatPanel({ articleId, invalidArticle = false }: { articleId?: string; invalidArticle?: boolean }) {
  const router = useRouter();
  const { catalog, profile, messages, appendMessages, clearMessages, conversationRevision, refreshFeed } = useReaderSession();
  const [question, setQuestion] = useState("");
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [articleTitle, setArticleTitle] = useState<string | null>(null);
  const [articleLoading, setArticleLoading] = useState(Boolean(articleId));
  const [articleError, setArticleError] = useState<ApiError | null>(null);
  const [articleRevision, setArticleRevision] = useState(0);
  const [resettingContext, setResettingContext] = useState(false);
  const [enteringReply, setEnteringReply] = useState<string | null>(null);
  const conversation = useRef<HTMLElement>(null);
  const transcript = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const errorSummary = useRef<HTMLDivElement>(null);
  const request = useRef<AbortController | null>(null);
  const followReply = useRef(false);
  const region = catalog?.regions.find((item) => item.id === profile?.regionId)?.label;
  const pending = pendingQuestion !== null;
  const contextBlocked = invalidArticle || resettingContext || Boolean(error?.fields?.articleId) || Boolean(articleId && (articleLoading || articleError || !articleTitle));

  useEffect(() => {
    if (!articleId) return;
    const controller = new AbortController();
    apiRequest<ArticleDetailResponse>(`/api/articles/${encodeURIComponent(articleId)}`, { signal: controller.signal })
      .then(({ data }) => {
        if (!controller.signal.aborted) setArticleTitle(data.title);
      })
      .catch((failure: unknown) => {
        if (!controller.signal.aborted && !isAbortError(failure)) setArticleError(asApiError(failure));
      })
      .finally(() => { if (!controller.signal.aborted) setArticleLoading(false); });
    return () => controller.abort();
  }, [articleId, articleRevision]);

  useEffect(() => () => {
    request.current?.abort();
    request.current = null;
  }, [conversationRevision]);

  useEffect(() => {
    if (error) errorSummary.current?.focus();
  }, [error]);

  useEffect(() => {
    const panel = conversation.current;
    if (!panel) return;
    const viewport = window.visualViewport;
    const desktop = window.matchMedia("(min-width: 64rem) and (pointer: fine)");
    let lastHeight = 0;
    let frame = 0;
    // El formulario permanece en el flujo al reducirse el espacio por el teclado.
    const reposition = () => {
      const top = Math.max(0, panel.getBoundingClientRect().top - (viewport?.offsetTop ?? 0));
      const viewportHeight = Math.max(0, (viewport?.height ?? window.innerHeight) - 16);
      const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
      const minimumHeight = Math.min((desktop.matches ? 38 : 17) * rem, viewportHeight);
      const height = Math.round(Math.max(minimumHeight, viewportHeight - top));
      if (height !== lastHeight) {
        panel.style.setProperty("--chat-height", `${height}px`);
        lastHeight = height;
      }
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(reposition);
    };
    reposition();
    window.addEventListener("resize", schedule);
    desktop.addEventListener("change", schedule);
    viewport?.addEventListener("resize", schedule);
    viewport?.addEventListener("scroll", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      desktop.removeEventListener("change", schedule);
      viewport?.removeEventListener("resize", schedule);
      viewport?.removeEventListener("scroll", schedule);
    };
  }, []);

  useEffect(() => {
    if (!followReply.current || !transcript.current) return;
    transcript.current.scrollTop = transcript.current.scrollHeight;
    followReply.current = false;
  }, [messages.length, pendingQuestion]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || request.current || contextBlocked) return;
    if (trimmed.length > 500) {
      setError(new ApiError("La pregunta admite 500 caracteres.", 422, "VALIDATION_ERROR", { question: "Reduce la pregunta a 500 caracteres." }));
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setQuestion(text);
    setError(null);
    setPendingQuestion(trimmed);
    followReply.current = true;
    const body: ChatRequest = {
      question: trimmed,
      messages: messages.slice(-4).map(({ role, text: previous }) => ({ role, text: previous.slice(0, 2000) })),
      ...(articleId && { articleId }),
    };
    try {
      const { data } = await apiRequest<ChatResponse>("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: controller.signal,
      });
      if (controller.signal.aborted || request.current !== controller) return;
      let answer: string;
      switch (data.status) {
        case "answered":
        case "out_of_scope":
          answer = data.segments.map((segment) => segment.text).join("\n\n");
          break;
        case "no_coverage":
          answer = "No hay cobertura suficiente para responder esta consulta. Puedes seguir leyendo la edición.";
          break;
        case "unavailable":
          answer = "El chat no está disponible en este momento. Puedes seguir leyendo la edición y volver a intentarlo después.";
          break;
        default:
          throw new ApiError("No se recibió una respuesta válida. Tu pregunta sigue disponible para intentarlo después.", 502, "INVALID_RESPONSE");
      }
      if (!answer.trim()) throw new ApiError("No se recibió una respuesta. Tu pregunta sigue disponible para intentarlo después.", 502, "INVALID_RESPONSE");
      followReply.current = true;
      const replyId = crypto.randomUUID();
      setEnteringReply(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? null : replyId);
      appendMessages([
        { id: crypto.randomUUID(), role: "reader", text: trimmed },
        { id: replyId, role: "assistant", text: answer, segments: data.status === "answered" || data.status === "out_of_scope" ? data.segments : undefined },
      ]);
      if (data.status !== "unavailable") setQuestion("");
    } catch (failure) {
      if (!controller.signal.aborted && request.current === controller && !isAbortError(failure)) setError(asApiError(failure));
    } finally {
      // El servidor puede registrar la señal antes de responder con un error.
      if (articleId) refreshFeed();
      if (request.current === controller) {
        request.current = null;
        setPendingQuestion(null);
      }
    }
  }

  function reloadArticle() {
    setArticleError(null);
    setError(null);
    setArticleLoading(true);
    setArticleRevision((current) => current + 1);
  }

  function newConversation() {
    request.current?.abort();
    request.current = null;
    setPendingQuestion(null);
    setError(null);
    clearMessages();
    setQuestion("");
    setEnteringReply(null);
    if (articleId || invalidArticle) {
      setResettingContext(true);
      router.replace("/chat", { scroll: false });
    }
    requestAnimationFrame(() => input.current?.focus({ preventScroll: true }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(question);
  }

  return (
    <section id="conversacion" ref={conversation} className={styles.chat} aria-labelledby="chat-title">
      <div className={styles.heading}><h2 id="chat-title">Tu conversación</h2>
        {(messages.length > 0 || pending || articleId || invalidArticle) && <button type="button" onClick={newConversation} disabled={resettingContext}>Nueva conversación</button>}
      </div>
      <div ref={transcript} className={styles.transcript} role="region" tabIndex={0} aria-label="Historial de esta conversación">
        <div className={styles.context}><p className={styles.region}>{region ? `Edición de ${region}` : "Sin región elegida"}</p><p className={styles.hint}>El chat resume noticias, no las verifica. Consulta las fuentes y el estado de cada noticia.</p>
          {(articleId || invalidArticle) && <aside className={styles.articleContext} aria-label="Noticia de esta conversación" aria-busy={articleLoading}>
            {invalidArticle ? <p role="alert">El enlace de la noticia no es válido. Abre una noticia desde la edición o continúa sin seleccionarla.</p>
              : articleLoading ? <p role="status">Cargando la noticia de esta conversación…</p>
                : articleError?.status === 404 ? <p role="alert">Esta noticia ya no está disponible. Puedes preguntar sobre la edición.</p>
                  : articleError ? <ApiErrorNotice error={articleError} retry={reloadArticle} />
                    : <><p>Estás preguntando sobre esta noticia</p><Link className={styles.articleTitle} href={`/noticias/${encodeURIComponent(articleId!)}`}>{articleTitle}</Link></>}
            {error?.fields?.articleId && <p id="chat-article-error" className={styles.contextError} role="alert">{error.fields.articleId}</p>}
            <Link className={styles.contextAction} href="/chat" scroll={false}>Preguntar sobre la edición</Link>
          </aside>}
        </div>
        <div className={styles.messages} role="log" aria-label="Conversación temporal" aria-live="polite" aria-relevant="additions">
        {messages.map((message) => <article key={message.id} className={`${styles.message}${enteringReply === message.id ? ` ${styles.messageEnter}` : ""}`} data-role={message.role} onAnimationEnd={() => { if (enteringReply === message.id) setEnteringReply(null); }}>
          <p className={styles.author}>{message.role === "reader" ? "Tu pregunta" : "Meridian · conversación"}</p>
          {message.segments?.length ? message.segments.map((segment, index) => <div className={styles.segment} key={index}>
            <p>{segment.text}</p>
            {segment.citations.length > 0 && <ul className={styles.citations} aria-label="Fuentes de este texto">{segment.citations.map((citation, citationIndex) => <li key={`${citation.kind}-${citationIndex}`}><Citation citation={citation} /></li>)}</ul>}
          </div>) : <p>{message.text}</p>}
        </article>)}
        {pendingQuestion && <>
          <article className={`${styles.message} ${styles.messageEnter}`} data-role="reader"><p className={styles.author}>Tu pregunta</p><p>{pendingQuestion}</p></article>
          <article className={styles.message} data-role="assistant"><p className={styles.author}>Meridian · conversación</p><p className={styles.pendingStatus} role="status">Consultando las noticias…</p></article>
        </>}
        </div>
        {error && <div ref={errorSummary} tabIndex={-1}><ApiErrorNotice error={error} /></div>}
      </div>
      <form className={styles.dock} onSubmit={submit}>
        <div className={styles.suggestions} role="group" aria-label="Preguntas sugeridas">
          {questions.map((text) => <button key={text} type="button" disabled={pending || contextBlocked} onClick={() => { void send(text); }}>{text}</button>)}
        </div>
        <label htmlFor="news-question">{articleId ? "Pregunta sobre esta noticia" : "Pregunta sobre tu edición"}</label>
        <div className={styles.inputRow}>
          <input ref={input} id="news-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="¿Qué está cambiando?" maxLength={500} disabled={pending || resettingContext} required autoComplete="off" enterKeyHint="send" aria-invalid={Boolean(error?.fields?.question)} aria-describedby={`${error?.fields?.question ? "chat-question-error " : ""}${error?.fields?.articleId ? "chat-article-error " : ""}chat-note`} />
          <Button type="submit" disabled={pending || contextBlocked || !question.trim()}>{pending ? "Enviando…" : "Enviar"} <span aria-hidden="true">↗</span></Button>
        </div>
        {error?.fields?.question && <p id="chat-question-error" className={styles.fieldError}>{error.fields.question}</p>}
        <p id="chat-note">Conversación temporal · máximo 500 caracteres · no es asesoría de inversión</p>
      </form>
    </section>
  );
}
