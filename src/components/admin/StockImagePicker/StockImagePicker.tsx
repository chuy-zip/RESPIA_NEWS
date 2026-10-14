"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";

import { ApiErrorNotice } from "@/components/news/ApiErrorNotice";
import { apiRequest, asApiError, isAbortError, type ApiError } from "@/components/news/ReaderSession/api";
import { Button } from "@/components/ui/Button";
import type { ImagePreviewResponse, ImagePreviewResult, StockImageCandidate } from "@/types/news";

import styles from "./StockImagePicker.module.css";

export type StockImageSelection = { candidate: StockImageCandidate } & Pick<ImagePreviewResult, "source" | "license" | "licenseUrl">;

interface StockImagePickerProps {
  title: string;
  summary: string;
  disabled: boolean;
  selectedId: number | null;
  onSelect: (selection: StockImageSelection) => void;
}

const TYPE_LABELS: Record<StockImageCandidate["type"], string> = {
  photo: "Fotografía",
  illustration: "Ilustración",
  "vector/svg": "Vector",
};

export function StockImagePicker({ title, summary, disabled, selectedId, onSelect }: StockImagePickerProps) {
  const id = useId();
  const context = JSON.stringify([title, summary]);
  const request = useRef<AbortController | null>(null);
  const [query, setQuery] = useState("");
  const [validation, setValidation] = useState<string | null>(null);
  const [pending, setPending] = useState<{ context: string; controller: AbortController } | null>(null);
  const [failure, setFailure] = useState<{ context: string; error: ApiError } | null>(null);
  const [result, setResult] = useState<{ context: string; query: string; data: ImagePreviewResult } | null>(null);
  const [previews, setPreviews] = useState<Record<string, "loaded" | "failed">>({});

  useEffect(() => () => {
    request.current?.abort();
    request.current = null;
  }, [title, summary]);

  const loading = pending?.context === context && !pending.controller.signal.aborted;
  const error = failure?.context === context ? failure.error : null;
  const queryError = validation ?? error?.fields?.query;
  const currentResult = result?.context === context ? result : null;

  async function search() {
    if (disabled || request.current) return;
    const searchQuery = query.trim();
    if (searchQuery.length < 2 || searchQuery.length > 100) {
      setValidation("Escribe de 2 a 100 caracteres para buscar una imagen.");
      return;
    }

    const controller = new AbortController();
    request.current = controller;
    setPending({ context, controller });
    setValidation(null);
    setFailure(null);
    setResult(null);
    setPreviews({});
    try {
      const response = await apiRequest<ImagePreviewResponse>("/api/admin/images/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, article: { title, summary } }),
        signal: controller.signal,
      }, 200);
      if (!controller.signal.aborted) setResult({ context, query: searchQuery, data: response.data });
    } catch (caught) {
      if (!isAbortError(caught) && !controller.signal.aborted) setFailure({ context, error: asApiError(caught) });
    } finally {
      if (!controller.signal.aborted) {
        if (request.current === controller) request.current = null;
        setPending(null);
      }
    }
  }

  return (
    <div className={styles.picker}>
      <div className={styles.heading}>
        <h3>Buscar una imagen ilustrativa</h3>
        <p>Las imágenes vienen de Pixabay. Una sugerencia de IA puede ayudar a elegir. Tú decides qué imagen usar.</p>
        <p>El costo de esa sugerencia no está disponible aquí. Puedes continuar sin imagen.</p>
      </div>
      <div className={styles.search}>
        <label htmlFor={`${id}-query`}>Palabras clave
          <input id={`${id}-query`} type="search" value={query} maxLength={100} disabled={disabled || loading}
            placeholder="Por ejemplo: tecnología financiera" aria-invalid={!!queryError}
            aria-describedby={queryError ? `${id}-query-error` : undefined}
            onChange={(event) => { setQuery(event.target.value); setValidation(null); setFailure(null); }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                event.preventDefault();
                void search();
              }
            }} />
        </label>
        <Button type="button" variant="ghost" onClick={() => void search()} disabled={disabled || loading}>
          {loading ? "Buscando imágenes…" : "Buscar imágenes"}
        </Button>
      </div>
      {queryError && <p id={`${id}-query-error`} className={styles.error} role="alert">{queryError}</p>}
      {error && !(error.status === 422 && queryError) && <ApiErrorNotice error={error} />}
      {error?.status === 503 && <p className={styles.note}>No se pudo buscar imágenes. Puedes publicar sin imagen o usar una foto propia.</p>}
      {loading && <p role="status">Buscando candidatas en Pixabay. Espera antes de elegir una imagen.</p>}
      {currentResult && <>
        <p className={styles.license}>
          Imágenes de {currentResult.data.source}. <a href={currentResult.data.licenseUrl} target="_blank" rel="noopener noreferrer">{currentResult.data.license}</a>
        </p>
        <p role="status">{currentResult.data.candidates.length === 0
          ? `No hay imágenes para «${currentResult.query}». Prueba otras palabras o continúa sin imagen.`
          : `${currentResult.data.candidates.length} imágenes para «${currentResult.query}». Revisa su contenido y su licencia antes de elegir.`}</p>
        <div className={styles.candidates}>
          {currentResult.data.candidates.map((candidate) => {
            const preview = previews[candidate.previewUrl];
            const selected = selectedId === candidate.id;
            const suggested = currentResult.data.suggestedId === candidate.id;
            return <div key={candidate.id} className={styles.candidate} data-selected={selected || undefined}>
              <div className={styles.preview}>
                {preview === "failed" ? <p>No se pudo cargar esta imagen. Elige otra candidata.</p> : <>
                  <Image src={candidate.previewUrl} alt={candidate.tags.join(", ") || `Vista previa de ${candidate.author}`}
                    fill unoptimized sizes="(max-width: 40rem) 100vw, 22rem" className={styles.image}
                    onLoad={() => setPreviews((current) => ({ ...current, [candidate.previewUrl]: "loaded" }))}
                    onError={() => setPreviews((current) => ({ ...current, [candidate.previewUrl]: "failed" }))} />
                  {!preview && <span className={styles.previewLoading}>Cargando vista previa…</span>}
                </>}
                {suggested && <span className={styles.suggested}>Sugerida por IA</span>}
              </div>
              <div className={styles.details}>
                <p><strong>{candidate.author}</strong><span>{TYPE_LABELS[candidate.type]}</span></p>
                <p className={styles.tags}>{candidate.tags.join(", ")}</p>
                <a href={candidate.pageUrl} target="_blank" rel="noopener noreferrer">Ver en Pixabay</a>
                <Button type="button" variant={selected ? "primary" : "ghost"} aria-pressed={selected}
                  disabled={disabled || loading || preview !== "loaded"}
                  aria-label={`${selected ? "Imagen elegida" : "Elegir imagen"} de ${candidate.author}: ${candidate.tags.join(", ")}`}
                  onClick={() => onSelect({ candidate, source: currentResult.data.source, license: currentResult.data.license, licenseUrl: currentResult.data.licenseUrl })}>
                  {selected ? "Imagen elegida" : "Elegir imagen"}
                </Button>
              </div>
            </div>;
          })}
        </div>
      </>}
    </div>
  );
}
