"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ApiErrorNotice } from "@/components/news/ApiErrorNotice";
import { STATUS_LABELS } from "@/components/news/ArticleMeta";
import { apiRequest, asApiError, type ApiError } from "@/components/news/ReaderSession/api";
import { Button } from "@/components/ui/Button";
import type { ArticleSummary, EditorialStatus, StatusUpdateInput, StatusUpdateResponse } from "@/types/news";
import styles from "./ArticleStatusEditor.module.css";

interface ArticleStatusEditorProps {
  article: ArticleSummary;
  statuses: EditorialStatus[];
  onUpdated: (data: StatusUpdateResponse["data"]) => void;
  onMissing: (id: string) => void;
}

export function ArticleStatusEditor({ article, statuses, onUpdated, onMissing }: ArticleStatusEditorProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<EditorialStatus | "">(article.status);
  const [reviewNote, setReviewNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<ApiError | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const statusField = useRef<HTMLSelectElement>(null);
  const noteField = useRef<HTMLTextAreaElement>(null);
  const errorSummary = useRef<HTMLDivElement>(null);
  const saveLock = useRef(false);
  const restoreFocus = useRef(false);

  useEffect(() => {
    if (open) statusField.current?.focus();
    else if (restoreFocus.current && !saving) {
      trigger.current?.focus();
      restoreFocus.current = false;
    }
  }, [open, saving]);

  useEffect(() => {
    if (error || Object.keys(fields).length) errorSummary.current?.focus();
  }, [error, fields]);

  function close() {
    if (saveLock.current) return;
    restoreFocus.current = true;
    setOpen(false);
    setError(null);
    setFields({});
  }

  function toggle() {
    if (open) { close(); return; }
    setStatus(statuses.includes(article.status) ? article.status : "");
    setReviewNote("");
    setError(null);
    setFields({});
    setOpen(true);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saveLock.current) return;
    const nextFields: Record<string, string> = {};
    if (!status || !statuses.includes(status)) nextFields.status = "Selecciona un estado del catálogo.";
    if (!reviewNote.trim()) nextFields.reviewNote = "Explica por qué corresponde este estado.";
    else if (reviewNote.trim().length > 1500) nextFields.reviewNote = "Escribe un motivo de hasta 1500 caracteres.";
    setFields(nextFields);
    setError(null);
    if (Object.keys(nextFields).length || !status) return;

    saveLock.current = true;
    setSaving(true);
    const input: StatusUpdateInput = { status, reviewNote: reviewNote.trim() };
    try {
      const response = await apiRequest<StatusUpdateResponse>(`/api/admin/articles/${encodeURIComponent(article.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }, 200);
      restoreFocus.current = true;
      setOpen(false);
      setReviewNote("");
      onUpdated(response.data);
    } catch (failure: unknown) {
      const apiError = asApiError(failure);
      setError(apiError);
      setFields(apiError.fields ?? {});
      if (apiError.status === 404) onMissing(article.id);
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  }

  return <div className={styles.editor}>
    <button ref={trigger} type="button" className={styles.trigger} onClick={toggle}
      disabled={saving || !statuses.length} aria-expanded={open} aria-controls={`${id}-form`}>
      Cambiar estado <span aria-hidden="true">{open ? "−" : "+"}</span>
    </button>
    {open && <form id={`${id}-form`} className={styles.form} onSubmit={save} noValidate
      aria-label={`Cambiar estado de ${article.title}`} aria-busy={saving}
      onKeyDown={(event) => { if (event.key === "Escape" && !saving) { event.preventDefault(); close(); } }}>
      <p className={styles.context}>Estado actual: <strong>{STATUS_LABELS[article.status]}</strong>. Revisa las fuentes antes de guardar.</p>
      {(error || Object.keys(fields).length > 0) && <div ref={errorSummary} tabIndex={-1} className={styles.errors}>
        {error ? <ApiErrorNotice error={error} /> : <p role="alert">Revisa los campos antes de guardar.</p>}
        {Object.keys(fields).length > 0 && <ul>{Object.entries(fields).map(([field, message]) => <li key={field}>
          {field === "status" || field === "reviewNote"
            ? <button type="button" onClick={() => (field === "status" ? statusField.current : noteField.current)?.focus()}>{message}</button>
            : message}
        </li>)}</ul>}
      </div>}
      <fieldset disabled={saving} className={styles.fields}>
        <div className={styles.field}>
          <label htmlFor={`${id}-status`}>Nuevo estado</label>
          <select ref={statusField} id={`${id}-status`} value={status} required
            onChange={(event) => setStatus(event.target.value as EditorialStatus)}
            aria-invalid={!!fields.status} aria-describedby={fields.status ? `${id}-status-error` : undefined}>
            <option value="" disabled>Selecciona un estado</option>
            {statuses.map((option) => <option value={option} key={option}>{STATUS_LABELS[option]}</option>)}
          </select>
          {fields.status && <span id={`${id}-status-error`} className={styles.fieldError}>{fields.status}</span>}
        </div>
        <div className={styles.field}>
          <label htmlFor={`${id}-note`}>Motivo del estado</label>
          <textarea ref={noteField} id={`${id}-note`} rows={3} value={reviewNote} maxLength={1500} required
            onChange={(event) => setReviewNote(event.target.value)} aria-invalid={!!fields.reviewNote}
            aria-describedby={`${id}-note-hint${fields.reviewNote ? ` ${id}-note-error` : ""}`} />
          <span id={`${id}-note-hint`} className={styles.hint}>Explica qué evidencia respalda tu decisión. Este motivo aparecerá en la noticia. Máximo 1500 caracteres.</span>
          {fields.reviewNote && <span id={`${id}-note-error`} className={styles.fieldError}>{fields.reviewNote}</span>}
        </div>
        <p className={styles.hint}>Confirmado requiere al menos dos fuentes registradas. Esta acción no permite añadir fuentes. La revisión del estado corresponde a una persona.</p>
        <div className={styles.actions}>
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button type="submit">{saving ? "Guardando estado…" : "Guardar estado"}</Button>
        </div>
      </fieldset>
      <span className={styles.srOnly} role="status">{saving ? "Guardando el estado de la noticia." : ""}</span>
    </form>}
  </div>;
}
