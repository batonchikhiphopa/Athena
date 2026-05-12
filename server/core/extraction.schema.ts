import { z } from "zod";
import { clientSignalPayloadSchema } from "./signal.schema.js";

export const extractionProviderSchema = z.enum(["ollama", "gemini", "off"]);

export const extractionRequestSchema = z.object({
  text: z.string().min(1).max(20_000),
  provider: extractionProviderSchema.optional(),
  model: z.string().min(1).max(128).optional(),
}).strict();

export const signalMetadataPayloadSchema = z.object({
  schema_version: z.string().min(1),
  prompt_version: z.string().min(1),
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
