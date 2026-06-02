import express from "express";
import { syncSelfReportDailyAggregatesSchema } from "../core/self-report.schema.js";
import { getDb } from "../db/sqlite.js";
import {
  listSyncedSelfReportDailyAggregates,
  syncSelfReportDailyAggregates,
} from "../services/self-report.service.js";

const router = express.Router();

router.put("/self-reports/daily-aggregates/:localDay", async (req, res) => {
  const parsed = syncSelfReportDailyAggregatesSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Не удалось обработать self-report aggregates",
      details: parsed.error.flatten(),
    });
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
    console.error(error);

    if (
      error instanceof Error &&
      error.message === "self_report_aggregate_day_mismatch"
    ) {
      return res.status(400).json({
        error: "Self-report aggregate day mismatch",
      });
    }

    return res.status(500).json({
      error: "Не удалось синхронизировать self-report aggregates",
    });
  }
});

router.get("/self-reports/daily-aggregates/:localDay", async (req, res) => {
  try {
    const db = await getDb();
    const aggregates = await listSyncedSelfReportDailyAggregates(
      db,
      req.params.localDay,
    );

    return res.json({ aggregates });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Не удалось загрузить self-report aggregates",
    });
  }
});

export default router;
