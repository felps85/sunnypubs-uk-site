const SHELL_CACHE_NAME = "sunny-pubs-shell-v3";
const STATIC_DATA_CACHE_NAME = "sunny-pubs-static-data-v1";
const PRECACHE_URLS = [
  "/",
  "/site.webmanifest",
  "/apple-touch-icon.png",
  "/pwa-192.png",
  "/pwa-512.png",
  "/og-sunny-pubs.png",
  "/og-sunny-pubs.svg",
  "/mask-icon.svg",
  "/favicon-default.svg",
  "/favicon-sunny.svg",
  "/favicon-not.svg",
  "/favicon-unknown.svg"
];
const NETWORK_FIRST_DESTINATIONS = new Set(["script", "style", "worker", "manifest"]);

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(SHELL_CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const activeCacheNames = new Set([SHELL_CACHE_NAME, STATIC_DATA_CACHE_NAME]);
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => !activeCacheNames.has(key)).map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

async function cacheFreshResponse(request, response) {
  if (!response.ok) return;
  const cache = await caches.open(SHELL_CACHE_NAME);
  await cache.put(request, response.clone());
}

async function networkFirst(request, fallbackPathname) {
  try {
    const response = await fetch(request);
    await cacheFreshResponse(request, response).catch(() => undefined);
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (fallbackPathname) {
      const cachedPath = await caches.match(fallbackPathname);
      if (cachedPath) return cachedPath;
      const cachedShell = await caches.match("/");
      if (cachedShell) return cachedShell;
    }
    return Response.error();
  }
}

async function cacheFirstWithBackgroundRefresh(request) {
  const cache = await caches.open(STATIC_DATA_CACHE_NAME);
  const cached = await cache.match(request);
  const refresh = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        await cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);

  if (cached) {
    refresh.catch(() => undefined);
    return cached;
  }

  const response = await refresh;
  return response ?? Response.error();
}

function shouldUseNetworkFirst(request, requestUrl) {
  return (
    NETWORK_FIRST_DESTINATIONS.has(request.destination) ||
    requestUrl.pathname.endsWith(".webmanifest") ||
    requestUrl.pathname === "/site.webmanifest"
  );
}

function isStaticMapDataRequest(requestUrl) {
  return requestUrl.pathname.startsWith("/sunny-map/");
}

function isRuntimeFunctionRequest(requestUrl) {
  return requestUrl.pathname.startsWith("/functions/");
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (isRuntimeFunctionRequest(requestUrl)) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(networkFirst(event.request, requestUrl.pathname));
    return;
  }

  if (isStaticMapDataRequest(requestUrl)) {
    event.respondWith(cacheFirstWithBackgroundRefresh(event.request));
    return;
  }

  if (shouldUseNetworkFirst(event.request, requestUrl)) {
    event.respondWith(networkFirst(event.request));
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
          caches.open(SHELL_CACHE_NAME).then((cache) => cache.put(event.request, responseCopy));
        }
        return response;
      });
    })
  );
});
