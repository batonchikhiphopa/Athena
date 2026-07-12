import assert from "node:assert/strict";
import test from "node:test";
import {
  authenticateSessionToken,
  ensureCsrfToken,
  hashToken,
  isFirstRunSetupRequired,
  login,
  logout,
  setupOwner,
  verifyCsrfToken,
} from "../server/modules/auth/auth.service.js";
import { createTestDb } from "./helpers/createTestDb.js";

test("first-run setup creates one owner with Argon2id password hash", async () => {
  const db = await createTestDb();

  try {
    assert.equal(await isFirstRunSetupRequired(db), true);

    const created = await setupOwner(db, {
      username: "owner",
      password: "correct horse battery staple",
    });
    const users = await db.all("SELECT * FROM auth_users");

    assert.equal(await isFirstRunSetupRequired(db), false);
    assert.equal(created.user.username, "owner");
    assert.equal(created.user.role, "owner");
    assert.equal(users.length, 1);
    assert.match(users[0].password_hash, /^\$argon2id\$/);
    assert.notEqual(users[0].password_hash, "correct horse battery staple");

    await assert.rejects(
      () =>
        setupOwner(db, {
          username: "second-owner",
          password: "another secure passphrase",
        }),
      /auth_owner_already_exists/,
    );
  } finally {
    await db.close();
  }
});

test("sessions store only token hashes and authenticate by presented token", async () => {
  const db = await createTestDb();

  try {
    const created = await setupOwner(db, {
      username: "owner",
      password: "correct horse battery staple",
    });
    const sessionRows = await db.all("SELECT * FROM auth_sessions");

    assert.equal(sessionRows.length, 1);
    assert.equal(sessionRows[0].token_hash, hashToken(created.sessionToken));
    assert.equal(sessionRows[0].csrf_token_hash, hashToken(created.csrfToken));
    assert.notEqual(sessionRows[0].token_hash, created.sessionToken);
    assert.notEqual(sessionRows[0].csrf_token_hash, created.csrfToken);

    const authenticated = await authenticateSessionToken(db, created.sessionToken);

    assert.equal(authenticated?.user.username, "owner");
    assert.equal(await authenticateSessionToken(db, "wrong-token"), null);
  } finally {
    await db.close();
  }
});

test("login validates owner password and creates a new session", async () => {
  const db = await createTestDb();

  try {
    await setupOwner(db, {
      username: "owner",
      password: "correct horse battery staple",
    });

    await assert.rejects(
      () =>
        login(db, {
          username: "owner",
          password: "wrong horse battery staple",
        }),
      /auth_invalid_credentials/,
    );

    const loggedIn = await login(db, {
      username: "owner",
      password: "correct horse battery staple",
    });
    const sessions = await db.all("SELECT * FROM auth_sessions");

    assert.equal(sessions.length, 2);
    assert.equal((await authenticateSessionToken(db, loggedIn.sessionToken))?.user.id, 1);
  } finally {
    await db.close();
  }
});

test("csrf token is bound to the authenticated session", async () => {
  const db = await createTestDb();

  try {
    const created = await setupOwner(db, {
      username: "owner",
      password: "correct horse battery staple",
    });
    const auth = await authenticateSessionToken(db, created.sessionToken);

    assert.ok(auth);
    assert.equal(verifyCsrfToken(created.csrfToken, auth.session.csrf_token_hash), true);
    assert.equal(verifyCsrfToken("wrong-csrf-token", auth.session.csrf_token_hash), false);

    const rotated = await ensureCsrfToken(db, auth, null);
    const refreshed = await authenticateSessionToken(db, created.sessionToken);

    assert.notEqual(rotated, created.csrfToken);
    assert.ok(refreshed);
    assert.equal(verifyCsrfToken(rotated, refreshed.session.csrf_token_hash), true);
    assert.equal(
      verifyCsrfToken(created.csrfToken, refreshed.session.csrf_token_hash),
      false,
    );
  } finally {
    await db.close();
  }
});

test("logout revokes the session token hash", async () => {
  const db = await createTestDb();

  try {
    const created = await setupOwner(db, {
      username: "owner",
      password: "correct horse battery staple",
    });

    assert.ok(await authenticateSessionToken(db, created.sessionToken));

    await logout(db, created.sessionToken);

    assert.equal(await authenticateSessionToken(db, created.sessionToken), null);
    assert.equal(
      (await db.get("SELECT revoked_at FROM auth_sessions WHERE id = ?", [
        created.session.id,
      ])).revoked_at === null,
      false,
    );
  } finally {
    await db.close();
  }
});
