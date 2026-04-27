import express from "express";
import { extractionRequestSchema } from "../core/extraction.schema.js";
import {
  extractSignal,
  getExtractionOptions,
  getExtractionStatus,
} from "../services/extraction.service.js";

const router = express.Router();

router.get("/extractions/config", (_req, res) => {
  return res.json(getExtractionOptions());
});

router.get("/extractions/status", async (req, res) => {
  try {
    const status = await getExtractionStatus({
      provider: req.query.provider,
      model: req.query.model,
    });

    return res.json(status);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to check extraction status",
    });
  }
});

router.post("/extractions", async (req, res) => {
  const parsed = extractionRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid extraction payload",
      details: parsed.error.flatten(),
    });
  }

  try {
    const result = await extractSignal(parsed.data);

    return res.json(result);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to extract signal",
    });
  }
});

export default router;
