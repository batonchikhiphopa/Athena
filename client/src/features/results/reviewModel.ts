import type { Language } from "../../i18n/languages";
import { todayDateOnly } from "../../shared/lib/dates";
import { createActivityGroupFromMentions } from "./activityAggregation";
import type { ActivityGroup, ActivityMention } from "./resultsTypes";

export type ReviewPeriod = "day" | "week";
export type ReviewQuestion =
  | "completed"
  | "moved"
  | "repeated"
  | "blocked"
  | "missingNextStep";

export type DeterministicReviewItem = {
  activityId: string;
  blockerCount: number;
  completedCount: number;
  label: string;
  mentionCount: number;
  missingNextStep: boolean;
  movementCount: number;
  nextStepAgeDays: number | null;
  resultCount: number;
  summary: string;
};

export type DeterministicReview = {
  endDate: string;
  items: DeterministicReviewItem[];
  period: ReviewPeriod;
  sections: Record<ReviewQuestion, DeterministicReviewItem[]>;
  startDate: string;
};

export function buildDeterministicReviews(
  activities: ActivityGroup[],
  language: Language,
  endDate = todayDateOnly(),
): DeterministicReview[] {
  return [
    buildReview(activities, language, "day", endDate, endDate),
    buildReview(
      activities,
      language,
      "week",
      shiftDate(endDate, -6),
      endDate,
    ),
  ];
}

export function formatReviewItemFacts(
  item: DeterministicReviewItem,
  language: Language,
) {
  return formatReviewSummary({
    blockerCount: item.blockerCount,
    label: null,
    language,
    mentionCount: item.mentionCount,
    nextStepAgeDays: item.nextStepAgeDays,
    resultCount: item.resultCount,
    showMissingNextStep: item.missingNextStep,
  });
}

export function buildWeeklyReviewActivities(
  activities: ActivityGroup[],
  endDate = todayDateOnly(),
) {
  const startDate = shiftDate(endDate, -6);

  return activities.flatMap((activity) => {
    const mentions = activity.mentions.filter(
      (mention) =>
        mention.entryDate >= startDate && mention.entryDate <= endDate,
    );
    if (mentions.length === 0) return [];

    return [
      createActivityGroupFromMentions({
        id: activity.id,
        kind: activity.kind,
        label: activity.label,
        latestEntryDate: mentions[0].entryDate,
        mentions,
      }),
    ];
  });
}

function buildReview(
  activities: ActivityGroup[],
  language: Language,
  period: ReviewPeriod,
  startDate: string,
  endDate: string,
): DeterministicReview {
  const snapshots = activities.flatMap((activity) => {
    const mentions = activity.mentions.filter(
      (mention) =>
        mention.entryDate >= startDate && mention.entryDate <= endDate,
    );
    if (mentions.length === 0) return [];
    return [createReviewSnapshot(activity, mentions, language, endDate)];
  });

  return {
    endDate,
    items: snapshots.map((snapshot) => snapshot.item),
    period,
    sections: {
      blocked: snapshots
        .filter((snapshot) => snapshot.isBlocked)
        .map((snapshot) => snapshot.item),
      completed: snapshots
        .filter((snapshot) => snapshot.isCompleted)
        .map((snapshot) => snapshot.item),
      missingNextStep: snapshots
        .filter((snapshot) => snapshot.isMissingNextStep)
        .map((snapshot) => snapshot.item),
      moved: snapshots
        .filter((snapshot) => snapshot.hasMoved)
        .map((snapshot) => snapshot.item),
      repeated: snapshots
        .filter((snapshot) => snapshot.isRepeatedWithoutResult)
        .map((snapshot) => snapshot.item),
    },
    startDate,
  };
}

function createReviewSnapshot(
  activity: ActivityGroup,
  mentions: ActivityMention[],
  language: Language,
  endDate: string,
) {
  const completedCount = mentions.filter(isCompletedMention).length;
  const resultCount = mentions.filter(isResultMention).length;
  const blockerCount = mentions.filter(isBlockedMention).length;
  const movementCount = mentions.filter(isMovementMention).length;
  const latestMention = activity.mentions[0] ?? mentions[0];
  const latestExplicitNextStep = activity.mentions.find(
    (mention) => mention.context?.next_step === "explicit",
  );
  const nextStepAgeDays = latestExplicitNextStep
    ? daysBetween(latestExplicitNextStep.entryDate, endDate)
    : null;
  const isMissingNextStep =
    activity.kind === "task" &&
    activity.insightInput.stage !== "completed" &&
    latestMention.context?.next_step !== "explicit";
  const item: DeterministicReviewItem = {
    activityId: activity.id,
    blockerCount,
    completedCount,
    label: activity.label,
    mentionCount: mentions.length,
    missingNextStep: isMissingNextStep,
    movementCount,
    nextStepAgeDays,
    resultCount,
    summary: formatReviewSummary({
      blockerCount,
      label: activity.label,
      language,
      mentionCount: mentions.length,
      nextStepAgeDays,
      resultCount,
      showMissingNextStep: isMissingNextStep,
    }),
  };

  return {
    hasMoved: movementCount > 0,
    isBlocked: blockerCount > 0,
    isCompleted: completedCount > 0,
    isMissingNextStep,
    isRepeatedWithoutResult: mentions.length >= 2 && resultCount === 0,
    item,
  };
}

function isCompletedMention(mention: ActivityMention) {
  return (
    mention.context?.event === "completed" ||
    mention.context?.outcome === "achieved"
  );
}

function isResultMention(mention: ActivityMention) {
  return (
    mention.marker === "result" ||
    mention.context?.event === "result" ||
    isCompletedMention(mention)
  );
}

function isBlockedMention(mention: ActivityMention) {
  return (
    mention.marker === "blocker" ||
    mention.context?.event === "blocked" ||
    Boolean(mention.context?.blockers.length)
  );
}

function isMovementMention(mention: ActivityMention) {
  return (
    isResultMention(mention) ||
    mention.context?.event === "started" ||
    mention.context?.event === "progressed"
  );
}

function formatReviewSummary({
  blockerCount,
  label,
  language,
  mentionCount,
  nextStepAgeDays,
  resultCount,
  showMissingNextStep,
}: {
  blockerCount: number;
  label: string | null;
  language: Language;
  mentionCount: number;
  nextStepAgeDays: number | null;
  resultCount: number;
  showMissingNextStep: boolean;
}) {
  const nextStep = showMissingNextStep
    ? formatNextStep(language, nextStepAgeDays)
    : "";

  if (language === "ru") {
    const facts = `Упоминаний — ${mentionCount}. Результатов — ${resultCount}; эпизодов с препятствием — ${blockerCount}.`;
    return `${label ? `${label}: ${lowercaseFirst(facts)}` : facts}${nextStep ? ` ${nextStep}` : ""}`;
  }
  if (language === "uk") {
    const facts = `Згадок — ${mentionCount}. Результатів — ${resultCount}; епізодів із перешкодою — ${blockerCount}.`;
    return `${label ? `${label}: ${lowercaseFirst(facts)}` : facts}${nextStep ? ` ${nextStep}` : ""}`;
  }
  if (language === "de") {
    const facts = `${mentionCount} Erwähnungen. ${resultCount} Ergebnisse; ${blockerCount} Episoden mit Hindernis.`;
    return `${label ? `${label}: ` : ""}${facts}${nextStep ? ` ${nextStep}` : ""}`;
  }
  const facts = `${mentionCount} mentions. ${resultCount} results; ${blockerCount} episodes with a blocker.`;
  return `${label ? `${label}: ` : ""}${facts}${nextStep ? ` ${nextStep}` : ""}`;
}

function lowercaseFirst(value: string) {
  return value ? `${value[0].toLocaleLowerCase()}${value.slice(1)}` : value;
}

function formatNextStep(language: Language, ageDays: number | null) {
  if (ageDays === null) {
    if (language === "ru") return "Следующий шаг не зафиксирован.";
    if (language === "uk") return "Наступний крок не зафіксовано.";
    if (language === "de") return "Kein nächster Schritt ist festgehalten.";
    return "No next step is recorded.";
  }

  if (language === "ru") {
    return `Следующий шаг не обновлялся ${ageDays} дн.`;
  }
  if (language === "uk") {
    return `Наступний крок не оновлювався ${ageDays} дн.`;
  }
  if (language === "de") {
    return `Der nächste Schritt wurde seit ${ageDays} Tagen nicht aktualisiert.`;
  }
  return `The next step has not been updated for ${ageDays} days.`;
}

function shiftDate(value: string, days: number) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function daysBetween(startDate: string, endDate: string) {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(0, Math.round((end - start) / 86_400_000));
}
