"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { DEMO_ARTICLES, type DemoArticle, type DemoMessage, type PreviewState, type Region } from "./demo";

interface DemoContextValue {
  articles: DemoArticle[];
  region: Region;
  setRegion: (region: Region) => void;
  preview: PreviewState;
  setPreview: (preview: PreviewState) => void;
  messages: DemoMessage[];
  addMessages: (messages: DemoMessage[]) => void;
  clearMessages: () => void;
  readIds: string[];
  markRead: (id: string) => void;
  publish: (article: DemoArticle) => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoSession({ children }: { children: ReactNode }) {
  const [articles, setArticles] = useState(DEMO_ARTICLES);
  const [region, setRegion] = useState<Region>("Guatemala");
  const [preview, setPreview] = useState<PreviewState>("ready");
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const markRead = useCallback((id: string) => {
    setReadIds((current) => current.includes(id) ? current : [...current, id]);
  }, []);

  return (
    <DemoContext.Provider value={{
      articles, region, setRegion, preview, setPreview, messages, readIds, markRead,
      addMessages: (next) => setMessages((current) => [...current, ...next]),
      clearMessages: () => setMessages([]),
      publish: (article) => setArticles((current) => [article, ...current]),
    }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoSession() {
  const session = useContext(DemoContext);
  if (!session) throw new Error("La demostración necesita su contexto de sesión.");
  return session;
}
