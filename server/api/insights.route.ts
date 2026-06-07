import express from "express";
import { getDb } from "../db/sqlite.js";
import {
  deleteInsightSnapshot,
  getCurrentInsightSnapshots,
  listInsightSnapshots,
} from "../services/insight.service.js";
import { asyncHandler } from "./http.js";

const router = express.Router();

router.get(
  "/insights/current",
  asyncHandler(async (req, res) => {
    const db = await getDb();
    const snapshots = await getCurrentInsightSnapshots(db, {
      today: typeof req.query.today === "string" ? req.query.today : undefined,
    });

    return res.json({ insights: snapshots });
  }),
);

router.get(
  "/insights",
  asyncHandler(async (_req, res) => {
    const db = await getDb();
    const snapshots = await listInsightSnapshots(db);

    return res.json({ insights: snapshots });
  }),
);

router.delete(
  "/insights/:id",
  asyncHandler(async (req, res) => {
    const db = await getDb();
    const deleted = await deleteInsightSnapshot(db, req.params.id);

    if (!deleted) {
      return res.status(404).json({
        error: "Наблюдение уже удалено",
      });
    }

    return res.status(204).send();
  }),
);

export default router;
