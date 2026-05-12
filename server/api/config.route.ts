import express from "express";
import {
  ACTIVE_MODEL,
  ACTIVE_PROMPT_VERSION,
  ACTIVE_SCHEMA_VERSION,
} from "../config/versions.js";

const router = express.Router();

router.get("/config", (_req, res) => {
  return res.json({
    ollama: {
      baseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
      model: ACTIVE_MODEL,
      requestTimeoutMs: Number(process.env.OLLAMA_REQUEST_TIMEOUT_MS ?? 30_000),
    },
    versions: {
      schema_version: ACTIVE_SCHEMA_VERSION,
      prompt_version: ACTIVE_PROMPT_VERSION,
    },
  });
});

export default router;
