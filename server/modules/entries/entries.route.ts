import express from "express";
import { appendSignalSchema } from "../extraction/extraction.schema.js";
import { createEntrySchema, updateEntrySchema } from "./entry.schema.js";
import { getDb } from "../../db/sqlite.js";
import {
  asyncHandler,
  isCodedError,
  sendValidationError,
} from "../../platform/http/http.js";
import {
  appendEntrySignal,
  createEntry,
  deleteEntry,
  listEntries,
  getEntryById,
  updateEntry,
} from "./entry.service.js";

const router = express.Router();

router.get(
  "/entries",
  asyncHandler(async (_req, res) => {
    const entries = await listEntries(await getDb());

    return res.json({ entries });
  }),
);

router.get(
  "/entries/:id",
  asyncHandler(async (req, res) => {
    const db = await getDb();
    const entry = await getEntryById(db, req.params.id);

    if (!entry) {
      return res.status(404).json({
        error: "Запись не найдена",
      });
    }

    return res.json({ entry });
  }),
);

router.post("/entries", async (req, res, next) => {
  const parsed = createEntrySchema.safeParse(req.body);

  if (!parsed.success) {
    return sendValidationError(
      res,
      "Не удалось обработать данные записи",
      parsed.error,
    );
  }

  try {
    const db = await getDb();
    const entryId = await createEntry(db, parsed.data);
    const entry = await getEntryById(db, entryId ?? "");

    return res.status(201).json({ entry });
  } catch (error) {
    if (isCodedError(error) && error.code === "SOURCE_HASH_MISMATCH") {
      return res.status(409).json({
        error: "Запись изменилась, попробуйте сохранить её ещё раз",
      });
    }

    return next(error);
  }
});

router.patch(
  "/entries/:id",
  asyncHandler(async (req, res) => {
  const parsed = updateEntrySchema.safeParse(req.body);

  if (!parsed.success) {
    return sendValidationError(
      res,
      "Не удалось обработать данные записи",
      parsed.error,
    );
  }

    const db = await getDb();
    const entry = await updateEntry(db, req.params.id, parsed.data);

    if (!entry) {
      return res.status(404).json({
        error: "Запись не найдена",
      });
    }

    return res.json({ entry });
  }),
);

router.delete(
  "/entries/:id",
  asyncHandler(async (req, res) => {
    const db = await getDb();
    const deleted = await deleteEntry(db, req.params.id);

    if (!deleted) {
      return res.status(404).json({
        error: "Запись не найдена",
      });
    }

    return res.status(204).send();
  }),
);

router.post("/entries/:id/signals", async (req, res, next) => {
  const parsed = appendSignalSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendValidationError(
      res,
      "Не удалось обработать данные анализа",
      parsed.error,
    );
  }

  try {
    const db = await getDb();
    const entry = await appendEntrySignal(db, req.params.id, parsed.data);

    if (!entry) {
      return res.status(404).json({
        error: "Запись не найдена",
      });
    }

    return res.json({ entry });
  } catch (error) {
    if (isCodedError(error) && error.code === "SOURCE_HASH_MISMATCH") {
      return res.status(409).json({
        error: "Запись изменилась, попробуйте сохранить её ещё раз",
      });
    }

    return next(error);
  }
});

export default router;
