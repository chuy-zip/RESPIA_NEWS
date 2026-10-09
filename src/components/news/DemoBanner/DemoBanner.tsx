"use client";

import { useDemoSession } from "@/components/news/DemoSession";
import { PREVIEW_LABELS, type PreviewState } from "@/components/news/DemoSession/demo";
import styles from "./DemoBanner.module.css";

export function DemoBanner() {
  const { preview, setPreview } = useDemoSession();
  return (
    <aside className={styles.banner} aria-label="Aviso de demostración">
      <p><strong>Demostración</strong> · Contenido ficticio y cambios temporales. Se pierden al recargar.</p>
      <details className={styles.controls}>
        <summary>Probar estados</summary>
        <label className={styles.options}>Vista de feed, lector y chat
          <select value={preview} onChange={(event) => setPreview(event.target.value as PreviewState)}>
            {Object.entries(PREVIEW_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </label>
        <small>Simulación visual. No cambia la red ni el presupuesto.</small>
      </details>
    </aside>
  );
}
