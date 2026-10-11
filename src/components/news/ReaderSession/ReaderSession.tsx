"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { CatalogData, CatalogResponse } from "@/types/news";
import type { EditorialProfile, ProfileResponse, UpdateProfileInput } from "@/types/profile";
import type { ChatSegment } from "@/types/chat";
import { ApiError, apiRequest, asApiError, isAbortError } from "./api";

export interface ReaderMessage {
  id: string;
  role: "reader" | "assistant";
  text: string;
  segments?: ChatSegment[];
}

interface ReaderContextValue {
  catalog: CatalogData | null;
  catalogLoading: boolean;
  catalogError: ApiError | null;
  reloadCatalog: () => void;
  profile: EditorialProfile | null;
  profileLoading: boolean;
  profileError: ApiError | null;
  reloadProfile: () => void;
  profileSaving: boolean;
  saveProfile: (input: UpdateProfileInput) => Promise<EditorialProfile>;
  feedRevision: number;
  refreshFeed: () => void;
  messages: ReaderMessage[];
  appendMessages: (messages: ReaderMessage[]) => void;
  clearMessages: () => void;
  conversationRevision: number;
}

const ReaderContext = createContext<ReaderContextValue | null>(null);

export function ReaderSession({ children, signedIn }: { children: ReactNode; signedIn: boolean }) {
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(signedIn);
  const [catalogError, setCatalogError] = useState<ApiError | null>(null);
  const [catalogRevision, setCatalogRevision] = useState(0);
  const [profile, setProfile] = useState<EditorialProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(signedIn);
  const [profileError, setProfileError] = useState<ApiError | null>(null);
  const [profileRevision, setProfileRevision] = useState(0);
  const [profileSaving, setProfileSaving] = useState(false);
  const [feedRevision, setFeedRevision] = useState(0);
  const [messages, setMessages] = useState<ReaderMessage[]>([]);
  const [conversationRevision, setConversationRevision] = useState(0);
  const saving = useRef(false);
  const profileGeneration = useRef(0);

  useEffect(() => {
    if (!signedIn) return;
    const controller = new AbortController();
    apiRequest<CatalogResponse>("/api/catalogs", { signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) { setCatalog(data); setCatalogError(null); } })
      .catch((error: unknown) => { if (!isAbortError(error) && !controller.signal.aborted) setCatalogError(asApiError(error)); })
      .finally(() => { if (!controller.signal.aborted) setCatalogLoading(false); });
    return () => controller.abort();
  }, [signedIn, catalogRevision]);

  useEffect(() => {
    if (!signedIn) return;
    const controller = new AbortController();
    const generation = ++profileGeneration.current;
    apiRequest<ProfileResponse>("/api/profile", { signal: controller.signal })
      .then(({ data }) => {
        if (!controller.signal.aborted && generation === profileGeneration.current) { setProfile(data); setProfileError(null); }
      })
      .catch((error: unknown) => {
        if (!isAbortError(error) && !controller.signal.aborted && generation === profileGeneration.current) setProfileError(asApiError(error));
      })
      .finally(() => { if (!controller.signal.aborted && generation === profileGeneration.current) setProfileLoading(false); });
    return () => controller.abort();
  }, [signedIn, profileRevision]);

  const reloadCatalog = useCallback(() => {
    setCatalogLoading(true); setCatalogError(null); setCatalogRevision((value) => value + 1);
  }, []);
  const reloadProfile = useCallback(() => {
    if (saving.current) return;
    setProfileLoading(true); setProfileError(null); setProfileRevision((value) => value + 1);
  }, []);
  const refreshFeed = useCallback(() => setFeedRevision((value) => value + 1), []);
  const saveProfile = useCallback(async (input: UpdateProfileInput) => {
    if (saving.current) throw new ApiError("Espera a que termine el guardado actual.", 409, "SAVE_IN_PROGRESS");
    saving.current = true;
    ++profileGeneration.current;
    setProfileSaving(true);
    try {
      const { data } = await apiRequest<ProfileResponse>("/api/profile", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
      });
      setProfile(data); setProfileError(null); refreshFeed();
      return data;
    } finally {
      saving.current = false; setProfileSaving(false); setProfileLoading(false);
    }
  }, [refreshFeed]);
  const appendMessages = useCallback((next: ReaderMessage[]) => setMessages((current) => [...current, ...next]), []);
  const clearMessages = useCallback(() => {
    setMessages([]); setConversationRevision((value) => value + 1);
  }, []);

  return <ReaderContext.Provider value={{ catalog, catalogLoading, catalogError, reloadCatalog, profile, profileLoading, profileError, reloadProfile, profileSaving, saveProfile, feedRevision, refreshFeed, messages, appendMessages, clearMessages, conversationRevision }}>{children}</ReaderContext.Provider>;
}

export function useReaderSession() {
  const session = useContext(ReaderContext);
  if (!session) throw new Error("La pantalla necesita el contexto editorial.");
  return session;
}
