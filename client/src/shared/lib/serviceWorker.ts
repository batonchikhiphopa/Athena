const ATHENA_CACHE_PREFIXES = ["athena-shell-", "athena-static-"];

type AppShellCleanupEnvironment = {
  cacheStorage?: Pick<CacheStorage, "delete" | "keys">;
  origin?: string;
  serviceWorker?: Pick<ServiceWorkerContainer, "getRegistrations">;
};

export async function clearAthenaAppShell(
  environment: AppShellCleanupEnvironment = {},
) {
  const serviceWorker =
    environment.serviceWorker ??
    (typeof navigator !== "undefined" && "serviceWorker" in navigator
      ? navigator.serviceWorker
      : undefined);
  const cacheStorage =
    environment.cacheStorage ??
    (typeof caches !== "undefined" ? caches : undefined);
  const origin =
    environment.origin ??
    (typeof window !== "undefined" ? window.location.origin : undefined);

  await Promise.all([
    unregisterAthenaServiceWorkers(serviceWorker, origin),
    deleteAthenaAppShellCaches(cacheStorage),
  ]);
}

export function registerServiceWorker() {
  if (import.meta.env?.DEV) {
    void clearAthenaAppShell().catch((error) => {
      console.warn("[sw:dev-cleanup]", error);
    });
    return;
  }

  if (!("serviceWorker" in navigator)) {
    console.warn("Service Worker is not supported in this browser");
    return;
  }

  const register = () => {
    void navigator.serviceWorker
      .register("/sw.js")
      .then(() => {
        console.log("Service Worker registered");
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
      });
  };

  if (document.readyState === "complete") {
    register();
    return;
  }

  window.addEventListener("load", register, { once: true });
}

async function unregisterAthenaServiceWorkers(
  serviceWorker:
    | Pick<ServiceWorkerContainer, "getRegistrations">
    | undefined,
  origin: string | undefined,
) {
  if (!serviceWorker || !origin) return;

  const registrations = await serviceWorker.getRegistrations();
  const athenaScope = new URL("/", origin).href;

  await Promise.all(
    registrations
      .filter((registration) => registration.scope === athenaScope)
      .map((registration) => registration.unregister()),
  );
}

async function deleteAthenaAppShellCaches(
  cacheStorage: Pick<CacheStorage, "delete" | "keys"> | undefined,
) {
  if (!cacheStorage) return;

  const cacheNames = await cacheStorage.keys();

  await Promise.all(
    cacheNames
      .filter((cacheName) =>
        ATHENA_CACHE_PREFIXES.some((prefix) => cacheName.startsWith(prefix)),
      )
      .map((cacheName) => cacheStorage.delete(cacheName)),
  );
}
