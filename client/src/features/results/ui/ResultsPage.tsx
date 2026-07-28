import { Fragment, useEffect, useMemo, useState } from "react";
import type { ExtractionSettings } from "../../../shared/contracts";
import { useI18n } from "../../../i18n/useI18n";
import type { Language } from "../../../i18n/languages";
import { formatLongDate, formatShortDate } from "../../../shared/lib/dates";
import { generateAthenaPlaceholder } from "../../editor/content/athenaPlaceholder";
import type { EntryView } from "../../entries/entryTypes";
import { EntryTile } from "../../entries/ui/EntryTile";
import { CloseIcon } from "../../entries/ui/entryUiHelpers";
import { Icon as IconComponent } from "../../../components/icon";
import { TooltipButton } from "../../../components/TooltipButton";
import {
  createEntrySearchSnippet,
  type EntrySearchSnippet,
} from "../../entries/entrySearch";
import { getResultsCopy } from "../resultsCopy";
import { getResultsCorrectionCopy } from "../resultsCorrectionCopy";
import type {
  ActivityGroup,
  ActivityIndex,
  ActivityMention,
} from "../resultsTypes";
import type { ResultsEntity } from "../resultsCorrections";
import type {
  ActivityInsightState,
} from "../activityInsightTypes";
import { ActivityDebug } from "./ActivityDebug";
import { ActivityGraph } from "./ActivityGraph";
import { AnimatedActivityPanel } from "./AnimatedActivityPanel";
import { ActivityReviewFacts } from "./ActivityReviewFacts";

export function ResultsPage({
  activityInsights,
  debugMode,
  entries,
  extractionSettings,
  entities,
  model,
  onDeleteEntry,
  onEditEntry,
  onManageActivity,
  onToggleEntryAnalysis,
  onToggleTag,
}: {
  activityInsights: ActivityInsightState;
  debugMode: boolean;
  entries: EntryView[];
  extractionSettings: ExtractionSettings;
  entities: ResultsEntity[];
  model: ActivityIndex;
  onDeleteEntry: (entry: EntryView) => void;
  onEditEntry: (entry: EntryView) => void;
  onManageActivity: (activityId: string) => void;
  onToggleEntryAnalysis: (entry: EntryView) => void;
  onToggleTag: (tag: string) => void;
}) {
  const { language } = useI18n();
  const copy = getResultsCopy(language);
  const correctionCopy = getResultsCorrectionCopy(language);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(
    null,
  );
  const [athenaPhrase, setAthenaPhrase] = useState<{
    activityId: string;
    text: string;
  } | null>(null);
  const sections = useMemo(
    () => groupActivities(model.activities, entities, language),
    [entities, language, model.activities],
  );

  useEffect(() => {
    if (!selectedActivityId) return;
    if (model.activities.some((activity) => activity.id === selectedActivityId)) {
      return;
    }
    setSelectedActivityId(null);
  }, [model.activities, selectedActivityId]);

  useEffect(() => {
    if (!selectedActivityId) return;
    setAthenaPhrase((current) => ({
      activityId: selectedActivityId,
      text: generateFreshAthenaPhrase(language, current?.text ?? ""),
    }));
  }, [language, selectedActivityId]);

  return (
    <section className="relative w-full max-w-6xl px-1.5 pb-1.5 sm:pb-2">
      <div className="w-full pb-12 pt-[var(--athena-workspace-surface-top)]">
        <div className="overflow-hidden rounded-xl border border-white/40 bg-[#f8f3e9]/38 backdrop-blur-sm">
          {model.activities.length > 0 ? (
            <div className="divide-y divide-zinc-900/8">
              {sections.map((section) => (
                <Fragment key={section.id}>
                  {section.label && (
                    <div className="bg-[#f8f3e9]/55 px-4 py-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                      {section.label}
                    </div>
                  )}
                  {section.activities.map((activity) => {
                    const isExpanded = selectedActivityId === activity.id;

                    return (
                      <section
                        className="scroll-mt-16"
                        data-activity-id={activity.id}
                        key={activity.id}
                      >
                        <div
                          className={[
                            "flex min-h-14 w-full items-stretch",
                            isExpanded ? "bg-white/48" : "hover:bg-white/28",
                          ].join(" ")}
                        >
                          <button
                            aria-expanded={isExpanded}
                            aria-label={activity.label}
                            className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left outline-none transition focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-zinc-400/70 sm:px-4"
                            onClick={() =>
                              setSelectedActivityId(
                                isExpanded ? null : activity.id,
                              )
                            }
                            type="button"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-zinc-800 sm:text-base">
                                {activity.label}
                              </span>
                            </div>

                            <span className="hidden shrink-0 text-xs text-zinc-400 sm:block">
                              {copy.latest(
                                formatShortDate(
                                  activity.latestEntryDate,
                                  language,
                                ),
                              )}
                            </span>
                          </button>
                          {!model.isDemo && (
                            <button
                              aria-label={`${correctionCopy.manageTitle}: ${activity.label}`}
                              className="m-2 grid h-7 w-7 shrink-0 self-center place-items-center rounded-full text-zinc-300 outline-none transition hover:bg-white/55 hover:text-zinc-700 focus-visible:ring-1 focus-visible:ring-zinc-400/70"
                              data-testid={`manage-result-${activity.id}`}
                              onClick={() => onManageActivity(activity.id)}
                              title={correctionCopy.manageTitle}
                              type="button"
                            >
                              <span>
                                <IconComponent name="settings" className="h-4 w-4" />
                              </span>
                            </button>
                          )}
                        </div>

                        <AnimatedActivityPanel isExpanded={isExpanded}>
                          <ActivityEntries
                            activity={activity}
                            activityInsights={activityInsights}
                            copy={copy}
                            debugMode={debugMode}
                            entries={entries}
                            extractionSettings={extractionSettings}
                            fallbackPhrase={
                              athenaPhrase?.activityId === activity.id
                                ? athenaPhrase.text
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
                </Fragment>
              ))}
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

type ActivitySection = {
  activities: ActivityGroup[];
  id: string;
  label: string | null;
};

function groupActivities(
  activities: ActivityGroup[],
  entities: ResultsEntity[],
  language: Language,
): ActivitySection[] {
  const entityById = new Map(entities.map((entity) => [entity.id, entity]));
  const grouped = new Map<string, ActivitySection>();

  for (const activity of activities) {
    const entity = entityById.get(activity.id);
    const label =
      entity?.trackingMode === "reduce"
        ? getReduceLabel(language)
        : entity?.direction ?? null;
    const id = entity?.trackingMode === "reduce" ? "reduce" : label ?? "other";
    const section = grouped.get(id) ?? { activities: [], id, label };
    section.activities.push(activity);
    grouped.set(id, section);
  }

  return [...grouped.values()].sort((left, right) => {
    if (left.id === "reduce") return 1;
    if (right.id === "reduce") return -1;
    if (left.label === null) return 1;
    if (right.label === null) return -1;
    return left.label.localeCompare(right.label);
  });
}

function getReduceLabel(language: Language) {
  if (language === "ru") return "Хочу сократить";
  if (language === "uk") return "Хочу скоротити";
  if (language === "de") return "Möchte ich reduzieren";
  return "Want to reduce";
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
  const reviewCopy = getResultsCorrectionCopy(language);
  const canFormulateCurrentReview =
    activityInsights.canFormulateReview &&
    extractionSettings.provider === "gemini" &&
    activity.insightInput.observationCount >= 2 &&
    activity.insightInput.rhythm !== "insufficient";
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
      <div className="border-b border-zinc-900/8 pb-5">
        <div className="flex items-start justify-between gap-4">
          <p className="max-w-3xl flex-1 font-serif text-[1.02rem] leading-7 text-zinc-800">
            {isDemo
              ? copy.demoInsight[activity.kind]
              : insight?.text || fallbackPhrase}
          </p>

          {!isDemo && (
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                className="rounded-full border border-white/60 bg-white/45 px-3 py-1.5 text-xs text-zinc-600 transition hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={
                  !canFormulateCurrentReview || activityInsights.isRefreshing
                }
                onClick={() => void activityInsights.formulateReview()}
                title={
                  canFormulateCurrentReview ? undefined : reviewCopy.aiDisabled
                }
                type="button"
              >
                {activityInsights.isRefreshing
                  ? `${reviewCopy.formulateReview}…`
                  : reviewCopy.formulateReview}
              </button>

              {insight && (
                <TooltipButton
                  aria-label={reviewCopy.remove}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-400 opacity-70 transition hover:bg-red-50 hover:text-red-700 hover:opacity-100"
                  onClick={() => void activityInsights.deleteInsight(activity.id)}
                  tooltip={reviewCopy.remove}
                  tooltipPlacement="left"
                  type="button"
                >
                  <CloseIcon />
                </TooltipButton>
              )}
            </div>
          )}
        </div>

        {insight?.sources && insight.sources.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-400">
            <span>{reviewCopy.webSources}:</span>
            {insight.sources.map((source) => (
              <a
                className="text-zinc-500 underline decoration-zinc-300 underline-offset-2 transition hover:text-zinc-900"
                href={source.url}
                key={source.url}
                rel="noreferrer"
                target="_blank"
              >
                {source.title}
              </a>
            ))}
          </div>
        )}

        {activityInsights.error && (
          <p className="mt-2 text-xs text-red-600" role="status">
            {activityInsights.error.message === "activity_insight_daily_limit"
              ? "AI review is limited to one request per day."
              : activityInsights.error.message}
          </p>
        )}
      </div>

      <div className="grid gap-5 border-b border-zinc-900/8 py-5 lg:grid-cols-2">
        <div className="min-w-0">
          <ActivityReviewFacts activity={activity} language={language} />
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
