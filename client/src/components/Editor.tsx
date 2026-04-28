import { formatLongDate, todayDateOnly } from "../lib/dates";
import type { InsightSnapshot } from "../types";
import { generateAthenaPlaceholder } from "../lib/athenaPlaceholder";
import { formatInsightText } from "../lib/insightText";

type DraftStatus = "loading" | "saved" | "saving";
type SaveStatus = "idle" | "saving" | "saved" | "local-only" | "empty" | "error";

type EditorProps = {
  draftStatus: DraftStatus;
  entryDate: string;
  editorInsight: InsightSnapshot | null;
  isEditing: boolean;
  personaTextEnabled: boolean;
  saveStatus: SaveStatus;
  text: string;
  onChangeText: (value: string) => void;
  onNewBlankPage: () => void;

  onClearLocalData: () => void;
};

export function Editor({
  entryDate,
  editorInsight,
  personaTextEnabled,
  text,
  onChangeText,
  onNewBlankPage,
}: EditorProps) {
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

        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3 text-xs text-zinc-600">
          <span>{formatLongDate(entryDate || todayDateOnly())}</span>
        </div>

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
