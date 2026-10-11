"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useReaderSession } from "@/components/news/ReaderSession";
import { asApiError, type ApiError } from "@/components/news/ReaderSession/api";
import { ApiErrorNotice } from "@/components/news/ApiErrorNotice";
import { StateNotice } from "@/components/news/StateNotice";
import { Button } from "@/components/ui/Button";
import type { EditorialProfile, UpdateProfileInput } from "@/types/profile";
import styles from "./ProfilePanel.module.css";

export function ProfilePanel() {
  const { catalog, catalogLoading, catalogError, reloadCatalog, profile, profileLoading, profileError, reloadProfile, saveProfile, profileSaving } = useReaderSession();
  const [draft, setDraft] = useState<EditorialProfile | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [saved, setSaved] = useState(false);
  const saving = useRef(false);
  const summary = useRef<HTMLDivElement>(null);
  const selection = draft ?? profile;

  useEffect(() => {
    if (error) summary.current?.focus();
  }, [error]);

  function select(next: EditorialProfile) {
    setDraft(next);
    setSaved(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selection || !catalog || saving.current || profileSaving) return;
    saving.current = true;
    setError(null);
    setSaved(false);
    const body: UpdateProfileInput = { topicIds: selection.topicIds };
    if (selection.regionId) body.regionId = selection.regionId;
    try {
      await saveProfile(body);
      setDraft(null);
      setSaved(true);
    } catch (failure) {
      setError(asApiError(failure));
    } finally {
      saving.current = false;
    }
  }

  if (catalogError) return <ApiErrorNotice error={catalogError} retry={reloadCatalog} />;
  if (profileError && !profile) return <ApiErrorNotice error={profileError} retry={reloadProfile} />;
  if (!catalog || !selection) return <StateNotice state="loading" title="Cargando tus preferencias" description="Estamos consultando tu región y tus temas guardados." />;
  const disabled = catalogLoading || profileLoading || profileSaving;
  const activeRegion = catalog.regions.find((item) => item.id === profile?.regionId)?.label;

  return (
    <div className={styles.panel}>
      <section><p className={styles.eyebrow}>Una perspectiva situada</p><h1>Tu lugar en el mundo.</h1><p>Una ubicación elegida por ti. Ningún permiso de GPS.</p>
        <form onSubmit={submit} aria-busy={profileSaving}>
          {error && <div ref={summary} tabIndex={-1}><ApiErrorNotice error={error} /></div>}
          <fieldset className={styles.regions} disabled={disabled} aria-describedby={error?.fields?.regionId ? "region-error" : "region-note"} aria-invalid={Boolean(error?.fields?.regionId)}><legend>Elige tu región simulada</legend>
            {catalog.regions.map((region) => <label key={region.id} data-selected={selection.regionId === region.id}><input type="radio" name="profile-region" value={region.id} checked={selection.regionId === region.id} onChange={() => select({ ...selection, regionId: region.id })} /><span>{region.label}</span><span aria-hidden="true">↗</span></label>)}
          </fieldset>
          {catalog.regions.length === 0 && <p className={styles.note}>Todavía no hay regiones disponibles. Puedes seguir leyendo.</p>}
          {error?.fields?.regionId && <p id="region-error" className={styles.fieldError}>{error.fields.regionId}</p>}
          <p id="region-note" className={styles.note}>{activeRegion ? `Región guardada: ${activeRegion}.` : profile?.regionId ? "Tu región guardada ya no está disponible. Elige otra región." : "Aún no elegiste una región. Puedes hacerlo después."}</p>
          <fieldset className={styles.regions} disabled={disabled} aria-describedby={error?.fields?.topicIds ? "topics-error" : "topics-note"} aria-invalid={Boolean(error?.fields?.topicIds)}><legend>Tus temas de interés</legend>
            {catalog.topics.map((topic) => <label key={topic.id} data-selected={selection.topicIds.includes(topic.id)}><input type="checkbox" name="profile-topics" value={topic.id} checked={selection.topicIds.includes(topic.id)} onChange={(event) => select({ ...selection, topicIds: event.target.checked ? [...selection.topicIds, topic.id] : selection.topicIds.filter((id) => id !== topic.id) })} /><span>{topic.label}</span></label>)}
          </fieldset>
          {catalog.topics.length === 0 && <p className={styles.note}>Todavía no hay temas disponibles.</p>}
          {error?.fields?.topicIds && <p id="topics-error" className={styles.fieldError}>{error.fields.topicIds}</p>}
          <p id="topics-note" className={styles.note}>Puedes dejar todos los temas sin marcar. Tus lecturas también ayudan a ordenar la edición.</p>
          <div className={styles.links}><Button type="submit" disabled={disabled || !draft}>{profileSaving ? "Guardando…" : "Guardar preferencias"}</Button></div>
          <p role="status" className={styles.note}>{saved ? "Preferencias guardadas. Tu próxima edición usará estos cambios." : draft ? "Tienes cambios sin guardar." : "Las preferencias se conservan en tu cuenta."}</p>
        </form>
        <div className={styles.links}><Link className={styles.link} href="/edicion">Explorar esta edición</Link><Link className={styles.link} href="/chat">Abrir conversación</Link></div>
      </section>
      <section className={styles.readings}><h2>Una edición que aprende de tus lecturas</h2><p>La región, los temas que eliges y las noticias que abres ayudan a ordenar tu edición. Cada apertura cuenta una sola vez por noticia.</p>
        <p className={styles.note}>La actualidad y la importancia editorial también cuentan. Las noticias importantes siguen presentes aunque no coincidan con tus preferencias.</p>
        <Link className={styles.link} href="/privacidad">Cómo usamos tus preferencias</Link>
        <div className={styles.saved}><h2>Tu biblioteca</h2><p>Guardar noticias todavía no está disponible. No se conserva una lista entre sesiones.</p><Link className={styles.link} href="/guardados">Consultar el estado de Guardados</Link></div>
      </section>
    </div>
  );
}
