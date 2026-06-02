import crypto from "crypto";
import argon2 from "argon2";
import {
  countAuthUsers,
  createAuthSession,
  createAuthUser,
  getActiveAuthSessionByTokenHash,
  getAuthUserByUsername,
  revokeAuthSessionByTokenHash,
  touchAuthSession,
  updateAuthSessionCsrfTokenHash,
  type AuthSessionWithUserRow,
  type AuthUserRole,
} from "../repositories/auth.repository.js";
import { withDbWriteTransaction, type AthenaDb } from "../db/sqlite.js";
import type { LoginInput, SetupOwnerInput } from "../core/auth.schema.js";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const TOKEN_BYTES = 32;
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19 * 1024,
  timeCost: 2,
  parallelism: 1,
};

export type AuthUserView = {
  id: number;
  username: string;
  role: AuthUserRole;
};

export type AuthenticatedSession = {
  session: AuthSessionWithUserRow;
  user: AuthUserView;
};

export type CreatedAuthSession = AuthenticatedSession & {
  sessionToken: string;
  csrfToken: string;
};

export async function isFirstRunSetupRequired(db: AthenaDb): Promise<boolean> {
  return (await countAuthUsers(db)) === 0;
}

export async function setupOwner(
  db: AthenaDb,
  input: SetupOwnerInput,
): Promise<CreatedAuthSession> {
  return withDbWriteTransaction(db, async (tx) => {
    if ((await countAuthUsers(tx)) > 0) {
      throw new Error("auth_owner_already_exists");
    }

    const now = new Date().toISOString();
    const passwordHash = await hashPassword(input.password);
    const user = await createAuthUser(tx, {
      username: input.username.trim(),
      passwordHash,
      now,
    });

    return createSessionForUser(tx, user, now);
  });
}

export async function login(
  db: AthenaDb,
  input: LoginInput,
): Promise<CreatedAuthSession> {
  const user = await getAuthUserByUsername(db, input.username.trim());

  if (!user || !(await verifyPassword(user.password_hash, input.password))) {
    throw new Error("auth_invalid_credentials");
  }

  return withDbWriteTransaction(db, async (tx) =>
    createSessionForUser(tx, user, new Date().toISOString()),
  );
}

export async function authenticateSessionToken(
  db: AthenaDb,
  sessionToken: string | null | undefined,
): Promise<AuthenticatedSession | null> {
  if (!sessionToken) {
    return null;
  }

  const tokenHash = hashToken(sessionToken);
  const session = await getActiveAuthSessionByTokenHash(db, tokenHash);

  if (!session) {
    return null;
  }

  const now = new Date().toISOString();

  if (session.expires_at <= now) {
    await revokeAuthSessionByTokenHash(db, { tokenHash, now });
    return null;
  }

  await touchAuthSession(db, session.id, now);

  return {
    session,
    user: {
      id: session.user_id,
      username: session.username,
      role: session.role,
    },
  };
}

export async function ensureCsrfToken(
  db: AthenaDb,
  auth: AuthenticatedSession,
  presentedToken: string | null | undefined,
): Promise<string> {
  if (presentedToken && verifyTokenHash(presentedToken, auth.session.csrf_token_hash)) {
    return presentedToken;
  }

  const csrfToken = generateToken();
  const now = new Date().toISOString();

  await updateAuthSessionCsrfTokenHash(db, {
    sessionId: auth.session.id,
    csrfTokenHash: hashToken(csrfToken),
    now,
  });

  auth.session.csrf_token_hash = hashToken(csrfToken);

  return csrfToken;
}

export async function logout(
  db: AthenaDb,
  sessionToken: string | null | undefined,
): Promise<void> {
  if (!sessionToken) {
    return;
  }

  await revokeAuthSessionByTokenHash(db, {
    tokenHash: hashToken(sessionToken),
    now: new Date().toISOString(),
  });
}

export function verifyCsrfToken(
  csrfToken: string | null | undefined,
  expectedHash: string,
): boolean {
  return Boolean(csrfToken && verifyTokenHash(csrfToken, expectedHash));
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_OPTIONS);
}

async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

async function createSessionForUser(
  db: AthenaDb,
  user: {
    id: number;
    username: string;
    role: AuthUserRole;
  },
  now: string,
): Promise<CreatedAuthSession> {
  const sessionToken = generateToken();
  const csrfToken = generateToken();
  const expiresAt = new Date(Date.parse(now) + SESSION_TTL_MS).toISOString();
  const session = await createAuthSession(db, {
    userId: user.id,
    tokenHash: hashToken(sessionToken),
    csrfTokenHash: hashToken(csrfToken),
    now,
    expiresAt,
  });

  return {
    session: {
      ...session,
      username: user.username,
      role: user.role,
    },
    sessionToken,
    csrfToken,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  };
}

function generateToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString("base64url");
}

function verifyTokenHash(token: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashToken(token), "hex");
  const expected = Buffer.from(expectedHash, "hex");

  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
