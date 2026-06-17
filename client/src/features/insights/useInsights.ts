import { useCallback, useEffect, useState } from "react";
import type { InsightSnapshot } from "../../types";
import {
  deleteInsightSnapshot,
  loadCurrentInsights,
  loadInsightHistory,
} from "./insightsApi";
import { todayDateOnly } from "../../lib/dates";
import {
  getSeenEditorInsightIds,
  getSeenObservationInsightIds,
  markEditorInsightSeen,
  markObservationInsightsSeen as persistObservationInsightsSeen,
} from "../../lib/storage";
import { pickLatestUnseenEditorInsight } from "../editor/editorInsight";

type UseInsightsOptions = {
  draftLoaded: boolean;
  draftText: string;
  personaTextEnabled: boolean;
};

export function useInsights({
  draftLoaded,
  draftText,
  personaTextEnabled,
}: UseInsightsOptions) {
  const [insights, setInsights] = useState<InsightSnapshot[]>([]);
  const [editorInsight, setEditorInsight] = useState<InsightSnapshot | null>(
    null,
  );
  const [observationHistory, setObservationHistory] = useState<
    InsightSnapshot[]
  >([]);
  const [hasUnreadInsights, setHasUnreadInsights] = useState(false);

  const refreshInsights = useCallback(async () => {
    try {
      const currentInsights = await loadCurrentInsights(todayDateOnly());
      setInsights(currentInsights);
      if (hasUnseenObservationInsight(currentInsights)) {
        setHasUnreadInsights(true);
      }
    } catch (error) {
      console.warn("[insights] unavailable:", error);
      setInsights([]);
    }
  }, []);

  const refreshObservationHistory = useCallback(async () => {
    try {
      const history = await loadInsightHistory();
      setObservationHistory(history);
      setHasUnreadInsights(
        (hasUnread) => hasUnread || hasUnseenObservationInsight(history),
      );
      return history;
    } catch (error) {
      console.warn("[insights:history] unavailable:", error);
      setObservationHistory([]);
      return [];
    }
  }, []);

  useEffect(() => {
    if (!personaTextEnabled) {
      if (editorInsight) setEditorInsight(null);
      return;
    }

    if (!draftLoaded || draftText.trim() || editorInsight) return;

    const nextInsight = pickLatestUnseenEditorInsight(
      insights,
      getSeenEditorInsightIds(),
    );
    if (!nextInsight) return;

    setEditorInsight(nextInsight);
    markEditorInsightSeen(nextInsight.id);
  }, [draftLoaded, draftText, editorInsight, insights, personaTextEnabled]);

  async function deleteInsight(insight: InsightSnapshot) {
    try {
      await deleteInsightSnapshot(insight.id);
    } catch (error) {
      console.warn("[insights:delete]", error);
      return;
    }

    if (editorInsight?.id === insight.id) {
      setEditorInsight(null);
    }

    await refreshInsights();
    await refreshObservationHistory();
  }

  function clearEditorInsight() {
    setEditorInsight(null);
  }

  function markObservationInsightsSeen(
    nextInsights: InsightSnapshot[] = observationHistory,
  ) {
    const ids = new Set([
      ...nextInsights.map((insight) => insight.id),
      ...insights.map((insight) => insight.id),
    ]);
    persistObservationInsightsSeen(Array.from(ids));
    setHasUnreadInsights(false);
  }

  return {
    editorInsight,
    hasUnreadInsights,
    insights,
    observationHistory,
    clearEditorInsight,
    deleteInsight,
    markObservationInsightsSeen,
    refreshInsights,
    refreshObservationHistory,
  };
}

function hasUnseenObservationInsight(insights: InsightSnapshot[]) {
  const seenIds = getSeenObservationInsightIds();

  return insights.some((insight) => !seenIds.has(insight.id));
}
