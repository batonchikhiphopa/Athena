/**
 * Shared HTTP mechanics only. Feature endpoints live next to their owning
 * modules; this file centralizes cookies, CSRF headers and error classification.
 */

export const SERVER_AUTH_REQUIRED_EVENT = "athena:server-auth-required";

const CSRF_COOKIE_NAME = "athena_csrf";

export class ApiHttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiHttpError";
    this.status = status;
    this.code = code;
  }
}

export function jsonHeaders(): Record<string, string> {
  return { "Content-Type": "application/json" };
}

export function csrfJsonHeaders(): Record<string, string> {
  return { ...jsonHeaders(), ...csrfHeaders() };
}

export function csrfHeaders(): Record<string, string> {
  const token = readBrowserCookie(CSRF_COOKIE_NAME);
  return token ? { "X-CSRF-Token": token } : {};
}

export async function createApiHttpError(
  response: Response,
  prefix: string,
): Promise<ApiHttpError> {
  const text = await response.text();
  return new ApiHttpError(
    response.status,
    classifyHttpErrorCode(response.status),
    `${prefix}: ${text}`,
  );
}

export function handleUnauthorized(response: Response): void {
  if (response.status !== 401 || typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SERVER_AUTH_REQUIRED_EVENT));
}

function readBrowserCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const prefix = `${name}=`;
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  if (!cookie) return null;

  try {
    return decodeURIComponent(cookie.slice(prefix.length));
  } catch {
    return cookie.slice(prefix.length);
  }
}

function classifyHttpErrorCode(status: number): string {
  if (status === 409) return "backend_conflict";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "backend_unavailable";
  return `http_${status}`;
}
