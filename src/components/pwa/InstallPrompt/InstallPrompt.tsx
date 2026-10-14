"use client";

import { useCallback, useEffect, useId, useState, useSyncExternalStore } from "react";
import { FaAndroid, FaAppStoreIos } from "react-icons/fa6";

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
  const [platform, setPlatform] = useState<"android" | "ios" | null>(null);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const id = useId();

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      // Sin preventDefault, el navegador decide solo cuándo enseñar su aviso.
      event.preventDefault();
      setDeferredEvent(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (installing) return;
    setPlatform("android");
    setNotice("");
    setError("");
    if (!deferredEvent || environment === "in-app" || environment === "ios") return;

    setInstalling(true);
    try {
      await deferredEvent.prompt();
      const choice = await deferredEvent.userChoice;
      setNotice(choice.outcome === "accepted"
        ? "Solicitud aceptada. El navegador completará la instalación."
        : "Instalación cancelada. Puedes volver a intentarlo desde el menú del navegador.");
    } catch {
      setError("No se pudo abrir la instalación. Sigue los pasos del navegador que aparecen abajo.");
    } finally {
      // El navegador permite usar cada evento de instalación una sola vez.
      setDeferredEvent(null);
      setInstalling(false);
    }
  }, [deferredEvent, environment, installing]);

  const copyLink = useCallback(async () => {
    setError("");
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
    } catch {
      setError("No se pudo copiar el enlace. Cópialo desde la barra de direcciones.");
    }
  }, []);

  if (environment === "pending" || environment === "installed" || installed) {
    return null;
  }

  return (
    <section className={styles.install} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className={styles.title}>
        Instalar en el teléfono
      </h2>
      <p className={styles.lead}>
        Lleva tu edición a la pantalla de inicio. Se instala desde el navegador,
        sin pasar por una tienda.
      </p>

      <div className={styles.badges}>
        <button
          type="button"
          className={styles.badge}
          onClick={install}
          disabled={installing}
          aria-busy={installing}
          aria-expanded={platform === "android"}
          aria-controls={`${id}-android`}
        >
          <FaAndroid className={styles.icon} aria-hidden="true" />
          <span className={styles.badgeText}>
            <span className={styles.caption}>{installing ? "Abriendo instalación…" : "Instalar en"}</span>
            <span className={styles.platform}>Android</span>
          </span>
        </button>
        <button
          type="button"
          className={styles.badge}
          onClick={() => {
            setPlatform((current) => current === "ios" ? null : "ios");
            setNotice("");
            setError("");
          }}
          disabled={installing}
          aria-expanded={platform === "ios"}
          aria-controls={`${id}-ios`}
        >
          <FaAppStoreIos className={styles.icon} aria-hidden="true" />
          <span className={styles.badgeText}>
            <span className={styles.caption}>Instalar en</span>
            <span className={styles.platform}>iPhone o iPad</span>
          </span>
        </button>
      </div>

      {notice ? <p className={styles.feedback} role="status">{notice}</p> : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}

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
      ) : null}
      <div id={`${id}-android`} className={styles.instructions} hidden={platform !== "android"}>
        <h3 className={styles.title}>Desde Chrome en Android</h3>
        <p className={styles.steps}>
          Abre el sitio en Chrome y toca <b>Instalar app</b> o <b>Añadir a pantalla de inicio</b> en el menú de
          tres puntos. Si no aparece, comprueba si ya la tienes instalada.
        </p>
      </div>
      <div id={`${id}-ios`} className={styles.instructions} hidden={platform !== "ios"}>
        <h3 className={styles.title}>Desde el navegador en iPhone o iPad</h3>
        <IosInstallSteps />
      </div>
    </section>
  );
}
