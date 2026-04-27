import type { EntryView } from "../types";
import { formatLongDate } from "../lib/dates";
import { DebugPanel } from "./DebugPanel";

type EntryDetailProps = {
  debugMode: boolean;
  entry: EntryView | null;
  onEditEntry: (entry: EntryView) => void;
};

export function EntryDetail({
  debugMode,
  entry,
  onEditEntry,
}: EntryDetailProps) {
  if (!entry) {
    return (
      <div className="flex min-h-screen items-center justify-center px-8 text-sm text-zinc-400">
        Выбери запись.
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-8 py-8">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase text-zinc-400">
            Запись
          </div>
          <h2 className="mt-2 text-2xl font-medium text-zinc-950">
            {formatLongDate(entry.entryDate)}
          </h2>
        </div>

        <button
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950"
          onClick={() => onEditEntry(entry)}
          type="button"
        >
          {entry.isDraft ? "Открыть" : "Редактировать"}
        </button>
      </div>

      <article className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="whitespace-pre-wrap font-serif text-lg leading-8 text-zinc-950">
          {entry.text}
        </div>

        {entry.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {entry.tags.map((tag) => (
              <span
                className="rounded-full bg-sky-50 px-2.5 py-1 text-xs text-sky-700"
                key={tag}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </article>

      {debugMode && <DebugPanel entry={entry} />}
    </div>
  );
}
