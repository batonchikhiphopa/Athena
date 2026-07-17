import { z } from "zod";
import {
  ACTIVITY_CONTEXT_AGENCIES,
  ACTIVITY_CONTEXT_BLOCKERS,
  ACTIVITY_CONTEXT_EFFECTS,
  ACTIVITY_CONTEXT_EVENTS,
  ACTIVITY_CONTEXT_KINDS,
  ACTIVITY_CONTEXT_NEXT_STEPS,
  ACTIVITY_CONTEXT_OUTCOMES,
  ACTIVITY_CONTEXT_STRATEGIES,
  CONFIDENCE_LEVELS,
  SIGNAL_AXES,
  SIGNAL_LEVELS,
} from "../../../shared/contracts/signal.js";
import { MARKERS } from "./markers.js";

export const markerSchema = z.enum(MARKERS);
export const signalAxisSchema = z.enum(SIGNAL_AXES);
export const signalLevelSchema = z.enum(SIGNAL_LEVELS);
export const confidenceLevelSchema = z.enum(CONFIDENCE_LEVELS);
export const entryIntentSchema = z.enum([
  "log",
  "reflection",
  "planning",
  "decision",
  "gratitude",
  "venting",
  "unknown",
]);
export const structureDensitySchema = z.enum(["empty", "sparse", "normal", "dense"]);
export const temporalBucketSchema = z.enum([
  "morning",
  "day",
  "evening",
  "night",
  "unknown",
]);
export const temporalContextSourceSchema = z.enum([
  "entry_metadata",
  "created_at",
  "absent",
]);

export const activityContextSchema = z
  .object({
    activity: z.string().trim().min(1).max(52),
    kind: z.enum(ACTIVITY_CONTEXT_KINDS),
    event: z.enum(ACTIVITY_CONTEXT_EVENTS),
    outcome: z.enum(ACTIVITY_CONTEXT_OUTCOMES),
    blockers: z.array(z.enum(ACTIVITY_CONTEXT_BLOCKERS)).max(2),
    strategy: z.enum(ACTIVITY_CONTEXT_STRATEGIES),
    next_step: z.enum(ACTIVITY_CONTEXT_NEXT_STEPS),
    agency: z.enum(ACTIVITY_CONTEXT_AGENCIES),
    effect: z.enum(ACTIVITY_CONTEXT_EFFECTS),
    confidence: confidenceLevelSchema,
  })
  .strict();

const scoreSchema = z.number().int().min(0).max(10).nullable();
const metricConfidenceSchema = z.object({
  load: confidenceLevelSchema,
  fatigue: confidenceLevelSchema,
  focus: confidenceLevelSchema,
}).strict();
const fallbackMetricConfidenceSchema = z.object({
  load: z.literal("low"),
  fatigue: z.literal("low"),
  focus: z.literal("low"),
}).strict();

const stateInferenceValueSchema = z.object({
  level: signalLevelSchema,
  confidence: confidenceLevelSchema,
  basis: z.array(z.string().min(1).max(160)).max(6),
}).strict();

const entryIntentSignalSchema = z.object({
  intent: entryIntentSchema,
  confidence: confidenceLevelSchema,
  basis: z.array(z.string().min(1).max(160)).max(6),
}).strict();

const defaultEntryIntentSignalSchema = z.object({
  intent: z.literal("unknown"),
  confidence: z.literal("low"),
  basis: z.array(z.string()).length(0),
}).strict();

const structureSignalSchema = z.object({
  density: structureDensitySchema,
  coherence: confidenceLevelSchema,
  has_question: z.boolean(),
  has_plan: z.boolean(),
  basis: z.array(z.string().min(1).max(160)).max(6),
}).strict();

const defaultStructureSignalSchema = z.object({
  density: z.literal("empty"),
  coherence: z.literal("low"),
  has_question: z.literal(false),
  has_plan: z.literal(false),
  basis: z.array(z.string()).length(0),
}).strict();

const temporalContextSchema = z.object({
  local_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  time_bucket: temporalBucketSchema,
  source: temporalContextSourceSchema,
}).strict();

const defaultTemporalContextSchema = z.object({
  local_date: z.null(),
  time_bucket: z.literal("unknown"),
  source: z.literal("absent"),
}).strict();

const stateInferenceShape = Object.fromEntries(
  SIGNAL_AXES.map((axis) => [axis, stateInferenceValueSchema.optional()]),
) as Record<(typeof SIGNAL_AXES)[number], z.ZodOptional<typeof stateInferenceValueSchema>>;

export const stateInferenceSchema = z.object(stateInferenceShape).strict();
const emptyStateInferenceSchema = z.object({}).strict();

export const extractedSignalCandidateSchema = z.object({
  topics: z.array(z.string().min(1)).max(5),
  activities: z.array(z.string().min(1)).max(5),
  activity_contexts: z.array(activityContextSchema).max(2),
  markers: z.array(markerSchema).max(8),
  state_inference: stateInferenceSchema,
  metric_confidence: metricConfidenceSchema,
  entry_intent: entryIntentSignalSchema,
  structure_signal: structureSignalSchema,
  temporal_context: temporalContextSchema,
  quality_reason: z.string().min(1).max(128),

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
  activity_contexts: z.array(activityContextSchema).length(0),
  markers: z.array(markerSchema).length(0),
  state_inference: emptyStateInferenceSchema,
  metric_confidence: fallbackMetricConfidenceSchema,
  entry_intent: defaultEntryIntentSignalSchema,
  structure_signal: defaultStructureSignalSchema,
  temporal_context: defaultTemporalContextSchema,
  quality_reason: z.literal("fallback"),

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
  activity_contexts: z.array(activityContextSchema).length(0),
  markers: z.array(markerSchema).length(0),
  state_inference: emptyStateInferenceSchema,
  metric_confidence: fallbackMetricConfidenceSchema,
  entry_intent: entryIntentSignalSchema,
  structure_signal: structureSignalSchema,
  temporal_context: temporalContextSchema,
  quality_reason: z.literal("fallback"),

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
