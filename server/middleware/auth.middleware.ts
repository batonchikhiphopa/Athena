import type { NextFunction, Request, Response } from "express";
import { isServerAuthRequired } from "../config/env.js";
import { getDb } from "../db/sqlite.js";
import {
  authenticateSessionToken,
  verifyCsrfToken,
  type AuthenticatedSession,
} from "../services/auth.service.js";

export const SESSION_COOKIE_NAME = "athena_session";
export const CSRF_COOKIE_NAME = "athena_csrf";

const PROTECTED_PATH_PREFIXES = [
  "/entries",
  "/insights",
  "/analytics",
  "/self-reports",
  "/extractions",
];

const MUTATING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!isServerAuthRequired()) {
    next();
    return;
  }

  try {
    const auth = await authenticateRequest(req);

    if (!auth) {
      res.status(401).json({ error: "Требуется вход" });
      return;
    }

    res.locals.auth = auth;
    next();
  } catch (error) {
    next(error);
  }
}

export async function requireProtectedApiAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!isServerAuthRequired()) {
    next();
    return;
  }

  if (!isProtectedApiPath(req.path)) {
    next();
    return;
  }

  await requireAuth(req, res, next);
}

export function requireProtectedApiCsrf(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!isServerAuthRequired()) {
    next();
    return;
  }

  if (!isProtectedApiPath(req.path) || !MUTATING_METHODS.has(req.method)) {
    next();
    return;
  }

  requireCsrf(req, res, next);
}

export function requireCsrf(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!isServerAuthRequired()) {
    next();
    return;
  }

  const auth = res.locals.auth as AuthenticatedSession | undefined;
  const csrfToken = req.get("x-csrf-token");

  if (!auth) {
    res.status(401).json({ error: "Требуется вход" });
    return;
  }

  if (!verifyCsrfToken(csrfToken, auth.session.csrf_token_hash)) {
    res.status(403).json({ error: "CSRF token mismatch" });
    return;
  }

  next();
}

export function readCookie(req: Request, name: string): string | null {
  const cookies = parseCookieHeader(req.get("cookie"));

  return cookies[name] ?? null;
}

export function setAuthCookies(
  res: Response,
  input: {
    sessionToken: string;
    csrfToken: string;
    expiresAt: string;
  },
): void {
  const baseOptions = {
    expires: new Date(input.expiresAt),
    path: "/",
    sameSite: "strict" as const,
    secure: isProduction(),
  };

  res.cookie(SESSION_COOKIE_NAME, input.sessionToken, {
    ...baseOptions,
    httpOnly: true,
  });
  res.cookie(CSRF_COOKIE_NAME, input.csrfToken, {
    ...baseOptions,
    httpOnly: false,
  });
}

export function clearAuthCookies(res: Response): void {
  const baseOptions = {
    path: "/",
    sameSite: "strict" as const,
    secure: isProduction(),
  };

  res.clearCookie(SESSION_COOKIE_NAME, {
    ...baseOptions,
    httpOnly: true,
  });
  res.clearCookie(CSRF_COOKIE_NAME, {
    ...baseOptions,
    httpOnly: false,
  });
}

async function authenticateRequest(req: Request): Promise<AuthenticatedSession | null> {
  const db = await getDb();

  return authenticateSessionToken(db, readCookie(req, SESSION_COOKIE_NAME));
}

function isProtectedApiPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function parseCookieHeader(header: string | undefined): Record<string, string> {
  if (!header) {
    return {};
  }

  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separatorIndex = part.indexOf("=");
        const rawName = separatorIndex >= 0 ? part.slice(0, separatorIndex) : part;
        const rawValue = separatorIndex >= 0 ? part.slice(separatorIndex + 1) : "";

        return [rawName, decodeCookieValue(rawValue)];
      }),
  );
}

function decodeCookieValue(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}
