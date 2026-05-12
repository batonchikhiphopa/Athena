import { formatLongDate } from "../lib/dates";
import { formatInsightText } from "../lib/insightText";
import type { InsightSnapshot } from "../types";

type ObservationsProps = {
  insights: InsightSnapshot[];
  personaTextEnabled: boolean;
  onDeleteInsight: (insight: InsightSnapshot) => void;
  onRefresh: () => void;
};

const layerLabels: Record<InsightSnapshot["layer"], string> = {
  day: "День",
  week: "Неделя",
  month: "Месяц",
};

export function Observations({
  insights,
  personaTextEnabled,
  onDeleteInsight,
  onRefresh,
}: ObservationsProps) {
  const groups = groupInsightsByDate(insights);

  return (
    <section className="mx-auto flex h-full min-h-0 w-full max-w-4xl flex-col overflow-y-auto px-8 py-8">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase text-zinc-400">Observations</div>
          <h1 className="mt-2 text-2xl font-medium text-zinc-950">
            История наблюдений
          </h1>
        </div>

        <button
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950"
          onClick={onRefresh}
          type="button"
        >
          Обновить
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-200 bg-white p-5 text-sm text-zinc-400">
          Пока пусто.
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.date}>
              <div className="mb-3 text-sm font-medium text-zinc-500">
                {formatLongDate(group.date)}
              </div>

              <div className="space-y-2">
                {group.insights.map((insight) => (
                  <article
                    className="group rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
                    key={insight.id}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs uppercase text-zinc-400">
                          {layerLabels[insight.layer]} ·{" "}
                          {formatPeriod(insight)}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-zinc-800">
                          {formatInsightText(insight, {
                            personaTextEnabled,
                          })}
                        </p>
                        <div className="mt-3 text-xs text-zinc-400">
                          {formatGeneratedAt(insight.generated_at)}
                        </div>
                      </div>

                      <button
                        aria-label="Удалить наблюдение"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 opacity-70 transition hover:bg-red-50 hover:text-red-700 group-hover:opacity-100"
                        onClick={() => onDeleteInsight(insight)}
                        type="button"
                      >
                        ×
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function groupInsightsByDate(insights: InsightSnapshot[]) {
  const sorted = [...insights].sort(compareInsights);
  const byDate = new Map<string, InsightSnapshot[]>();

  for (const insight of sorted) {
    const date = insight.period_end;
    byDate.set(date, [...(byDate.get(date) ?? []), insight]);
  }

  return Array.from(byDate, ([date, groupedInsights]) => ({
    date,
    insights: groupedInsights,
  }));
}

function compareInsights(left: InsightSnapshot, right: InsightSnapshot) {
  const dateOrder = right.period_end.localeCompare(left.period_end);
  if (dateOrder !== 0) return dateOrder;

  const layerOrder = layerWeight(left.layer) - layerWeight(right.layer);
  if (layerOrder !== 0) return layerOrder;

  return right.generated_at.localeCompare(left.generated_at);
}

function layerWeight(layer: InsightSnapshot["layer"]) {
  if (layer === "day") return 0;
  if (layer === "week") return 1;
  return 2;
}

function formatPeriod(insight: InsightSnapshot) {
  if (insight.period_start === insight.period_end) {
    return formatLongDate(insight.period_end);
  }

  return `${formatLongDate(insight.period_start)} - ${formatLongDate(
    insight.period_end,
  )}`;
}

function formatGeneratedAt(value: string) {
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
