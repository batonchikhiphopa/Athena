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
  const baseline = 70;
  const usableHeight = 44;
  const points = values.map((value, index) => {
    const x = 12 + (index / Math.max(1, values.length - 1)) * 216;
    const y = baseline - (value / maxValue) * usableHeight;
    return { value, x, y };
  });
  const line = points
    .map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(" ");
  const area = `12,${baseline} ${line} 228,${baseline}`;
  const dates = activity.mentions
    .map((mention) => mention.entryDate)
    .sort((left, right) => left.localeCompare(right));

  return (
    <figure className="flex h-full flex-col justify-between rounded-xl border border-[#d7c6a6]/45 bg-[#fffdf8]/60 p-3.5 shadow-sm shadow-[#7c6540]/5 backdrop-blur-md">
      <figcaption className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
        <span>{copy.activityGraph}</span>
        <span className="rounded-full bg-[#efe4cf] px-2 py-0.5 text-xs font-bold normal-case tracking-normal text-[#87611f]">
          {activity.mentions.length}
        </span>
      </figcaption>
      <div className="relative my-2">
        <svg
          aria-label={copy.activityGraph}
          className="h-20 w-full overflow-visible"
          role="img"
          viewBox="0 0 240 82"
        >
          <line stroke="rgb(162 145 117 / 0.28)" x1="12" x2="228" y1={baseline} y2={baseline} />
          <polygon fill="rgb(184 140 68 / 0.10)" points={area} />
          <polyline fill="none" points={line} stroke="rgb(174 125 43 / 0.70)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" />
          {points.map((point, index) =>
            point.value > 0 ? (
              <circle cx={point.x} cy={point.y} fill="rgb(174 125 43 / 0.82)" key={index} r="2.5" stroke="#fffdf8" strokeWidth="1.25" />
            ) : null,
          )}
        </svg>
      </div>
      <div className="flex justify-between border-t border-[#eadfc9] pt-1.5 text-[10px] font-medium text-stone-400">
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
