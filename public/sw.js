/*
 * Service worker de RESPIA News.
 *
 * Cumple dos funciones:
 *   1. Sin un manejador de `fetch`, Chrome no considera la app instalable.
 *   2. Da una pantalla usable cuando el teléfono se queda sin señal.
 *
 * Estrategias:
 *   - navegación (abrir una página): red primero, caché como respaldo.
 *   - estáticos (/_next/static, iconos): caché primero, se refresca de fondo.
 *   - /api/*: siempre red. Son datos frescos, no se cachean nunca.
 *
 * Al cambiar CACHE_VERSION se invalida todo lo guardado del deploy anterior.
 */

const CACHE_VERSION = "respia-v1";
const PRECACHE_URLS = ["/", "/offline.html", "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      // Activa este worker sin esperar a que se cierren las pestañas viejas.
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Solo se cachean lecturas del propio dominio.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});

/** Red primero: contenido fresco, y si no hay señal, lo último que se vio. */
async function networkFirst(request) {
  const cache = await caches.open(CACHE_VERSION);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;

    const offline = await cache.match("/offline.html");
    if (offline) return offline;

    return new Response("Sin conexión", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
}

/** Caché primero: los estáticos de Next llevan hash, así que no caducan. */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("", { status: 504 });
  }
}
