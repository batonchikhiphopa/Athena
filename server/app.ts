import express from "express";
import path from "path";
import analyticsRouter from "./modules/analytics/analytics.route.js";
import configRouter from "./platform/http/config.route.js";
import entriesRouter from "./modules/entries/entries.route.js";
import exportsRouter from "./modules/exports/exports.route.js";
import extractionsRouter from "./modules/extraction/extractions.route.js";
import insightsRouter from "./modules/insights/insights.route.js";
import resultsRouter from "./modules/results/results.route.js";
import selfReportsRouter from "./modules/selfReports/selfReports.route.js";
import { CLIENT_DIST_DIR } from "./config/env.js";
import {
  apiErrorHandler,
  jsonErrorHandler,
} from "./platform/http/error.middleware.js";

const CLIENT_DIR = CLIENT_DIST_DIR;

export function createApp(): express.Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "64kb" }));
  app.use(jsonErrorHandler);
  app.use(configRouter);
  app.use(extractionsRouter);
  app.use(entriesRouter);
  app.use(exportsRouter);
  app.use(analyticsRouter);
  app.use(insightsRouter);
  app.use(resultsRouter);
  app.use(selfReportsRouter);
  app.use(apiErrorHandler);
  app.use(express.static(CLIENT_DIR));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(CLIENT_DIR, "index.html"));
  });

  return app;
}
