import express from "express";
import { syncSelfReportDailyAggregatesSchema } from "./selfReport.schema.js";
import { getDb } from "../../db/sqlite.js";
import {
  listSyncedSelfReportDailyAggregates,
  syncSelfReportDailyAggregates,
} from "./selfReport.service.js";
import {
  asyncHandler,
  sendValidationError,
} from "../../platform/http/http.js";

const router = express.Router();

router.put("/self-reports/daily-aggregates/:localDay", async (req, res, next) => {
  const parsed = syncSelfReportDailyAggregatesSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendValidationError(
      res,
      "Не удалось обработать self-report aggregates",
      parsed.error,
    );
  }

  try {
    const db = await getDb();
    const aggregates = await syncSelfReportDailyAggregates(
      db,
      req.params.localDay,
      parsed.data.aggregates,
    );

    return res.json({ aggregates });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "self_report_aggregate_day_mismatch"
    ) {
      return res.status(400).json({
        error: "Self-report aggregate day mismatch",
      });
    }

    return next(error);
  }
});

router.get(
  "/self-reports/daily-aggregates/:localDay",
  asyncHandler(async (req, res) => {
    const db = await getDb();
    const aggregates = await listSyncedSelfReportDailyAggregates(
      db,
      req.params.localDay,
    );

    return res.json({ aggregates });
  }),
);

export default router;
