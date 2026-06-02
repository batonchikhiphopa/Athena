import type { AthenaDb } from "../db/sqlite.js";

export type AuthUserRole = "owner";

export type AuthUserRow = {
  id: number;
  username: string;
  role: AuthUserRole;
  password_hash: string;
  created_at: string;
  updated_at: string;
};

export type AuthSessionRow = {
  id: number;
  user_id: number;
  token_hash: string;
  csrf_token_hash: string;
  created_at: string;
  last_seen_at: string;
  expires_at: string;
  revoked_at: string | null;
};

export type AuthSessionWithUserRow = AuthSessionRow & {
  username: string;
  role: AuthUserRole;
};

export async function countAuthUsers(db: AthenaDb): Promise<number> {
  const row = await db.get<{ count: number }>(
    "SELECT COUNT(*) AS count FROM auth_users",
  );

  return row?.count ?? 0;
}

export async function createAuthUser(
  db: AthenaDb,
  input: {
    username: string;
    passwordHash: string;
    now: string;
  },
): Promise<AuthUserRow> {
  const result = await db.run(
    `
      INSERT INTO auth_users (username, role, password_hash, created_at, updated_at)
      VALUES (?, 'owner', ?, ?, ?)
    `,
    [input.username, input.passwordHash, input.now, input.now],
  );

  return (await getAuthUserById(db, result.lastID ?? 0))!;
}

export async function getAuthUserById(
  db: AthenaDb,
  id: number,
): Promise<AuthUserRow | null> {
  const row = await db.get<AuthUserRow>(
    `
      SELECT id, username, role, password_hash, created_at, updated_at
      FROM auth_users
      WHERE id = ?
    `,
    [id],
  );

  return row ?? null;
}

export async function getAuthUserByUsername(
  db: AthenaDb,
  username: string,
): Promise<AuthUserRow | null> {
  const row = await db.get<AuthUserRow>(
    `
      SELECT id, username, role, password_hash, created_at, updated_at
      FROM auth_users
      WHERE username = ?
    `,
    [username],
  );

  return row ?? null;
}

export async function createAuthSession(
  db: AthenaDb,
  input: {
    userId: number;
    tokenHash: string;
    csrfTokenHash: string;
    now: string;
    expiresAt: string;
  },
): Promise<AuthSessionRow> {
  const result = await db.run(
    `
      INSERT INTO auth_sessions (
        user_id,
        token_hash,
        csrf_token_hash,
        created_at,
        last_seen_at,
        expires_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      input.userId,
      input.tokenHash,
      input.csrfTokenHash,
      input.now,
      input.now,
      input.expiresAt,
    ],
  );

  return (await getAuthSessionById(db, result.lastID ?? 0))!;
}

export async function getAuthSessionById(
  db: AthenaDb,
  id: number,
): Promise<AuthSessionRow | null> {
  const row = await db.get<AuthSessionRow>(
    `
      SELECT
        id,
        user_id,
        token_hash,
        csrf_token_hash,
        created_at,
        last_seen_at,
        expires_at,
        revoked_at
      FROM auth_sessions
      WHERE id = ?
    `,
    [id],
  );

  return row ?? null;
}

export async function getActiveAuthSessionByTokenHash(
  db: AthenaDb,
  tokenHash: string,
): Promise<AuthSessionWithUserRow | null> {
  const row = await db.get<AuthSessionWithUserRow>(
    `
      SELECT
        s.id,
        s.user_id,
        s.token_hash,
        s.csrf_token_hash,
        s.created_at,
        s.last_seen_at,
        s.expires_at,
        s.revoked_at,
        u.username,
        u.role
      FROM auth_sessions s
      JOIN auth_users u ON u.id = s.user_id
      WHERE s.token_hash = ?
        AND s.revoked_at IS NULL
    `,
    [tokenHash],
  );

  return row ?? null;
}

export async function touchAuthSession(
  db: AthenaDb,
  sessionId: number,
  now: string,
): Promise<void> {
  await db.run(
    `
      UPDATE auth_sessions
      SET last_seen_at = ?
      WHERE id = ?
        AND revoked_at IS NULL
    `,
    [now, sessionId],
  );
}

export async function updateAuthSessionCsrfTokenHash(
  db: AthenaDb,
  input: {
    sessionId: number;
    csrfTokenHash: string;
    now: string;
  },
): Promise<void> {
  await db.run(
    `
      UPDATE auth_sessions
      SET csrf_token_hash = ?,
          last_seen_at = ?
      WHERE id = ?
        AND revoked_at IS NULL
    `,
    [input.csrfTokenHash, input.now, input.sessionId],
  );
}

export async function revokeAuthSessionByTokenHash(
  db: AthenaDb,
  input: {
    tokenHash: string;
    now: string;
  },
): Promise<void> {
  await db.run(
    `
      UPDATE auth_sessions
      SET revoked_at = ?,
          last_seen_at = ?
      WHERE token_hash = ?
        AND revoked_at IS NULL
    `,
    [input.now, input.now, input.tokenHash],
  );
}
