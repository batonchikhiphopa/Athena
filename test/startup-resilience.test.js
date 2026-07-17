import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { clearAthenaAppShell } from "../client/src/shared/lib/serviceWorker.ts";

test("app-shell recovery removes only Athena root worker and caches", async () => {
  const unregisteredScopes = [];
  const deletedCaches = [];
  const registration = (scope) => ({
    scope,
    async unregister() {
      unregisteredScopes.push(scope);
      return true;
    },
  });

  await clearAthenaAppShell({
    cacheStorage: {
      async delete(cacheName) {
        deletedCaches.push(cacheName);
        return true;
      },
      async keys() {
        return [
          "athena-shell-v3",
          "athena-static-v3",
          "semantic-model-cache",
        ];
      },
    },
    origin: "http://127.0.0.1:5173",
    serviceWorker: {
      async getRegistrations() {
        return [
          registration("http://127.0.0.1:5173/"),
          registration("http://127.0.0.1:5173/another-app/"),
          registration("https://example.com/"),
        ];
      },
    },
  });

  assert.deepEqual(unregisteredScopes, ["http://127.0.0.1:5173/"]);
  assert.deepEqual(deletedCaches.sort(), [
    "athena-shell-v3",
    "athena-static-v3",
  ]);
});

test("index contains a visible bootstrap shell before React loads", async () => {
  const html = await readFile(
    new URL("../client/index.html", import.meta.url),
    "utf8",
  );

  assert.match(html, /data-athena-bootstrap="pending"/);
  assert.match(html, /class="athena-boot-shell"/);
  assert.match(html, /id="athena-boot-retry"/);
  assert.match(html, /src="\/src\/main\.tsx"/);
});
