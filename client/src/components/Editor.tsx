import { useState } from "react";
import { formatLongDate, todayDateOnly } from "../lib/dates";
import { formatInsightText } from "../lib/insightText";
import { generateAthenaPlaceholder } from "../lib/athenaPlaceholder";
import type { InsightSnapshot } from "../types";

type EditorProps = {
  entryDate: string;
  editorInsight: InsightSnapshot | null;
  personaTextEnabled: boolean;
  text: string;
  onChangeText: (value: string) => void;
  onNewBlankPage: () => void;
};

export function Editor({
  entryDate,
  editorInsight,
  personaTextEnabled,
  text,
  onChangeText,
  onNewBlankPage,
}: EditorProps) {
  const [isHidden, setIsHidden] = useState(false);

  const editorInsightText = editorInsight
    ? formatInsightText(editorInsight, { personaTextEnabled })
    : null;

  const insightMap: Partial<Record<InsightSnapshot["layer"], string>> =
    editorInsight && editorInsightText
      ? { [editorInsight.layer]: editorInsightText }
      : {};

  const athenaPlaceholder = personaTextEnabled
    ? generateAthenaPlaceholder(insightMap)
    : "";

  return (
    <section className="flex min-h-screen w-full max-w-6xl flex-col px-1.5">
      <div aria-hidden="true" className="h-8 shrink-0" />

      <div className="relative flex min-h-[min(720px,calc(100vh-180px))] flex-1 flex-col rounded-lg border border-zinc-200 bg-white shadow-sm">
        
        {/* КНОПКА ГЛАЗА */}
        <button
          aria-label={isHidden ? "Показать" : "Скрыть"}
          aria-pressed={isHidden}
          onClick={() => setIsHidden((v) => !v)}
          type="button"
          className="
            absolute top-1 right-10 z-20
            h-6 w-6 flex items-center justify-center
            rounded-full

            text-zinc-400
            hover:text-zinc-700
            hover:bg-zinc-200/40

            opacity-70 hover:opacity-100
            transition
          "
        >
          {isHidden ? <EyeClosedIcon /> : <EyeOpenIcon />}
        </button>

        {/* КРЕСТИК */}
        <button
          aria-label="Открыть чистый лист"
          onClick={onNewBlankPage}
          type="button"
          className="
            absolute top-1 right-2 z-20
            h-6 w-6 flex items-center justify-center
            rounded-full

            text-[14px] leading-none
            text-zinc-400
            hover:text-zinc-700
            hover:bg-zinc-200/40

            opacity-70 hover:opacity-100
            transition
          "
        >
          <span className="translate-y-[-2px]">×</span>
        </button>

        {/* ДАТА */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3 text-xs text-zinc-600">
          <span>{formatLongDate(entryDate || todayDateOnly())}</span>
        </div>

        {/* ТЕКСТ */}
        <textarea
          className="
            min-h-[520px] flex-1 resize-none bg-transparent px-5 py-5
            font-serif text-[20px] leading-9
            text-zinc-900
            outline-none
            placeholder:text-zinc-400
          "
          onChange={(event) => onChangeText(event.target.value)}
          placeholder={athenaPlaceholder}
          value={text}
        />
      </div>
    </section>
  );
}

/* ================= ICONS ================= */

function EyeOpenIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <path
        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function EyeClosedIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <path
        d="M2 12c2.5 3.5 6 5 10 5s7.5-1.5 10-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

<path d="M6 14l-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
<path d="M10 15l-2 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
<path d="M14 15l2 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
<path d="M18 14l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}