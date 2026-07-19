/**
 * Shared HTTP mechanics only. Feature endpoints live next to their owning
 * modules; this file centralizes JSON headers and error classification.
 */

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

function classifyHttpErrorCode(status: number): string {
  if (status === 409) return "backend_conflict";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "backend_unavailable";
  return `http_${status}`;
}
