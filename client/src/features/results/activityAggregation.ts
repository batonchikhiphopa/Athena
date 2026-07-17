import {
  BLOCKER_PATTERN,
  COMPLETION_PATTERN,
  NEGATED_RESULT_PATTERN,
  RESULT_PATTERN,
} from "./activityCatalog";
import type {
  ActivityBurnoutRelation,
  ActivityGroup,
  ActivityInsightInput,
  ActivityKind,
  ActivityMention,
  ActivityMentionMarker,
  ActivityRhythm,
  ActivityStage,
} from "./resultsTypes";

const MAX_INSIGHT_EVIDENCE = 200;
const MAX_INSIGHT_SPAN_DAYS = 3_650;

export function createActivityGroupFromMentions({
  id,
  kind,
  label,
  latestEntryDate,
  mentions,
}: Pick<
  ActivityGroup,
  "id" | "kind" | "label" | "latestEntryDate" | "mentions"
>): ActivityGroup {
  const stage = deriveStage(kind, mentions);
  const rhythm = deriveRhythm(mentions);
  const burnoutRelation = deriveBurnoutRelation(mentions);

  return {
    id,
    insightInput: createInsightInput({
      burnoutRelation,
      id,
      kind,
      label,
      mentions,
      rhythm,
      stage,
    }),
    kind,
    label,
    latestEntryDate,
    mentions,
  };
}

export function detectMentionMarker(text: string): ActivityMentionMarker {
  if (NEGATED_RESULT_PATTERN.test(text) || BLOCKER_PATTERN.test(text)) {
    return "blocker";
  }
  if (RESULT_PATTERN.test(text)) return "result";
  return null;
}

export function normalizeMetric(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(10, value));
}

function deriveStage(
  kind: ActivityKind,
  mentions: ActivityMention[],
): ActivityStage {
  const latestMention = mentions[0];
  if (!latestMention) return "unknown";
  if (latestMention.marker === "blocker") return "stalled";

  if (kind === "task" && latestMention.context?.event === "completed") {
    return "completed";
  }

  if (
    kind === "task" &&
    latestMention.marker === "result" &&
    COMPLETION_PATTERN.test(latestMention.text) &&
    !NEGATED_RESULT_PATTERN.test(latestMention.text)
  ) {
    return "completed";
  }

  const distinctDates = uniqueDates(mentions);
  if (
    distinctDates.length <= 2 &&
    daysBetween(
      distinctDates.at(-1) ?? latestMention.entryDate,
      distinctDates[0],
    ) <= 14
  ) {
    return "starting";
  }

  return "active";
}

function deriveRhythm(mentions: ActivityMention[]): ActivityRhythm {
  const dates = uniqueDates(mentions);
  if (dates.length < 2) return "insufficient";

  const today = dateOnly(new Date());
  if (daysBetween(dates[0], today) >= 14) return "paused";

  const descendingGaps = dates
    .slice(0, -1)
    .map((date, index) => daysBetween(dates[index + 1], date));

  if (daysBetween(dates[1], dates[0]) >= 14) return "returning";

  if (dates.length >= 3) {
    const sortedGaps = [...descendingGaps].sort((left, right) => left - right);
    const medianGap = sortedGaps[Math.floor(sortedGaps.length / 2)] ?? 0;
    const largestGap = sortedGaps.at(-1) ?? 0;

    if (medianGap <= 7 && largestGap <= Math.max(10, medianGap * 3)) {
      return "steady";
    }
  }

  return "irregular";
}

function deriveBurnoutRelation(
  mentions: ActivityMention[],
): ActivityBurnoutRelation {
  const effects = mentions.flatMap((mention) =>
    mention.context &&
    mention.context.confidence !== "low" &&
    mention.context.effect !== "unclear"
      ? [mention.context.effect]
      : [],
  );

  if (effects.length < 2) return "unclear";

  const drainingSamples = effects.filter(
    (effect) => effect === "draining" || effect === "mixed",
  ).length;
  const restorativeSamples = effects.filter(
    (effect) => effect === "restorative" || effect === "mixed",
  ).length;

  return classifyBurnoutSamples(
    effects.length,
    drainingSamples,
    restorativeSamples,
  );
}

function classifyBurnoutSamples(
  sampleCount: number,
  drainingSamples: number,
  restorativeSamples: number,
): ActivityBurnoutRelation {
  const meaningfulShare = Math.max(1, Math.ceil(sampleCount * 0.4));
  if (
    drainingSamples >= meaningfulShare &&
    restorativeSamples >= meaningfulShare
  ) {
    return "mixed";
  }
  if (drainingSamples >= Math.ceil(sampleCount * 0.6)) return "draining";
  if (restorativeSamples >= Math.ceil(sampleCount * 0.6)) {
    return "restorative";
  }

  return "unclear";
}

function createInsightInput({
  burnoutRelation,
  id,
  kind,
  label,
  mentions,
  rhythm,
  stage,
}: {
  burnoutRelation: ActivityBurnoutRelation;
  id: string;
  kind: ActivityKind;
  label: string;
  mentions: ActivityMention[];
  rhythm: ActivityRhythm;
  stage: ActivityStage;
}): ActivityInsightInput {
  const dates = uniqueDates(mentions);

  return {
    id,
    label,
    kind,
    stage,
    rhythm,
    burnoutRelation,
    recentEvents: mentions.slice(0, 8).map((mention) => {
      if (mention.marker === "result") return "result";
      if (mention.marker === "blocker") return "blocker";
      return "mention";
    }),
    recentContexts: mentions
      .flatMap((mention) => {
        if (!mention.context) return [];
        const {
          agency,
          blockers,
          confidence,
          effect,
          event,
          kind: contextKind,
          next_step,
          outcome,
          strategy,
        } = mention.context;
        return [
          {
            agency,
            blockers,
            confidence,
            effect,
            event,
            kind: contextKind,
            next_step,
            outcome,
            strategy,
          },
        ];
      })
      .slice(0, 8),
    evidenceCount: Math.max(
      1,
      Math.min(MAX_INSIGHT_EVIDENCE, mentions.length),
    ),
    observationCount: Math.max(
      1,
      Math.min(MAX_INSIGHT_EVIDENCE, dates.length),
    ),
    spanDays: Math.min(
      MAX_INSIGHT_SPAN_DAYS,
      daysBetween(dates.at(-1) ?? dates[0], dates[0]),
    ),
  };
}

function uniqueDates(mentions: ActivityMention[]): string[] {
  return [...new Set(mentions.map((mention) => mention.entryDate))].sort(
    (left, right) => right.localeCompare(left),
  );
}

function daysBetween(startDate: string, endDate: string): number {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

function dateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
