"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import type { ApiErrorResponse } from "@/types/joke";
import type { ArticleImportItem, ArticleImportResponse } from "@/types/news";

import styles from "./ArticleImport.module.css";

type Outcome =
  | { kind: "done"; published: number; failed: number; results: ArticleImportItem[] }
  | { kind: "error"; message: string };

/**
 * Publica varias noticias desde un archivo JSON con POST /api/admin/articles/import.
 * El formato del archivo está en specs/backend/portal-admin.md.
 */
export function ArticleImport() {
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;

    setSending(true);
    setOutcome(null);
    try {
      let body: unknown;
      try {
        body = JSON.parse(await file.text());
      } catch {
        setOutcome({ kind: "error", message: "El archivo no es JSON válido." });
        return;
      }

      const response = await fetch("/api/admin/articles/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const { data } = (await response.json()) as ArticleImportResponse;
        setOutcome({ kind: "done", ...data });
      } else {
        const { error } = (await response.json()) as ApiErrorResponse;
        const detail = error.fields ? Object.values(error.fields).join(" ") : "";
        setOutcome({ kind: "error", message: `${error.message} ${detail}`.trim() });
      }
    } catch {
      setOutcome({ kind: "error", message: "No se pudo conectar con el servidor. Revisa el listado antes de reintentar." });
    } finally {
      setSending(false);
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="article-import-title">
      <h2 id="article-import-title" className={styles.title}>
        Importar noticias
      </h2>
      <p className={styles.hint}>
        Sube un archivo JSON con <code>{"{ \"items\": [...] }"}</code>, de 20 noticias como máximo. Cada noticia se
        publica aprobada. Revísalas antes de subir el archivo.
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          type="file"
          accept="application/json,.json"
          aria-label="Archivo JSON de noticias"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        <Button type="submit" disabled={!file || sending}>
          {sending ? "Publicando…" : "Publicar archivo"}
        </Button>
      </form>

      <div aria-live="polite">
        {outcome?.kind === "error" && <p className={styles.error}>{outcome.message}</p>}
        {outcome?.kind === "done" && (
          <>
            <p>
              Publicadas: {outcome.published}. Con errores: {outcome.failed}.
            </p>
            <ul className={styles.results}>
              {outcome.results.map((result) => (
                <li key={result.index} className={"id" in result ? styles.ok : styles.error}>
                  Noticia {result.index + 1}:{" "}
                  {"id" in result ? (
                    <Link href={`/noticias/${result.id}`}>publicada</Link>
                  ) : (
                    Object.entries(result.fields)
                      .map(([field, message]) => `${field}: ${message}`)
                      .join(" · ")
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
