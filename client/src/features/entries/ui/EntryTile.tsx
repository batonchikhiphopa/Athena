import type { KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import type { Language } from "../../../i18n/languages";
import { useI18n } from "../../../i18n/useI18n";
import { formatLongDate } from "../../../shared/lib/dates";
import { EyeClosedIcon, EyeOpenIcon } from "../../../components/icon";
import { TooltipButton } from "../../../components/TooltipButton";
import { parseEntrySearchQuery } from "../entrySearch";
import type { EntryView } from "../entryTypes";
import { EntryDebugTooltip, EntryDebugWaitCue } from "./EntryDebugTooltip";
import { useEntryDebugTooltip } from "./useEntryDebugTooltip";
import { CloseIcon, EditIcon } from "./entryUiHelpers";
import { tagTestIdValue } from "./entryTagId";

export function EntryTile({
  compact = false,
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
  compact?: boolean;
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
      data-compact={compact ? "true" : "false"}
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

        <div
          className={[
            "flex items-center justify-between border-b border-black/5 pr-28 text-xs text-zinc-500",
            compact ? "min-h-8 px-4 py-2" : "min-h-10 px-5 py-3",
          ].join(" ")}
        >
          <span>{formatLongDate(entry.entryDate, language)}</span>
          {entry.isDraft && (
            <span className="rounded-full bg-white/45 px-2 py-0.5 text-[11px] text-zinc-500">
              {t("entries.draft")}
            </span>
          )}
        </div>

        <div
          className={[
            "athena-entry-tile-body",
            compact ? "px-4 py-2.5" : "px-5 py-4",
          ].join(" ")}
        >
          <div
            className={[
              "athena-entry-tile-body-content whitespace-pre-wrap break-words font-serif text-zinc-900",
              compact ? "text-sm leading-6" : "text-[15px] leading-7",
            ].join(" ")}
          >
            <EntryText text={entry.text} query={searchQuery} />
          </div>
        </div>

        {entry.tags.length > 0 && (
          <div className={compact ? "px-4 pb-2.5" : "px-5 pb-4"}>
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
