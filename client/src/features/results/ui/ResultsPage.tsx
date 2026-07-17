import { Fragment, useEffect, useMemo, useState } from "react";
import type { ExtractionSettings } from "../../../shared/contracts";
import { useI18n } from "../../../i18n/useI18n";
import type { Language } from "../../../i18n/languages";
import { formatLongDate, formatShortDate } from "../../../shared/lib/dates";
import { generateAthenaPlaceholder } from "../../editor/content/athenaPlaceholder";
import type { EntryView } from "../../entries/entryTypes";
import { EntryTile } from "../../entries/ui/EntryTile";
import {
  createEntrySearchSnippet,
  type EntrySearchSnippet,
} from "../../entries/entrySearch";
import { getResultsCopy } from "../resultsCopy";
import type {
  ActivityGroup,
  ActivityIndex,
  ActivityMention,
} from "../resultsTypes";
import type {
  ActivityInsightState,
  ActivityInsightView,
} from "../activityInsightTypes";
import { ActivityDebug } from "./ActivityDebug";
import { ActivityGraph } from "./ActivityGraph";
import { AnimatedActivityPanel } from "./AnimatedActivityPanel";

export function ResultsPage({
  activityInsights,
  debugMode,
  entries,
  extractionSettings,
  focusedActivityId,
  focusedActivityKey,
  model,
  onDeleteEntry,
  onEditEntry,
  onToggleEntryAnalysis,
  onToggleTag,
}: {
  activityInsights: ActivityInsightState;
  debugMode: boolean;
  entries: EntryView[];
  extractionSettings: ExtractionSettings;
  focusedActivityId: string | null;
  focusedActivityKey: number;
  model: ActivityIndex;
  onDeleteEntry: (entry: EntryView) => void;
  onEditEntry: (entry: EntryView) => void;
  onToggleEntryAnalysis: (entry: EntryView) => void;
  onToggleTag: (tag: string) => void;
}) {
  const { language } = useI18n();
  const copy = getResultsCopy(language);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(
    null,
  );
  const [insightFallback, setInsightFallback] = useState<{
    activityId: string;
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!focusedActivityId) return;
    const activity = model.activities.find(
      (candidate) => candidate.id === focusedActivityId,
    );
    if (!activity) return;

    setSelectedActivityId(activity.id);
    globalThis.requestAnimationFrame?.(() => {
      document
        .querySelector(`[data-activity-id="${CSS.escape(activity.id)}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [focusedActivityId, focusedActivityKey, model.activities]);

  useEffect(() => {
    if (!selectedActivityId) return;
    if (model.activities.some((activity) => activity.id === selectedActivityId)) {
      return;
    }
    setSelectedActivityId(null);
  }, [model.activities, selectedActivityId]);

  useEffect(() => {
    if (!selectedActivityId) return;

    setInsightFallback((current) => ({
      activityId: selectedActivityId,
      text: generateFreshAthenaPhrase(language, current?.text ?? ""),
    }));
  }, [language, selectedActivityId]);

  return (
    <section className="relative w-full max-w-6xl px-1.5 py-1.5 sm:py-2">
      <div className="w-full pb-12 pt-20">
        <div className="overflow-hidden rounded-xl border border-white/40 bg-[#f8f3e9]/38 backdrop-blur-sm">
          {model.activities.length > 0 ? (
            <div className="divide-y divide-zinc-900/8">
              {model.activities.map((activity) => {
                const isExpanded = selectedActivityId === activity.id;

                return (
                  <section
                    className="scroll-mt-16"
                    data-activity-id={activity.id}
                    key={activity.id}
                  >
                    <button
                      aria-expanded={isExpanded}
                      aria-label={activity.label}
                      className={[
                        "flex min-h-14 w-full items-center gap-2 px-3 py-2 text-left outline-none transition focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-zinc-400/70 sm:px-4",
                        isExpanded ? "bg-white/48" : "hover:bg-white/28",
                      ].join(" ")}
                      onClick={() =>
                        setSelectedActivityId(isExpanded ? null : activity.id)
                      }
                      type="button"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-zinc-800 sm:text-base">
                          {activity.label}
                        </span>
                      </div>

                      <span className="hidden shrink-0 text-xs text-zinc-400 sm:block">
                        {copy.stage[activity.insightInput.stage]} ·{" "}
                        {copy.latest(
                          formatShortDate(activity.latestEntryDate, language),
                        )}
                      </span>
                    </button>

                    <AnimatedActivityPanel isExpanded={isExpanded}>
                      <ActivityEntries
                        activity={activity}
                        activityInsights={activityInsights}
                        copy={copy}
                        debugMode={debugMode}
                        entries={entries}
                        extractionSettings={extractionSettings}
                        fallbackPhrase={
                          insightFallback?.activityId === activity.id
                            ? insightFallback.text
                            : ""
                        }
                        isDemo={model.isDemo}
                        language={language}
                        onDeleteEntry={onDeleteEntry}
                        onEditEntry={onEditEntry}
                        onToggleEntryAnalysis={onToggleEntryAnalysis}
                        onToggleTag={onToggleTag}
                      />
                    </AnimatedActivityPanel>
                  </section>
                );
              })}
            </div>
          ) : (
            <p className="px-5 py-10 text-sm text-zinc-400">{copy.empty}</p>
          )}
        </div>

        {model.isDemo && (
          <p className="px-3 pt-3 text-[10px] text-zinc-400">
            {copy.demoNotice}
          </p>
        )}
      </div>
    </section>
  );
}

function generateFreshAthenaPhrase(language: Language, previousText: string) {
  let phrase = generateAthenaPlaceholder({}, {}, language);

  for (let attempt = 0; attempt < 3 && phrase === previousText; attempt += 1) {
    phrase = generateAthenaPlaceholder({}, {}, language);
  }

  return phrase;
}

function ActivityEntries({
  activity,
  activityInsights,
  copy,
  debugMode,
  entries,
  extractionSettings,
  fallbackPhrase,
  isDemo,
  language,
  onDeleteEntry,
  onEditEntry,
  onToggleEntryAnalysis,
  onToggleTag,
}: {
  activity: ActivityGroup;
  activityInsights: ActivityInsightState;
  copy: ReturnType<typeof getResultsCopy>;
  debugMode: boolean;
  entries: EntryView[];
  extractionSettings: ExtractionSettings;
  fallbackPhrase: string;
  isDemo: boolean;
  language: Language;
  onDeleteEntry: (entry: EntryView) => void;
  onEditEntry: (entry: EntryView) => void;
  onToggleEntryAnalysis: (entry: EntryView) => void;
  onToggleTag: (tag: string) => void;
}) {
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const insight = activityInsights.insights.get(activity.id) ?? null;
  const entryById = useMemo(
    () => new Map(entries.map((entry) => [entry.id, entry])),
    [entries],
  );
  const activityEntries = activity.mentions.flatMap((mention) => {
    if (!mention.entryId) return [];
    const entry = entryById.get(mention.entryId);
    return entry ? [entry] : [];
  });

  return (
    <div className="border-t border-zinc-900/8 bg-white/36 px-4 pb-5 pt-4 sm:px-5">
      <div className="grid gap-5 border-b border-zinc-900/8 pb-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-zinc-900/[0.055] px-2.5 py-1 text-[11px] text-zinc-600">
              {copy.stage[activity.insightInput.stage]}
            </span>
            <span className="rounded-full bg-white/55 px-2.5 py-1 text-[11px] text-zinc-500">
              {copy.rhythm[activity.insightInput.rhythm]}
            </span>
          </div>
          <p className="max-w-3xl font-serif text-[1.02rem] leading-7 text-zinc-800">
            {resolveInsightText({
              activity,
              copy,
              extractionSettings,
              fallbackPhrase,
              insight,
              insightError: activityInsights.error,
              isDemo,
              isInsightLoading: activityInsights.isLoading,
              isInsightRefreshing: activityInsights.isRefreshing,
            })}
          </p>
          {insight?.isStale && activityInsights.isRefreshing && (
            <p className="mt-2 text-[11px] text-zinc-400">
              {copy.insightUpdating}
            </p>
          )}
          {debugMode && (
            <ActivityDebug
              activity={activity}
              copy={copy}
              insight={insight}
              language={language}
              model={extractionSettings.model}
            />
          )}
        </div>

        <ActivityGraph activity={activity} copy={copy} language={language} />
      </div>

      <div className="py-4">
        <p className="text-xs text-zinc-400">
          {copy.sourceEntries}
          {debugMode && ` · ${activity.mentions.length}`}
        </p>
      </div>

      {activityEntries.length > 0 ? (
        <div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
          {activityEntries.map((entry) => (
            <EntryTile
              compact
              debugMode={debugMode}
              entry={entry}
              isExpanded={expandedEntryId === entry.id}
              isSelected={expandedEntryId === entry.id}
              key={entry.id}
              language={language}
              searchQuery={activity.label}
              onDeleteEntry={onDeleteEntry}
              onEditEntry={onEditEntry}
              onSelectEntry={(entryId) =>
                setExpandedEntryId((current) =>
                  current === entryId ? null : entryId,
                )
              }
              onToggleEntryAnalysis={onToggleEntryAnalysis}
              onToggleTag={onToggleTag}
            />
          ))}
        </div>
      ) : (
        <div className="divide-y divide-zinc-900/8">
          {activity.mentions.map((mention, index) => (
            <DemoMentionRow
              activityLabel={activity.label}
              index={index}
              key={`${mention.entryDate}-${index}`}
              language={language}
              mention={mention}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function resolveInsightText({
  activity,
  copy,
  extractionSettings,
  fallbackPhrase,
  insight,
  insightError,
  isDemo,
  isInsightLoading,
  isInsightRefreshing,
}: {
  activity: ActivityGroup;
  copy: ReturnType<typeof getResultsCopy>;
  extractionSettings: ExtractionSettings;
  fallbackPhrase: string;
  insight: ActivityInsightView | null;
  insightError: Error | null;
  isDemo: boolean;
  isInsightLoading: boolean;
  isInsightRefreshing: boolean;
}) {
  if (isDemo) return copy.demoInsight[activity.kind];
  if (insight) return insight.text;
  if (
    activity.insightInput.observationCount < 2 ||
    activity.insightInput.rhythm === "insufficient"
  ) {
    return fallbackPhrase || copy.insightInsufficient;
  }
  if (isInsightLoading) return copy.insightLoading;
  if (isInsightRefreshing) return copy.insightUpdating;
  if (insightError || extractionSettings.provider !== "gemini") {
    return copy.insightUnavailable;
  }
  return fallbackPhrase || copy.insightInsufficient;
}

function DemoMentionRow({
  activityLabel,
  index,
  language,
  mention,
}: {
  activityLabel: string;
  index: number;
  language: Language;
  mention: ActivityMention;
}) {
  const snippet = createEntrySearchSnippet(mention.text, activityLabel, 220);

  return (
    <div className="grid gap-2 py-3 sm:grid-cols-[2rem_8rem_1fr] sm:gap-3">
      <span className="font-serif text-sm text-zinc-300">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="text-xs text-zinc-400">
        {formatLongDate(mention.entryDate, language)}
      </span>
      <span className="font-serif text-sm leading-6 text-zinc-700">
        <MentionSnippet snippet={snippet} text={mention.text} />
      </span>
    </div>
  );
}

function MentionSnippet({
  snippet,
  text,
}: {
  snippet: EntrySearchSnippet | null;
  text: string;
}) {
  if (!snippet) {
    const normalized = text.replace(/\s+/g, " ").trim();
    return <>{normalized.length > 220 ? `${normalized.slice(0, 217)}…` : normalized}</>;
  }

  return (
    <Fragment>
      {snippet.before}
      <mark className="rounded bg-amber-100/65 px-0.5 text-zinc-900">
        {snippet.match}
      </mark>
      {snippet.after}
    </Fragment>
  );
}
