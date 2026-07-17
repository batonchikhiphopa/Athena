import "./load-env.js";
import {
  ACTIVE_EXTRACTION_PROMPT_VERSION,
  ACTIVE_SIGNAL_SCHEMA_VERSION,
} from "../../shared/contracts/signalVersions.js";

export const ACTIVE_SCHEMA_VERSION = ACTIVE_SIGNAL_SCHEMA_VERSION;
export const ACTIVE_PROMPT_VERSION = ACTIVE_EXTRACTION_PROMPT_VERSION;

export const ACTIVE_MODEL = process.env.OLLAMA_MODEL ?? "gpt-oss:20b";
export const DEFAULT_OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "gpt-oss:20b";
export const DEFAULT_GEMINI_MODEL =
  process.env.GEMINI_MODEL ?? "gemini-3.1-flash-lite";
