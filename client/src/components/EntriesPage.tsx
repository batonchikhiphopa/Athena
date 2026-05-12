import type { EntrySortDirection, EntryView } from "../types";
import { EntryDetail } from "./EntryDetail";
import { excerpt } from "../lib/text";
import { formatLongDate } from "../lib/dates";
import { normalizeTag } from "../features/entries/entryFilters";
import { EyeClosedIcon, EyeOpenIcon } from "./icon";

type EntriesPageProps = {
  debugMode: boolean;
  entries: EntryView[];
  selectedEntry: EntryView | null;
  selectedEntryId: string | null;
  sortDirection: EntrySortDirection;
  searchQuery: string;
  includedTags: string[];
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
  onToggleTag,
}: EntriesPageProps) {
  return (
    <section className="-mx-4 grid h-full min-h-0 w-[calc(100%+2rem)] grid-cols-[minmax(320px,420px)_minmax(0,1fr)] overflow-hidden">
      <div className="grid h-screen min-h-0 grid-rows-[auto_auto_auto_minmax(0,1fr)] border-r border-zinc-200 bg-zinc-50 px-6 py-8">
        <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div>
            <div className="text-xs uppercase text-zinc-400">Записи</div>
          </div>

          <button
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950"
            onClick={onRefresh}
            type="button"
          >
            Обновить
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
            Новые
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
            Старые
          </button>
        </div>

        <div className="mb-4 space-y-3">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <input
              aria-label="Поиск по записям"
              className="
                h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm
                text-zinc-800 outline-none transition
                placeholder:text-zinc-400
                focus:border-zinc-400
              "
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder="Поиск по тексту, дате или тегу"
              type="search"
              value={searchQuery}
            />

            {hasActiveFilters && (
              <button
                className="rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-950"
                onClick={onClearFilters}
                type="button"
              >
                Сбросить
              </button>
            )}
          </div>

          {availableTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map(({ tag, count }) => {
                const isActive = includedTags.some(
                  (includedTag) => normalizeTag(includedTag) === normalizeTag(tag),
                );

                return (
                  <button
                    aria-pressed={isActive}
                    className={[
                      "rounded-full border px-2.5 py-1 text-xs transition",
                      isActive
                        ? "border-zinc-950 bg-zinc-950 text-white"
                        : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-950",
                    ].join(" ")}
                    key={tag}
                    onClick={() => onToggleTag(tag)}
                    type="button"
                  >
                    #{tag}
                    <span className="ml-1 opacity-60">{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {isSearching && (
            <div className="text-xs text-zinc-400">Ищу…</div>
          )}
        </div>

        <div className="entries-feed-scroll min-h-0 space-y-2 overflow-y-auto pr-3">
          {entries.map((entry) => (
            <div
              className={[
                "group relative rounded-lg border bg-white transition",
                selectedEntryId === entry.id
                  ? "border-zinc-950 shadow-sm"
                  : "border-zinc-200 hover:border-zinc-300",
              ].join(" ")}
              key={entry.id}
            >
              <button
                className="block w-full p-4 pr-28 text-left"
                onClick={() => onSelectEntry(entry.id)}
                type="button"
              >
                <div className="grid grid-flow-col auto-cols-max items-center justify-start gap-2 text-xs text-zinc-400">
                  <span>{formatLongDate(entry.entryDate)}</span>
                  {entry.isDraft && (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-500">
                      Черновик
                    </span>
                  )}
                </div>
                <div className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-800">
                  {excerpt(entry.text, 160)}
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
                <button
                  aria-label={
                    entry.analysisEnabled
                      ? "Запретить анализ записи"
                      : "Разрешить анализ записи"
                  }
                  aria-pressed={entry.analysisEnabled}
                  className="grid h-8 w-8 place-items-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-950"
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleEntryAnalysis(entry);
                  }}
                  type="button"
                >
                  {entry.analysisEnabled ? <EyeOpenIcon /> : <EyeClosedIcon />}
                </button>
                <button
                  aria-label="Редактировать запись"
                  className="grid h-8 w-8 place-items-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-950"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEditEntry(entry);
                  }}
                  type="button"
                >
                  ✎
                </button>
                <button
                  aria-label="Удалить запись"
                  className="grid h-8 w-8 place-items-center rounded-full text-zinc-400 transition hover:bg-red-50 hover:text-red-700"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteEntry(entry);
                  }}
                  type="button"
                >
                  ×
                </button>
              </div>
            </div>
          ))}

          {entries.length === 0 && (
            <div className="rounded-lg border border-dashed border-zinc-200 bg-white p-5 text-sm text-zinc-400">
              {hasActiveFilters ? "Ничего не найдено." : "Пока пусто."}
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
