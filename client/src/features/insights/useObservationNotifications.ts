import { useCallback, useState } from "react";
import type { InsightSnapshot } from "../../shared/contracts";
import {
  getSeenExtractionProposalIds,
  getSeenObservationIds,
  markObservationFeedSeen,
} from "./seenInsights";

export function useObservationNotifications({
  observations,
  pendingProposalIds,
}: {
  observations: InsightSnapshot[];
  pendingProposalIds: string[];
}) {
  const [seenObservationIds, setSeenObservationIds] = useState(
    getSeenObservationIds,
  );
  const [seenProposalIds, setSeenProposalIds] = useState(
    getSeenExtractionProposalIds,
  );
  const hasUnread =
    observations.some((insight) => !seenObservationIds.has(insight.id)) ||
    pendingProposalIds.some((id) => !seenProposalIds.has(id));

  const markAllSeen = useCallback(() => {
    const observationIds = observations.map((insight) => insight.id);
    markObservationFeedSeen({
      observationIds,
      proposalIds: pendingProposalIds,
    });
    setSeenObservationIds((current) =>
      new Set([...current, ...observationIds]),
    );
    setSeenProposalIds((current) =>
      new Set([...current, ...pendingProposalIds]),
    );
  }, [observations, pendingProposalIds]);

  return { hasUnread, markAllSeen };
}
