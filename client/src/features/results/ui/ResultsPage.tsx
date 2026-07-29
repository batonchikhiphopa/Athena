import { Fragment, useEffect, useMemo, useState, type CSSProperties } from "react";
import type { ExtractionSettings } from "../../../shared/contracts";
import { useI18n } from "../../../i18n/useI18n";
import type { Language } from "../../../i18n/languages";
import { Icon as IconComponent } from "../../../components/icon";
import { formatLongDate, formatShortDate } from "../../../shared/lib/dates";
import { generateAthenaPlaceholder } from "../../editor/content/athenaPlaceholder";
import type { EntryView } from "../../entries/entryTypes";
import { EntryTile } from "../../entries/ui/EntryTile";
import { CloseIcon } from "../../entries/ui/entryUiHelpers";
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
import type { ResultsCustomizationState } from "../useResultsCustomization";
import { ResultsInlineControls, ResultsInlineHeader } from "./ResultsInlineControls";
import type {
  ActivityInsightState,
} from "../activityInsightTypes";
import { ActivityDebug } from "./ActivityDebug";
import { ActivityGraph } from "./ActivityGraph";
import { AnimatedActivityPanel } from "./AnimatedActivityPanel";

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
  onSetParent,
  onToggleEntryAnalysis,
  onToggleTag,
  resultsState,
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
  onSetParent: (entityId: string, parentId: string | null) => void;
  onToggleEntryAnalysis: (entry: EntryView) => void;
  onToggleTag: (tag: string) => void;
  resultsState: ResultsCustomizationState;
}) {
  const { language } = useI18n();
  const copy = getResultsCopy(language);
  const correctionCopy = getResultsCorrectionCopy(language);
  const [openActivityIds, setOpenActivityIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [expandedBranchIds, setExpandedBranchIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [athenaPhrases, setAthenaPhrases] = useState<Map<string, string>>(
    () => new Map(),
  );
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [activityLabelDraft, setActivityLabelDraft] = useState("");
  const tree = useMemo(
    () => buildVisibleResultsTree(model.activities, entities, expandedBranchIds),
    [entities, expandedBranchIds, model.activities],
  );

  useEffect(() => {
    const currentIds = new Set(model.activities.map((activity) => activity.id));
    setOpenActivityIds((current) =>
      new Set([...current].filter((id) => currentIds.has(id))),
    );
    setAthenaPhrases((current) =>
      new Map([...current].filter(([id]) => currentIds.has(id))),
    );
  }, [model.activities]);

  return (
    <section className="relative w-full max-w-6xl px-1.5 pb-1.5 sm:pb-2">
      <div className="w-full pb-12 pt-[var(--athena-workspace-surface-top)]">
        <div className="overflow-hidden rounded-xl border border-white/40 bg-[#f8f3e9]/38 backdrop-blur-sm">
          {model.activities.length > 0 ? (
            <div className="divide-y divide-zinc-900/8">
              {tree.map(({ activity, depth, hasChildren }) => {
                    const isExpanded = openActivityIds.has(activity.id);
                    const entity = entities.find((candidate) => candidate.id === activity.id) ?? null;
                    const isRenaming = editingActivityId === activity.id;

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
                          <div
                            className="relative flex w-11 shrink-0 items-stretch"
                            style={{ paddingLeft: "10px" }}
                          >
                            {depth > 0 && (
                              <span
                                className="absolute bottom-0 top-0 border-l border-zinc-400/30"
                                style={{ left: `${depth * 16 + 10}px` }}
                              />
                            )}
                            <button
                              aria-label={correctionCopy.dragActivity(activity.label)}
                              className="my-auto h-3 w-3 shrink-0 cursor-grab rounded-full border-2 border-[#f8f3e9] bg-zinc-500 shadow-sm transition hover:scale-125 hover:bg-zinc-800 active:cursor-grabbing"
                              draggable={!model.isDemo}
                              onDragOver={(event) => event.preventDefault()}
                              onDragStart={(event) => {
                                event.dataTransfer.effectAllowed = "move";
                                event.dataTransfer.setData("application/x-athena-result", activity.id);
                              }}
                              onDrop={(event) => {
                                const sourceId = event.dataTransfer.getData("application/x-athena-result");
                                if (sourceId) onSetParent(sourceId, activity.id);
                              }}
                              style={{ marginLeft: `${depth * 16}px` } as CSSProperties}
                              title={correctionCopy.dropAsParent}
                              type="button"
                            />
                          </div>
                          <div
                            aria-expanded={isExpanded}
                            aria-label={activity.label}
                            className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left outline-none transition focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-zinc-400/70 sm:px-4"
                            onClick={() => {
                              setOpenActivityIds((current) => {
                                const next = new Set(current);
                                if (next.has(activity.id)) next.delete(activity.id);
                                else next.add(activity.id);
                                return next;
                              });
                              if (!isExpanded) {
                                setAthenaPhrases((current) => {
                                  const next = new Map(current);
                                  next.set(
                                    activity.id,
                                    generateFreshAthenaPhrase(
                                      language,
                                      current.get(activity.id) ?? "",
                                    ),
                                  );
                                  return next;
                                });
                              }
                              if (hasChildren) {
                                setExpandedBranchIds((current) => {
                                  const next = new Set(current);
                                  if (next.has(activity.id)) next.delete(activity.id);
                                  else next.add(activity.id);
                                  return next;
                                });
                              }
                            }}
                            role="button"
                            tabIndex={0}
                          >
                            <div className="min-w-0 flex-1">
                              {isRenaming ? (
                                <input
                                  autoFocus
                                  aria-label={correctionCopy.itemName}
                                  className="w-full bg-transparent text-sm font-medium text-zinc-800 outline-none sm:text-base"
                                  onBlur={() => {
                                    const label = activityLabelDraft.trim();
                                    if (label && entity) {
                                      resultsState.updateEntity(entity.id, {
                                        kind: entity.kind,
                                        label,
                                        priority: entity.priority,
                                      });
                                    }
                                    setEditingActivityId(null);
                                  }}
                                  onChange={(event) => setActivityLabelDraft(event.target.value)}
                                  onClick={(event) => event.stopPropagation()}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") event.currentTarget.blur();
                                    if (event.key === "Escape") setEditingActivityId(null);
                                  }}
                                  value={activityLabelDraft}
                                />
                              ) : (
                                <span
                                  className="block truncate text-sm font-medium text-zinc-800 sm:text-base"
                                  onDoubleClick={(event) => {
                                    event.stopPropagation();
                                    if (!entity) return;
                                    setActivityLabelDraft(entity.label);
                                    setEditingActivityId(activity.id);
                                  }}
                                  title={entity ? correctionCopy.renameHint : undefined}
                                >
                                  {activity.label}
                                </span>
                              )}
                            </div>

                            <span className="hidden shrink-0 text-xs text-zinc-400 sm:block">
                              {copy.latest(
                                formatShortDate(
                                  activity.latestEntryDate,
                                  language,
                                ),
                              )}
                            </span>
                          </div>
                        </div>

                        {isExpanded && (
                          <AnimatedActivityPanel isExpanded>
                            <ActivityEntries
                              activity={activity}
                              activityInsights={activityInsights}
                              copy={copy}
                              debugMode={debugMode}
                              entries={entries}
                              extractionSettings={extractionSettings}
                              fallbackPhrase={
                                athenaPhrases.get(activity.id) ?? ""
                              }
                              isDemo={model.isDemo}
                              language={language}
                              onDeleteEntry={onDeleteEntry}
                              onEditEntry={onEditEntry}
                              onToggleEntryAnalysis={onToggleEntryAnalysis}
                              onToggleTag={onToggleTag}
                              entity={entity}
                              resultsState={resultsState}
                              onManageActivity={onManageActivity}
                            />
                          </AnimatedActivityPanel>
                        )}
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

type ResultTreeNode = {
  activity: ActivityGroup;
  depth: number;
  hasChildren: boolean;
};

function buildVisibleResultsTree(
  activities: ActivityGroup[],
  entities: ResultsEntity[],
  expandedBranchIds: Set<string>,
): ResultTreeNode[] {
  const entityById = new Map(entities.map((entity) => [entity.id, entity]));
  const activityById = new Map(activities.map((activity) => [activity.id, activity]));
  const childrenByParentId = new Map<string, ActivityGroup[]>();
  const roots: ActivityGroup[] = [];

  for (const activity of activities) {
    const entity = entityById.get(activity.id);
    const parent = entity?.parentId ? entityById.get(entity.parentId) : null;
    if (!entity || !parent || !activityById.has(parent.id) || parent.priority <= entity.priority) {
      roots.push(activity);
      continue;
    }
    childrenByParentId.set(parent.id, [...(childrenByParentId.get(parent.id) ?? []), activity]);
  }

  const compare = (left: ActivityGroup, right: ActivityGroup) =>
    (entityById.get(right.id)?.priority ?? 0) - (entityById.get(left.id)?.priority ?? 0) || left.label.localeCompare(right.label);
  const visible: ResultTreeNode[] = [];
  const append = (activity: ActivityGroup, depth: number) => {
    const children = [...(childrenByParentId.get(activity.id) ?? [])].sort(compare);
    visible.push({ activity, depth, hasChildren: children.length > 0 });
    if (expandedBranchIds.has(activity.id)) children.forEach((child) => append(child, depth + 1));
  };
  roots.sort(compare).forEach((activity) => append(activity, 0));
  return visible;
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
  entity,
  entries,
  extractionSettings,
  fallbackPhrase,
  isDemo,
  language,
  onDeleteEntry,
  onEditEntry,
  onManageActivity,
  onToggleEntryAnalysis,
  onToggleTag,
  resultsState,
}: {
  activity: ActivityGroup;
  activityInsights: ActivityInsightState;
  copy: ReturnType<typeof getResultsCopy>;
  debugMode: boolean;
  entity: ResultsEntity | null;
  entries: EntryView[];
  extractionSettings: ExtractionSettings;
  fallbackPhrase: string;
  isDemo: boolean;
  language: Language;
  onDeleteEntry: (entry: EntryView) => void;
  onEditEntry: (entry: EntryView) => void;
  onManageActivity: (activityId: string) => void;
  onToggleEntryAnalysis: (entry: EntryView) => void;
  onToggleTag: (tag: string) => void;
  resultsState: ResultsCustomizationState;
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
    <div className="flex flex-col border-t border-zinc-900/8 bg-white/36 pb-5">
      {!isDemo && entity && (
        <ResultsInlineHeader entries={entries} entity={entity} state={resultsState} />
      )}

      <div className="grid items-stretch gap-3 border-b border-zinc-900/8 px-4 py-4 sm:px-5 md:grid-cols-12">
        <div className="md:col-span-6 lg:col-span-5">
          <ActivityGraph activity={activity} copy={copy} language={language} />
        </div>
        <div className="md:col-span-6 lg:col-span-4">
          <ActivitySnapshot activity={activity} copy={copy} />
        </div>
        {!isDemo && entity && (
          <div className="md:col-span-12 lg:col-span-3">
            <ResultsInlineControls entity={entity} state={resultsState} />
          </div>
        )}
        {debugMode && (
          <div className="min-w-0 md:col-span-12">
            <ActivityDebug
              activity={activity}
              copy={copy}
              insight={insight}
              language={language}
              model={extractionSettings.model}
            />
          </div>
        )}
      </div>

      <div className="order-2 flex items-center justify-between px-4 py-4 sm:px-5">
        <p className="text-xs text-zinc-400">
          {copy.sourceEntries}
          {debugMode && ` · ${activity.mentions.length}`}
        </p>
        {!isDemo && (
          <button
            aria-label={`${reviewCopy.manageTitle}: ${activity.label}`}
            className="grid h-7 w-7 place-items-center rounded-full text-zinc-300 transition hover:bg-white/55 hover:text-zinc-700"
            onClick={() => onManageActivity(activity.id)}
            title={reviewCopy.manageTitle}
            type="button"
          >
            <IconComponent className="h-4 w-4" name="settings" />
          </button>
        )}
      </div>

      <div className="order-3 px-4 sm:px-5">
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

      <div className="order-1 mx-4 border-b border-zinc-900/8 py-4 sm:mx-5">
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
              ? copy.insightDailyLimit
              : activityInsights.error.message}
          </p>
        )}
      </div>
    </div>
  );
}

function ActivitySnapshot({
  activity,
  copy,
}: {
  activity: ActivityGroup;
  copy: ReturnType<typeof getResultsCopy>;
}) {
  const mentions = activity.mentions;
  const resultCount = mentions.filter(
    (mention) => mention.marker === "result" || mention.context?.event === "result",
  ).length;
  const blockerCount = mentions.filter(
    (mention) => mention.marker === "blocker" || mention.context?.event === "blocked",
  ).length;
  return (
    <section className="flex h-full flex-col justify-between rounded-xl border border-amber-900/10 bg-white/70 p-3.5 text-sm text-zinc-700 shadow-sm backdrop-blur-md">
      <div>
        <div className="inline-block rounded-full bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700">
          {copy.rhythm[activity.insightInput.rhythm]}
        </div>
        <p className="mt-2 text-xs font-medium text-zinc-600">
          {copy.stage[activity.insightInput.stage]}
        </p>
      </div>
      <div className="mt-3 border-t border-zinc-100 pt-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
          {copy.reviewPeriod}
        </p>
        <dl className="mt-1.5 space-y-1 text-xs text-zinc-700">
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-500">{copy.snapshotMentions}</dt>
            <dd className="font-semibold">{mentions.length}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-500">{copy.snapshotResults}</dt>
            <dd className="font-semibold text-emerald-700">{resultCount}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-500">{copy.snapshotBlockers}</dt>
            <dd className="font-semibold text-amber-700">{blockerCount}</dd>
          </div>
        </dl>
      </div>
    </section>
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
