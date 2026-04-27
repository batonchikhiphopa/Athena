import { useCallback, useEffect, useState } from "react";
import type { InsightSnapshot } from "../../types";
import {
  deleteInsightSnapshot,
  loadCurrentInsights,
  loadInsightHistory,
} from "../../lib/api";
import { todayDateOnly } from "../../lib/dates";
import {
  getSeenEditorInsightIds,
  markEditorInsightSeen,
} from "../../lib/storage";
import { pickLatestUnseenEditorInsight } from "../editor/editorInsight";

type UseInsightsOptions = {
  draftLoaded: boolean;
  draftText: string;
};

export function useInsights({ draftLoaded, draftText }: UseInsightsOptions) {
  const [insights, setInsights] = useState<InsightSnapshot[]>([]);
  const [editorInsight, setEditorInsight] = useState<InsightSnapshot | null>(
    null,
  );
  const [observationHistory, setObservationHistory] = useState<
    InsightSnapshot[]
  >([]);

  const refreshInsights = useCallback(async () => {
    try {
      setInsights(await loadCurrentInsights(todayDateOnly()));
    } catch (error) {
      console.warn("[insights] unavailable:", error);
      setInsights([]);
    }
  }, []);

  const refreshObservationHistory = useCallback(async () => {
    try {
      setObservationHistory(await loadInsightHistory());
    } catch (error) {
      console.warn("[insights:history] unavailable:", error);
      setObservationHistory([]);
    }
  }, []);

  useEffect(() => {
    if (!draftLoaded || draftText.trim() || editorInsight) return;

    const nextInsight = pickLatestUnseenEditorInsight(
      insights,
      getSeenEditorInsightIds(),
    );
    if (!nextInsight) return;

    setEditorInsight(nextInsight);
    markEditorInsightSeen(nextInsight.id);
  }, [draftLoaded, draftText, editorInsight, insights]);

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

  return {
    editorInsight,
    insights,
    observationHistory,
    clearEditorInsight,
    deleteInsight,
    refreshInsights,
    refreshObservationHistory,
  };
}
