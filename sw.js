self.__SUNNY_SHELL_CACHE__ = "sunny-pubs-shell-v2";
const SHELL_CACHE = self.__SUNNY_SHELL_CACHE__;
const PRECACHE_URLS = [
  "/",
  "/site.webmanifest",
  "/apple-touch-icon.png",
  "/pwa-192.png",
  "/pwa-512.png",
  "/favicon-default.svg"
];
const CACHEABLE_DESTINATIONS = new Set(["style", "script", "image", "font", "worker"]);

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== SHELL_CACHE).map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match(requestUrl.pathname);
        return cached || caches.match("/") || Response.error();
      })
    );
    return;
  }

  event.respondWith(
    (async () => {
      const destination = event.request.destination;
      const shouldCacheResponse = CACHEABLE_DESTINATIONS.has(destination);

      try {
        const response = await fetch(event.request);
        if (response.ok && shouldCacheResponse) {
          const responseCopy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(event.request, responseCopy));
        }
        return response;
      } catch {
        const cached = await caches.match(event.request);
        return cached || Response.error();
      }
    })()
  );
});
