import { z } from "zod";
import { signalMetadataPayloadSchema } from "./extraction.schema.js";
import { clientSignalPayloadSchema } from "./signal.schema.js";

export const createEntrySchema = z.object({
  client_entry_id: z.string().min(1).max(128),
  entry_date: z.string().min(1),
  tags: z.array(z.string().min(1)).max(20).optional(),
  source_text_hash: z.string().regex(/^[a-f0-9]{64}$/),
  signal: clientSignalPayloadSchema,
  metadata: signalMetadataPayloadSchema.optional(),
}).strict();

export const updateEntrySchema = z.object({
  entry_date: z.string().min(1),
  tags: z.array(z.string().min(1)).max(20).optional(),
  source_text_hash: z.string().regex(/^[a-f0-9]{64}$/),
  signal: clientSignalPayloadSchema,
  metadata: signalMetadataPayloadSchema.optional(),
}).strict();
