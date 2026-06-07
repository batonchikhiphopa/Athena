import express from "express";
import { extractionRequestSchema } from "../core/extraction.schema.js";
import {
  extractSignal,
  getExtractionOptions,
  getExtractionStatus,
} from "../services/extraction.service.js";
import { asyncHandler, sendValidationError } from "./http.js";

const router = express.Router();

router.get("/extractions/config", (_req, res) => {
  return res.json(getExtractionOptions());
});

router.get(
  "/extractions/status",
  asyncHandler(async (req, res) => {
    const status = await getExtractionStatus({
      provider: req.query.provider,
      model: req.query.model,
    });

    return res.json(status);
  }),
);

router.post(
  "/extractions",
  asyncHandler(async (req, res) => {
  const parsed = extractionRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendValidationError(
      res,
      "Не удалось обработать текст для анализа",
      parsed.error,
    );
  }

    const result = await extractSignal(parsed.data);

    return res.json(result);
  }),
);

export default router;
