import express from "express";
import { getDb } from "../db/sqlite.js";
import {
  deleteInsightSnapshot,
  getCurrentInsightSnapshots,
  listInsightSnapshots,
} from "../services/insight.service.js";

const router = express.Router();

router.get("/insights/current", async (req, res) => {
  try {
    const db = await getDb();
    const snapshots = await getCurrentInsightSnapshots(db, {
      today: typeof req.query.today === "string" ? req.query.today : undefined,
    });

    return res.json({ insights: snapshots });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Не удалось загрузить текущие наблюдения",
    });
  }
});

router.get("/insights", async (_req, res) => {
  try {
    const db = await getDb();
    const snapshots = await listInsightSnapshots(db);

    return res.json({ insights: snapshots });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Не удалось загрузить историю наблюдений",
    });
  }
});

router.delete("/insights/:id", async (req, res) => {
  try {
    const db = await getDb();
    const deleted = await deleteInsightSnapshot(db, req.params.id);

    if (!deleted) {
      return res.status(404).json({
        error: "Наблюдение уже удалено",
      });
    }

    return res.status(204).send();
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Не удалось удалить наблюдение",
    });
  }
});

export default router;
