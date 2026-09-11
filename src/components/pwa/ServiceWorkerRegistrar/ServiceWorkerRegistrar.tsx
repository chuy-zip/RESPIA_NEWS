"use client";

import { useEffect } from "react";

/**
 * Registra el service worker que hace instalable la app.
 *
 * Solo corre en producción: en `next dev` un service worker cacheando módulos
 * pelea contra el hot reload. Para probar la instalación en local hay que usar
 * `npm run build && npm start`.
 *
 * No pinta nada, por eso devuelve null.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // Si el registro falla la app sigue funcionando online; solo se pierde
        // el modo offline y el aviso de instalar.
      });
    };

    // Esperar a `load` evita competir con la carga inicial por ancho de banda.
    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
