"use client";

import type { ReactNode } from "react";
import { useDemoSession } from "@/components/news/DemoSession";
import type { PreviewState } from "@/components/news/DemoSession/demo";
import { Button } from "@/components/ui/Button";
import styles from "./StateNotice.module.css";

interface StateNoticeProps {
  state?: PreviewState;
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  children?: ReactNode;
  headingLevel?: 1 | 2;
}

export function StateNotice({ state, title: customTitle, description: customDescription, action, children, headingLevel = 2 }: StateNoticeProps = {}) {
  const { preview, setPreview } = useDemoSession();
  const current = state ?? preview;
  const content = {
    loading: ["Preparando tu edición", "Vista de carga simulada. Puedes volver al contenido sin esperar una petición."],
    empty: ["Una edición por escribir", "Todavía no hay noticias para mostrar en este escenario."],
    error: ["No pudimos cargar las noticias", "Tus opciones siguen disponibles. Vuelve a intentarlo."],
    offline: ["Sin conexión", "Para consultar noticias necesitas conexión. La app no guarda contenido privado para leer sin conexión."],
  };
  if (current === "ready" || current === "limit") return null;
  const [title, description] = content[current];
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <section className={styles.notice} aria-label={state ? "Estado del contenido" : "Estado simulado de contenido"}>
      <div role={current === "error" ? "alert" : "status"}><p className={styles.symbol} aria-hidden="true">{current === "loading" ? "◷" : "◇"}</p>
        <Heading>{customTitle ?? title}</Heading><p>{customDescription ?? description}</p></div>
      {current === "loading" && <div className={styles.skeleton} aria-hidden="true"><span /><span /><span /></div>}
      {action ? <Button variant="ghost" onClick={action.onClick}>{action.label}</Button> : !state && <Button variant="ghost" onClick={() => setPreview("ready")}>{current === "error" ? "Reintentar demo" : "Volver al contenido de demo"}</Button>}
      {children}
    </section>
  );
}
