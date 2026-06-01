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
      error: "Не удалось проверить доступность анализа",
    });
  }
});

router.post("/extractions", async (req, res) => {
  const parsed = extractionRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Не удалось обработать текст для анализа",
      details: parsed.error.flatten(),
    });
  }

  try {
    const result = await extractSignal(parsed.data);

    return res.json(result);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Не удалось выполнить анализ текста",
    });
  }
});

export default router;
