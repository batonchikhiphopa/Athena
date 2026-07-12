import type { ErrorRequestHandler } from "express";

export const jsonErrorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  next,
) => {
  if (isEntityTooLargeError(error)) {
    return res.status(413).json({ error: "Request body too large" });
  }

  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  return next(error);
};

export const apiErrorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  console.error(error);

  if (res.headersSent) {
    return;
  }

  return res.status(500).json({ error: "Internal server error" });
};

function isEntityTooLargeError(error: unknown): error is { type: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "entity.too.large"
  );
}
