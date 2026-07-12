import type { Language } from "../../../i18n/languages";
import { formatLongDate, getLocale } from "../../../shared/lib/dates";
import { useI18n } from "../../../i18n/useI18n";
import type { MessageKey } from "../../../i18n/messages";
import { formatInsightText } from "../content/insightText";
import type { InsightSnapshot } from "../../../shared/contracts";
import { TooltipButton } from "../../../components/TooltipButton";

type ObservationsProps = {
  insights: InsightSnapshot[];
  personaTextEnabled: boolean;
  onClose: () => void;
  onDeleteInsight: (insight: InsightSnapshot) => void;
  onRefresh: () => void;
};

export function Observations({
  insights,
  personaTextEnabled,
  onClose,
  onDeleteInsight,
  onRefresh,
}: ObservationsProps) {
  const { language, t } = useI18n();
  const groups = groupInsightsByDate(insights);

  return (
    <section className="flex h-full min-h-0 flex-col text-zinc-800">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-black/5 px-5 py-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wide text-zinc-400">
            {t("observations.eyebrow")}
          </div>
          <h2 className="truncate text-base font-medium text-zinc-900">
            {t("observations.title")}
          </h2>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            className="
              rounded-full border border-white/45 bg-white/35 px-3 py-1.5
              text-sm text-zinc-500 transition
              hover:border-white/70 hover:bg-white/55 hover:text-zinc-950
            "
            onClick={onRefresh}
            type="button"
          >
            {t("common.refresh")}
          </button>
          <button
            aria-label={t("common.close")}
            className="
              grid h-8 w-8 place-items-center rounded-full text-zinc-300
              transition hover:bg-white/45 hover:text-zinc-700
            "
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
      </header>

      <div
        className="entries-feed-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5"
        data-no-drag
      >
        {groups.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/50 bg-white/30 p-5 text-sm text-zinc-400">
            {t("observations.empty")}
          </div>
        ) : (
          <div className="space-y-5">
            {groups.map((group) => (
              <section key={group.date}>
                <div className="mb-2 text-sm font-medium text-zinc-500">
                  {formatLongDate(group.date, language)}
                </div>

                <div className="space-y-2">
                  {group.insights.map((insight) => (
                    <article
                      className="
                        group rounded-lg border border-white/20 bg-white/30 p-4
                        shadow-sm shadow-zinc-900/5 backdrop-blur-[1px]
                      "
                      key={insight.id}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs uppercase text-zinc-400">
                            {t(getLayerLabelKey(insight.layer))} ·{" "}
                            {formatPeriod(insight, language)}
                          </div>
                          <p className="mt-2 text-sm leading-6 text-zinc-800">
                            {formatInsightText(insight, {
                              language,
                              personaTextEnabled,
                            })}
                          </p>
                          <div className="mt-3 text-xs text-zinc-400">
                            {formatGeneratedAt(insight.generated_at, language)}
                          </div>
                        </div>

                        <TooltipButton
                          aria-label={t("observations.action.delete")}
                          className="
                            flex h-8 w-8 shrink-0 items-center justify-center
                            rounded-full text-zinc-400 opacity-0 transition
                            hover:bg-red-50 hover:text-red-700
                            group-hover:opacity-100 group-focus-within:opacity-100
                          "
                          onClick={() => onDeleteInsight(insight)}
                          tooltip={t("observations.action.delete")}
                          tooltipPlacement="left"
                          type="button"
                        >
                          ×
                        </TooltipButton>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
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

function formatPeriod(insight: InsightSnapshot, language: Language) {
  if (insight.period_start === insight.period_end) {
    return formatLongDate(insight.period_end, language);
  }

  return `${formatLongDate(insight.period_start, language)} - ${formatLongDate(
    insight.period_end,
    language,
  )}`;
}

function formatGeneratedAt(value: string, language: Language) {
  return new Date(value).toLocaleString(getLocale(language), {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getLayerLabelKey(layer: InsightSnapshot["layer"]): MessageKey {
  if (layer === "day") return "insights.layer.day";
  if (layer === "week") return "insights.layer.week";
  return "insights.layer.month";
}
