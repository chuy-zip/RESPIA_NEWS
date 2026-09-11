"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/Button";

import styles from "./InstallPrompt.module.css";

/**
 * Ofrece instalar la app, adaptándose a lo que permite cada navegador.
 *
 *   - Chromium (Android, escritorio): captura `beforeinstallprompt` y enseña un
 *     botón propio. Sin esto, Chrome decide por su cuenta si muestra su aviso,
 *     y casi nunca lo hace: el usuario tiene que buscar "Instalar app" en el
 *     menú de tres puntos.
 *   - iOS: Safari no implementa `beforeinstallprompt` y Apple no expone ninguna
 *     API equivalente, así que lo único posible es explicar el gesto manual.
 *   - Si la app ya está instalada, no se muestra nada.
 */

/** Evento no estándar, solo en navegadores Chromium. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** "pending" es lo que ve el servidor: no puede saber en qué aparato corre. */
type Environment = "pending" | "installed" | "ios" | "other";

function isStandalone(): boolean {
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  // Safari en iOS usa esta propiedad suya en vez del display-mode estándar.
  return (
    "standalone" in window.navigator &&
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

function isIos(): boolean {
  const ua = window.navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return true;
  // iPadOS 13+ se identifica como Mac; el multitáctil lo delata.
  return /macintosh/i.test(ua) && window.navigator.maxTouchPoints > 1;
}

/**
 * El entorno es estado externo al árbol de React, así que se lee con
 * useSyncExternalStore: durante la hidratación devuelve el valor del servidor y
 * React vuelve a renderizar con el real, sin discrepancias.
 */
function subscribeToEnvironment(onChange: () => void): () => void {
  const standalone = window.matchMedia("(display-mode: standalone)");
  standalone.addEventListener("change", onChange);
  window.addEventListener("appinstalled", onChange);

  return () => {
    standalone.removeEventListener("change", onChange);
    window.removeEventListener("appinstalled", onChange);
  };
}

function getEnvironment(): Environment {
  if (isStandalone()) return "installed";
  return isIos() ? "ios" : "other";
}

function getServerEnvironment(): Environment {
  return "pending";
}

export function InstallPrompt() {
  const environment = useSyncExternalStore(
    subscribeToEnvironment,
    getEnvironment,
    getServerEnvironment,
  );

  const [deferredEvent, setDeferredEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      // Sin preventDefault, el navegador decide solo cuándo enseñar su aviso.
      event.preventDefault();
      setDeferredEvent(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () =>
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  const install = useCallback(async () => {
    if (!deferredEvent) return;

    await deferredEvent.prompt();
    await deferredEvent.userChoice;

    // El evento se consume de un solo uso; el navegador lo vuelve a emitir más
    // adelante si el usuario dijo que no.
    setDeferredEvent(null);
  }, [deferredEvent]);

  if (environment === "pending" || environment === "installed") {
    return null;
  }

  return (
    <section className={styles.install} aria-labelledby="install-title">
      <h2 id="install-title" className={styles.title}>
        Instalar en el teléfono
      </h2>

      {deferredEvent ? (
        <div className={styles.action}>
          <p className={styles.steps}>
            Se instala como aplicación: icono propio, pantalla completa y
            funciona sin conexión.
          </p>
          <Button onClick={install}>Instalar app</Button>
        </div>
      ) : environment === "ios" ? (
        <p className={styles.steps}>
          Toca <b>Compartir</b> y elige <b>Añadir a pantalla de inicio</b>.
          Safari es el único navegador de iOS que lo permite.
        </p>
      ) : (
        <dl className={styles.list}>
          <div className={styles.row}>
            <dt className={styles.platform}>Android</dt>
            <dd className={styles.steps}>
              Abre el sitio en Chrome y toca <b>Instalar app</b> en el menú de
              tres puntos.
            </dd>
          </div>
          <div className={styles.row}>
            <dt className={styles.platform}>iOS</dt>
            <dd className={styles.steps}>
              Abre el sitio en Safari, toca <b>Compartir</b> y elige{" "}
              <b>Añadir a pantalla de inicio</b>.
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}
