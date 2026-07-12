import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type RefObject,
} from "react";
import type { EntryView } from "../entryTypes";
import {
  formatDebugValue,
  formatEntryDebugText,
  getEntryDebugBlocks,
  type DebugRow,
} from "./entryDebugBlocks";

export function EntryDebugWaitCue() {
  return (
    <div
      aria-hidden="true"
      className="
        pointer-events-none absolute right-2 bottom-2 z-20 grid h-5 w-5
        place-items-center rounded-full bg-white/45 shadow-sm shadow-zinc-900/5
      "
    >
      <span className="h-3 w-3 animate-spin rounded-full border border-zinc-300 border-t-zinc-600" />
    </div>
  );
}

export function EntryDebugTooltip({
  entry,
  maxHeight,
  onBlur,
  onFocus,
  onPointerEnter,
  onPointerLeave,
  style,
  tooltipRef,
}: {
  entry: EntryView;
  maxHeight: number;
  onBlur: (event: FocusEvent<HTMLDivElement>) => void;
  onFocus: () => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  style: CSSProperties;
  tooltipRef: RefObject<HTMLDivElement | null>;
}) {
  const blocks = useMemo(() => getEntryDebugBlocks(entry), [entry]);
  const copyText = useMemo(() => formatEntryDebugText(blocks), [blocks]);
  const copyResetTimerRef = useRef<number | null>(null);
  const [copyStatus, setCopyStatus] = useState<"copied" | "failed" | "idle">(
    "idle",
  );

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current);
      }
    };
  }, []);

  const handleCopyDebug = useCallback(async () => {
    const didCopy = await writeTextToClipboard(copyText);

    setCopyStatus(didCopy ? "copied" : "failed");

    if (copyResetTimerRef.current !== null) {
      window.clearTimeout(copyResetTimerRef.current);
    }

    copyResetTimerRef.current = window.setTimeout(() => {
      setCopyStatus("idle");
      copyResetTimerRef.current = null;
    }, 1600);
  }, [copyText]);

  return (
    <div
      className="
        fixed z-[2147483646] overflow-hidden rounded-md border border-zinc-200/80
        bg-[#fbf7ef]/95 text-zinc-800 shadow-2xl shadow-zinc-900/15
        backdrop-blur-md
      "
      data-no-drag
      onBlur={onBlur}
      onClick={(event) => event.stopPropagation()}
      onFocus={onFocus}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      ref={tooltipRef}
      role="tooltip"
      style={style}
      tabIndex={0}
    >
      <div className="flex items-center justify-between gap-3 border-b border-black/5 px-3 py-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          debug mode
        </div>
        <button
          aria-label={
            copyStatus === "copied"
              ? "Debug info copied"
              : copyStatus === "failed"
                ? "Debug info copy failed"
                : "Copy debug info"
          }
          className={[
            "grid h-7 w-7 shrink-0 place-items-center rounded-full transition",
            "text-zinc-400 hover:bg-white/65 hover:text-zinc-900",
            "focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500/70",
            copyStatus === "copied" ? "text-emerald-600" : "",
            copyStatus === "failed" ? "text-red-600" : "",
          ].join(" ")}
          data-no-drag
          data-testid="entry-debug-copy"
          onClick={(event) => {
            event.stopPropagation();
            void handleCopyDebug();
          }}
          title={
            copyStatus === "copied"
              ? "Copied"
              : copyStatus === "failed"
                ? "Copy failed"
                : "Copy debug info"
          }
          type="button"
        >
          {copyStatus === "copied" ? <CheckIcon /> : <CopyIcon />}
          <span className="sr-only" aria-live="polite">
            {copyStatus === "copied"
              ? "Copied"
              : copyStatus === "failed"
                ? "Copy failed"
                : ""}
          </span>
        </button>
      </div>

      <div
        className="entries-feed-scroll overflow-y-auto px-3 py-3"
        style={{ maxHeight: maxHeight - 36 }}
      >
        <div className="grid gap-3">
          {blocks.map((block) => (
            <section
              className="rounded-md border border-white/45 bg-white/35 p-3"
              key={block.title}
            >
              <div className="mb-2 text-xs font-medium text-zinc-950">
                {block.title}
              </div>
              <div className="space-y-1.5">
                {block.rows.map((row) => (
                  <DebugTooltipRow
                    key={`${block.title}-${row.label}`}
                    label={row.label}
                    value={row.value}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M8 8.5V6.25C8 5.56 8.56 5 9.25 5h8.5C18.44 5 19 5.56 19 6.25v8.5c0 .69-.56 1.25-1.25 1.25H15.5"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M5 9.25C5 8.56 5.56 8 6.25 8h8.5c.69 0 1.25.56 1.25 1.25v8.5c0 .69-.56 1.25-1.25 1.25h-8.5C5.56 19 5 18.44 5 17.75v-8.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="m5 12.5 4.25 4.25L19 7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function DebugTooltipRow({ label, value }: DebugRow) {
  return (
    <div className="grid grid-cols-[minmax(74px,104px)_minmax(0,1fr)] gap-2 text-[11px] leading-4">
      <div className="break-words text-zinc-400">{label}</div>
      <div className="select-text break-words font-mono text-zinc-800">
        {formatDebugValue(value)}
      </div>
    </div>
  );
}

async function writeTextToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the textarea path for dev and restricted contexts.
    }
  }

  if (typeof document === "undefined") return false;

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.left = "-9999px";
  textarea.style.position = "fixed";
  textarea.style.top = "0";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}
