import type { InsightSnapshot } from "../../types";

export function pickLatestUnseenEditorInsight(
  insights: InsightSnapshot[],
  seenInsightIds: Set<number>,
) {
  const latestInsight = [...insights].sort(compareInsightsByRecency).at(0);

  if (!latestInsight || seenInsightIds.has(latestInsight.id)) return null;

  return latestInsight;
}

function compareInsightsByRecency(
  left: InsightSnapshot,
  right: InsightSnapshot,
) {
  const generatedOrder = right.generated_at.localeCompare(left.generated_at);
  if (generatedOrder !== 0) return generatedOrder;

  const periodOrder = right.period_end.localeCompare(left.period_end);
  if (periodOrder !== 0) return periodOrder;

  return right.id - left.id;
}
