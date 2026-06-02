import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { validSignal } from "./signal-fixtures.js";

const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "athena-auth-api-"));
process.env.ATHENA_DATABASE_PATH = path.join(tempDir, "athena.db");
process.env.ATHENA_AUTH_REQUIRED = "true";

const { getDb } = await import("../server/db/sqlite.js");
const { createApp } = await import("../server/app.js");

const db = await getDb();
await applyMigrations(db);

const app = createApp();
const server = app.listen(0, "127.0.0.1");
const baseUrl = await getServerBaseUrl(server);

test.beforeEach(async () => {
  await db.exec(`
    DELETE FROM auth_sessions;
    DELETE FROM auth_users;
    DELETE FROM signal_overrides;
    DELETE FROM signals;
    DELETE FROM entries;
  `);
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await db.close();
  await fs.rm(tempDir, { recursive: true, force: true });
});

test("entry API without a session returns 401", async () => {
  const response = await request("GET", "/entries");

  assert.equal(response.status, 401);
});

test("auth can be disabled for passwordless local API access", async () => {
  process.env.ATHENA_AUTH_REQUIRED = "false";

  try {
    const authStatus = await request("GET", "/auth/me");
    const authPayload = await authStatus.json();
    const listResponse = await request("GET", "/entries");
    const createResponse = await request("POST", "/entries", {
      body: validEntryPayload(),
    });

    assert.equal(authStatus.status, 200);
    assert.equal(authPayload.auth_required, false);
    assert.equal(authPayload.authenticated, true);
    assert.equal(authPayload.setup_required, false);
    assert.equal(authPayload.user, null);
    assert.equal(listResponse.status, 200);
    assert.equal(createResponse.status, 201);
  } finally {
    process.env.ATHENA_AUTH_REQUIRED = "true";
  }
});

test("login creates a session and auth cookies", async () => {
  await setupOwner();

  const response = await request("POST", "/auth/login", {
    body: {
      username: "owner",
      password: "correct horse battery staple",
    },
  });
  const setCookies = getSetCookies(response);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.user.username, "owner");
  assert.equal(typeof payload.csrf_token, "string");
  assert.ok(
    setCookies.some(
      (cookie) =>
        cookie.startsWith("athena_session=") &&
        cookie.includes("HttpOnly") &&
        cookie.includes("SameSite=Strict"),
    ),
  );
  assert.ok(setCookies.some((cookie) => cookie.startsWith("athena_csrf=")));
});

test("logout invalidates the active session", async () => {
  const auth = await setupOwner();
  const beforeLogout = await request("GET", "/entries", {
    cookies: auth.cookies,
  });

  assert.equal(beforeLogout.status, 200);

  const logoutResponse = await request("POST", "/auth/logout", {
    cookies: auth.cookies,
    csrfToken: auth.csrfToken,
  });
  const afterLogout = await request("GET", "/entries", {
    cookies: auth.cookies,
  });
  const revoked = await db.get(
    "SELECT revoked_at FROM auth_sessions ORDER BY id DESC LIMIT 1",
  );

  assert.equal(logoutResponse.status, 204);
  assert.equal(afterLogout.status, 401);
  assert.notEqual(revoked.revoked_at, null);
});

test("mutating protected requests without CSRF return 403", async () => {
  const auth = await setupOwner();
  const response = await request("POST", "/entries", {
    body: validEntryPayload(),
    cookies: auth.cookies,
  });

  assert.equal(response.status, 403);
});

test("expired session does not authenticate", async () => {
  const auth = await setupOwner();

  await db.run(
    `
      UPDATE auth_sessions
      SET expires_at = ?
      WHERE revoked_at IS NULL
    `,
    ["2000-01-01T00:00:00.000Z"],
  );

  const response = await request("GET", "/entries", {
    cookies: auth.cookies,
  });
  const revoked = await db.get(
    "SELECT revoked_at FROM auth_sessions ORDER BY id DESC LIMIT 1",
  );

  assert.equal(response.status, 401);
  assert.notEqual(revoked.revoked_at, null);
});

test("raw text still cannot pass through backend entry payloads", async () => {
  const auth = await setupOwner();
  const response = await request("POST", "/entries", {
    body: {
      ...validEntryPayload(),
      text: "raw diary text must stay out of backend payloads",
    },
    cookies: auth.cookies,
    csrfToken: auth.csrfToken,
  });

  assert.equal(response.status, 400);
});

async function setupOwner() {
  const response = await request("POST", "/auth/setup", {
    body: {
      username: "owner",
      password: "correct horse battery staple",
    },
  });
  const body = await response.json();

  assert.equal(response.status, 201);

  return {
    cookies: createCookieHeader(response),
    csrfToken: body.csrf_token,
  };
}

function validEntryPayload(overrides = {}) {
  return {
    client_entry_id: "client-entry-auth-api",
    entry_date: "2026-06-02",
    tags: ["auth"],
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

  if (options.cookies) {
    headers.Cookie = options.cookies;
  }

  if (options.csrfToken) {
    headers["X-CSRF-Token"] = options.csrfToken;
  }

  return fetch(`${baseUrl}${pathname}`, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

async function applyMigrations(database) {
  const files = (await fs.readdir("./migrations"))
    .filter((filename) => filename.endsWith(".sql"))
    .sort();

  for (const filename of files) {
    await database.exec(await fs.readFile(`./migrations/${filename}`, "utf8"));
  }
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

function createCookieHeader(response) {
  return getSetCookies(response)
    .map((cookie) => cookie.split(";")[0])
    .join("; ");
}

function getSetCookies(response) {
  if (typeof response.headers.getSetCookie === "function") {
    return response.headers.getSetCookie();
  }

  const raw = response.headers.get("set-cookie");

  return raw ? raw.split(/,(?=[^;,]+=)/) : [];
}
