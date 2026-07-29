import type { ActivityContext, ConfidenceLevel } from "./signal.js";

export const ACTIVITY_INSIGHT_LANGUAGES = ["en", "de", "ru", "uk"] as const;
export const ACTIVITY_INSIGHT_KINDS = ["task", "activity", "habit"] as const;
export const ACTIVITY_INSIGHT_STAGES = [
  "starting",
  "active",
  "stalled",
  "completed",
  "unknown",
] as const;
export const ACTIVITY_INSIGHT_RHYTHMS = [
  "steady",
  "irregular",
  "returning",
  "paused",
  "insufficient",
] as const;
export const ACTIVITY_INSIGHT_BURNOUT_RELATIONS = [
  "draining",
  "restorative",
  "mixed",
  "unclear",
] as const;
export const ACTIVITY_INSIGHT_EVENTS = ["result", "blocker", "mention"] as const;
export const ACTIVITY_INSIGHT_STATUSES = ["ready", "insufficient"] as const;

export type ActivityInsightLanguage =
  (typeof ACTIVITY_INSIGHT_LANGUAGES)[number];
export type ActivityInsightKind = (typeof ACTIVITY_INSIGHT_KINDS)[number];
export type ActivityInsightStage = (typeof ACTIVITY_INSIGHT_STAGES)[number];
export type ActivityInsightRhythm = (typeof ACTIVITY_INSIGHT_RHYTHMS)[number];
export type ActivityInsightBurnoutRelation =
  (typeof ACTIVITY_INSIGHT_BURNOUT_RELATIONS)[number];
export type ActivityInsightEvent = (typeof ACTIVITY_INSIGHT_EVENTS)[number];

export type ActivityInsightContext = Omit<ActivityContext, "activity">;

export type ActivityInsightInput = {
  id: string;
  label: string;
  kind: ActivityInsightKind;
  stage: ActivityInsightStage;
  rhythm: ActivityInsightRhythm;
  burnoutRelation: ActivityInsightBurnoutRelation;
  recentEvents: ActivityInsightEvent[];
  recentContexts: ActivityInsightContext[];
  evidenceCount: number;
  observationCount: number;
  spanDays: number;
};

export type ActivityInsightsRequest = {
  model?: string;
  language: ActivityInsightLanguage;
  activities: ActivityInsightInput[];
};

export type ActivityInsightStatus = (typeof ACTIVITY_INSIGHT_STATUSES)[number];
export type ActivityInsightConfidence = ConfidenceLevel;

export type ActivityInsightSource = {
  title: string;
  url: string;
};

export type ActivityInsight = {
  activityId: string;
  text: string;
  status: ActivityInsightStatus;
  confidence: ActivityInsightConfidence;
  sources?: ActivityInsightSource[];
};

export type ActivityInsightsResponse = {
  insights: ActivityInsight[];
};
