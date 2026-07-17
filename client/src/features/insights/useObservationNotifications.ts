import { useCallback, useMemo, useState } from "react";
import type { InsightSnapshot } from "../../shared/contracts";
import type { ActivityInsightView } from "../results/activityInsightTypes";
import {
  createActivityInsightSeenKey,
  getSeenActivityInsightKeys,
  getSeenObservationIds,
  markObservationFeedSeen,
} from "./seenInsights";

export function useObservationNotifications({
  activityInsights,
  observations,
}: {
  activityInsights: Map<string, ActivityInsightView>;
  observations: InsightSnapshot[];
}) {
  const [seenObservationIds, setSeenObservationIds] = useState(
    getSeenObservationIds,
  );
  const [seenActivityInsightKeys, setSeenActivityInsightKeys] = useState(
    getSeenActivityInsightKeys,
  );
  const activityInsightKeys = useMemo(
    () =>
      [...activityInsights.values()].map((insight) =>
        createActivityInsightSeenKey(insight.activityId, insight.generatedAt),
      ),
    [activityInsights],
  );
  const hasUnread =
    observations.some((insight) => !seenObservationIds.has(insight.id)) ||
    activityInsightKeys.some((key) => !seenActivityInsightKeys.has(key));

  const markAllSeen = useCallback(() => {
    const observationIds = observations.map((insight) => insight.id);
    markObservationFeedSeen({ activityInsightKeys, observationIds });
    setSeenObservationIds((current) =>
      new Set([...current, ...observationIds]),
    );
    setSeenActivityInsightKeys((current) =>
      new Set([...current, ...activityInsightKeys]),
    );
  }, [activityInsightKeys, observations]);

  return { hasUnread, markAllSeen };
}
