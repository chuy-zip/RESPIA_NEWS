"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { useReaderSession } from "@/components/news/ReaderSession";
import { apiRequest, asApiError, isAbortError, type ApiError } from "@/components/news/ReaderSession/api";
import { ApiErrorNotice } from "@/components/news/ApiErrorNotice";
import { StateNotice } from "@/components/news/StateNotice";
import { ArticleMeta, CONTENT_TYPE_LABELS, STATUS_LABELS } from "@/components/news/ArticleMeta";
import { ArticleVisual } from "@/components/news/ArticleVisual";
import type { ArticleListResponse, ArticleSummary, ContentType, EditorialStatus, ImageProvenance, ImageUploadResponse, ImageUploadResult, PublicationResponse, PublishArticleInput, PublishImageInput, Source } from "@/types/news";
import styles from "./EditorialDesk.module.css";

interface Draft {
  title: string;
  summary: string;
  body: string;
  date: string;
  topic: string;
  regions: string[];
  contentType: ContentType | "";
  sources: Source[];
  status: EditorialStatus | "";
  issue: "none" | "insufficient" | "conflict";
  reviewNote: string;
  important: boolean;
  imageAlt: string;
  imageAuthor: string;
  imageLicense: string;
  imageOrigin: PublishImageInput["origin"] | "";
}

const INITIAL: Draft = {
  title: "", summary: "", body: "", date: "", topic: "", regions: [],
  contentType: "", sources: [{ name: "", url: "" }], status: "", issue: "none", reviewNote: "", important: false,
  imageAlt: "", imageAuthor: "", imageLicense: "", imageOrigin: "",
};

function localDate() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

const FIELD_TARGETS: Record<string, { id: string; step: number }> = {
  title: { id: "title", step: 0 }, summary: { id: "summary", step: 0 }, body: { id: "body", step: 0 },
  topicIds: { id: "topic", step: 0 }, regionIds: { id: "regions", step: 0 }, publishedAt: { id: "date", step: 0 },
  contentType: { id: "contentType", step: 0 }, important: { id: "important", step: 0 },
  sources: { id: "sources", step: 1 }, status: { id: "status", step: 1 }, reviewNote: { id: "reviewNote", step: 1 },
  image: { id: "file", step: 1 }, file: { id: "file", step: 1 }, "image.uploadId": { id: "file", step: 1 },
  "image.alt": { id: "image-alt", step: 1 }, "image.author": { id: "image-author", step: 1 },
  "image.license": { id: "image-license", step: 1 }, "image.origin": { id: "image-origin", step: 1 },
  reviewConfirmed: { id: "consent", step: 2 },
};

function fieldTarget(field: string, sourceCount: number) {
  const source = /^sources\.(\d+)\.(name|url)$/.exec(field);
  if (source && Number(source[1]) < sourceCount) return { id: `source-${source[2]}-${source[1]}`, step: 1 };
  return FIELD_TARGETS[field];
}

function listPath(filters: { q: string; topic: string; status: string }, cursor?: string) {
  const params = new URLSearchParams({ limit: "20" });
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.topic) params.set("topic", filters.topic);
  if (filters.status) params.set("status", filters.status);
  if (cursor) params.set("cursor", cursor);
  return `/api/admin/articles?${params.toString()}`;
}

export function EditorialDesk() {
  const { catalog, catalogLoading, catalogError, reloadCatalog, refreshFeed } = useReaderSession();
  const [draft, setDraft] = useState<Draft>(INITIAL);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publicationError, setPublicationError] = useState<ApiError | null>(null);
  const [upload, setUpload] = useState<ImageUploadResult | null>(null);
  const [imageSelected, setImageSelected] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<ApiError | null>(null);
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [filters, setFilters] = useState({ q: "", topic: "", status: "" });
  const [filterDraft, setFilterDraft] = useState(filters);
  const [listVersion, setListVersion] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<ApiError | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const publishLock = useRef(false);
  const uploadLock = useRef(false);
  const listRequest = useRef<AbortController | null>(null);
  const pendingField = useRef<string | null>(null);
  const errorSummary = useRef<HTMLDivElement>(null);
  const stepTitle = useRef<HTMLHeadingElement>(null);
  const focusStep = useRef(false);
  const catalogReady = !catalogLoading && !catalogError && !!catalog?.topics.length && !!catalog.regions.length && !!catalog.statuses.length && !!catalog.contentTypes.length;

  useEffect(() => {
    Promise.resolve().then(() => setDraft((current) => ({ ...current, date: current.date || localDate() })));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    listRequest.current = controller;
    apiRequest<ArticleListResponse>(listPath(filters), { signal: controller.signal }).then((response) => {
      if (controller.signal.aborted) return;
      setArticles(response.data.items);
      setNextCursor(response.meta.nextCursor);
    }).catch((error: unknown) => {
      if (!isAbortError(error) && !controller.signal.aborted) setListError(asApiError(error));
    }).finally(() => {
      if (controller.signal.aborted) return;
      if (listRequest.current === controller) listRequest.current = null;
      setListLoading(false);
    });
    return () => { controller.abort(); listRequest.current?.abort(); };
  }, [filters, listVersion]);

  useEffect(() => {
    if (Object.keys(errors).length > 0) errorSummary.current?.focus();
  }, [errors]);

  useEffect(() => {
    if (pendingField.current) {
      document.getElementById(pendingField.current)?.focus();
      pendingField.current = null;
      return;
    }
    if (!focusStep.current) return;
    stepTitle.current?.focus();
    focusStep.current = false;
  }, [step, publishedId]);

  function fieldError(field: string) {
    const target = fieldTarget(field, draft.sources.length);
    return errors[field] ? <span id={`${target?.id ?? field}-error`} className={styles.fieldError}>{errors[field]}</span> : null;
  }

  function focusError(field: string) {
    const target = fieldTarget(field, draft.sources.length);
    if (!target) return;
    if (target.step === step) document.getElementById(target.id)?.focus();
    else { pendingField.current = target.id; setStep(target.step); }
  }

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
      if (!draft.date || !/^\d{4}-\d{2}-\d{2}$/.test(draft.date) || Number.isNaN(Date.parse(`${draft.date}T12:00:00`))) next.publishedAt = "Selecciona una fecha válida.";
      if (!catalog?.topics.some((topic) => topic.id === draft.topic)) next.topicIds = "Selecciona un tema del catálogo.";
      if (!draft.regions.length || !draft.regions.every((id) => catalog?.regions.some((region) => region.id === id))) next.regionIds = "Selecciona al menos una región del catálogo.";
      if (!draft.contentType || !catalog?.contentTypes.includes(draft.contentType)) next.contentType = "Selecciona el tipo de contenido.";
    }
    if (stage === 1) {
      draft.sources.forEach((source, index) => {
        if (!source.name.trim()) next[`sources.${index}.name`] = "Escribe el nombre de cada fuente.";
        try {
          const url = new URL(source.url);
          if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error();
        } catch { next[`sources.${index}.url`] = "Escribe una URL HTTP o HTTPS sin credenciales."; }
      });
      if (!draft.reviewNote.trim()) next.reviewNote = "Explica tu revisión editorial.";
      if (!draft.status || !catalog?.statuses.includes(draft.status)) next.status = "Selecciona un estado editorial.";
      if (draft.status === "confirmed" && draft.issue !== "none") next.status = "Resuelve la insuficiencia o contradicción antes de marcar Confirmado.";
      if (draft.status === "confirmed" && draft.sources.length < 2) next.status = "Para marcar Confirmado se necesitan al menos dos fuentes.";
      if (imageSelected && !upload) next.file = "Sube la imagen correctamente o quítala para publicar sin imagen.";
      if (upload) {
        if (!draft.imageAlt.trim()) next["image.alt"] = "Describe la imagen para quien no puede verla.";
        if (!draft.imageAuthor.trim()) next["image.author"] = "Indica el autor de la imagen.";
        if (!draft.imageLicense.trim()) next["image.license"] = "Indica la licencia o el permiso de uso.";
        if (!draft.imageOrigin) next["image.origin"] = "Selecciona el origen de la imagen.";
      }
    }
    if (stage === 2 && !consent) next.reviewConfirmed = "Confirma la revisión antes de publicar.";
    return next;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (publishLock.current || uploadLock.current || publishedId || !catalogReady) return;
    const nextErrors = step === 2 ? { ...validate(0), ...validate(1), ...validate(2) } : validate(step);
    setErrors(nextErrors);
    setPublicationError(null);
    if (Object.keys(nextErrors).length) return;
    if (step < 2) { focusStep.current = true; setStep(step + 1); return; }
    if (!draft.status || !draft.contentType) return;
    const article: PublishArticleInput = {
      title: draft.title.trim(), summary: draft.summary.trim(),
      body: draft.body.split(/\n+/).map((line) => line.trim()).filter(Boolean).map((text) => ({ type: "paragraph", text })),
      publishedAt: new Date(`${draft.date}T12:00:00`).toISOString(),
      topicIds: [draft.topic], regionIds: [...draft.regions], contentType: draft.contentType,
      sources: draft.sources.map((source) => ({ name: source.name.trim(), url: source.url.trim() })),
      status: draft.status, reviewNote: draft.reviewNote.trim(), important: draft.important, reviewConfirmed: true,
      image: upload && draft.imageOrigin ? { uploadId: upload.uploadId, alt: draft.imageAlt.trim(), author: draft.imageAuthor.trim(), license: draft.imageLicense.trim(), origin: draft.imageOrigin } : null,
    };
    publishLock.current = true;
    setPublishing(true);
    try {
      const response = await apiRequest<PublicationResponse>("/api/admin/articles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(article) }, 201);
      focusStep.current = true;
      setPublishedId(response.data.id);
      refreshFeed();
      reloadList();
    } catch (error) {
      const failure = asApiError(error);
      setPublicationError(failure);
      setErrors(failure.fields ?? { request: failure.message });
    } finally {
      publishLock.current = false;
      setPublishing(false);
    }
  }

  async function uploadPhoto(file: File | undefined) {
    if (!file || uploadLock.current || publishLock.current) return;
    setConsent(false); setUpload(null); setImageSelected(true); setUploadError(null);
    setDraft((current) => ({ ...current, imageAlt: "", imageAuthor: "", imageLicense: "", imageOrigin: "" }));
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 4 * 1024 * 1024 || file.size === 0) {
      setErrors({ file: "Selecciona una imagen PNG, JPEG o WebP de hasta 4 MB." });
      return;
    }
    uploadLock.current = true;
    setUploading(true); setErrors({});
    const form = new FormData();
    form.append("file", file);
    try {
      const response = await apiRequest<ImageUploadResponse>("/api/admin/images", { method: "POST", body: form }, 201);
      setUpload(response.data);
    } catch (error) {
      const failure = asApiError(error);
      setUploadError(failure);
      setErrors(failure.fields ?? { file: failure.message });
    } finally {
      uploadLock.current = false;
      setUploading(false);
    }
  }

  function removeImage() {
    setUpload(null); setImageSelected(false); setUploadError(null); setConsent(false); setErrors({});
    const input = document.getElementById("file") as HTMLInputElement | null;
    if (input) input.value = "";
  }

  function reloadList() {
    listRequest.current?.abort();
    setListLoading(true); setListError(null); setNextCursor(null);
    setListVersion((current) => current + 1);
  }

  async function loadMore() {
    if (!nextCursor || listRequest.current) return;
    const controller = new AbortController();
    listRequest.current = controller;
    setListLoading(true); setListError(null);
    try {
      const response = await apiRequest<ArticleListResponse>(listPath(filters, nextCursor), { signal: controller.signal });
      if (controller.signal.aborted) return;
      setArticles((current) => [...current, ...response.data.items.filter((article) => !current.some((existing) => existing.id === article.id))]);
      setNextCursor(response.meta.nextCursor);
    } catch (error) {
      if (!isAbortError(error) && !controller.signal.aborted) setListError(asApiError(error));
    } finally {
      if (!controller.signal.aborted) {
        if (listRequest.current === controller) listRequest.current = null;
        setListLoading(false);
      }
    }
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    listRequest.current?.abort();
    setArticles([]); setNextCursor(null); setListError(null); setListLoading(true);
    setFilters({ ...filterDraft });
  }

  function reset() {
    focusStep.current = true;
    setDraft({ ...INITIAL, date: localDate() }); setStep(0); setErrors({}); setConsent(false); setPublishedId(null);
    setUpload(null); setImageSelected(false); setUploadError(null); setPublicationError(null);
  }

  const previewImage: ImageProvenance | null = upload && draft.imageOrigin ? {
    url: upload.url, alt: draft.imageAlt, author: draft.imageAuthor, license: draft.imageLicense, origin: draft.imageOrigin,
    sourceUrl: null, label: draft.imageOrigin === "event_photo" ? "Fotografía del hecho" : "Imagen ilustrativa",
  } : null;

  return (
    <div className={styles.desk}>
      <header className={styles.intro}><p className={styles.eyebrow}>Mesa de edición</p><h1>El criterio es humano.</h1><p>Prepara una noticia, revisa sus fuentes y decide cómo presentarla.</p></header>
      <div className={styles.budget}><strong>Consumo de IA: no disponible</strong><span>Presupuesto del proyecto: USD 20. La consulta del gasto está pendiente.</span><span>Este editor no realiza llamadas a modelos.</span></div>
      <section className={styles.editor} aria-labelledby="editor-title">
        {publishedId ? <div className={styles.success} role="status"><p className={styles.eyebrow}>Publicación guardada</p><h2 ref={stepTitle} tabIndex={-1} id="editor-title">Tu noticia ya está publicada.</h2><p>El servidor confirmó la publicación. Puedes abrirla desde la edición.</p><Link href={`/noticias/${publishedId}`}>Abrir noticia →</Link><Link href="/edicion">Ver la edición →</Link><Button onClick={reset}>Preparar otra noticia</Button></div> : <>
          <h2 ref={stepTitle} tabIndex={-1} id="editor-title">{["Preparar una noticia", "Revisar fuentes e imagen", "Revisar antes de publicar"][step]}</h2>
          <ol className={styles.steps} aria-label="Pasos de publicación">{["Contenido", "Fuentes y revisión", "Vista previa"].map((name, index) => <li key={name} aria-current={step === index ? "step" : undefined}><span>{index + 1}</span>{name}</li>)}</ol>
          <p className={styles.note}>La publicación estará disponible para las personas con sesión. Revisa la información y los permisos de la imagen antes de confirmar.</p>
          {catalogLoading && <StateNotice state="loading" title="Cargando opciones editoriales" description="Los temas, las regiones y los estados se consultan al servidor." />}
          {catalogError && <ApiErrorNotice error={catalogError} retry={reloadCatalog} />}
          {!catalogLoading && !catalogError && !catalogReady && <StateNotice state="empty" title="El catálogo está incompleto" description="Faltan opciones para publicar. Conserva tu borrador y vuelve a consultar el catálogo." action={{ label: "Consultar catálogo", onClick: reloadCatalog }} />}
          {publicationError && <ApiErrorNotice error={publicationError} />}
          {publicationError && (publicationError.status === 0 || publicationError.status >= 500) && <p className={styles.note}>No se pudo confirmar el resultado. Revisa las noticias publicadas antes de volver a enviar para evitar duplicados. Tu borrador sigue aquí.</p>}
          {Object.keys(errors).length > 0 && <div ref={errorSummary} tabIndex={-1} className={styles.errors} role="alert" aria-labelledby="form-errors"><strong id="form-errors">Revisa estos campos:</strong><ul>{Object.entries(errors).map(([field, message]) => <li key={field}>{fieldTarget(field, draft.sources.length) ? <button type="button" onClick={() => focusError(field)}>{message}</button> : message}</li>)}</ul></div>}
          <form onSubmit={submit} noValidate>
            <fieldset className={styles.formBody} disabled={publishing || uploading} aria-label="Preparación de la noticia">
            {step === 0 && <div className={styles.fields}>
              <label htmlFor="title">Título<input id="title" value={draft.title} onChange={(event) => update("title", event.target.value)} maxLength={180} required aria-invalid={!!errors.title} aria-describedby={errors.title ? "title-error" : undefined} placeholder="El titular que abre la conversación" />{fieldError("title")}</label>
              <label htmlFor="summary">Entradilla<textarea id="summary" rows={2} value={draft.summary} onChange={(event) => update("summary", event.target.value)} maxLength={500} required aria-invalid={!!errors.summary} aria-describedby={errors.summary ? "summary-error" : undefined} placeholder="La idea principal y por qué importa" />{fieldError("summary")}</label>
              <label htmlFor="body">Contenido<textarea id="body" rows={9} value={draft.body} onChange={(event) => update("body", event.target.value)} maxLength={15000} required aria-invalid={!!errors.body} aria-describedby={errors.body ? "body-error" : undefined} placeholder="Escribe los párrafos de la noticia. El contenido se presenta como texto, sin HTML." />{fieldError("body")}</label>
              <div className={styles.row}>
                <label htmlFor="topic">Tema<select id="topic" value={draft.topic} onChange={(event) => update("topic", event.target.value)} required disabled={!catalogReady} aria-invalid={!!errors.topicIds} aria-describedby={errors.topicIds ? "topic-error" : undefined}><option value="">Selecciona un tema</option>{catalog?.topics.map((topic) => <option value={topic.id} key={topic.id}>{topic.label}</option>)}</select>{fieldError("topicIds")}</label>
                <label htmlFor="date">Fecha de la noticia<input id="date" type="date" value={draft.date} onChange={(event) => update("date", event.target.value)} required aria-invalid={!!errors.publishedAt} aria-describedby={errors.publishedAt ? "date-error date-hint" : "date-hint"} /><span id="date-hint" className={styles.hint}>Se registra a las 12:00 de tu zona horaria.</span>{fieldError("publishedAt")}</label>
                <label htmlFor="contentType">Tipo de contenido<select id="contentType" value={draft.contentType} onChange={(event) => update("contentType", event.target.value as Draft["contentType"])} required disabled={!catalogReady} aria-invalid={!!errors.contentType} aria-describedby={errors.contentType ? "contentType-error" : undefined}><option value="">Selecciona un tipo</option>{catalog?.contentTypes.map((type) => <option value={type} key={type}>{CONTENT_TYPE_LABELS[type]}</option>)}</select>{fieldError("contentType")}</label>
              </div>
              <fieldset id="regions" tabIndex={-1} className={styles.checks} disabled={!catalogReady} aria-invalid={!!errors.regionIds} aria-describedby={errors.regionIds ? "regions-error" : undefined}><legend>Regiones de relevancia</legend>{catalog?.regions.map((region) => <label key={region.id}><input type="checkbox" checked={draft.regions.includes(region.id)} onChange={(event) => update("regions", event.target.checked ? [...draft.regions, region.id] : draft.regions.filter((item) => item !== region.id))} />{region.label}</label>)}{fieldError("regionIds")}</fieldset>
              <label className={styles.consent} htmlFor="important"><input id="important" type="checkbox" checked={draft.important} onChange={(event) => update("important", event.target.checked)} aria-invalid={!!errors.important} aria-describedby={errors.important ? "important-error" : undefined} />Noticia importante: debe seguir visible aunque no coincida con las preferencias del lector.</label>{fieldError("important")}
            </div>}
            {step === 1 && <div className={styles.fields}>
              <fieldset id="sources" tabIndex={-1} className={styles.sourceFields} aria-invalid={!!errors.sources} aria-describedby={errors.sources ? "sources-error" : undefined}><legend>Fuentes declaradas</legend>
                {draft.sources.map((source, index) => <div className={styles.sourceRow} key={index}>
                  <label htmlFor={`source-name-${index}`}>Nombre de la fuente {index + 1}<input id={`source-name-${index}`} value={source.name} maxLength={120} required aria-invalid={!!errors[`sources.${index}.name`]} aria-describedby={errors[`sources.${index}.name`] ? `source-name-${index}-error` : undefined} onChange={(event) => update("sources", draft.sources.map((item, position) => position === index ? { ...item, name: event.target.value } : item))} />{fieldError(`sources.${index}.name`)}</label>
                  <label htmlFor={`source-url-${index}`}>Enlace<input id={`source-url-${index}`} type="url" value={source.url} maxLength={1000} required placeholder="https://example.org/" aria-invalid={!!errors[`sources.${index}.url`]} aria-describedby={errors[`sources.${index}.url`] ? `source-url-${index}-error` : undefined} onChange={(event) => update("sources", draft.sources.map((item, position) => position === index ? { ...item, url: event.target.value } : item))} />{fieldError(`sources.${index}.url`)}</label>
                  {draft.sources.length > 1 && <Button variant="ghost" onClick={() => { update("sources", draft.sources.filter((_, position) => position !== index)); setErrors({}); }} aria-label={`Quitar fuente ${index + 1}`}>Quitar</Button>}
                </div>)}
                <Button variant="ghost" onClick={() => update("sources", [...draft.sources, { name: "", url: "" }])}>Añadir fuente</Button>
                {fieldError("sources")}
              </fieldset>
              <div className={styles.row}>
                <label htmlFor="issue">Resultado de tu revisión<select id="issue" value={draft.issue} onChange={(event) => update("issue", event.target.value as Draft["issue"])}><option value="none">Sin conflictos pendientes</option><option value="insufficient">Fuente insuficiente</option><option value="conflict">Fuentes contradictorias</option></select></label>
                <label htmlFor="status">Estado editorial<select id="status" value={draft.status} required aria-invalid={!!errors.status} aria-describedby={errors.status ? "status-error" : undefined} onChange={(event) => update("status", event.target.value as Draft["status"])}><option value="">Selecciona un estado</option>{catalog?.statuses.map((value) => <option value={value} key={value}>{STATUS_LABELS[value]}</option>)}</select>{fieldError("status")}</label>
              </div>
              <label htmlFor="reviewNote">Razón del estado asignado<textarea id="reviewNote" rows={3} value={draft.reviewNote} onChange={(event) => update("reviewNote", event.target.value)} maxLength={1500} required aria-invalid={!!errors.reviewNote} aria-describedby={errors.reviewNote ? "reviewNote-error" : undefined} placeholder="Describe lo que revisaste y qué sigue sin confirmarse." />{fieldError("reviewNote")}</label>
              <fieldset className={styles.visuals}><legend>Una imagen con su procedencia</legend><p className={styles.note}>La imagen es opcional. Sube un PNG, JPEG o WebP de hasta 4 MB. Las sugerencias de banco de imágenes todavía no están disponibles.</p>
                <label htmlFor="file">Subir imagen<input id="file" type="file" accept="image/png,image/jpeg,image/webp" aria-invalid={!!errors.file || !!errors["image.uploadId"] || !!errors.image} aria-describedby={errors.file || errors["image.uploadId"] || errors.image ? "file-error" : undefined} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; void uploadPhoto(file); }} /></label>
                {fieldError("file")}{fieldError("image.uploadId")}{fieldError("image")}
                {uploading && <p role="status">Subiendo imagen…</p>}
                {uploadError && <ApiErrorNotice error={uploadError} />}
                {imageSelected && <Button variant="ghost" onClick={removeImage}>Quitar imagen</Button>}
                {upload && <div className={styles.imageDetails}>
                  <p role="status">Imagen subida. Completa su procedencia antes de publicar.</p>
                  <label htmlFor="image-alt">Texto alternativo<input id="image-alt" value={draft.imageAlt} maxLength={300} required onChange={(event) => update("imageAlt", event.target.value)} aria-invalid={!!errors["image.alt"]} aria-describedby={errors["image.alt"] ? "image-alt-error" : undefined} />{fieldError("image.alt")}</label>
                  <div className={styles.row}>
                    <label htmlFor="image-author">Autor<input id="image-author" value={draft.imageAuthor} maxLength={120} required onChange={(event) => update("imageAuthor", event.target.value)} aria-invalid={!!errors["image.author"]} aria-describedby={errors["image.author"] ? "image-author-error" : undefined} />{fieldError("image.author")}</label>
                    <label htmlFor="image-license">Licencia o permiso<input id="image-license" value={draft.imageLicense} maxLength={200} required onChange={(event) => update("imageLicense", event.target.value)} aria-invalid={!!errors["image.license"]} aria-describedby={errors["image.license"] ? "image-license-error" : undefined} />{fieldError("image.license")}</label>
                    <label htmlFor="image-origin">Origen<select id="image-origin" value={draft.imageOrigin} required onChange={(event) => update("imageOrigin", event.target.value as Draft["imageOrigin"])} aria-invalid={!!errors["image.origin"]} aria-describedby={errors["image.origin"] ? "image-origin-error" : undefined}><option value="">Selecciona el origen</option><option value="event_photo">Fotografía del hecho</option><option value="illustrative">Imagen ilustrativa</option></select>{fieldError("image.origin")}</label>
                  </div>
                  {previewImage ? <ArticleVisual image={previewImage} /> : <Image className={styles.uploadPreview} src={upload.url} alt={draft.imageAlt || "Vista previa de la imagen subida"} width={1200} height={800} unoptimized />}
                </div>}
              </fieldset>
            </div>}
            {step === 2 && <div className={styles.preview}>
              <p className={styles.eyebrow}>{catalog?.topics.find((topic) => topic.id === draft.topic)?.label} / {catalog?.regions.filter((region) => draft.regions.includes(region.id)).map((region) => region.label).join(" · ")}</p><h2>{draft.title}</h2><p>{draft.summary}</p>
              <p>{draft.status && STATUS_LABELS[draft.status]} · {draft.contentType && CONTENT_TYPE_LABELS[draft.contentType]} · {draft.date}</p>
              {draft.important && <p>Noticia importante. Se mostrará fuera de las preferencias del lector.</p>}
              {previewImage ? <ArticleVisual image={previewImage} /> : <p className={styles.note}>Se publicará sin imagen.</p>}
              {draft.body.split(/\n+/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              <h3>Fuentes y revisión</h3><ul>{draft.sources.map((source, index) => <li key={index}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.name} ↗</a></li>)}</ul><p>{draft.reviewNote}</p>
              <label className={styles.consent} htmlFor="consent"><input id="consent" type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} required aria-invalid={!!errors.reviewConfirmed} aria-describedby={errors.reviewConfirmed ? "consent-error" : undefined} />Revisé las fuentes, el estado y los permisos y el origen de la imagen, si existe. Confirmo la publicación de esta noticia.</label>{fieldError("reviewConfirmed")}
            </div>}
            <div className={styles.formActions}>{step > 0 && <Button variant="ghost" onClick={() => { focusStep.current = true; setStep(step - 1); setErrors({}); setConsent(false); }}>← Volver</Button>}<Button type="submit" disabled={!catalogReady}>{publishing ? "Publicando…" : step === 2 ? "Publicar noticia" : "Continuar →"}</Button></div>
            </fieldset>
          </form>
        </>}
      </section>
      <section className={styles.list} aria-labelledby="published-title"><div className={styles.listHeading}><h2 id="published-title">Noticias publicadas</h2><span role="status">{articles.length} noticias cargadas</span><Button variant="ghost" onClick={reloadList} disabled={listLoading}>Actualizar listado</Button></div>
        <form className={styles.fields} onSubmit={applyFilters} aria-label="Filtrar publicaciones"><div className={styles.row}>
          <label htmlFor="filter-title">Buscar por título<input id="filter-title" type="search" value={filterDraft.q} onChange={(event) => setFilterDraft((current) => ({ ...current, q: event.target.value }))} /></label>
          <label htmlFor="filter-topic">Tema<select id="filter-topic" value={filterDraft.topic} onChange={(event) => setFilterDraft((current) => ({ ...current, topic: event.target.value }))}><option value="">Todos los temas</option>{catalog?.topics.map((topic) => <option value={topic.slug} key={topic.id}>{topic.label}</option>)}</select></label>
          <label htmlFor="filter-status">Estado<select id="filter-status" value={filterDraft.status} onChange={(event) => setFilterDraft((current) => ({ ...current, status: event.target.value }))}><option value="">Todos los estados</option>{catalog?.statuses.map((status) => <option value={status} key={status}>{STATUS_LABELS[status]}</option>)}</select></label>
        </div><div><Button type="submit" variant="ghost">Aplicar filtros</Button></div></form>
        {listError && <ApiErrorNotice error={listError} retry={reloadList} />}
        {!listLoading && !listError && articles.length === 0 && <StateNotice state="empty" title="No hay publicaciones para mostrar" description="Publica una noticia o cambia los filtros del listado." />}
        {articles.map((article) => <article key={article.id}><div><p className={styles.eyebrow}>{catalog?.topics.filter((topic) => article.topicIds.includes(topic.id)).map((topic) => topic.label).join(" · ")}</p><h3><Link href={`/noticias/${article.id}`}>{article.title}</Link></h3></div><ArticleMeta article={article} /></article>)}
        {listLoading && <p role="status">Cargando publicaciones…</p>}
        {nextCursor && <div className={styles.formActions}><Button variant="ghost" onClick={() => void loadMore()} disabled={listLoading}>Cargar más</Button></div>}
      </section>
    </div>
  );
}
