import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { validSignal } from "./signal-fixtures.js";

const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "athena-open-api-"));
process.env.ATHENA_DATABASE_PATH = path.join(tempDir, "athena.db");
// A stale local environment must not be able to turn the retired auth gate on.
process.env.ATHENA_AUTH_REQUIRED = "true";

const { getDb } = await import("../server/db/sqlite.js");
const { ensureCanonicalSchema } = await import("../server/db/canonical-schema.js");
const { createApp } = await import("../server/app.js");

const db = await getDb();
await ensureCanonicalSchema({
  db,
  logger: { log() {} },
  schemaPath: path.resolve("schema.sql"),
});

const app = createApp();
const server = app.listen(0, "127.0.0.1");
const baseUrl = await getServerBaseUrl(server);

test.beforeEach(async () => {
  await db.exec(`
    DELETE FROM signal_overrides;
    DELETE FROM signals;
    DELETE FROM entries;
  `);
});

test.after(async () => {
  delete process.env.ATHENA_AUTH_REQUIRED;
  await new Promise((resolve) => server.close(resolve));
  await db.close();
  await fs.rm(tempDir, { recursive: true, force: true });
});

test("backend API stays open even when a stale auth env flag is present", async () => {
  const listResponse = await request("GET", "/entries");
  const createResponse = await request("POST", "/entries", {
    body: validEntryPayload(),
  });

  assert.equal(listResponse.status, 200);
  assert.equal(createResponse.status, 201);
});

test("retired auth mutation endpoints are unavailable", async () => {
  for (const pathname of ["/auth/setup", "/auth/login", "/auth/logout"]) {
    const response = await request("POST", pathname, { body: {} });
    assert.equal(response.status, 404, pathname);
  }
});

test("raw text still cannot pass through backend entry payloads", async () => {
  const response = await request("POST", "/entries", {
    body: {
      ...validEntryPayload(),
      text: "raw diary text must stay out of backend payloads",
    },
  });

  assert.equal(response.status, 400);
});

function validEntryPayload(overrides = {}) {
  return {
    client_entry_id: "client-entry-open-api",
    entry_date: "2026-06-02",
    tags: ["open-api"],
    source_text_hash: "a".repeat(64),
    signal: validSignal(),
    ...overrides,
  };
}

async function request(method, pathname, options = {}) {
  const headers = {};

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(`${baseUrl}${pathname}`, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

async function getServerBaseUrl(httpServer) {
  await new Promise((resolve) => {
    if (httpServer.listening) {
      resolve();
      return;
    }

    httpServer.once("listening", resolve);
  });

  const address = httpServer.address();
  assert.equal(typeof address, "object");
  assert.ok(address);

  return `http://127.0.0.1:${address.port}`;
}
