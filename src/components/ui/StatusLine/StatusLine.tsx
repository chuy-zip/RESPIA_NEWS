import styles from "./StatusLine.module.css";

export type StepState = "idle" | "running" | "ok" | "fail";

export interface Step {
  id: string;
  /** Qué hace este salto, en palabras del usuario. */
  label: string;
  /** Dato técnico corto: latencia, código de estado, nombre del proveedor. */
  detail?: string;
  state: StepState;
}

interface StatusLineProps {
  steps: Step[];
}

const STATE_LABEL: Record<StepState, string> = {
  idle: "sin ejecutar",
  running: "en curso",
  ok: "listo",
  fail: "falló",
};

/**
 * Traza el camino que recorre una petición, un salto por fila.
 *
 * Cuando algo se rompe en producción, esta lista dice en qué salto fue: si el
 * navegador nunca llamó, si el Route Handler no respondió o si el proveedor
 * externo se cayó.
 */
export function StatusLine({ steps }: StatusLineProps) {
  return (
    <ol className={styles.list}>
      {steps.map((step) => (
        <li key={step.id} className={styles.step} data-state={step.state}>
          <span className={styles.marker} aria-hidden="true" />
          <span className={styles.label}>{step.label}</span>
          <span className={styles.detail}>
            {step.detail ?? STATE_LABEL[step.state]}
          </span>
        </li>
      ))}
    </ol>
  );
}
