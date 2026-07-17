import express from "express";
import { getDb } from "../../db/sqlite.js";
import { buildAnalyticsV2Overview } from "./analyticsV2.service.js";
import { asyncHandler } from "../../platform/http/http.js";

const router = express.Router();

router.get(
  "/analytics/v2/summary",
  asyncHandler(async (_req, res) => {
    const summary = await buildAnalyticsV2Overview(await getDb());

    return res.json(summary);
  }),
);

export default router;
