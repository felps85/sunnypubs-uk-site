self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open("sunny-pubs-shell-v1").then((cache) =>
      cache.addAll([
        "/",
        "/site.webmanifest",
        "/apple-touch-icon.png",
        "/pwa-192.png",
        "/pwa-512.png",
        "/favicon-default.svg"
      ])
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== "sunny-pubs-shell-v1").map((key) => caches.delete(key)));
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
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response.ok) return response;
        const destination = event.request.destination;
        if (destination === "style" || destination === "script" || destination === "image" || destination === "font") {
          const responseCopy = response.clone();
          caches.open("sunny-pubs-shell-v1").then((cache) => cache.put(event.request, responseCopy));
        }
        return response;
      });
    })
  );
});
