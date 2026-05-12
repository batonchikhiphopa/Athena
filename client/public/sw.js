const SHELL_CACHE_NAME = "athena-shell-v3";
const STATIC_CACHE_NAME = "athena-static-v3";

const APP_SHELL_ASSETS = [
  "/",
  "/index.html",
  "/favicon.svg",
  "/icons.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    cacheAppShell().then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter(
              (cacheName) =>
                cacheName !== SHELL_CACHE_NAME &&
                cacheName !== STATIC_CACHE_NAME
            )
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (
    request.mode === "navigate" ||
    url.pathname === "/" ||
    url.pathname === "/index.html"
  ) {
    event.respondWith(networkFirst(request));
  }
});

async function cacheAppShell() {
  const shellCache = await caches.open(SHELL_CACHE_NAME);
  const staticCache = await caches.open(STATIC_CACHE_NAME);

  await Promise.allSettled(
    APP_SHELL_ASSETS.map((asset) => shellCache.add(asset))
  );

  const indexResponse = await fetch("/index.html", { cache: "reload" });

  if (!indexResponse.ok) {
    return;
  }

  await shellCache.put("/index.html", indexResponse.clone());
  await shellCache.put("/", indexResponse.clone());

  const indexHtml = await indexResponse.text();
  const assetUrls = extractSameOriginAssetUrls(indexHtml);

  await cacheStaticAssets(staticCache, assetUrls);
}

function extractSameOriginAssetUrls(indexHtml) {
  const assetUrls = new Set();
  const patterns = [
    /\ssrc=["']([^"']+)["']/g,
    /\shref=["']([^"']+)["']/g,
    /["'`](\/assets\/[^"'`\\\s]+)["'`]/g,
  ];

  for (const pattern of patterns) {
    for (const match of indexHtml.matchAll(pattern)) {
      const url = new URL(match[1], self.location.origin);

      if (url.origin === self.location.origin && url.pathname.startsWith("/assets/")) {
        assetUrls.add(url.pathname + url.search);
      }
    }
  }

  return [...assetUrls];
}

async function cacheStaticAssets(cache, initialAssetUrls) {
  const pendingAssetUrls = [...initialAssetUrls];
  const seenAssetUrls = new Set();

  while (pendingAssetUrls.length > 0) {
    const assetUrl = pendingAssetUrls.shift();

    if (!assetUrl || seenAssetUrls.has(assetUrl)) {
      continue;
    }

    seenAssetUrls.add(assetUrl);

    try {
      const response = await fetch(assetUrl, { cache: "reload" });

      if (!response.ok) {
        continue;
      }

      await cache.put(assetUrl, response.clone());

      const contentType = response.headers.get("content-type") ?? "";
      const isTextAsset =
        contentType.includes("javascript") ||
        contentType.includes("text/css") ||
        contentType.includes("text/html");

      if (!isTextAsset) {
        continue;
      }

      for (const discoveredAssetUrl of extractSameOriginAssetUrls(
        await response.text()
      )) {
        if (!seenAssetUrls.has(discoveredAssetUrl)) {
          pendingAssetUrls.push(discoveredAssetUrl);
        }
      }
    } catch (error) {
      console.warn("[sw:cache-static-asset]", assetUrl, error);
    }
  }
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);

  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE_NAME);
    await cache.put(request, response.clone());
  }

  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(SHELL_CACHE_NAME);

  try {
    const response = await fetch(request);

    if (response.ok) {
      await cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    const cachedIndex = await cache.match("/index.html");

    return cachedResponse || cachedIndex || Response.error();
  }
}
