import { useMemo } from "react";
import type { Language } from "../../../i18n/languages";
import { getResultsCopy } from "../resultsCopy";
import { getResultsCorrectionCopy } from "../resultsCorrectionCopy";
import {
  buildDeterministicReviews,
  formatReviewItemFacts,
  type ReviewQuestion,
} from "../reviewModel";
import type { ActivityGroup } from "../resultsTypes";

const SIGNAL_ORDER: ReviewQuestion[] = [
  "completed",
  "moved",
  "repeated",
  "blocked",
  "missingNextStep",
];

export function ActivityReviewFacts({
  activity,
  language,
}: {
  activity: ActivityGroup;
  language: Language;
}) {
  const copy = getResultsCorrectionCopy(language);
  const resultsCopy = getResultsCopy(language);
  const reviews = useMemo(
    () => buildDeterministicReviews([activity], language),
    [activity, language],
  );
  const visibleReviews = reviews.filter((review) => review.items.length > 0);

  return (
    <section className="self-start rounded-lg border border-white/55 bg-white/35 p-3">
      <div
        className={[
          "flex flex-wrap gap-1.5",
          visibleReviews.length > 0
            ? "border-b border-zinc-900/8 pb-3"
            : "",
        ].join(" ")}
      >
        <span className="rounded-full bg-zinc-900/[0.055] px-2.5 py-1 text-[11px] text-zinc-600">
          {resultsCopy.stage[activity.insightInput.stage]}
        </span>
        <span className="rounded-full bg-white/65 px-2.5 py-1 text-[11px] text-zinc-500">
          {resultsCopy.rhythm[activity.insightInput.rhythm]}
        </span>
      </div>

      {visibleReviews.map((review) => {
        const item = review.items[0];
        const signals = SIGNAL_ORDER.filter((question) =>
          review.sections[question].some(
            (candidate) => candidate.activityId === activity.id,
          ),
        );

        return (
          <article
            className="border-b border-zinc-900/8 py-3 last:border-b-0 last:pb-0"
            key={review.period}
          >
            <div className="text-[11px] uppercase tracking-wide text-zinc-400">
              {copy.reviewPeriod[review.period]}
            </div>
            <p className="mt-1.5 text-sm leading-6 text-zinc-700">
              {formatReviewItemFacts(item, language)}
            </p>
            {signals.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {signals.map((signal) => (
                  <span
                    className="rounded-full bg-zinc-900/[0.055] px-2 py-1 text-[10px] text-zinc-500"
                    key={signal}
                  >
                    {copy.reviewSignal[signal]}
                  </span>
                ))}
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}
