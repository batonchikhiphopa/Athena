import type { EntrySortDirection, EntryView } from "../types";
import { EntryDetail } from "./EntryDetail";
import { excerpt } from "../lib/text";
import { formatLongDate } from "../lib/dates";
import { useI18n } from "../i18n/useI18n";
import { normalizeTag } from "../features/entries/entryFilters";
import { createEntrySearchSnippet } from "../features/entries/entrySearch";
import { EyeClosedIcon, EyeOpenIcon } from "./icon";
import { TooltipButton } from "./TooltipButton";

type EntriesPageProps = {
  debugMode: boolean;
  entries: EntryView[];
  selectedEntry: EntryView | null;
  selectedEntryId: string | null;
  sortDirection: EntrySortDirection;
  searchQuery: string;
  includedTags: string[];
  excludedTags: string[];
  availableTags: Array<{ tag: string; count: number }>;
  hasActiveFilters: boolean;
  isSearching: boolean;
  onChangeSortDirection: (direction: EntrySortDirection) => void;
  onClearFilters: () => void;
  onDeleteEntry: (entry: EntryView) => void;
  onEditEntry: (entry: EntryView) => void;
  onRefresh: () => void;
  onSearchQueryChange: (query: string) => void;
  onSelectEntry: (id: string) => void;
  onToggleEntryAnalysis: (entry: EntryView) => void;
  onToggleExcludedTag: (tag: string) => void;
  onToggleTag: (tag: string) => void;
};

export function EntriesPage({
  debugMode,
  entries,
  selectedEntry,
  selectedEntryId,
  sortDirection,
  searchQuery,
  includedTags,
  excludedTags,
  availableTags,
  hasActiveFilters,
  isSearching,
  onChangeSortDirection,
  onClearFilters,
  onDeleteEntry,
  onEditEntry,
  onRefresh,
  onSearchQueryChange,
  onSelectEntry,
  onToggleEntryAnalysis,
  onToggleExcludedTag,
  onToggleTag,
}: EntriesPageProps) {
  const { language, t } = useI18n();

  return (
    <section className="-mx-4 grid h-full min-h-0 w-[calc(100%+2rem)] grid-cols-[minmax(320px,420px)_minmax(0,1fr)] overflow-hidden">
      <div className="grid h-screen min-h-0 grid-rows-[auto_auto_auto_minmax(0,1fr)] border-r border-zinc-200 bg-zinc-50 px-6 py-8">
        <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div>
            <div className="text-xs uppercase text-zinc-400">
              {t("entries.title")}
            </div>
          </div>

          <button
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950"
            onClick={onRefresh}
            type="button"
          >
            {t("common.refresh")}
          </button>
        </div>

        <div className="mb-4 inline-grid w-max grid-cols-2 rounded-md border border-zinc-200 bg-white p-1 text-sm">
          <button
            className={[
              "rounded px-3 py-1.5 transition",
              sortDirection === "desc"
                ? "bg-zinc-950 text-white"
                : "text-zinc-500 hover:text-zinc-950",
            ].join(" ")}
            onClick={() => onChangeSortDirection("desc")}
            type="button"
          >
            {t("entries.sort.newest")}
          </button>
          <button
            className={[
              "rounded px-3 py-1.5 transition",
              sortDirection === "asc"
                ? "bg-zinc-950 text-white"
                : "text-zinc-500 hover:text-zinc-950",
            ].join(" ")}
            onClick={() => onChangeSortDirection("asc")}
            type="button"
          >
            {t("entries.sort.oldest")}
          </button>
        </div>

        <div className="mb-4 space-y-3">
          <div className="relative">
            <input
              aria-label={t("entries.searchAria")}
              className="
                h-10 w-full rounded-md border border-zinc-200 bg-white px-3 pr-10 text-sm
                text-zinc-800 outline-none transition
                placeholder:text-zinc-400
                focus:border-zinc-400
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
                className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-950"
                data-testid="entries-clear-filters"
                onClick={onClearFilters}
                type="button"
              >
                ×
              </button>
            )}
          </div>

          {availableTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map(({ tag, count }) => {
                const normalizedTag = normalizeTag(tag);
                const isIncluded = includedTags.some(
                  (includedTag) => normalizeTag(includedTag) === normalizedTag,
                );
                const isExcluded = excludedTags.some(
                  (excludedTag) => normalizeTag(excludedTag) === normalizedTag,
                );
                const testIdTag = tagTestIdValue(tag);

                return (
                  <span
                    className={[
                      "inline-grid grid-cols-[auto_1.5rem] overflow-hidden rounded-full border text-xs transition",
                      isIncluded
                        ? "border-zinc-950 bg-zinc-950 text-white"
                        : isExcluded
                          ? "border-zinc-300 bg-zinc-100 text-zinc-500"
                          : "border-zinc-200 bg-white text-zinc-500",
                    ].join(" ")}
                    key={tag}
                  >
                    <button
                      aria-label={`${t("entries.tag.include")} #${tag}`}
                      aria-pressed={isIncluded}
                      className={[
                        "px-2.5 py-1 text-left transition",
                        isIncluded
                          ? "text-white"
                          : "hover:bg-zinc-50 hover:text-zinc-950",
                      ].join(" ")}
                      data-testid={`entry-tag-include-${testIdTag}`}
                      onClick={() => onToggleTag(tag)}
                      type="button"
                    >
                      #{tag}
                      <span className="ml-1 opacity-60">{count}</span>
                    </button>
                    <button
                      aria-label={`${t("entries.tag.exclude")} #${tag}`}
                      aria-pressed={isExcluded}
                      className={[
                        "border-l px-1.5 py-1 text-center transition",
                        isExcluded
                          ? "border-zinc-300 bg-zinc-200 text-zinc-700"
                          : isIncluded
                            ? "border-white/20 text-white/60 hover:bg-white/10 hover:text-white"
                            : "border-zinc-100 text-zinc-300 hover:bg-zinc-50 hover:text-zinc-700",
                      ].join(" ")}
                      data-testid={`entry-tag-exclude-${testIdTag}`}
                      onClick={() => onToggleExcludedTag(tag)}
                      type="button"
                    >
                      −
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {isSearching && (
            <div className="text-xs text-zinc-400">
              {t("entries.searching")}
            </div>
          )}
        </div>

        <div className="entries-feed-scroll min-h-0 space-y-2 overflow-y-auto pr-3">
          {entries.map((entry) => {
            const snippet = createEntrySearchSnippet(entry.text, searchQuery);

            return (
              <div
                className={[
                  "group relative rounded-lg border bg-white transition",
                  selectedEntryId === entry.id
                    ? "border-zinc-950 shadow-sm"
                    : "border-zinc-200 hover:border-zinc-300",
                ].join(" ")}
                data-testid="entry-list-item"
                key={entry.id}
              >
                <button
                  className="block w-full p-4 pr-28 text-left"
                  onClick={() => onSelectEntry(entry.id)}
                  type="button"
                >
                  <div className="grid grid-flow-col auto-cols-max items-center justify-start gap-2 text-xs text-zinc-400">
                    <span>{formatLongDate(entry.entryDate, language)}</span>
                    {entry.isDraft && (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-500">
                        {t("entries.draft")}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-800">
                    {snippet ? (
                      <EntrySearchSnippetView snippet={snippet} />
                    ) : (
                      excerpt(entry.text, 160)
                    )}
                  </div>
                  {entry.tags.length > 0 && (
                    <div className="mt-3 space-x-1.5 space-y-1.5">
                      {entry.tags.map((tag) => (
                        <span
                          className="inline-block rounded-full bg-sky-50 px-2 py-1 text-xs text-sky-700"
                          key={tag}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>

                <div className="absolute right-3 top-3 grid grid-flow-col auto-cols-[2rem] gap-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                  <TooltipButton
                    aria-label={
                      entry.analysisEnabled
                        ? t("entries.action.excludeAnalysis")
                        : t("entries.action.includeAnalysis")
                    }
                    aria-pressed={entry.analysisEnabled}
                    className="grid h-8 w-8 place-items-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-950"
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleEntryAnalysis(entry);
                    }}
                    tooltip={
                      entry.analysisEnabled
                        ? t("entries.action.excludeAnalysis")
                        : t("entries.action.includeAnalysis")
                    }
                    tooltipPlacement="top"
                    type="button"
                  >
                    {entry.analysisEnabled ? <EyeOpenIcon /> : <EyeClosedIcon />}
                  </TooltipButton>
                  <TooltipButton
                    aria-label={t("entries.action.edit")}
                    className="grid h-8 w-8 place-items-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-950"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEditEntry(entry);
                    }}
                    tooltip={t("entries.action.edit")}
                    tooltipPlacement="top"
                    type="button"
                  >
                    ✎
                  </TooltipButton>
                  <TooltipButton
                    aria-label={t("entries.action.delete")}
                    className="grid h-8 w-8 place-items-center rounded-full text-zinc-400 transition hover:bg-red-50 hover:text-red-700"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteEntry(entry);
                    }}
                    tooltip={t("entries.action.delete")}
                    tooltipPlacement="top"
                    type="button"
                  >
                    ×
                  </TooltipButton>
                </div>
              </div>
            );
          })}

          {entries.length === 0 && (
            <div
              className="rounded-lg border border-dashed border-zinc-200 bg-white p-5 text-sm text-zinc-400"
              data-testid="entries-empty-state"
            >
              {hasActiveFilters
                ? t("entries.emptyFiltered")
                : t("entries.empty")}
            </div>
          )}
        </div>
      </div>

      <EntryDetail
        debugMode={debugMode}
        entry={selectedEntry}
        onEditEntry={onEditEntry}
      />
    </section>
  );
}

function EntrySearchSnippetView({
  snippet,
}: {
  snippet: { before: string; match: string; after: string };
}) {
  return (
    <>
      {snippet.before}
      <mark className="rounded bg-zinc-100 px-0.5 text-zinc-950">
        {snippet.match}
      </mark>
      {snippet.after}
    </>
  );
}

function tagTestIdValue(tag: string) {
  return normalizeTag(tag).replace(/[^\p{L}\p{N}]+/gu, "-") || "tag";
}
