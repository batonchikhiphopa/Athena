import { z } from "zod";
import {
  ACTIVITY_INSIGHT_BURNOUT_RELATIONS,
  ACTIVITY_INSIGHT_EVENTS,
  ACTIVITY_INSIGHT_KINDS,
  ACTIVITY_INSIGHT_LANGUAGES,
  ACTIVITY_INSIGHT_RHYTHMS,
  ACTIVITY_INSIGHT_STAGES,
  ACTIVITY_INSIGHT_STATUSES,
  CONFIDENCE_LEVELS,
} from "../../../shared/contracts/index.js";
import { activityContextSchema } from "../extraction/signal.schema.js";

const languageSchema = z.enum(ACTIVITY_INSIGHT_LANGUAGES);
const kindSchema = z.enum(ACTIVITY_INSIGHT_KINDS);
const stageSchema = z.enum(ACTIVITY_INSIGHT_STAGES);
const rhythmSchema = z.enum(ACTIVITY_INSIGHT_RHYTHMS);
const burnoutRelationSchema = z.enum(ACTIVITY_INSIGHT_BURNOUT_RELATIONS);
const recentEventSchema = z.enum(ACTIVITY_INSIGHT_EVENTS);
const activityInsightContextSchema = activityContextSchema.omit({
  activity: true,
});

export const activityInsightInputSchema = z
  .object({
    id: z.string().trim().min(1).max(52),
    label: z.string().trim().min(1).max(52),
    kind: kindSchema,
    stage: stageSchema,
    rhythm: rhythmSchema,
    burnoutRelation: burnoutRelationSchema,
    recentEvents: z.array(recentEventSchema).max(8),
    recentContexts: z.array(activityInsightContextSchema).max(8),
    evidenceCount: z.number().int().min(1).max(200),
    observationCount: z.number().int().min(1).max(200),
    spanDays: z.number().int().min(0).max(3_650),
  })
  .strict()
  .superRefine((activity, context) => {
    if (activity.observationCount > activity.evidenceCount) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["observationCount"],
        message: "observationCount cannot exceed evidenceCount",
      });
    }
  });

export const activityInsightsRequestSchema = z
  .object({
    model: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .regex(/^[a-zA-Z0-9._-]+$/)
      .optional(),
    language: languageSchema,
    activities: z.array(activityInsightInputSchema).min(1).max(8),
  })
  .strict()
  .superRefine(({ activities }, context) => {
    const ids = new Set<string>();

    activities.forEach((activity, index) => {
      if (ids.has(activity.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["activities", index, "id"],
          message: "Activity ids must be unique",
        });
      }

      ids.add(activity.id);
    });
  });

const activityInsightSchema = z
  .object({
    activityId: z.string().trim().min(1).max(52),
    text: z.string().trim().min(1).max(900),
    status: z.enum(ACTIVITY_INSIGHT_STATUSES),
    confidence: z.enum(CONFIDENCE_LEVELS),
  })
  .strict();

export const activityInsightsProviderResponseSchema = z
  .object({
    insights: z.array(activityInsightSchema).min(1).max(8),
  })
  .strict();
