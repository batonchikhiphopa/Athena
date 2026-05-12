import type { InsightSnapshot } from "../../types";
import { generateAthenaPlaceholder } from "../../lib/athenaPlaceholder";
import { formatInsightText } from "../../lib/insightText";

export function buildAthenaPlaceholder(
  editorInsight: InsightSnapshot | null,
  personaTextEnabled: boolean,
) {
  if (!personaTextEnabled) return "";

  const editorInsightText = editorInsight
    ? formatInsightText(editorInsight, { personaTextEnabled })
    : null;

  const insightMap: Partial<Record<InsightSnapshot["layer"], string>> =
    editorInsight && editorInsightText
      ? { [editorInsight.layer]: editorInsightText }
      : {};

  return generateAthenaPlaceholder(insightMap);
}
