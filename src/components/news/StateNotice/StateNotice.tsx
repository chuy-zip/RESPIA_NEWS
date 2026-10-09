"use client";

import { useDemoSession } from "@/components/news/DemoSession";
import { Button } from "@/components/ui/Button";
import styles from "./StateNotice.module.css";

export function StateNotice() {
  const { preview, setPreview } = useDemoSession();
  const content = {
    loading: ["Preparando tu edición", "Vista de carga simulada. Puedes volver al contenido sin esperar una petición."],
    empty: ["Una edición por escribir", "Todavía no hay noticias para mostrar en este escenario."],
    error: ["No pudimos cargar las noticias", "Tus opciones siguen disponibles. Vuelve a intentarlo."],
    offline: ["Sin conexión", "Para consultar noticias necesitas conexión. La app no guarda contenido privado para leer sin conexión."],
  };
  if (preview === "ready" || preview === "limit") return null;
  const [title, description] = content[preview];
  return (
    <section className={styles.notice} aria-label="Estado simulado de contenido">
      <div role="status"><p className={styles.symbol} aria-hidden="true">{preview === "loading" ? "◷" : "◇"}</p>
        <h2>{title}</h2><p>{description}</p></div>
      {preview === "loading" && <div className={styles.skeleton} aria-hidden="true"><span /><span /><span /></div>}
      <Button variant="ghost" onClick={() => setPreview("ready")}>{preview === "error" ? "Reintentar demo" : "Volver al contenido de demo"}</Button>
    </section>
  );
}
