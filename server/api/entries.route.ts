import express from "express";
import { appendSignalSchema } from "../core/extraction.schema.js";
import { createEntrySchema, updateEntrySchema } from "../core/entry.schema.js";
import { getDb } from "../db/sqlite.js";
import {
  appendEntrySignal,
  createEntry,
  deleteEntry,
  listEntries,
  getEntryById,
  updateEntry,
} from "../services/entry.service.js";

type CodedError = Error & {
  code?: string;
};

const router = express.Router();

router.get("/entries", async (_req, res) => {
  try {
    const db = await getDb();
    const entries = await listEntries(db);

    return res.json({ entries });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to list entries",
    });
  }
});

router.get("/entries/:id", async (req, res) => {
  try {
    const db = await getDb();
    const entry = await getEntryById(db, req.params.id);

    if (!entry) {
      return res.status(404).json({
        error: "Entry not found",
      });
    }

    return res.json({ entry });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to get entry",
    });
  }
});

router.post("/entries", async (req, res) => {
  const parsed = createEntrySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid entry payload",
      details: parsed.error.flatten(),
    });
  }

  try {
    const db = await getDb();
    const entryId = await createEntry(db, parsed.data);
    const entry = await getEntryById(db, entryId ?? "");

    return res.status(201).json({ entry });
  } catch (error) {
    console.error(error);

    if (isCodedError(error) && error.code === "SOURCE_HASH_MISMATCH") {
      return res.status(409).json({
        error: "Source text hash mismatch",
      });
    }

    return res.status(500).json({
      error: "Failed to create entry",
    });
  }
});

router.patch("/entries/:id", async (req, res) => {
  const parsed = updateEntrySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid entry payload",
      details: parsed.error.flatten(),
    });
  }

  try {
    const db = await getDb();
    const entry = await updateEntry(db, req.params.id, parsed.data);

    if (!entry) {
      return res.status(404).json({
        error: "Entry not found",
      });
    }

    return res.json({ entry });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to update entry",
    });
  }
});

router.delete("/entries/:id", async (req, res) => {
  try {
    const db = await getDb();
    const deleted = await deleteEntry(db, req.params.id);

    if (!deleted) {
      return res.status(404).json({
        error: "Entry not found",
      });
    }

    return res.status(204).send();
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to delete entry",
    });
  }
});

router.post("/entries/:id/signals", async (req, res) => {
  const parsed = appendSignalSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid signal payload",
      details: parsed.error.flatten(),
    });
  }

  try {
    const db = await getDb();
    const entry = await appendEntrySignal(db, req.params.id, parsed.data);

    if (!entry) {
      return res.status(404).json({
        error: "Entry not found",
      });
    }

    return res.json({ entry });
  } catch (error) {
    console.error(error);

    if (isCodedError(error) && error.code === "SOURCE_HASH_MISMATCH") {
      return res.status(409).json({
        error: "Source text hash mismatch",
      });
    }

    return res.status(500).json({
      error: "Failed to append signal",
    });
  }
});

export default router;

function isCodedError(error: unknown): error is CodedError {
  return error instanceof Error && "code" in error;
}
