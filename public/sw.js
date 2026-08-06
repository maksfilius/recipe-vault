const SHELL_CACHE = "keep-and-cook-shell-v1";
const PRIVATE_CACHE = "keep-and-cook-private-v1";
const IMAGE_CACHE = "keep-and-cook-images-v1";
const STATIC_CACHE = "keep-and-cook-static-v1";
const CURRENT_CACHES = new Set([SHELL_CACHE, PRIVATE_CACHE, IMAGE_CACHE, STATIC_CACHE]);

const SHELL_URLS = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

// Precache each shell URL independently: addAll is atomic, so a single missing
// asset would abort installation and leave the app with no service worker.
async function precacheShell() {
  const cache = await caches.open(SHELL_CACHE);

  await Promise.all(
    SHELL_URLS.map((url) =>
      cache.add(new Request(url, { cache: "reload" })).catch(() => undefined),
    ),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !CURRENT_CACHES.has(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "CLEAR_PRIVATE_CACHES") return;
  event.waitUntil(Promise.all([caches.delete(PRIVATE_CACHE), caches.delete(IMAGE_CACHE)]));
});

async function networkFirst(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    const requestedUrl = new URL(request.url);
    const redirectedToLogin =
      requestedUrl.pathname.startsWith("/dashboard") &&
      response.redirected &&
      new URL(response.url).pathname === "/login";

    if (response.ok && !redirectedToLogin) await cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) ?? (fallbackUrl ? await caches.match(fallbackUrl) : undefined) ?? Response.error();
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok || response.type === "opaque") await cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (request.mode === "navigate") {
    const isDashboard = url.origin === self.location.origin && url.pathname.startsWith("/dashboard");
    event.respondWith(networkFirst(request, isDashboard ? PRIVATE_CACHE : SHELL_CACHE, isDashboard ? null : "/"));
    return;
  }

  if (request.destination === "image") {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/"))
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  }
});
