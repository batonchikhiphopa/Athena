import type { InsightSnapshot } from "../types";

type InsightStripProps = {
  insights: InsightSnapshot[];
};

const layerLabels: Record<InsightSnapshot["layer"], string> = {
  day: "Вчера",
  week: "Неделя",
  month: "Месяц",
};

export function InsightStrip({ insights }: InsightStripProps) {
  if (insights.length === 0) return null;

  return (
    <div className="mb-5 grid gap-3 md:grid-cols-3">
      {insights.map((insight) => (
        <div
          className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
          key={`${insight.layer}-${insight.period_start}-${insight.period_end}`}
        >
          <div className="mb-2 text-xs uppercase text-zinc-400">
            {layerLabels[insight.layer]}
          </div>
          <div className="text-sm leading-6 text-zinc-800">{insight.text}</div>
        </div>
      ))}
    </div>
  );
}
