import type { Language } from "../../i18n/languages";
import type { EntryView } from "../entries/entryTypes";
import {
  createActivityGroupFromMentions,
  detectMentionMarker,
  normalizeMetric,
} from "./activityAggregation";
import {
  BOUNDED_TASK_LANGUAGE_PATTERN,
  KNOWN_RECURRING_ACTIVITY_PATTERN,
  PROJECT_LANGUAGE_PATTERN,
  RECURRING_LANGUAGE_PATTERN,
  cleanActivityLabel,
  getActivityDisplayLabel,
  getConfiguredActivityKind,
  hasConfiguredActivity,
  isSpecificProjectIdentityTag,
  isUsefulActivityName,
  normalizeActivityLabel,
  textContainsActivity,
} from "./activityCatalog";
import { createDemoActivities } from "./demoResults";
import type {
  ActivityGroup,
  ActivityIndex,
  ActivityKind,
  ActivityMention,
  ActivityMentionMarker,
  ActivityMentionSource,
} from "./resultsTypes";

const MAX_ACTIVITY_CANDIDATES = 24;

type ActivityCandidate = {
  id: string;
  kindHint: ActivityKind | null;
  label: string;
  latestEntryDate: string;
  sourceEntryCount: number;
};

type ProjectTagHint = {
  id: string;
  label: string;
};

export function buildActivityIndex(
  entries: EntryView[],
  language: Language,
): ActivityIndex {
  const usableEntries = entries
    .filter(
      (entry) =>
        entry.analysisEnabled && !entry.textUnavailable && entry.text.trim(),
    )
    .sort((left, right) => right.entryDate.localeCompare(left.entryDate));

  if (usableEntries.length === 0) {
    return {
      activities: createDemoActivities(language),
      isDemo: true,
    };
  }

  const candidates = collectCandidates(usableEntries, language)
    .sort(compareActivityCandidates)
    .slice(0, MAX_ACTIVITY_CANDIDATES);
  const activities = candidates
    .map((candidate) => createActivityGroup(candidate, usableEntries))
    .filter((activity) => activity.mentions.length > 0)
    .sort(compareActivityGroups);

  return { activities, isDemo: false };
}

function collectCandidates(
  entries: EntryView[],
  language: Language,
): ActivityCandidate[] {
  const candidates = new Map<string, ActivityCandidate>();

  for (const entry of entries) {
    const countedInEntry = new Set<string>();
    const projectTagHint = getProjectTagHint(entry, language);
    let projectTagWasUsed = false;

    for (const rawLabel of entry.signals.activities) {
      const cleanedLabel = cleanActivityLabel(rawLabel);
      const extractedId = normalizeActivityLabel(cleanedLabel);
      const useProjectIdentity = Boolean(
        projectTagHint &&
          (projectTagHint.id === extractedId ||
            (entry.signals.activities.length === 1 &&
              !hasConfiguredActivity(extractedId) &&
              shouldUseProjectTagForActivity(entry, cleanedLabel))),
      );
      if (useProjectIdentity) projectTagWasUsed = true;

      const id = useProjectIdentity ? projectTagHint!.id : extractedId;
      const label = useProjectIdentity
        ? projectTagHint!.label
        : getActivityDisplayLabel(id, cleanedLabel, language);

      addCandidate({
        candidates,
        countedInEntry,
        entryDate: entry.entryDate,
        id,
        kindHint: useProjectIdentity ? "task" : null,
        label,
      });
    }

    if (
      projectTagHint &&
      (entry.signals.activities.length === 0 || projectTagWasUsed)
    ) {
      addCandidate({
        candidates,
        countedInEntry,
        entryDate: entry.entryDate,
        id: projectTagHint.id,
        kindHint: "task",
        label: projectTagHint.label,
      });
    }
  }

  return [...candidates.values()];
}

function addCandidate({
  candidates,
  countedInEntry,
  entryDate,
  id,
  kindHint,
  label,
}: {
  candidates: Map<string, ActivityCandidate>;
  countedInEntry: Set<string>;
  entryDate: string;
  id: string;
  kindHint: ActivityKind | null;
  label: string;
}) {
  if (!isUsefulActivityName(id)) return;

  if (countedInEntry.has(id)) {
    const existing = candidates.get(id);
    if (existing) existing.kindHint ??= kindHint;
    return;
  }

  countedInEntry.add(id);
  const existing = candidates.get(id);

  if (!existing) {
    candidates.set(id, {
      id,
      kindHint,
      label,
      latestEntryDate: entryDate,
      sourceEntryCount: 1,
    });
    return;
  }

  existing.sourceEntryCount += 1;
  existing.kindHint ??= kindHint;
  if (entryDate > existing.latestEntryDate) {
    existing.latestEntryDate = entryDate;
    existing.label = label;
  }
}

function getProjectTagHint(
  entry: EntryView,
  language: Language,
): ProjectTagHint | null {
  if (!hasProjectWorkEvidence(entry)) return null;

  const specificTags = new Map<string, string>();
  for (const rawTag of entry.tags) {
    const cleanedTag = cleanActivityLabel(rawTag);
    const id = normalizeActivityLabel(cleanedTag);
    if (!isSpecificProjectIdentityTag(id)) continue;
    specificTags.set(id, cleanedTag);
  }

  // Several concrete tags do not establish which project owns the work.
  if (specificTags.size !== 1) return null;

  const [id, cleanedTag] = [...specificTags.entries()][0];
  return {
    id,
    label: getActivityDisplayLabel(id, cleanedTag, language),
  };
}

function hasProjectWorkEvidence(entry: EntryView): boolean {
  const hasTaskContext = (entry.signals.activity_contexts ?? []).some(
    (context) => context.kind === "task" && context.confidence !== "low",
  );
  if (hasTaskContext) return true;

  const evidence = [entry.text, ...entry.signals.activities].join("\n");
  return (
    PROJECT_LANGUAGE_PATTERN.test(evidence) ||
    BOUNDED_TASK_LANGUAGE_PATTERN.test(evidence)
  );
}

function shouldUseProjectTagForActivity(
  entry: EntryView,
  activityLabel: string,
): boolean {
  const activityId = normalizeActivityLabel(activityLabel);
  const context = (entry.signals.activity_contexts ?? []).find(
    (candidate) => normalizeActivityLabel(candidate.activity) === activityId,
  );

  if (context?.kind === "task" && context.confidence !== "low") return true;

  return (
    PROJECT_LANGUAGE_PATTERN.test(activityLabel) ||
    BOUNDED_TASK_LANGUAGE_PATTERN.test(activityLabel)
  );
}

function createActivityGroup(
  candidate: ActivityCandidate,
  entries: EntryView[],
): ActivityGroup {
  const mentions = entries
    .map((entry) => findMention(entry, candidate.id))
    .filter((mention): mention is ActivityMention => mention !== null)
    .sort((left, right) => right.entryDate.localeCompare(left.entryDate));
  const kind = classifyActivity(candidate.id, mentions, candidate.kindHint);

  return createActivityGroupFromMentions({
    id: candidate.id,
    kind,
    label: candidate.label,
    latestEntryDate: mentions[0]?.entryDate ?? candidate.latestEntryDate,
    mentions,
  });
}

function findMention(
  entry: EntryView,
  activityId: string,
): ActivityMention | null {
  const sources: ActivityMentionSource[] = [];
  const signalActivityCount = new Set(
    entry.signals.activities.map(normalizeActivityLabel).filter(Boolean),
  ).size;

  if (
    entry.signals.activities.some(
      (activity) => normalizeActivityLabel(activity) === activityId,
    )
  ) {
    sources.push("activity");
  }
  if (entry.tags.some((tag) => normalizeActivityLabel(tag) === activityId)) {
    sources.push("tag");
  }
  if (textContainsActivity(entry.text, activityId)) sources.push("text");
  if (sources.length === 0) return null;

  const relevantText =
    findRelevantText(entry.text, activityId, signalActivityCount === 1) ||
    (sources.includes("tag") ? entry.text : "");
  const directContext = (entry.signals.activity_contexts ?? []).find(
    (candidate) => normalizeActivityLabel(candidate.activity) === activityId,
  );
  const context =
    directContext ??
    (sources.includes("tag") ? findTagBackedTaskContext(entry) : null);

  return {
    context,
    debugSignals: {
      fatigue: normalizeMetric(entry.signals.fatigue),
      focus: normalizeMetric(entry.signals.focus),
      load: normalizeMetric(entry.signals.load),
    },
    entryDate: entry.entryDate,
    entryId: entry.id,
    marker:
      contextToMentionMarker(context?.event) ??
      (relevantText ? detectMentionMarker(relevantText) : null),
    sources,
    text: entry.text,
  };
}

function findTagBackedTaskContext(entry: EntryView) {
  const contexts = entry.signals.activity_contexts ?? [];
  if (contexts.length !== 1 || contexts[0].kind !== "task") return null;
  return contexts[0];
}

function classifyActivity(
  id: string,
  mentions: ActivityMention[],
  kindHint: ActivityKind | null,
): ActivityKind {
  // Finite outcomes outrank recurrence so a recurring pursuit such as job
  // search remains a task rather than becoming a practice.
  const configuredKind = getConfiguredActivityKind(id);
  if (configuredKind) return configuredKind;
  if (kindHint) return kindHint;

  const supportedKinds = mentions.flatMap((mention) =>
    mention.context && mention.context.confidence !== "low"
      ? [mention.context.kind]
      : [],
  );
  if (supportedKinds.includes("task")) return "task";

  const evidenceTexts = mentions
    .map((mention) => getClassificationText(mention, id))
    .filter(Boolean);
  if (
    evidenceTexts.some(
      (text) =>
        PROJECT_LANGUAGE_PATTERN.test(text) ||
        BOUNDED_TASK_LANGUAGE_PATTERN.test(text),
    )
  ) {
    return "task";
  }

  if (supportedKinds.includes("activity")) return "activity";
  if (KNOWN_RECURRING_ACTIVITY_PATTERN.test(id)) return "activity";
  if (RECURRING_LANGUAGE_PATTERN.test(evidenceTexts.join("\n"))) {
    return "activity";
  }

  // Provider activities are intentional by contract. Unknown cases default to
  // repeatable activity instead of inventing a project completion condition.
  return "activity";
}

function getClassificationText(
  mention: ActivityMention,
  activityId: string,
): string {
  const relevantText = findRelevantText(mention.text, activityId, false);
  if (relevantText) return relevantText;
  return mention.sources.includes("activity") || mention.sources.includes("tag")
    ? mention.text
    : "";
}

function contextToMentionMarker(
  event: NonNullable<ActivityMention["context"]>["event"] | undefined,
): ActivityMentionMarker {
  if (event === "blocked") return "blocker";
  if (event === "result" || event === "completed") return "result";
  return null;
}

function findRelevantText(
  text: string,
  activityId: string,
  canUseWholeEntry: boolean,
): string {
  const passages = text
    .split(/(?:\r?\n)+|(?<=[.!?…])\s+/u)
    .map((value) => value.trim())
    .filter(Boolean);
  const matchingPassages = passages.filter((passage) =>
    textContainsActivity(passage, activityId),
  );

  if (matchingPassages.length > 0) return matchingPassages.join(" ");
  return canUseWholeEntry ? text : "";
}

function compareActivityCandidates(
  left: ActivityCandidate,
  right: ActivityCandidate,
): number {
  const countOrder = right.sourceEntryCount - left.sourceEntryCount;
  if (countOrder !== 0) return countOrder;

  const dateOrder = right.latestEntryDate.localeCompare(left.latestEntryDate);
  if (dateOrder !== 0) return dateOrder;
  return left.label.localeCompare(right.label);
}

function compareActivityGroups(left: ActivityGroup, right: ActivityGroup) {
  const mentionOrder = right.mentions.length - left.mentions.length;
  if (mentionOrder !== 0) return mentionOrder;

  const dateOrder = right.latestEntryDate.localeCompare(left.latestEntryDate);
  if (dateOrder !== 0) return dateOrder;
  return left.label.localeCompare(right.label);
}
