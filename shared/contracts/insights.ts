export type InsightLayer = "day" | "week" | "month";

export type InsightSnapshot = {
  id: number;
  layer: InsightLayer;
  period_start: string;
  period_end: string;
  topic: string | null;
  text: string;
  generated_at: string;
  expires_at: string;
};
