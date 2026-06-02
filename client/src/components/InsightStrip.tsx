import type { InsightSnapshot } from "../types";
import { useI18n } from "../i18n/useI18n";
import type { MessageKey } from "../i18n/messages";

type InsightStripProps = {
  insights: InsightSnapshot[];
};

export function InsightStrip({ insights }: InsightStripProps) {
  const { t } = useI18n();

  if (insights.length === 0) return null;

  return (
    <div className="mb-5 grid gap-3 md:grid-cols-3">
      {insights.map((insight) => (
        <div
          className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
          key={`${insight.layer}-${insight.period_start}-${insight.period_end}`}
        >
          <div className="mb-2 text-xs uppercase text-zinc-400">
            {t(getLayerLabelKey(insight.layer))}
          </div>
          <div className="text-sm leading-6 text-zinc-800">{insight.text}</div>
        </div>
      ))}
    </div>
  );
}

function getLayerLabelKey(layer: InsightSnapshot["layer"]): MessageKey {
  if (layer === "day") return "insights.layer.day";
  if (layer === "week") return "insights.layer.week";
  return "insights.layer.month";
}
