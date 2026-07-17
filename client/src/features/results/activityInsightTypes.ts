export type CachedActivityInsight = {
  activityId: string;
  confidence: "low" | "medium" | "high";
  fingerprint: string;
  generatedAt: string;
  model: string;
  status: "ready" | "insufficient";
  text: string;
};

export type ActivityInsightView = CachedActivityInsight & {
  isStale: boolean;
};

export type ActivityInsightState = {
  error: Error | null;
  insights: Map<string, ActivityInsightView>;
  isLoading: boolean;
  isRefreshing: boolean;
};
