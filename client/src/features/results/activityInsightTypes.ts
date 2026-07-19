import type { ActivityInsightSource } from "../../shared/contracts";

export type CachedActivityInsight = {
  activityId: string;
  confidence: "low" | "medium" | "high";
  fingerprint: string;
  generatedAt: string;
  model: string;
  status: "ready" | "insufficient";
  text: string;
  sources?: ActivityInsightSource[];
};

export type ActivityInsightView = CachedActivityInsight & {
  isStale: boolean;
};

export type ActivityInsightState = {
  canFormulateReview: boolean;
  deleteInsight: (activityId: string) => Promise<void>;
  error: Error | null;
  formulateReview: () => Promise<void>;
  insights: Map<string, ActivityInsightView>;
  isLoading: boolean;
  isRefreshing: boolean;
};
