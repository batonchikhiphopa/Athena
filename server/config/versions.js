import "./load-env.js";

export const ACTIVE_SCHEMA_VERSION = "signal.v2";
export const ACTIVE_PROMPT_VERSION = "extraction.v2";

export const ACTIVE_MODEL = process.env.OLLAMA_MODEL ?? "gpt-oss:20b";
export const DEFAULT_OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "gpt-oss:20b";
export const DEFAULT_GEMINI_MODEL =
  process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";
