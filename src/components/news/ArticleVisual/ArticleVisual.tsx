import type { Visual } from "@/components/news/DemoSession/demo";
import styles from "./ArticleVisual.module.css";

export function ArticleVisual({ visual = "network" }: { visual?: Visual }) {
  return (
    <figure className={styles.figure}>
      <svg viewBox="0 0 640 320" aria-hidden="true" className={styles.art}>
        <path d="M0 80H640M0 160H640M0 240H640M80 0V320M160 0V320M240 0V320M320 0V320M400 0V320M480 0V320M560 0V320" className={styles.grid} />
        {visual === "network" && <>
          <path d="M320 40 530 145 320 250 110 145Z" className={styles.plane} />
          <path d="m110 145 210 105 210-105v48L320 298 110 193Z" className={styles.solid} />
          <path d="M320 40v210M110 145h420M215 92l210 105M425 92 215 197" className={styles.lines} />
          <rect x="267" y="118" width="106" height="56" rx="6" className={styles.chip} />
          <text x="320" y="153" textAnchor="middle" className={styles.label}>IA</text>
          <circle cx="110" cy="145" r="7" className={styles.node} /><circle cx="530" cy="145" r="7" className={styles.node} />
        </>}
        {visual === "trade" && <>
          <path d="M75 232 188 116 320 208 445 82 572 140" className={styles.route} />
          <path d="M75 260V232M188 260V116M320 260V208M445 260V82M572 260V140" className={styles.lines} />
          {[ [75,232], [188,116], [320,208], [445,82], [572,140] ].map(([x,y], index) => <circle key={index} cx={x} cy={y} r="12" className={styles.node} />)}
          <path d="M50 260H595" className={styles.lines} />
          <text x="52" y="48" className={styles.caption}>CONEXIONES / NO ES UNA SERIE DE DATOS</text>
        </>}
        {visual === "orbit" && <>
          <circle cx="320" cy="160" r="118" className={styles.ring} />
          <ellipse cx="320" cy="160" rx="210" ry="66" transform="rotate(-22 320 160)" className={styles.ring} />
          <ellipse cx="320" cy="160" rx="160" ry="55" transform="rotate(40 320 160)" className={styles.ring} />
          <circle cx="320" cy="160" r="51" className={styles.solid} />
          <circle cx="512" cy="101" r="12" className={styles.node} />
          <circle cx="248" cy="255" r="9" className={styles.node} />
          <text x="320" y="174" textAnchor="middle" className={styles.label}>M</text>
        </>}
      </svg>
      <figcaption>Ilustración de demo · asistida por IA</figcaption>
    </figure>
  );
}
