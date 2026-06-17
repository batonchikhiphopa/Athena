import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import type { EntrySortDirection, EntryView } from "../types";
import type { Language } from "../i18n/languages";
import { formatLongDate } from "../lib/dates";
import { useI18n } from "../i18n/useI18n";
import { normalizeTag } from "../features/entries/entryFilters";
import { parseEntrySearchQuery } from "../features/entries/entrySearch";
import {
  EntryDebugTooltip,
  EntryDebugWaitCue,
} from "./EntryDebugTooltip";
import { EyeClosedIcon, EyeOpenIcon, Icon } from "./icon";
import { TooltipButton } from "./TooltipButton";
import { useEntryDebugTooltip } from "./useEntryDebugTooltip";

type EntriesPageProps = {
  debugMode: boolean;
  entries: EntryView[];
  selectedEntryId: string | null;
  sortDirection: EntrySortDirection;
  searchQuery: string;
  includedTags: string[];
  excludedTags: string[];
  hasActiveFilters: boolean;
  hasUnreadInsights: boolean;
  isSearching: boolean;
  onChangeSortDirection: (direction: EntrySortDirection) => void;
  onClearFilters: () => void;
  onDeleteEntry: (entry: EntryView) => void;
  onEditEntry: (entry: EntryView) => void;
  onOpenObservations: () => void;
  onSearchQueryChange: (query: string) => void;
  onSelectEntry: (id: string) => void;
  onToggleEntryAnalysis: (entry: EntryView) => void;
  onToggleExcludedTag: (tag: string) => void;
  onToggleTag: (tag: string) => void;
};

export function EntriesPage({
  debugMode,
  entries,
  selectedEntryId,
  searchQuery,
  includedTags,
  excludedTags,
  hasActiveFilters,
  hasUnreadInsights,
  isSearching,
  onClearFilters,
  onDeleteEntry,
  onEditEntry,
  onOpenObservations,
  onSearchQueryChange,
  onSelectEntry,
  onToggleEntryAnalysis,
  onToggleExcludedTag,
  onToggleTag,
}: EntriesPageProps) {
  const { language, t } = useI18n();
  const gridRef = useRef<HTMLDivElement>(null);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const columnCount = useEntryColumnCount(gridRef, entries.length);
  const entryColumns = useMemo(
    () => distributeEntriesByColumn(entries, columnCount),
    [columnCount, entries],
  );
  const entriesGridStyle = {
    "--athena-entry-column-count": entryColumns.length || 1,
  } as CSSProperties;

  useEffect(() => {
    if (!expandedEntryId) return;
    if (entries.some((entry) => entry.id === expandedEntryId)) return;

    setExpandedEntryId(null);
  }, [entries, expandedEntryId]);

  function handleSelectEntry(entryId: string) {
    setExpandedEntryId(entryId);
    onSelectEntry(entryId);
  }

  return (
    <section className="relative w-full max-w-6xl px-1.5 py-1.5 sm:py-2">
  <div
    className="
      fixed left-1/2 top-1.5 z-30 w-full max-w-6xl
      -translate-x-1/2 bg-transparent px-1.5
      sm:top-2
    "
  >
        <EntriesUtilityPanel
          excludedTags={excludedTags}
          hasActiveFilters={hasActiveFilters}
          hasUnreadInsights={hasUnreadInsights}
          includedTags={includedTags}
          isSearching={isSearching}
          searchQuery={searchQuery}
          onClearFilters={onClearFilters}
          onOpenObservations={onOpenObservations}
          onSearchQueryChange={onSearchQueryChange}
          onToggleExcludedTag={onToggleExcludedTag}
          onToggleTag={onToggleTag}
        />
      </div>

      <div
        className="
          athena-entries-grid w-full pb-8 pt-20
          transform-gpu
        "
        ref={gridRef}
        style={entriesGridStyle}
      >

        {entries.length > 0 &&
          entryColumns.map((columnEntries, columnIndex) => (
            <div
              className="athena-entries-column"
              key={`entries-column-${columnIndex}`}
            >
              {columnEntries.map((entry) => (
                <EntryTile
                  debugMode={debugMode}
                  entry={entry}
                  isExpanded={expandedEntryId === entry.id}
                  isSelected={selectedEntryId === entry.id}
                  key={entry.id}
                  language={language}
                  searchQuery={searchQuery}
                  onDeleteEntry={onDeleteEntry}
                  onEditEntry={onEditEntry}
                  onSelectEntry={handleSelectEntry}
                  onToggleEntryAnalysis={onToggleEntryAnalysis}
                  onToggleTag={onToggleTag}
                />
              ))}
            </div>
          ))}

        {entries.length === 0 && (
          <div
            className="
              col-span-full
              rounded-lg border border-dashed border-white/50 bg-white/30 p-5
              text-sm text-zinc-400 backdrop-blur-[1px]
            "
            data-testid="entries-empty-state"
          >
            {hasActiveFilters ? t("entries.emptyFiltered") : t("entries.empty")}
          </div>
        )}
      </div>
    </section>
  );
}

function EntriesUtilityPanel({
  searchQuery,
  includedTags,
  excludedTags,
  hasActiveFilters,
  hasUnreadInsights,
  isSearching,
  onClearFilters,
  onOpenObservations,
  onSearchQueryChange,
  onToggleExcludedTag,
  onToggleTag,
}: {
  searchQuery: string;
  includedTags: string[];
  excludedTags: string[];
  hasActiveFilters: boolean;
  hasUnreadInsights: boolean;
  isSearching: boolean;
  onClearFilters: () => void;
  onOpenObservations: () => void;
  onSearchQueryChange: (query: string) => void;
  onToggleExcludedTag: (tag: string) => void;
  onToggleTag: (tag: string) => void;
}) {
  const { t } = useI18n();
  const forceInsightGlowForReview = true;
  const showInsightGlow = forceInsightGlowForReview || hasUnreadInsights;

  return (
    <aside
      aria-label={t("entries.searchAria")}
      className="
        flex w-full shrink-0 flex-wrap items-start gap-2
        bg-transparent
        sm:flex-nowrap
      "
    >
      <div className="relative min-w-0 flex-1 basis-[18rem] sm:max-w-[34.5rem]">
        <input
          aria-label={t("entries.searchAria")}
          className="
            h-9 w-full rounded-full border border-white/70 bg-white px-3.5 pr-9
            text-sm text-zinc-800 shadow-sm shadow-zinc-900/5 outline-none
            transition
            placeholder:text-zinc-400
            focus:border-white focus:bg-white focus:shadow-zinc-900/10
          "
          data-testid="entries-search-input"
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder={t("entries.searchPlaceholder")}
          type="search"
          value={searchQuery}
        />

        {hasActiveFilters && (
          <button
            aria-label={t("entries.action.clearFilters")}
            className="
              absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2
              place-items-center rounded-full text-zinc-400 transition
              hover:bg-white/60 hover:text-zinc-950
            "
            data-testid="entries-clear-filters"
            onClick={onClearFilters}
            type="button"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      <ActiveTagFilters
        excludedTags={excludedTags}
        includedTags={includedTags}
        onToggleExcludedTag={onToggleExcludedTag}
        onToggleTag={onToggleTag}
      />

      {isSearching && (
        <div className="flex h-9 items-center text-xs text-zinc-400">
          {t("entries.searching")}
        </div>
      )}

      <TooltipButton
        aria-label={t("nav.observations")}
        className={[
          "-mr-1 ml-auto relative flex h-9 w-9 shrink-0 items-center justify-center overflow-visible rounded-full bg-transparent transition hover:bg-transparent",
          showInsightGlow
            ? "text-zinc-700 hover:text-zinc-900"
            : "text-zinc-400 opacity-50 hover:text-zinc-700 hover:opacity-100",
        ].join(" ")}
        data-testid="entries-open-observations"
        onClick={onOpenObservations}
        tooltip={t("nav.observations")}
        tooltipPlacement="left"
        type="button"
      >
        <Icon
          name="observations"
          className={[
            "relative h-5 w-5",
            showInsightGlow
              ? "z-10 text-zinc-700 motion-safe:animate-[observation-stars-glow_2.8s_ease-in-out_infinite]"
              : "z-10",
          ].join(" ")}
        />
      </TooltipButton>
    </aside>
  );
}

function ActiveTagFilters({
  includedTags,
  excludedTags,
  onToggleTag,
  onToggleExcludedTag,
}: {
  includedTags: string[];
  excludedTags: string[];
  onToggleTag: (tag: string) => void;
  onToggleExcludedTag: (tag: string) => void;
}) {
  const { t } = useI18n();

  if (includedTags.length === 0 && excludedTags.length === 0) return null;

  return (
    <div className="flex min-h-9 min-w-0 flex-wrap items-center gap-2">
      {includedTags.map((tag) => (
        <button
          aria-label={`${t("entries.action.clearFilters")} #${tag}`}
          className="
            inline-flex h-9 items-center gap-2 rounded-full border border-white/45
            bg-sky-50/70 px-3 text-sm text-sky-700 shadow-sm shadow-zinc-900/5
            backdrop-blur-[2px] transition hover:bg-white/70 hover:text-sky-800
          "
          data-testid={`entry-tag-include-${tagTestIdValue(tag)}`}
          key={`include-${tag}`}
          onClick={() => onToggleTag(tag)}
          type="button"
        >
          <span>#{tag}</span>
          <CloseIcon />
        </button>
      ))}

      {excludedTags.map((tag) => (
        <button
          aria-label={`${t("entries.action.clearFilters")} -#${tag}`}
          className="
            inline-flex h-9 items-center gap-2 rounded-full border border-white/45
            bg-zinc-100/65 px-3 text-sm text-zinc-500 shadow-sm shadow-zinc-900/5
            backdrop-blur-[2px] transition hover:bg-white/70 hover:text-zinc-800
          "
          data-testid={`entry-tag-exclude-${tagTestIdValue(tag)}`}
          key={`exclude-${tag}`}
          onClick={() => onToggleExcludedTag(tag)}
          type="button"
        >
          <span>-#{tag}</span>
          <CloseIcon />
        </button>
      ))}
    </div>
  );
}

function EntryTile({
  debugMode,
  entry,
  isExpanded,
  isSelected,
  language,
  searchQuery,
  onDeleteEntry,
  onEditEntry,
  onSelectEntry,
  onToggleEntryAnalysis,
  onToggleTag,
}: {
  debugMode: boolean;
  entry: EntryView;
  isExpanded: boolean;
  isSelected: boolean;
  language: Language;
  searchQuery: string;
  onDeleteEntry: (entry: EntryView) => void;
  onEditEntry: (entry: EntryView) => void;
  onSelectEntry: (id: string) => void;
  onToggleEntryAnalysis: (entry: EntryView) => void;
  onToggleTag: (tag: string) => void;
}) {
  const { t } = useI18n();
  const {
    anchorRef: debugAnchorRef,
    isWaiting: isDebugTooltipWaiting,
    onAnchorBlur,
    onAnchorFocus,
    onAnchorPointerEnter,
    onAnchorPointerLeave,
    onTooltipBlur,
    onTooltipFocus,
    onTooltipPointerEnter,
    onTooltipPointerLeave,
    position: debugTooltipPosition,
    status: debugTooltipStatus,
    tooltipRef,
  } = useEntryDebugTooltip({ enabled: debugMode });

  const debugTooltip =
    debugMode &&
    debugTooltipStatus === "open" &&
    debugTooltipPosition &&
    typeof document !== "undefined"
      ? createPortal(
          <EntryDebugTooltip
            entry={entry}
            maxHeight={debugTooltipPosition.maxHeight}
            onBlur={onTooltipBlur}
            onFocus={onTooltipFocus}
            onPointerEnter={onTooltipPointerEnter}
            onPointerLeave={onTooltipPointerLeave}
            style={{
              left: debugTooltipPosition.left,
              maxHeight: debugTooltipPosition.maxHeight,
              top: debugTooltipPosition.top,
              width: debugTooltipPosition.width,
            }}
            tooltipRef={tooltipRef}
          />,
          document.body,
        )
      : null;

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    onSelectEntry(entry.id);
  };

  return (
    <article
      aria-expanded={isExpanded}
      aria-pressed={isSelected}
      className={[
        "athena-entry-tile group relative cursor-pointer",
        "focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400/70",
      ].join(" ")}
      data-expanded={isExpanded ? "true" : "false"}
      data-testid="entry-list-item"
      onClick={() => onSelectEntry(entry.id)}
      onBlurCapture={onAnchorBlur}
      onFocusCapture={onAnchorFocus}
      onKeyDown={handleKeyDown}
      onPointerEnter={onAnchorPointerEnter}
      onPointerLeave={onAnchorPointerLeave}
      ref={debugAnchorRef}
      role="button"
      tabIndex={0}
    >
      <div
        className={[
          "relative flex flex-col overflow-hidden rounded-lg border border-white/15",
          "bg-white/25 shadow-sm shadow-zinc-900/5 backdrop-blur-[1px]",
          "transition duration-200",
          isSelected
            ? "border-zinc-400/60 bg-white/40"
            : "hover:border-white/35 hover:bg-white/32",
        ].join(" ")}
      >
        <div
          className="
            pointer-events-none absolute right-[4.5rem] top-1 z-20 opacity-0
            transition
            group-hover:pointer-events-auto group-hover:opacity-100
            group-focus-within:pointer-events-auto group-focus-within:opacity-100
          "
        >
          <TooltipButton
            aria-label={
              entry.analysisEnabled
                ? t("entries.action.excludeAnalysis")
                : t("entries.action.includeAnalysis")
            }
            aria-pressed={entry.analysisEnabled}
            className="
              flex h-6 w-6 items-center justify-center rounded-full
              text-zinc-400 opacity-70 transition
              hover:bg-zinc-200/40 hover:text-zinc-700 hover:opacity-100
            "
            onClick={(event) => {
              event.stopPropagation();
              onToggleEntryAnalysis(entry);
            }}
            tooltip={
              entry.analysisEnabled
                ? t("entries.action.excludeAnalysis")
                : t("entries.action.includeAnalysis")
            }
            tooltipPlacement="left"
            type="button"
          >
            {entry.analysisEnabled ? <EyeOpenIcon /> : <EyeClosedIcon />}
          </TooltipButton>
        </div>

        <div
          className="
            pointer-events-none absolute right-10 top-1 z-20 opacity-0
            transition
            group-hover:pointer-events-auto group-hover:opacity-100
            group-focus-within:pointer-events-auto group-focus-within:opacity-100
          "
        >
          <TooltipButton
            aria-label={t("entries.action.edit")}
            className="
              flex h-6 w-6 items-center justify-center rounded-full
              text-zinc-400 opacity-70 transition
              hover:bg-zinc-200/40 hover:text-zinc-700 hover:opacity-100
            "
            onClick={(event) => {
              event.stopPropagation();
              onEditEntry(entry);
            }}
            tooltip={t("entries.action.edit")}
            tooltipPlacement="left"
            type="button"
          >
            <EditIcon />
          </TooltipButton>
        </div>

        <div
          className="
            pointer-events-none absolute right-2 top-1 z-20 opacity-0
            transition
            group-hover:pointer-events-auto group-hover:opacity-100
            group-focus-within:pointer-events-auto group-focus-within:opacity-100
          "
        >
          <TooltipButton
            aria-label={t("entries.action.delete")}
            className="
              flex h-6 w-6 items-center justify-center rounded-full
              text-zinc-400 opacity-70 transition
              hover:bg-red-50 hover:text-red-700 hover:opacity-100
            "
            onClick={(event) => {
              event.stopPropagation();
              onDeleteEntry(entry);
            }}
            tooltip={t("entries.action.delete")}
            tooltipPlacement="left"
            type="button"
          >
            <CloseIcon />
          </TooltipButton>
        </div>

        <div className="flex min-h-10 items-center justify-between border-b border-black/5 px-5 py-3 pr-28 text-xs text-zinc-500">
          <span>{formatLongDate(entry.entryDate, language)}</span>
          {entry.isDraft && (
            <span className="rounded-full bg-white/45 px-2 py-0.5 text-[11px] text-zinc-500">
              {t("entries.draft")}
            </span>
          )}
        </div>

        <div className="athena-entry-tile-body px-5 py-4">
          <div className="athena-entry-tile-body-content whitespace-pre-wrap break-words font-serif text-[15px] leading-7 text-zinc-900">
            <EntryText text={entry.text} query={searchQuery} />
          </div>
        </div>

        {entry.tags.length > 0 && (
          <div className="px-5 pb-4">
            <div className="flex max-h-8 flex-wrap items-start gap-1.5 overflow-hidden">
              {entry.tags.map((tag) => (
                <button
                  className="
                    inline-grid items-center rounded-full bg-sky-50 px-2 py-1
                    text-xs text-sky-700 transition
                    hover:bg-white hover:text-zinc-950
                  "
                  data-testid={`entry-tile-tag-${tagTestIdValue(tag)}`}
                  key={tag}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleTag(tag);
                  }}
                  type="button"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {isDebugTooltipWaiting && <EntryDebugWaitCue />}
      </div>

      {debugTooltip}
    </article>
  );
}

function EntryText({ text, query }: { text: string; query: string }) {
  const range = findSearchHighlightRange(text, query);

  if (!range) return <>{text}</>;

  return (
    <>
      {text.slice(0, range.start)}
      <mark className="rounded bg-white/75 px-0.5 text-zinc-950">
        {text.slice(range.start, range.end)}
      </mark>
      {text.slice(range.end)}
    </>
  );
}

function findSearchHighlightRange(
  text: string,
  query: string,
): { start: number; end: number } | null {
  const { textTerms } = parseEntrySearchQuery(query);
  const phrase = textTerms.join(" ");
  const terms = [phrase, ...textTerms].filter(Boolean);

  for (const term of terms) {
    const range = findCaseInsensitiveRange(text, term);
    if (range) return range;
  }

  return null;
}

function findCaseInsensitiveRange(
  text: string,
  term: string,
): { start: number; end: number } | null {
  const normalizedText = text.toLocaleLowerCase();
  const normalizedTerm = term.toLocaleLowerCase();
  const start = normalizedText.indexOf(normalizedTerm);

  if (start < 0) return null;

  return {
    start,
    end: start + normalizedTerm.length,
  };
}

function EditIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M5 18.5h3.2L18.7 8a2.26 2.26 0 0 0-3.2-3.2L5 15.3v3.2Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="m14.5 5.8 3.7 3.7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="m7 7 10 10M17 7 7 17"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function tagTestIdValue(tag: string) {
  return normalizeTag(tag).replace(/[^\p{L}\p{N}]+/gu, "-") || "tag";
}

function useEntryColumnCount(
  containerRef: RefObject<HTMLElement | null>,
  itemCount: number,
) {
  const [columnCount, setColumnCount] = useState(1);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateColumnCount = () => {
      const nextColumnCount = getEntryColumnCount(element.clientWidth, itemCount);
      setColumnCount((currentColumnCount) =>
        currentColumnCount === nextColumnCount
          ? currentColumnCount
          : nextColumnCount,
      );
    };

    updateColumnCount();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateColumnCount);
      return () => window.removeEventListener("resize", updateColumnCount);
    }

    const resizeObserver = new ResizeObserver(updateColumnCount);
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, [containerRef, itemCount]);

  return columnCount;
}

function getEntryColumnCount(containerWidth: number, itemCount: number) {
  if (itemCount <= 1) return 1;

  const rootFontSize =
    typeof document === "undefined"
      ? 16
      : Number.parseFloat(getComputedStyle(document.documentElement).fontSize) ||
        16;
  const minColumnWidth = 18.5 * rootFontSize;
  const columnGap = 0.75 * rootFontSize;
  const availableColumnCount = Math.max(
    1,
    Math.floor((containerWidth + columnGap) / (minColumnWidth + columnGap)),
  );

  return Math.min(itemCount, availableColumnCount);
}

function distributeEntriesByColumn(entries: EntryView[], columnCount: number) {
  const columns = Array.from(
    { length: Math.max(1, Math.min(entries.length || 1, columnCount)) },
    () => [] as EntryView[],
  );

  entries.forEach((entry, index) => {
    columns[index % columns.length].push(entry);
  });

  return columns;
}
