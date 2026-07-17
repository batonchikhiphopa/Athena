import type { Language } from "../../../i18n/languages";
import { getResultsCopy } from "../resultsCopy";
import type { ActivityInsightView } from "../activityInsightTypes";
import type { ActivityGroup, ActivityMention } from "../resultsTypes";

export function ActivityDebug({
  activity,
  copy,
  insight,
  language,
  model,
}: {
  activity: ActivityGroup;
  copy: ReturnType<typeof getResultsCopy>;
  insight: ActivityInsightView | null;
  language: Language;
  model: string;
}) {
  const input = activity.insightInput;
  const values = [
    [copy.debug.kind, input.kind],
    [copy.debug.stage, input.stage],
    [copy.debug.rhythm, input.rhythm],
    [copy.debug.burnout, input.burnoutRelation],
    [copy.debug.evidence, String(input.evidenceCount)],
    [copy.debug.span, String(input.spanDays)],
    [copy.debug.recentEvents, input.recentEvents.join(", ") || "—"],
    [copy.debug.load, formatAverageSignal(activity, "load")],
    [copy.debug.fatigue, formatAverageSignal(activity, "fatigue")],
    [copy.debug.focus, formatAverageSignal(activity, "focus")],
    [copy.debug.status, insight?.status ?? "—"],
    [copy.debug.confidence, insight?.confidence ?? "—"],
    [copy.debug.model, insight?.model ?? model],
    [
      copy.debug.generated,
      insight ? new Date(insight.generatedAt).toLocaleString(language) : "—",
    ],
    [copy.debug.stale, insight?.isStale ? "true" : "false"],
  ];

  return (
    <details className="mt-4 rounded-lg border border-zinc-900/10 bg-zinc-950/[0.025] px-3 py-2 font-mono text-[10px] text-zinc-500">
      <summary className="cursor-pointer select-none">{copy.debug.title}</summary>
      <dl className="mt-3 grid gap-x-5 gap-y-2 min-[620px]:grid-cols-2">
        {values.map(([label, value]) => (
          <div className="min-w-0" key={label}>
            <dt className="text-zinc-400">{label}</dt>
            <dd className="truncate text-zinc-700" title={value}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

function formatAverageSignal(
  activity: ActivityGroup,
  key: keyof ActivityMention["debugSignals"],
) {
  const values = activity.mentions
    .map((mention) => mention.debugSignals[key])
    .filter((value): value is number => value !== null);
  if (values.length === 0) return "—";

  return (
    values.reduce((sum, value) => sum + value, 0) / values.length
  ).toFixed(1);
}
