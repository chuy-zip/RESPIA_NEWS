"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useReaderSession } from "@/components/news/ReaderSession";
import { apiRequest, asApiError, isAbortError, type ApiError } from "@/components/news/ReaderSession/api";
import { ApiErrorNotice } from "@/components/news/ApiErrorNotice";
import { ArticleCard } from "@/components/news/ArticleCard";
import { CategoryNavigation } from "@/components/news/CategoryNavigation";
import { StateNotice } from "@/components/news/StateNotice";
import { Button } from "@/components/ui/Button";
import type { CatalogItem } from "@/types/news";
import type { FeedItem, FeedResponse } from "@/types/feed";
import styles from "./NewsDesk.module.css";

export function NewsDesk({ topicSlug }: { topicSlug?: string }) {
  const { catalog, catalogLoading, catalogError, reloadCatalog, profile, profileLoading, profileError, reloadProfile, saveProfile, profileSaving, feedRevision, refreshFeed } = useReaderSession();
  const [pendingRegion, setPendingRegion] = useState<string | null>(null);
  const [regionError, setRegionError] = useState<ApiError | null>(null);
  const [regionSaved, setRegionSaved] = useState(false);
  const savingRegion = useRef(false);
  const topic = catalog?.topics.find((item) => item.slug === topicSlug);

  async function changeRegion(regionId: string) {
    if (!regionId || profileSaving || savingRegion.current) return;
    savingRegion.current = true;
    setPendingRegion(regionId);
    setRegionError(null);
    setRegionSaved(false);
    try {
      await saveProfile({ regionId });
      setPendingRegion(null);
      setRegionSaved(true);
    } catch (error) {
      setRegionError(asApiError(error));
    } finally {
      savingRegion.current = false;
    }
  }

  return (
    <div className={styles.desk}>
      <header className={styles.intro}>
        <div className={styles.heading}><p className={styles.eyebrow}>Tu edición</p><h1>{topic ? topic.label : "El mundo, en contexto."}</h1><p>{topic ? `Las noticias publicadas sobre ${topic.label.toLocaleLowerCase("es")}.` : "Una lectura que conecta lo cercano con lo que sucede más allá."}</p></div>
        <label className={styles.region}>Tu región simulada
          <select value={pendingRegion ?? profile?.regionId ?? ""} onChange={(event) => void changeRegion(event.target.value)} disabled={!catalog?.regions.length || !profile || profileLoading || profileSaving} aria-describedby="region-feedback" aria-invalid={Boolean(regionError?.fields?.regionId)}>
            <option value="" disabled>{profileLoading ? "Cargando región…" : "Elige una región"}</option>
            {catalog?.regions.map((region) => <option key={region.id} value={region.id}>{region.label}</option>)}
          </select>
          <span id="region-feedback" role="status">{profileSaving ? "Guardando región…" : regionError ? regionError.fields?.regionId ?? "Esta selección aún no se ha guardado." : regionSaved ? "Región guardada." : profile && !profile.regionId ? "Aún no has elegido una región." : "Sin ubicación del dispositivo."}</span>
        </label>
      </header>
      {profileError && <ApiErrorNotice error={profileError} retry={reloadProfile} />}
      {regionError && <ApiErrorNotice error={regionError} />}
      {regionError && pendingRegion && <Button variant="ghost" onClick={() => void changeRegion(pendingRegion)} disabled={profileSaving}>Guardar región seleccionada</Button>}
      {catalogError && <ApiErrorNotice error={catalogError} retry={reloadCatalog} />}
      {catalogLoading && !catalog ? <StateNotice state="loading" title="Cargando los temas de tu edición" /> : catalog && <>
        <CategoryNavigation activeSlug={topicSlug} topics={catalog.topics} />
        {catalog.topics.length === 0 && <StateNotice state="empty" title="Todavía no hay temas disponibles" description="La redacción aún no ha configurado el catálogo de temas." />}
        {topicSlug && !topic ? <StateNotice state="empty" title="Este tema no está disponible" description="Elige un tema del catálogo o vuelve a la edición completa."><Link href="/edicion">Ver toda la edición</Link></StateNotice> : <FeedEdition key={`${topicSlug ?? "all"}:${feedRevision}`} topic={topic} topics={catalog.topics} refresh={refreshFeed} />}
      </>}
      <aside className={styles.conversation} aria-labelledby="question-title"><div><h2 id="question-title">Detrás de cada titular hay una pregunta.</h2><p>Consulta sobre las noticias publicadas y revisa sus fuentes.</p></div><Link href="/chat">Abrir la conversación</Link></aside>
    </div>
  );
}

function FeedEdition({ topic, topics, refresh }: { topic?: CatalogItem; topics: CatalogItem[]; refresh: () => void }) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [importantItems, setImportantItems] = useState<FeedItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const paginationRequest = useRef<AbortController | null>(null);
  const paginationBusy = useRef(false);
  const topicSlug = topic?.slug;

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ limit: "20" });
    if (topicSlug) params.set("topic", topicSlug);
    apiRequest<FeedResponse>(`/api/feed?${params}`, { signal: controller.signal })
      .then(({ data, meta }) => {
        if (controller.signal.aborted) return;
        setItems(data.items);
        setImportantItems(data.importantItems);
        setNextCursor(meta.nextCursor);
      })
      .catch((failure: unknown) => { if (!controller.signal.aborted && !isAbortError(failure)) setError(asApiError(failure)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); paginationRequest.current?.abort(); };
  }, [topicSlug]);

  async function loadMore() {
    if (!nextCursor || paginationBusy.current || loading) return;
    paginationBusy.current = true;
    setLoadingMore(true);
    setError(null);
    const controller = new AbortController();
    paginationRequest.current = controller;
    const params = new URLSearchParams({ limit: "20", cursor: nextCursor });
    if (topicSlug) params.set("topic", topicSlug);
    try {
      const { data, meta } = await apiRequest<FeedResponse>(`/api/feed?${params}`, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setItems((current) => {
        const known = new Set(current.map((item) => item.article.id));
        return [...current, ...data.items.filter((item) => {
          if (known.has(item.article.id)) return false;
          known.add(item.article.id);
          return true;
        })];
      });
      setImportantItems(data.importantItems);
      setNextCursor(meta.nextCursor);
    } catch (failure) {
      if (!controller.signal.aborted && !isAbortError(failure)) setError(asApiError(failure));
    } finally {
      paginationBusy.current = false;
      if (!controller.signal.aborted) setLoadingMore(false);
    }
  }

  return <>
    <section aria-labelledby="edition-title" aria-busy={loading || loadingMore}>
      <div className={styles.sectionHead}><h2 id="edition-title">{topic ? `En ${topic.label.toLocaleLowerCase("es")}` : "En portada"}</h2><Button variant="ghost" onClick={refresh} disabled={loading || loadingMore}>Actualizar edición</Button></div>
      {loading ? <StateNotice state="loading" /> : <>
        {!error && <p className={styles.results} role="status">{items.length} noticias en esta edición</p>}
        {items.length > 0 && <div className={styles.feed}>{items.map((item, index) => <ArticleCard key={item.article.id} article={item.article} prominence={item.prominence} reason={item.reason} topics={topics} mobileRow={index >= 4} />)}</div>}
        {!items.length && !error && <StateNotice state="empty" title={topic ? "Este tema aún no tiene noticias" : "Todavía no hay noticias publicadas"} description={topic ? "Explora otro tema o consulta la información importante de esta edición." : "Las noticias aparecerán aquí cuando la redacción las publique."}>{topic && <Link href="/edicion">Ver toda la edición</Link>}</StateNotice>}
        {error && <ApiErrorNotice error={error} retry={items.length ? () => void loadMore() : refresh} />}
        {nextCursor && <div className={styles.pagination}><Button variant="ghost" onClick={() => void loadMore()} disabled={loadingMore}>{loadingMore ? "Cargando noticias…" : "Cargar más"}</Button></div>}
      </>}
    </section>
    {!loading && importantItems.length > 0 && <section className={styles.perspective} aria-labelledby="perspective-title">
      <div className={styles.sectionHead}><h2 id="perspective-title">La otra perspectiva</h2><span>Información importante</span></div>
      <p>Las noticias importantes siguen visibles aunque no coincidan con tus preferencias o con el tema elegido.</p>
      <div className={styles.feed}>{importantItems.map((item) => <ArticleCard key={item.article.id} article={item.article} prominence={item.prominence} reason={item.reason} topics={topics} mobileRow />)}</div>
    </section>}
  </>;
}
