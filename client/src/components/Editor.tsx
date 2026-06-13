import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useI18n } from "../i18n/useI18n";
import { formatLongDate, todayDateOnly } from "../lib/dates";
import type { InsightSnapshot } from "../types";
import { buildAthenaPlaceholder } from "../features/editor/editorPlaceholder";
import {
  useEditorTagControls,
} from "../features/editor/useEditorTagControls";
import type { AvailableTag } from "../features/editor/editorTagUtils";
import { saveEntrySelfReportAndSync } from "../features/selfReports/selfReportActions";
import { getEntrySelfReport } from "../features/selfReports/selfReportStorage";
import {
  DEFAULT_SELF_REPORT_VALUES,
  type SelfReportValues,
} from "../features/selfReports/selfReportTypes";
import { EditorActionButtons } from "./editor/EditorActionButtons";
import { EditorTagChips } from "./editor/EditorTagChips";
import { EditorTagMenu } from "./editor/EditorTagMenu";
import { useFloatingTextOcclusion } from "./floating";

type EditorProps = {
  analysisEnabled: boolean;
  availableTags: AvailableTag[];
  editingEntryId: string | null;
  entryDate: string;
  editorInsight: InsightSnapshot | null;
  personaTextEnabled: boolean;
  tags: string[];
  text: string;
  onChangeTags: (tags: string[]) => void;
  onChangeText: (value: string) => void;
  onNewBlankPage: () => void;
  onToggleAnalysisEnabled: () => void;
};

export function Editor({
  analysisEnabled,
  availableTags,
  editingEntryId,
  entryDate,
  editorInsight,
  personaTextEnabled,
  tags,
  text,
  onChangeTags,
  onChangeText,
  onNewBlankPage,
  onToggleAnalysisEnabled,
}: EditorProps) {
  const { language } = useI18n();
  const [selfReportCloseSignal, setSelfReportCloseSignal] = useState(0);
  const [selfReportValues, setSelfReportValues] = useState<SelfReportValues>(
    DEFAULT_SELF_REPORT_VALUES,
  );
  const pendingSelfReportRef = useRef<SelfReportValues | null>(null);

  const athenaPlaceholder = useMemo(
    () => buildAthenaPlaceholder(editorInsight, personaTextEnabled, language),
    [editorInsight, language, personaTextEnabled],
  );

  const {
    cancelTagEdit,
    commitSuggestion,
    commitTagEdit,
    editingTagIndex,
    editingTagValue,
    editorCardRef,
    handleTextareaKeyDown,
    insertHashAtCursor,
    isTagMenuOpen,
    menuPosition,
    removeTag,
    selectedSuggestionIndex,
    setCursorPosition,
    setDismissedTagInputKey,
    setEditingTagValue,
    startEditingTag,
    suggestionOptions,
    textareaRef,
    visibleTags,
  } = useEditorTagControls({
    availableTags,
    tags,
    text,
    onChangeTags,
    onChangeText,
  });

  const textOcclusion = useFloatingTextOcclusion(textareaRef);
  const editorTextPlaceholder = visibleTags.length > 0 ? "" : athenaPlaceholder;

  const persistSelfReport = useCallback(
    async (entryId: string, valuesToSave: SelfReportValues) => {
      await saveEntrySelfReportAndSync({
        entryId,
        localDay: entryDate || todayDateOnly(),
        values: valuesToSave,
      });
    },
    [entryDate],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadOrAttachSelfReport() {
      if (!editingEntryId) {
        if (!pendingSelfReportRef.current) {
          setSelfReportValues(DEFAULT_SELF_REPORT_VALUES);
        }

        return;
      }

      const pendingValues = pendingSelfReportRef.current;

      if (pendingValues) {
        pendingSelfReportRef.current = null;
        setSelfReportValues(pendingValues);
        await persistSelfReport(editingEntryId, pendingValues).catch((error) =>
          console.warn("[self-report:attach-pending]", error),
        );
        return;
      }

      const report = await getEntrySelfReport(editingEntryId).catch((error) => {
        console.warn("[self-report:load-entry]", error);
        return null;
      });

      if (!cancelled) {
        setSelfReportValues(report?.values ?? DEFAULT_SELF_REPORT_VALUES);
      }
    }

    void loadOrAttachSelfReport();

    return () => {
      cancelled = true;
    };
  }, [editingEntryId, persistSelfReport]);

  useEffect(() => {
    if (editingEntryId) return;
    if (text.trim() || visibleTags.length > 0) return;

    pendingSelfReportRef.current = null;
    setSelfReportValues(DEFAULT_SELF_REPORT_VALUES);
  }, [editingEntryId, text, visibleTags.length]);

  const commitSelfReport = useCallback(
    (valuesToSave: SelfReportValues) => {
      setSelfReportValues(valuesToSave);

      if (!editingEntryId) {
        pendingSelfReportRef.current = valuesToSave;
        return;
      }

      void persistSelfReport(editingEntryId, valuesToSave).catch((error) =>
        console.warn("[self-report:save-entry]", error),
      );
    },
    [editingEntryId, persistSelfReport],
  );

  return (
    <section className="flex h-full min-h-0 w-full max-w-6xl flex-col overflow-hidden px-1.5 pt-1">
      <EditorTagChips
        editingTagIndex={editingTagIndex}
        editingTagValue={editingTagValue}
        tags={visibleTags}
        onCancelEdit={cancelTagEdit}
        onChangeEditingValue={setEditingTagValue}
        onCommitEdit={commitTagEdit}
        onRemoveTag={removeTag}
        onStartEditingTag={startEditingTag}
      />

      <div
        className="relative flex min-h-0 flex-1 flex-col rounded-lg border border-white/15 bg-white/25 backdrop-blur-[1px]"
        ref={editorCardRef}
      >
        <EditorActionButtons
          analysisEnabled={analysisEnabled}
          selfReportCloseSignal={selfReportCloseSignal}
          selfReportValues={selfReportValues}
          onInsertTag={insertHashAtCursor}
          onNewBlankPage={onNewBlankPage}
          onSelfReportCommit={commitSelfReport}
          onToggleAnalysisEnabled={onToggleAnalysisEnabled}
        />

        <EditorTagMenu
          isOpen={isTagMenuOpen}
          menuPosition={menuPosition}
          selectedIndex={selectedSuggestionIndex}
          suggestions={suggestionOptions}
          onCommitSuggestion={commitSuggestion}
        />

        <div className="flex items-center justify-between border-b border-black/5 px-5 py-3 text-xs text-zinc-500">
          <span>{formatLongDate(entryDate || todayDateOnly(), language)}</span>
        </div>

        <div className="relative min-h-0 flex-1">
          {textOcclusion.blurMirrorStyles.map((blurMirrorStyle, index) => (
            <textarea
              aria-hidden="true"
              className="
                pointer-events-none absolute inset-0 z-0 h-full w-full
                resize-none overflow-hidden bg-transparent px-5 py-5
                font-serif text-[20px] leading-9 outline-none
                placeholder:text-zinc-400
              "
              key={`floating-text-blur-${index}`}
              placeholder={editorTextPlaceholder}
              readOnly
              ref={textOcclusion.registerBlurMirror(index)}
              style={blurMirrorStyle}
              tabIndex={-1}
              value={text}
            />
          ))}

          <textarea
            ref={textareaRef}
            className="
              relative z-10 h-full w-full resize-none bg-transparent px-5 py-5
              font-serif text-[20px] leading-9
              text-zinc-900
              outline-none
              placeholder:text-zinc-400
            "
            data-testid="editor-textarea"
            style={textOcclusion.textStyle}
            onChange={(event) => {
              setCursorPosition(event.currentTarget.selectionStart);
              setDismissedTagInputKey(null);
              setSelfReportCloseSignal((current) => current + 1);
              onChangeText(event.currentTarget.value);
            }}
            onClick={(event) => {
              setCursorPosition(event.currentTarget.selectionStart);
            }}
            onKeyDown={handleTextareaKeyDown}
            onKeyUp={(event) => {
              setCursorPosition(event.currentTarget.selectionStart);
            }}
            onScroll={textOcclusion.handleTargetScroll}
            onSelect={(event) => {
              setCursorPosition(event.currentTarget.selectionStart);
            }}
            placeholder={editorTextPlaceholder}
            value={text}
          />
        </div>
      </div>
    </section>
  );
}
