import express from "express";
import { getDb } from "../db/sqlite.js";
import { buildSummary } from "../services/analytics.service.js";
import { buildAnalyticsV2Overview } from "../services/analytics-v2.service.js";
import { asyncHandler } from "./http.js";

type LatestEntryDateRow = {
  date: string | null;
};

const router = express.Router();

router.get(
  "/analytics/summary",
  asyncHandler(async (_req, res) => {
    const db = await getDb();
    const latest = await db.get<LatestEntryDateRow>(
      "SELECT MAX(entry_date) AS date FROM entries",
    );

    if (!latest?.date) {
      return res.json({ week: null, month: null });
    }

    const to = latest.date;
    const weekFrom = subtractDays(to, 6);
    const monthFrom = subtractDays(to, 29);

    const [week, month] = await Promise.all([
      buildSummary(db, { from: weekFrom, to, window: "week" }),
      buildSummary(db, { from: monthFrom, to, window: "month" }),
    ]);

    return res.json({ week, month });
  }),
);

router.get(
  "/analytics/v2/summary",
  asyncHandler(async (_req, res) => {
    const summary = await buildAnalyticsV2Overview(await getDb());

    return res.json(summary);
  }),
);

export default router;

function subtractDays(dateOnly: string, days: number): string {
  const [year, month, day] = dateOnly.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - days);

  return date.toISOString().slice(0, 10);
}
