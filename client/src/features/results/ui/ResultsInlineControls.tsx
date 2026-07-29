import { useMemo, useState } from "react";
import { TooltipButton } from "../../../components/TooltipButton";
import { LineLever } from "../../editor/ui/LineLever";
import { getAvailableTags } from "../../entries/entryFilters";
import type { EntryView } from "../../entries/entryTypes";
import type { ResultsEntity } from "../resultsCorrections";
import type { ActivityKind } from "../resultsTypes";
import type { ResultsCustomizationState } from "../useResultsCustomization";
import { getResultsCorrectionCopy } from "../resultsCorrectionCopy";
import { useI18n } from "../../../i18n/useI18n";

export function ResultsInlineHeader({
  entries,
  entity,
  state,
}: {
  entries: EntryView[];
  entity: ResultsEntity;
  state: ResultsCustomizationState;
}) {
  const { language } = useI18n();
  const copy = getResultsCorrectionCopy(language);
  const [isAdding, setIsAdding] = useState(false);
  const [alias, setAlias] = useState("");
  const [isTagMenuOpen, setIsTagMenuOpen] = useState(false);
  const availableTags = useMemo(() => getAvailableTags(entries), [entries]);

  function saveAlias() {
    if (alias.trim()) state.addAlias(entity.id, alias);
    setAlias("");
    setIsAdding(false);
  }

  return (
    <div className="relative flex min-w-0 flex-wrap items-center gap-1.5 border-b border-zinc-900/8 px-4 py-2.5">
        {(entity.monitoringTags ?? []).map((tag) => (
          <Chip
            key={`tag:${tag}`}
            label={`#${tag}`}
            onRemove={() => state.removeMonitoringTag(entity.id, tag)}
          />
        ))}
        {entity.aliases.map((aliasValue) => (
          <Chip
            key={`alias:${aliasValue}`}
            label={aliasValue}
            onRemove={() => state.removeAlias(entity.id, aliasValue)}
          />
        ))}
        {isAdding ? (
          <span className="flex h-7 min-w-28 items-center overflow-hidden rounded-full border border-zinc-300 bg-white">
            <button
              aria-label={copy.chooseTag}
              className="h-full border-r border-zinc-200 px-2 text-xs text-sky-700 hover:bg-sky-50"
              onClick={() => setIsTagMenuOpen((current) => !current)}
              type="button"
            >
              #
            </button>
            <input
              autoFocus
              className="min-w-0 flex-1 bg-transparent px-2 text-xs text-zinc-700 outline-none"
              onBlur={saveAlias}
              onChange={(event) => setAlias(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
                if (event.key === "Escape") {
                  setAlias("");
                  setIsAdding(false);
                }
              }}
              placeholder={copy.aliasPlaceholder}
              value={alias}
            />
          </span>
        ) : (
          <button
            aria-label={copy.addAliasOrTag}
            className="grid h-7 w-7 place-items-center rounded-full bg-sky-50 text-base leading-none text-sky-700 hover:bg-sky-100"
            onClick={() => setIsAdding(true)}
            type="button"
          >
            +
          </button>
        )}
        {isTagMenuOpen && (
          <div className="absolute right-0 top-full z-20 mt-1 max-h-44 min-w-44 overflow-y-auto rounded-md border border-zinc-200 bg-white py-1 shadow-lg">
            {availableTags.map(({ tag, count }) => (
              <button
                className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-3 px-3 py-2 text-left text-xs text-zinc-600 hover:bg-sky-50 hover:text-sky-700"
                key={tag}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  state.addMonitoringTag(entity.id, tag);
                  setIsTagMenuOpen(false);
                  setAlias("");
                  setIsAdding(false);
                }}
                type="button"
              >
                <span>#{tag}</span>
                <span className="text-zinc-400">{count}</span>
              </button>
            ))}
          </div>
        )}
        <select
          aria-label={copy.activityKind}
          className="ml-auto max-w-48 rounded-md border border-white/60 bg-white/45 px-2 py-1.5 text-xs text-zinc-600 outline-none focus:border-zinc-300"
          onChange={(event) =>
            state.updateEntity(entity.id, {
              kind: event.target.value as ActivityKind,
              label: entity.label,
              priority: entity.priority,
            })
          }
          value={entity.kind}
        >
          <option value="task">{copy.kind.task}</option>
          <option value="activity">{copy.kind.activity}</option>
          <option value="habit">{copy.kind.habit}</option>
        </select>
    </div>
  );
}

export function ResultsInlineControls({
  entity,
  state,
}: {
  entity: ResultsEntity;
  state: ResultsCustomizationState;
}) {
  const { language } = useI18n();
  const copy = getResultsCorrectionCopy(language);
  const priorityLabel = copy.priorityLabel(entity.priority);

  return (
    <section className="grid h-full content-center justify-items-center gap-2 rounded-lg border border-white/55 bg-white/35 px-3 py-3 text-xs text-zinc-600">
      <TooltipButton
        className="text-center text-xs text-zinc-600"
        tooltip={copy.priorityDescription}
        tooltipPlacement="bottom"
        type="button"
      >
        {priorityLabel}
      </TooltipButton>
      <LineLever
        label={priorityLabel}
        max={5}
        value={entity.priority}
        onCommit={(priority) =>
          state.updateEntity(entity.id, {
            kind: entity.kind,
            label: entity.label,
            priority,
          })
        }
      />
    </section>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-grid grid-cols-[auto_auto] items-center gap-1.5 rounded-full bg-sky-50 px-2 py-1 text-xs text-sky-700">
      <span>{label}</span>
      <button className="text-zinc-300 hover:text-zinc-700" onClick={onRemove} type="button">×</button>
    </span>
  );
}
