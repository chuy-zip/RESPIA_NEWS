"use client";

import Image from "next/image";
import { useState } from "react";
import type { ImageProvenance } from "@/types/news";
import styles from "./ArticleVisual.module.css";

type ArticleVisualProps = ({ image: ImageProvenance | null; visual?: never } | { visual: "orbit"; image?: never }) & { mobileThumbnail?: boolean };

export function ArticleVisual({ image, visual, mobileThumbnail = false }: ArticleVisualProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (image) {
    const credits = <>{image.author} · {image.license}{image.sourceUrl && <> · <a href={image.sourceUrl} target="_blank" rel="noopener noreferrer">Origen de la imagen ↗</a></>}</>;
    return <figure className={`${styles.figure}${mobileThumbnail ? ` ${styles.thumbnail}` : ""}`}>
      <div className={styles.photo} data-unavailable={failedUrl === image.url || undefined}>
        {failedUrl === image.url ? <p className={styles.unavailable}>No se pudo cargar la imagen.</p> : <Image src={image.url} alt={image.alt} fill unoptimized sizes="(max-width: 40rem) 100vw, 60rem" className={styles.image} onError={() => setFailedUrl(image.url)} />}
        <span className={styles.origin}>{image.label}</span>
      </div>
      <figcaption>{mobileThumbnail ? <>
        <span className={styles.fullCredits}>{credits}</span>
        <details className={styles.mobileCredits}><summary>Créditos</summary><div>{credits}</div></details>
      </> : credits}</figcaption>
    </figure>;
  }
  if (!visual) return null;
  return (
    <figure className={styles.figure}>
      <svg viewBox="0 0 640 320" aria-hidden="true" className={styles.art}>
        <path d="M0 80H640M0 160H640M0 240H640M80 0V320M160 0V320M240 0V320M320 0V320M400 0V320M480 0V320M560 0V320" className={styles.grid} />
          <circle cx="320" cy="160" r="118" className={styles.ring} />
          <ellipse cx="320" cy="160" rx="210" ry="66" transform="rotate(-22 320 160)" className={styles.ring} />
          <ellipse cx="320" cy="160" rx="160" ry="55" transform="rotate(40 320 160)" className={styles.ring} />
          <circle cx="320" cy="160" r="51" className={styles.solid} />
          <circle cx="512" cy="101" r="12" className={styles.node} />
          <circle cx="248" cy="255" r="9" className={styles.node} />
          <text x="320" y="174" textAnchor="middle" className={styles.label}>M</text>
      </svg>
      <figcaption>Ilustración conceptual · elaborada con asistencia de IA</figcaption>
    </figure>
  );
}
