export type QueueErrorKind =
  | "retryable"
  | "blocked"
  | "conflict"
  | "cancelled";

export type ClassifiedQueueError = {
  kind: QueueErrorKind;
  code: string;
  message: string;
};

type QueueJobErrorOptions = {
  cause?: unknown;
};

export class QueueJobError extends Error {
  kind: QueueErrorKind;
  code: string;

  constructor(
    kind: QueueErrorKind,
    code: string,
    message: string,
    options?: QueueJobErrorOptions,
  ) {
    super(message, options);
    this.name = "QueueJobError";
    this.kind = kind;
    this.code = code;
  }
}

export function queueRetryable(
  code: string,
  message: string,
  cause?: unknown,
): QueueJobError {
  return new QueueJobError("retryable", code, message, { cause });
}

export function queueBlocked(
  code: string,
  message: string,
  cause?: unknown,
): QueueJobError {
  return new QueueJobError("blocked", code, message, { cause });
}

export function queueConflict(
  code: string,
  message: string,
  cause?: unknown,
): QueueJobError {
  return new QueueJobError("conflict", code, message, { cause });
}

export function queueCancelled(
  message = "Job was cancelled.",
  cause?: unknown,
): QueueJobError {
  return new QueueJobError("cancelled", "cancelled", message, { cause });
}

export function classifyQueueError(error: unknown): ClassifiedQueueError {
  if (error instanceof QueueJobError) {
    return {
      kind: error.kind,
      code: error.code,
      message: error.message,
    };
  }

  if (isAbortLikeError(error)) {
    return {
      kind: "cancelled",
      code: "aborted",
      message: errorToMessage(error),
    };
  }

  const status = readHttpStatus(error);
  const rawCode = readErrorCode(error);
  const message = errorToMessage(error);
  const normalized = `${rawCode ?? ""} ${message}`.toLowerCase();

  if (
    normalized.includes("source_hash_mismatch") ||
    normalized.includes("source hash mismatch")
  ) {
    return {
      kind: "conflict",
      code: "source_hash_mismatch",
      message,
    };
  }

  if (status === 409 || normalized.includes("409")) {
    return {
      kind: "conflict",
      code: "backend_conflict",
      message,
    };
  }

  if (
    normalized.includes("cancel") ||
    normalized.includes("aborted") ||
    normalized.includes("abort")
  ) {
    return {
      kind: "cancelled",
      code: "cancelled",
      message,
    };
  }

  if (
    normalized.includes("privacy") ||
    normalized.includes("raw text") ||
    normalized.includes("raw_text")
  ) {
    return {
      kind: "blocked",
      code: "privacy_boundary_violation",
      message,
    };
  }

  if (normalized.includes("validation")) {
    return {
      kind: "blocked",
      code: "validation_error",
      message,
    };
  }

  if (normalized.includes("schema")) {
    return {
      kind: "blocked",
      code: "schema_error",
      message,
    };
  }

  if (
    normalized.includes("missing local entry") ||
    normalized.includes("local entry not found")
  ) {
    return {
      kind: "blocked",
      code: "missing_local_entry",
      message,
    };
  }

  if (normalized.includes("analysis disabled")) {
    return {
      kind: "blocked",
      code: "analysis_disabled",
      message,
    };
  }

  if (normalized.includes("vault locked")) {
    return {
      kind: "blocked",
      code: "vault_locked",
      message,
    };
  }

  if (status === 429 || normalized.includes("429")) {
    return {
      kind: "retryable",
      code: "rate_limited",
      message,
    };
  }

  if (
    normalized.includes("retryable_provider_failure") ||
    normalized.includes("quota_error") ||
    normalized.includes("gemini_daily_limit") ||
    normalized.includes("ollama_unavailable") ||
    normalized.includes("provider_unavailable") ||
    normalized.includes("provider_error")
  ) {
    return {
      kind: "retryable",
      code: rawCode ?? "provider_unavailable",
      message,
    };
  }

  if (
    normalized.includes("timeout") ||
    normalized.includes("network") ||
    normalized.includes("failed to fetch") ||
    normalized.includes("backend")
  ) {
    return {
      kind: "retryable",
      code: rawCode ?? "backend_unavailable",
      message,
    };
  }

  if (typeof status === "number") {
    if (status >= 500 && status <= 599) {
      return {
        kind: "retryable",
        code: `http_${status}`,
        message,
      };
    }

    if (status >= 400 && status <= 499) {
      return {
        kind: "blocked",
        code: `http_${status}`,
        message,
      };
    }
  }

  if (
    normalized.includes("500") ||
    normalized.includes("502") ||
    normalized.includes("503") ||
    normalized.includes("504")
  ) {
    return {
      kind: "retryable",
      code: "backend_unavailable",
      message,
    };
  }

  if (
    normalized.includes("400") ||
    normalized.includes("401") ||
    normalized.includes("403") ||
    normalized.includes("404")
  ) {
    return {
      kind: "blocked",
      code: "unrecoverable_client_error",
      message,
    };
  }

  return {
    kind: "blocked",
    code: rawCode ?? "unknown_queue_error",
    message,
  };
}

export function serializeQueueError(error: unknown): string {
  const classified = classifyQueueError(error);
  return `${classified.code}: ${classified.message}`;
}

function errorToMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown queue error";
  }
}

function readHttpStatus(error: unknown): number | null {
  if (typeof error !== "object" || error === null) return null;

  const record = error as Record<string, unknown>;
  const status = record.status ?? record.statusCode;

  return typeof status === "number" ? status : null;
}

function readErrorCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null) return null;

  const code = (error as Record<string, unknown>).code;

  return typeof code === "string" && code.trim() ? code : null;
}

function isAbortLikeError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  return (
    error.name === "AbortError" ||
    error.name === "DOMException" && error.message.toLowerCase().includes("abort")
  );
}