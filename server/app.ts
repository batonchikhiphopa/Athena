import express, { type ErrorRequestHandler } from "express";
import path from "path";
import analyticsRouter from "./api/analytics.route.js";
import configRouter from "./api/config.route.js";
import entriesRouter from "./api/entries.route.js";
import extractionsRouter from "./api/extractions.route.js";
import insightsRouter from "./api/insights.route.js";
import { PROJECT_ROOT } from "./config/env.js";

const CLIENT_DIR = path.join(PROJECT_ROOT, "client", "dist");

const jsonErrorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (isEntityTooLargeError(error)) {
    return res.status(413).json({ error: "Request body too large" });
  }

  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  return next(error);
};

export function createApp(): express.Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "64kb" }));
  app.use(jsonErrorHandler);
  app.use(configRouter);
  app.use(extractionsRouter);
  app.use(entriesRouter);
  app.use(analyticsRouter);
  app.use(insightsRouter);
  app.use(express.static(CLIENT_DIR));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(CLIENT_DIR, "index.html"));
  });

  return app;
}

function isEntityTooLargeError(error: unknown): error is { type: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "entity.too.large"
  );
}
