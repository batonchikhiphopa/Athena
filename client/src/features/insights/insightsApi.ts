import type { InsightSnapshot } from "../../shared/contracts";

type InsightsResponse = { insights: InsightSnapshot[] };

export async function loadCurrentInsights(today: string) {
  try {
    const params = new URLSearchParams({ today });
    const response = await fetch(`/insights/current?${params.toString()}`, {
      credentials: "same-origin",
    });
    if (!response.ok) throw new Error("Не удалось загрузить текущие наблюдения");
    return ((await response.json()) as InsightsResponse).insights ?? [];
  } catch (error) {
    console.warn("[api:insights:current]", error);
    return [];
  }
}

export async function loadInsightHistory() {
  try {
    const response = await fetch("/insights", { credentials: "same-origin" });
    if (!response.ok) throw new Error("Не удалось загрузить историю наблюдений");
    return ((await response.json()) as InsightsResponse).insights ?? [];
  } catch (error) {
    console.warn("[api:insights:history]", error);
    return [];
  }
}

export async function deleteInsightSnapshot(insightId: number | string) {
  const response = await fetch(`/insights/${encodeURIComponent(insightId)}`, {
    method: "DELETE",
    credentials: "same-origin",
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Не удалось удалить наблюдение: ${await response.text()}`);
  }
}
