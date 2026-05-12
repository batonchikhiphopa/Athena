import { useMemo } from "react";
import { formatLongDate, todayDateOnly } from "../lib/dates";
import type { InsightSnapshot } from "../types";
import { buildAthenaPlaceholder } from "../features/editor/editorPlaceholder";
import {
  useEditorTagControls,
} from "../features/editor/useEditorTagControls";
import type { AvailableTag } from "../features/editor/editorTagUtils";
import { EditorActionButtons } from "./editor/EditorActionButtons";
import { EditorTagChips } from "./editor/EditorTagChips";
import { EditorTagMenu } from "./editor/EditorTagMenu";

type EditorProps = {
  analysisEnabled: boolean;
  availableTags: AvailableTag[];
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
  const athenaPlaceholder = useMemo(
    () => buildAthenaPlaceholder(editorInsight, personaTextEnabled),
    [editorInsight, personaTextEnabled],
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
        className="relative flex min-h-0 flex-1 flex-col rounded-lg border border-zinc-200 bg-white shadow-sm"
        ref={editorCardRef}
      >
        <EditorActionButtons
          analysisEnabled={analysisEnabled}
          onInsertTag={insertHashAtCursor}
          onNewBlankPage={onNewBlankPage}
          onToggleAnalysisEnabled={onToggleAnalysisEnabled}
        />

        <EditorTagMenu
          isOpen={isTagMenuOpen}
          menuPosition={menuPosition}
          selectedIndex={selectedSuggestionIndex}
          suggestions={suggestionOptions}
          onCommitSuggestion={commitSuggestion}
        />

        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3 text-xs text-zinc-600">
          <span>{formatLongDate(entryDate || todayDateOnly())}</span>
        </div>

        <textarea
          ref={textareaRef}
          className="
            min-h-0 flex-1 resize-none bg-transparent px-5 py-5
            font-serif text-[20px] leading-9
            text-zinc-900
            outline-none
            placeholder:text-zinc-400
          "
          onChange={(event) => {
            setCursorPosition(event.currentTarget.selectionStart);
            setDismissedTagInputKey(null);
            onChangeText(event.currentTarget.value);
          }}
          onClick={(event) => {
            setCursorPosition(event.currentTarget.selectionStart);
          }}
          onKeyDown={handleTextareaKeyDown}
          onKeyUp={(event) => {
            setCursorPosition(event.currentTarget.selectionStart);
          }}
          onSelect={(event) => {
            setCursorPosition(event.currentTarget.selectionStart);
          }}
          placeholder={visibleTags.length > 0 ? "" : athenaPlaceholder}
          value={text}
        />
      </div>
    </section>
  );
}
