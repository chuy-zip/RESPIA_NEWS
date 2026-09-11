"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { StatusLine, type Step } from "@/components/ui/StatusLine";
import type { ApiErrorResponse, Joke, JokeResponse } from "@/types/joke";

import styles from "./JokeProbe.module.css";

type ProbeStatus = "idle" | "loading" | "ok" | "error";

interface ProbeResult {
  joke: Joke;
  provider: string;
  serverMs: number;
  clientMs: number;
}

/**
 * Prueba de extremo a extremo de la cadena de datos.
 *
 * Pide un chiste a /api/joke y muestra en qué salto va la petición. Sustituye
 * al futuro feed de noticias: sirve para confirmar que el Route Handler
 * funciona igual en local y en Vercel.
 */
export function JokeProbe() {
  const [status, setStatus] = useState<ProbeStatus>("idle");
  const [result, setResult] = useState<ProbeResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function runProbe() {
    setStatus("loading");
    setErrorMessage(null);

    const startedAt = performance.now();

    try {
      const response = await fetch("/api/joke", { cache: "no-store" });
      const clientMs = Math.round(performance.now() - startedAt);
      const payload = (await response.json()) as JokeResponse | ApiErrorResponse;

      if (!response.ok || "error" in payload) {
        const message =
          "error" in payload
            ? payload.error.message
            : `La ruta respondió ${response.status}.`;
        setErrorMessage(message);
        setStatus("error");
        return;
      }

      setResult({
        joke: payload.data,
        provider: payload.meta.source,
        serverMs: payload.meta.durationMs,
        clientMs,
      });
      setStatus("ok");
    } catch {
      setErrorMessage(
        "No se pudo llamar a /api/joke. Revisa tu conexión e intenta de nuevo.",
      );
      setStatus("error");
    }
  }

  const steps = buildSteps(status, result);
  const isLoading = status === "loading";

  return (
    <section className={styles.probe} aria-labelledby="probe-title">
      <div className={styles.head}>
        <h2 id="probe-title" className={styles.title}>
          Prueba de la cadena de datos
        </h2>
        <p className={styles.description}>
          Pide un chiste a un servicio público para comprobar que el backend en
          Vercel responde. En el proyecto real, este mismo camino traerá las
          noticias.
        </p>
      </div>

      <StatusLine steps={steps} />

      <Button onClick={runProbe} disabled={isLoading}>
        {probeButtonLabel(status)}
      </Button>

      {/* aria-live avisa a los lectores de pantalla cuando llega el resultado */}
      <div className={styles.output} aria-live="polite">
        {status === "ok" && result ? (
          <article className={styles.card}>
            <p className={styles.joke}>{result.joke.text}</p>
            <footer className={styles.cardMeta}>
              <span className={styles.tag}>{result.joke.category}</span>
              {result.joke.safe ? (
                <span className={styles.tag} data-tone="ok">
                  contenido apto
                </span>
              ) : null}
              <span className={styles.provider}>{result.provider}</span>
            </footer>
          </article>
        ) : null}

        {status === "error" && errorMessage ? (
          <p className={styles.error} role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function probeButtonLabel(status: ProbeStatus): string {
  if (status === "loading") return "Probando…";
  if (status === "idle") return "Probar la conexión";
  return "Probar otra vez";
}

/** Traduce el estado de la petición a los tres saltos que la componen. */
function buildSteps(status: ProbeStatus, result: ProbeResult | null): Step[] {
  const browser: Step = {
    id: "browser",
    label: "El navegador llama a /api/joke",
    state: "idle",
  };
  const handler: Step = {
    id: "handler",
    label: "El backend consulta al proveedor",
    state: "idle",
  };
  const screen: Step = {
    id: "screen",
    label: "La respuesta llega a la pantalla",
    state: "idle",
  };

  if (status === "loading") {
    browser.state = "running";
    browser.detail = "esperando";
  }

  if (status === "ok" && result) {
    browser.state = "ok";
    browser.detail = `${result.clientMs} ms`;
    handler.state = "ok";
    handler.detail = `${result.serverMs} ms`;
    screen.state = "ok";
    screen.detail = result.joke.language.toUpperCase();
  }

  if (status === "error") {
    browser.state = "ok";
    handler.state = "fail";
    handler.detail = "sin respuesta";
    screen.state = "fail";
  }

  return [browser, handler, screen];
}
