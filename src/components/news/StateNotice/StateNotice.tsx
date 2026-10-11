"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import styles from "./StateNotice.module.css";

interface StateNoticeProps {
  state: "loading" | "empty" | "error" | "offline";
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  children?: ReactNode;
  headingLevel?: 1 | 2;
}

export function StateNotice({ state: current, title: customTitle, description: customDescription, action, children, headingLevel = 2 }: StateNoticeProps) {
  const content = {
    loading: ["Preparando tu edición", "Estamos consultando la información publicada."],
    empty: ["Una edición por escribir", "Todavía no hay noticias para mostrar."],
    error: ["No pudimos cargar las noticias", "Tus opciones siguen disponibles. Vuelve a intentarlo."],
    offline: ["Sin conexión", "Para consultar noticias necesitas conexión. La app no guarda contenido privado para leer sin conexión."],
  };
  const [title, description] = content[current];
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <section className={styles.notice} aria-label="Estado del contenido">
      <div role={current === "error" ? "alert" : "status"}><p className={styles.symbol} aria-hidden="true">{current === "loading" ? "◷" : "◇"}</p>
        <Heading>{customTitle ?? title}</Heading><p>{customDescription ?? description}</p></div>
      {current === "loading" && <div className={styles.skeleton} aria-hidden="true"><span /><span /><span /></div>}
      {action && <Button variant="ghost" onClick={action.onClick}>{action.label}</Button>}
      {children}
    </section>
  );
}
