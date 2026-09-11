"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/Button";

import { IosInstallSteps } from "./IosInstallSteps";
import styles from "./InstallPrompt.module.css";

/**
 * Ofrece instalar la app, adaptándose a lo que permite cada navegador.
 *
 *   - Chromium (Android, escritorio): captura `beforeinstallprompt` y enseña un
 *     botón propio que abre el diálogo del sistema.
 *   - iOS: Apple no expone ninguna API de instalación, ni en Safari ni en los
 *     demás navegadores (todos usan WebKit por obligación). Lo único posible es
 *     enseñar el gesto manual, así que se enseña bien: con los iconos reales.
 *   - Navegador embebido (Instagram, Facebook, TikTok…): ahí la opción de
 *     instalar no existe, y lo útil es mandar al usuario a su navegador.
 *   - Si la app ya está instalada, no se muestra nada.
 */

/** Evento no estándar, solo en navegadores Chromium. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** "pending" es lo que ve el servidor: no puede saber en qué aparato corre. */
type Environment = "pending" | "installed" | "in-app" | "ios" | "other";

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

/** Webviews que abren enlaces dentro de otra app y esconden "instalar". */
function isInAppBrowser(): boolean {
  return /FBAN|FBAV|FB_IAB|Instagram|Line\/|Twitter|LinkedInApp|TikTok|Snapchat/i.test(
    window.navigator.userAgent,
  );
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
  if (isInAppBrowser()) return "in-app";
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
  const [showIosSteps, setShowIosSteps] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

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

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
    } catch {
      // Sin permiso de portapapeles el usuario todavía puede copiar la URL
      // a mano desde la barra de direcciones.
    }
  }, []);

  if (environment === "pending" || environment === "installed") {
    return null;
  }

  return (
    <section className={styles.install} aria-labelledby="install-title">
      <h2 id="install-title" className={styles.title}>
        Instalar en el teléfono
      </h2>

      {environment === "in-app" ? (
        <div className={styles.action}>
          <p className={styles.lead}>
            Estás viendo la página dentro de otra aplicación, y desde aquí no se
            puede instalar. Ábrela en tu navegador para poder hacerlo.
          </p>
          <Button variant="ghost" onClick={copyLink}>
            {linkCopied ? "Enlace copiado" : "Copiar enlace"}
          </Button>
        </div>
      ) : deferredEvent ? (
        <div className={styles.action}>
          <p className={styles.lead}>
            Se instala como aplicación: icono propio, pantalla completa y
            funciona sin conexión.
          </p>
          <Button onClick={install}>Instalar app</Button>
        </div>
      ) : environment === "ios" ? (
        <div className={styles.ios}>
          <p className={styles.lead}>
            Se instala como aplicación: icono propio, pantalla completa y
            funciona sin conexión. En iPhone son tres toques.
          </p>

          <Button
            variant="ghost"
            onClick={() => setShowIosSteps((visible) => !visible)}
            aria-expanded={showIosSteps}
            aria-controls="ios-steps"
          >
            {showIosSteps ? "Ocultar los pasos" : "Ver cómo instalarla"}
          </Button>

          {showIosSteps ? (
            <div id="ios-steps">
              <IosInstallSteps />
            </div>
          ) : null}
        </div>
      ) : (
        <dl className={styles.list}>
          <div className={styles.row}>
            <dt className={styles.platform}>Android</dt>
            <dd className={styles.steps}>
              Abre el sitio en Chrome y toca <b>Instalar app</b> en el menú de
              tres puntos. Si no aparece, puede que ya la tengas instalada.
            </dd>
          </div>
          <div className={styles.row}>
            <dt className={styles.platform}>iPhone</dt>
            <dd className={styles.steps}>
              Toca <b>Compartir</b> y elige <b>Añadir a pantalla de inicio</b>.
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}
