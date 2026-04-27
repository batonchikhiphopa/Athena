import express from "express";
import { getDb } from "../db/sqlite.js";
import { buildSummary } from "../services/analytics.service.js";

const router = express.Router();

router.get("/analytics/summary", async (_req, res) => {
  try {
    const db = await getDb();
    const latest = await db.get("SELECT MAX(entry_date) AS date FROM entries");

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
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to build analytics summary",
    });
  }
});

export default router;

function subtractDays(dateOnly, days) {
  const [year, month, day] = dateOnly.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - days);

  return date.toISOString().slice(0, 10);
}
