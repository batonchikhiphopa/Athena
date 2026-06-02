import { z } from "zod";

export const selfReportAxisSchema = z.enum([
  "mood",
  "stress",
  "energy",
  "sleep_quality",
  "function",
]);

export const selfReportDailyAggregateSchema = z
  .object({
    local_day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    axis: selfReportAxisSchema,
    count: z.number().int().positive(),
    sum: z.number().finite(),
    sum_squares: z.number().finite(),
    mean: z.number().finite().min(0).max(10),
    min: z.number().finite().min(0).max(10),
    max: z.number().finite().min(0).max(10),
    schema_version: z.literal("self_report.v1"),
    aggregate_version: z.literal("self_report_daily_aggregate.v1"),
    updated_at: z.string().min(1),
  })
  .strict()
  .refine((aggregate) => aggregate.local_day.length > 0)
  .refine((aggregate) => aggregate.min <= aggregate.max)
  .refine((aggregate) => aggregate.mean >= aggregate.min)
  .refine((aggregate) => aggregate.mean <= aggregate.max);

export const syncSelfReportDailyAggregatesSchema = z
  .object({
    aggregates: z.array(selfReportDailyAggregateSchema).max(5),
  })
  .strict();
