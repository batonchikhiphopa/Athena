import { z } from "zod";
import { MARKERS } from "./markers.js";

export const markerSchema = z.enum(MARKERS);

const scoreSchema = z.number().int().min(0).max(10).nullable();

export const extractedSignalCandidateSchema = z.object({
  topics: z.array(z.string().min(1)).max(5),
  activities: z.array(z.string().min(1)).max(5),
  markers: z.array(markerSchema).max(8),

  load: scoreSchema,
  fatigue: scoreSchema,
  focus: scoreSchema,

  signal_quality: z.enum(["valid", "sparse"]),
}).strict();

export const sanitizedSignalSchema = extractedSignalCandidateSchema.extend({
  entry_id: z.number().int().positive(),
  source_text_hash: z.string().min(1),

  schema_version: z.string().min(1),
  prompt_version: z.string().min(1),
  model: z.string().min(1),

  created_at: z.string().min(1),
});

export const fallbackSignalSchema = z.object({
  topics: z.array(z.string()).length(0),
  activities: z.array(z.string()).length(0),
  markers: z.array(markerSchema).length(0),

  load: z.null(),
  fatigue: z.null(),
  focus: z.null(),

  signal_quality: z.literal("fallback"),

  entry_id: z.number().int().positive(),
  source_text_hash: z.string().min(1),

  schema_version: z.string().min(1),
  prompt_version: z.string().min(1),
  model: z.string().min(1),

  created_at: z.string().min(1),
});

export const clientFallbackSignalSchema = z.object({
  topics: z.array(z.string()).length(0),
  activities: z.array(z.string()).length(0),
  markers: z.array(markerSchema).length(0),

  load: z.null(),
  fatigue: z.null(),
  focus: z.null(),

  signal_quality: z.literal("fallback"),
}).strict();

export const clientSignalPayloadSchema = z.union([
  extractedSignalCandidateSchema,
  clientFallbackSignalSchema,
]);

export const overridePayloadSchema = z.object({
  load: scoreSchema.optional(),
  fatigue: scoreSchema.optional(),
  focus: scoreSchema.optional(),
}).strict();
