import express from "express";
import path from "path";
import analyticsRouter from "./api/analytics.route.js";
import authRouter from "./api/auth.route.js";
import configRouter from "./api/config.route.js";
import entriesRouter from "./api/entries.route.js";
import exportsRouter from "./api/exports.route.js";
import extractionsRouter from "./api/extractions.route.js";
import insightsRouter from "./api/insights.route.js";
import selfReportsRouter from "./api/self-reports.route.js";
import { CLIENT_DIST_DIR } from "./config/env.js";
import {
  requireProtectedApiAuth,
  requireProtectedApiCsrf,
} from "./middleware/auth.middleware.js";
import {
  apiErrorHandler,
  jsonErrorHandler,
} from "./middleware/error.middleware.js";

const CLIENT_DIR = CLIENT_DIST_DIR;

export function createApp(): express.Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "64kb" }));
  app.use(jsonErrorHandler);
  // Config and login/setup must be reachable before the optional auth ring.
  app.use(configRouter);
  app.use(authRouter);
  // Everything registered below this point is owner-protected when auth is on.
  app.use(requireProtectedApiAuth);
  app.use(requireProtectedApiCsrf);
  app.use(extractionsRouter);
  app.use(entriesRouter);
  app.use(exportsRouter);
  app.use(analyticsRouter);
  app.use(insightsRouter);
  app.use(selfReportsRouter);
  app.use(apiErrorHandler);
  app.use(express.static(CLIENT_DIR));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(CLIENT_DIR, "index.html"));
  });

  return app;
}
