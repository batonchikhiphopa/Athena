import type { EntrySortDirection, EntryView } from "../types";
import { EntryDetail } from "./EntryDetail";
import { excerpt } from "../lib/text";
import { formatLongDate } from "../lib/dates";

type EntriesPageProps = {
  debugMode: boolean;
  entries: EntryView[];
  selectedEntry: EntryView | null;
  selectedEntryId: string | null;
  sortDirection: EntrySortDirection;
  onChangeSortDirection: (direction: EntrySortDirection) => void;
  onDeleteEntry: (entry: EntryView) => void;
  onEditEntry: (entry: EntryView) => void;
  onRefresh: () => void;
  onSelectEntry: (id: string) => void;
};

export function EntriesPage({
  debugMode,
  entries,
  selectedEntry,
  selectedEntryId,
  sortDirection,
  onChangeSortDirection,
  onDeleteEntry,
  onEditEntry,
  onRefresh,
  onSelectEntry,
}: EntriesPageProps) {
  return (
    <section className="-mx-4 grid min-h-screen w-[calc(100%+2rem)] grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
      <div className="grid h-screen min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] border-r border-zinc-200 bg-zinc-50 px-6 py-8">
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
                className="block w-full p-4 pr-20 text-left"
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
              Пока пусто.
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
