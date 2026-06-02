import type { InsightSnapshot } from "../../types";
import type { Language } from "../../i18n/languages";
import { generateAthenaPlaceholder } from "../../lib/athenaPlaceholder";
import { formatInsightText } from "../../lib/insightText";

export function buildAthenaPlaceholder(
  editorInsight: InsightSnapshot | null,
  personaTextEnabled: boolean,
  language: Language,
) {
  if (!personaTextEnabled) return "";

  const editorInsightText = editorInsight
    ? formatInsightText(editorInsight, { language, personaTextEnabled })
    : null;

  const insightMap: Partial<Record<InsightSnapshot["layer"], string>> =
    editorInsight && editorInsightText
      ? { [editorInsight.layer]: editorInsightText }
      : {};

  return generateAthenaPlaceholder(insightMap, {}, language);
}
