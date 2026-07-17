import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useI18n } from "../../../i18n/useI18n";
import type { EntrySortDirection, EntryView } from "../entryTypes";
import { EntryTile } from "./EntryTile";
import { EntriesUtilityPanel } from "./EntriesUtilityPanel";
import { distributeEntriesByColumn, useEntryColumnCount } from "./entryGrid";

type EntriesPageProps = {
  debugMode: boolean;
  entries: EntryView[];
  selectedEntryId: string | null;
  sortDirection: EntrySortDirection;
  searchQuery: string;
  includedTags: string[];
  excludedTags: string[];
  hasActiveFilters: boolean;
  isSearching: boolean;
  onChangeSortDirection: (direction: EntrySortDirection) => void;
  onClearFilters: () => void;
  onDeleteEntry: (entry: EntryView) => void;
  onEditEntry: (entry: EntryView) => void;
  onSearchQueryChange: (query: string) => void;
  onSelectEntry: (id: string | null) => void;
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
  isSearching,
  onClearFilters,
  onDeleteEntry,
  onEditEntry,
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
    const nextExpandedEntryId = expandedEntryId === entryId ? null : entryId;

    setExpandedEntryId(nextExpandedEntryId);
    onSelectEntry(nextExpandedEntryId);
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
          includedTags={includedTags}
          isSearching={isSearching}
          searchQuery={searchQuery}
          onClearFilters={onClearFilters}
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
