import type {
  ActivityContext,
  ActivityInsightBurnoutRelation,
  ActivityInsightEvent,
  ActivityInsightInput,
  ActivityInsightKind,
  ActivityInsightRhythm,
  ActivityInsightStage,
} from "../../shared/contracts";

export type ActivityMentionSource = "activity" | "tag" | "text";
export type ActivityKind = ActivityInsightKind;
export type ActivityMentionMarker = "result" | "blocker" | null;
export type ActivityStage = ActivityInsightStage;
export type ActivityRhythm = ActivityInsightRhythm;
export type ActivityBurnoutRelation = ActivityInsightBurnoutRelation;
export type ActivityInsightEventType = ActivityInsightEvent;
export type { ActivityInsightInput };

export type ActivityMentionDebugSignals = {
  fatigue: number | null;
  focus: number | null;
  load: number | null;
};

export type ActivityMention = {
  context: ActivityContext | null;
  debugSignals: ActivityMentionDebugSignals;
  entryDate: string;
  entryId: string | null;
  marker: ActivityMentionMarker;
  sources: ActivityMentionSource[];
  text: string;
};

export type ActivityGroup = {
  id: string;
  insightInput: ActivityInsightInput;
  kind: ActivityKind;
  label: string;
  latestEntryDate: string;
  mentions: ActivityMention[];
};

export type ActivityIndex = {
  activities: ActivityGroup[];
  isDemo: boolean;
};
