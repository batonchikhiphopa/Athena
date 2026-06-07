import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodError } from "zod";

export type CodedError = Error & {
  code?: string;
};

export function asyncHandler(
  handler: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    void handler(req, res, next).catch(next);
  };
}

export function sendValidationError(
  res: Response,
  message: string,
  error: ZodError,
) {
  return res.status(400).json({
    error: message,
    details: error.flatten(),
  });
}

export function isCodedError(error: unknown): error is CodedError {
  return error instanceof Error && "code" in error;
}
