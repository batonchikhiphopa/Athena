import type { Language } from "../../../i18n/languages";
import { formatShortDate } from "../../../shared/lib/dates";
import { getResultsCopy } from "../resultsCopy";
import type { ActivityGroup, ActivityMention } from "../resultsTypes";

export function ActivityGraph({
  activity,
  copy,
  language,
}: {
  activity: ActivityGroup;
  copy: ReturnType<typeof getResultsCopy>;
  language: Language;
}) {
  const values = createActivityGraphValues(activity.mentions, 12);
  const maxValue = Math.max(1, ...values);
  const points = values.map((value, index) => {
    const x = 8 + (index / Math.max(1, values.length - 1)) * 224;
    const y = 74 - (value / maxValue) * 54;
    return { value, x, y };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `8,78 ${line} 232,78`;
  const dates = activity.mentions
    .map((mention) => mention.entryDate)
    .sort((left, right) => left.localeCompare(right));

  return (
    <figure className="self-start rounded-lg border border-white/55 bg-white/35 p-3">
      <figcaption className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.12em] text-zinc-400">
        <span>{copy.activityGraph}</span>
        <span className="normal-case tracking-normal">
          {activity.mentions.length}
        </span>
      </figcaption>
      <svg
        aria-label={copy.activityGraph}
        className="mt-2 h-20 w-full overflow-visible"
        role="img"
        viewBox="0 0 240 82"
      >
        <line
          stroke="rgb(161 161 170 / 0.24)"
          x1="8"
          x2="232"
          y1="78"
          y2="78"
        />
        <polygon fill="rgb(217 119 6 / 0.08)" points={area} />
        <polyline
          fill="none"
          points={line}
          stroke="rgb(161 98 7 / 0.62)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        {points.map((point, index) =>
          point.value > 0 ? (
            <circle
              cx={point.x}
              cy={point.y}
              fill="rgb(161 98 7 / 0.72)"
              key={index}
              r="2"
            />
          ) : null,
        )}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-zinc-400">
        <span>{dates[0] ? formatShortDate(dates[0], language) : "—"}</span>
        <span>
          {dates.at(-1) ? formatShortDate(dates.at(-1)!, language) : "—"}
        </span>
      </div>
    </figure>
  );
}

function createActivityGraphValues(
  mentions: ActivityMention[],
  bucketCount: number,
) {
  const times = mentions
    .map((mention) => Date.parse(`${mention.entryDate}T00:00:00Z`))
    .filter(Number.isFinite);
  if (times.length === 0) return Array.from({ length: bucketCount }, () => 0);

  const latest = Math.max(...times);
  const earliest = Math.min(...times);
  const minimumSpan = (bucketCount - 1) * 86_400_000;
  const start = Math.min(earliest, latest - minimumSpan);
  const span = Math.max(1, latest - start);
  const values = Array.from({ length: bucketCount }, () => 0);

  for (const time of times) {
    const index = Math.min(
      bucketCount - 1,
      Math.max(0, Math.round(((time - start) / span) * (bucketCount - 1))),
    );
    values[index] += 1;
  }

  return values;
}
