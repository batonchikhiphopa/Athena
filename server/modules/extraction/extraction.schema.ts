import { z } from "zod";
import {
  ACTIVE_PROMPT_VERSION,
  ACTIVE_SCHEMA_VERSION,
} from "../../config/versions.js";
import { clientSignalPayloadSchema } from "./signal.schema.js";

export const extractionProviderSchema = z.enum(["ollama", "gemini", "off"]);

export const extractionRequestSchema = z.object({
  text: z.string().min(1).max(20_000),
  provider: extractionProviderSchema.optional(),
  model: z.string().min(1).max(128).optional(),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  captured_at: z.string().min(1).optional(),
}).strict();

export const signalMetadataPayloadSchema = z.object({
  schema_version: z.literal(ACTIVE_SCHEMA_VERSION),
  prompt_version: z.literal(ACTIVE_PROMPT_VERSION),
  provider: extractionProviderSchema.default("ollama"),
  model: z.string().min(1),
  error_code: z.string().min(1).nullable().optional(),
  created_at: z.string().min(1).optional(),
}).strict();

export const appendSignalSchema = z.object({
  source_text_hash: z.string().regex(/^[a-f0-9]{64}$/),
  signal: clientSignalPayloadSchema,
  metadata: signalMetadataPayloadSchema.optional(),
}).strict();
