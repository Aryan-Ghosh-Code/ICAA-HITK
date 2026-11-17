// Service Worker for ICAA Operations Unified PWA (Admin & Scanner)
const CACHE_VERSION = "icaa-ops-v3";
const OFFLINE_URL = "/offline";

// Pre-cache essential offline fallback assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll([
        OFFLINE_URL,
        "/pwa/icon-192.png",
        "/pwa/icon-512.png",
      ]);
    }),
  );
  self.skipWaiting();
});

// Clean up old cache versions on activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => {
          if (k !== CACHE_VERSION) {
            return caches.delete(k);
          }
        }),
      );
    }),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. NEVER cache any /api/* dynamic endpoints (real-time claims and verification)
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // 2. Cache-first with stale-while-revalidate for static Next.js assets & icons
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/pwa/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".ico")
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request)
          .then((networkRes) => {
            if (networkRes.status === 200) {
              const resClone = networkRes.clone();
              caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, resClone));
            }
            return networkRes;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      }),
    );
    return;
  }

  // 3. Network-first with offline fallback for HTML navigation requests (ONLY Admin & Scanner)
  if (event.request.mode === "navigate") {
    const p = url.pathname;
    const isPublicPage = p === "/" || p.startsWith("/2027") || p.startsWith("/certificates");
    if (isPublicPage) {
      // Do not intercept or hijack public conference website routes
      return;
    }

    event.respondWith(
      fetch(event.request)
        .then((networkRes) => {
          if (networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, resClone));
          }
          return networkRes;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          const offlinePage = await caches.match(OFFLINE_URL);
          return (
            offlinePage ||
            new Response("You are offline. Please reconnect to continue using ICAA Operations.", {
              status: 503,
              headers: { "Content-Type": "text/plain" },
            })
          );
        }),
    );
    return;
  }
});
