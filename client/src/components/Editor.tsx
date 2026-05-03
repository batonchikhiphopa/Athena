import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { formatLongDate, todayDateOnly } from "../lib/dates";
import { formatInsightText } from "../lib/insightText";
import { generateAthenaPlaceholder } from "../lib/athenaPlaceholder";
import { normalizeTag } from "../features/entries/entryFilters";
import { EyeClosedIcon, EyeOpenIcon } from "./icon";
import type { InsightSnapshot } from "../types";

type AvailableTag = {
  tag: string;
  count: number;
};

type ActiveTagInput = {
  start: number;
  end: number;
  query: string;
};

type SuggestionOption =
  | {
      type: "existing";
      tag: string;
      count: number;
    }
  | {
      type: "create";
      tag: string;
      count: null;
    };

type MenuPosition = {
  left: number;
  top: number;
  direction: "down" | "up";
};

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

function findActiveTagInput(
  text: string,
  cursorPosition: number,
): ActiveTagInput | null {
  const beforeCursor = text.slice(0, cursorPosition);
  const match = beforeCursor.match(/(?:^|\s)#([^\s#]*)$/);

  if (!match) return null;

  const start = beforeCursor.lastIndexOf("#");

  if (start < 0) return null;

  return {
    start,
    end: cursorPosition,
    query: match[1] ?? "",
  };
}

function normalizeEditorTag(tag: string) {
  return tag.trim().replace(/^#+/, "").toLocaleLowerCase();
}

function buildAthenaPlaceholder(
  editorInsight: InsightSnapshot | null,
  personaTextEnabled: boolean,
) {
  if (!personaTextEnabled) return "";

  const editorInsightText = editorInsight
    ? formatInsightText(editorInsight, { personaTextEnabled })
    : null;

  const insightMap: Partial<Record<InsightSnapshot["layer"], string>> =
    editorInsight && editorInsightText
      ? { [editorInsight.layer]: editorInsightText }
      : {};

  return generateAthenaPlaceholder(insightMap);
}

function getTextareaCaretPoint(
  textarea: HTMLTextAreaElement,
  editorCard: HTMLDivElement,
  text: string,
  position: number,
): MenuPosition {
  const textareaRect = textarea.getBoundingClientRect();
  const editorRect = editorCard.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(textarea);

  const mirror = document.createElement("div");
  const marker = document.createElement("span");

  mirror.style.position = "fixed";
  mirror.style.visibility = "hidden";
  mirror.style.pointerEvents = "none";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.overflowWrap = "break-word";
  mirror.style.wordBreak = computedStyle.wordBreak;
  mirror.style.boxSizing = computedStyle.boxSizing;
  mirror.style.width = `${textareaRect.width}px`;
  mirror.style.left = `${textareaRect.left - textarea.scrollLeft}px`;
  mirror.style.top = `${textareaRect.top - textarea.scrollTop}px`;

  mirror.style.font = computedStyle.font;
  mirror.style.fontFamily = computedStyle.fontFamily;
  mirror.style.fontSize = computedStyle.fontSize;
  mirror.style.fontWeight = computedStyle.fontWeight;
  mirror.style.fontStyle = computedStyle.fontStyle;
  mirror.style.letterSpacing = computedStyle.letterSpacing;
  mirror.style.lineHeight = computedStyle.lineHeight;
  mirror.style.textTransform = computedStyle.textTransform;
  mirror.style.textAlign = computedStyle.textAlign;

  mirror.style.paddingTop = computedStyle.paddingTop;
  mirror.style.paddingRight = computedStyle.paddingRight;
  mirror.style.paddingBottom = computedStyle.paddingBottom;
  mirror.style.paddingLeft = computedStyle.paddingLeft;

  mirror.style.borderTopWidth = computedStyle.borderTopWidth;
  mirror.style.borderRightWidth = computedStyle.borderRightWidth;
  mirror.style.borderBottomWidth = computedStyle.borderBottomWidth;
  mirror.style.borderLeftWidth = computedStyle.borderLeftWidth;

  mirror.textContent = text.slice(0, position);
  marker.textContent = "\u200b";

  mirror.appendChild(marker);
  document.body.appendChild(mirror);

  const markerRect = marker.getBoundingClientRect();

  document.body.removeChild(mirror);

const lineHeight = Number.parseFloat(computedStyle.lineHeight) || 36;
const lineIndex = Math.floor(
  (markerRect.top - textareaRect.top + textarea.scrollTop) / lineHeight,
);

return {
  left: markerRect.left - editorRect.left,
  top: markerRect.top - editorRect.top,
  direction: lineIndex < 5 ? "down" : "up",
};
}

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
  const [cursorPosition, setCursorPosition] = useState(0);
  const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null);
  const [editingTagValue, setEditingTagValue] = useState("");
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [dismissedTagInputKey, setDismissedTagInputKey] = useState<
    string | null
  >(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const editorCardRef = useRef<HTMLDivElement | null>(null);

  const placeholderRef = useRef({
    key: "",
    value: "",
  });

  const placeholderKey = [
    personaTextEnabled ? "persona-on" : "persona-off",
    editorInsight?.id ?? "no-insight-id",
    editorInsight?.layer ?? "no-layer",
  ].join(":");

  if (placeholderRef.current.key !== placeholderKey) {
    placeholderRef.current = {
      key: placeholderKey,
      value: buildAthenaPlaceholder(editorInsight, personaTextEnabled),
    };
  }

  const athenaPlaceholder = placeholderRef.current.value;

  const visibleTags = useMemo(
    () => Array.from(new Set(tags.map(normalizeEditorTag).filter(Boolean))),
    [tags],
  );

  const activeTagInput = useMemo(
    () => findActiveTagInput(text, cursorPosition),
    [cursorPosition, text],
  );

  const selectedTagSet = useMemo(
    () => new Set(visibleTags.map(normalizeTag)),
    [visibleTags],
  );

  const activeTagInputKey = activeTagInput
    ? `${activeTagInput.start}:${activeTagInput.end}:${activeTagInput.query}`
    : null;

  const tagSuggestions = useMemo(() => {
    if (!activeTagInput) return [];

    const normalizedQuery = normalizeTag(activeTagInput.query);

    return availableTags
      .filter(({ tag }) => {
        const normalizedTag = normalizeTag(tag);

        if (selectedTagSet.has(normalizedTag)) return false;
        if (!normalizedQuery) return true;

        return normalizedTag.includes(normalizedQuery);
      })
  }, [activeTagInput, availableTags, selectedTagSet]);

  const suggestionOptions = useMemo<SuggestionOption[]>(() => {
    if (!activeTagInput) return [];

    const normalizedQuery = normalizeEditorTag(activeTagInput.query);

    const existingOptions: SuggestionOption[] = tagSuggestions.map(
      ({ tag, count }) => ({
        type: "existing",
        tag,
        count,
      }),
    );

    if (!normalizedQuery || selectedTagSet.has(normalizedQuery)) {
      return existingOptions;
    }

    const alreadySuggested = existingOptions.some(
      (option) => normalizeTag(option.tag) === normalizedQuery,
    );

    if (alreadySuggested) return existingOptions;

    return [
      ...existingOptions,
      {
        type: "create",
        tag: normalizedQuery,
        count: null,
      },
    ];
  }, [activeTagInput, selectedTagSet, tagSuggestions]);

  const isTagMenuOpen =
    Boolean(activeTagInput) &&
    activeTagInputKey !== dismissedTagInputKey &&
    suggestionOptions.length > 0;

  useEffect(() => {
    setSelectedSuggestionIndex(0);
  }, [activeTagInput?.query]);

  useEffect(() => {
    if (selectedSuggestionIndex <= suggestionOptions.length - 1) return;

    setSelectedSuggestionIndex(Math.max(suggestionOptions.length - 1, 0));
  }, [selectedSuggestionIndex, suggestionOptions.length]);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    const editorCard = editorCardRef.current;

    if (!textarea || !editorCard || !activeTagInput || !isTagMenuOpen) {
      setMenuPosition(null);
      return;
    }

    setMenuPosition(
      getTextareaCaretPoint(textarea, editorCard, text, activeTagInput.start),
    );
  }, [activeTagInput, isTagMenuOpen, text]);

  function focusTextareaAt(position: number) {
    window.requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      textarea.focus();
      textarea.setSelectionRange(position, position);
      setCursorPosition(position);
    });
  }

  function insertHashAtCursor() {
    const textarea = textareaRef.current;

    const selectionStart = textarea?.selectionStart ?? text.length;
    const selectionEnd = textarea?.selectionEnd ?? text.length;
    const before = text.slice(0, selectionStart);
    const after = text.slice(selectionEnd);

    const needsSpaceBefore = before.length > 0 && !/\s$/.test(before);
    const insertion = `${needsSpaceBefore ? " " : ""}#`;
    const nextText = `${before}${insertion}${after}`;
    const nextCursorPosition = before.length + insertion.length;

    setDismissedTagInputKey(null);
    onChangeText(nextText);
    focusTextareaAt(nextCursorPosition);
  }

  function addTag(rawTag: string) {
    const normalizedTag = normalizeEditorTag(rawTag);

    if (!normalizedTag || selectedTagSet.has(normalizedTag)) return;

    onChangeTags([...visibleTags, normalizedTag]);
  }

  function commitActiveTag(rawTag: string) {
    const normalizedTag = normalizeEditorTag(rawTag);

    if (!activeTagInput || !normalizedTag) return;

    const before = text.slice(0, activeTagInput.start);
    let after = text.slice(activeTagInput.end);

    if (before.endsWith(" ") && after.startsWith(" ")) {
      after = after.slice(1);
    }

    const nextText = `${before}${after}`;
    const nextCursorPosition = activeTagInput.start;

    addTag(normalizedTag);
    onChangeText(nextText);
    setDismissedTagInputKey(null);
    focusTextareaAt(nextCursorPosition);
  }

  function commitSuggestion(option: SuggestionOption) {
    commitActiveTag(option.tag);
  }

  function removeTag(tagToRemove: string) {
    const normalizedTagToRemove = normalizeTag(tagToRemove);

    onChangeTags(
      visibleTags.filter((tag) => normalizeTag(tag) !== normalizedTagToRemove),
    );
  }

  function startEditingTag(index: number, tag: string) {
    setEditingTagIndex(index);
    setEditingTagValue(tag);
  }

  function commitTagEdit() {
    if (editingTagIndex === null) return;

    const normalizedValue = normalizeEditorTag(editingTagValue);

    if (!normalizedValue) {
      onChangeTags(visibleTags.filter((_, index) => index !== editingTagIndex));
      setEditingTagIndex(null);
      setEditingTagValue("");
      return;
    }

    const nextTags = visibleTags.map((tag, index) =>
      index === editingTagIndex ? normalizedValue : tag,
    );

    onChangeTags(Array.from(new Set(nextTags)));
    setEditingTagIndex(null);
    setEditingTagValue("");
  }

  function cancelTagEdit() {
    setEditingTagIndex(null);
    setEditingTagValue("");
  }

  function handleTextareaKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!activeTagInput) return;

    if (isTagMenuOpen && event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedSuggestionIndex((currentIndex) =>
        Math.min(currentIndex + 1, suggestionOptions.length - 1),
      );
      return;
    }

    if (isTagMenuOpen && event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedSuggestionIndex((currentIndex) =>
        Math.max(currentIndex - 1, 0),
      );
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setDismissedTagInputKey(activeTagInputKey);
      return;
    }

    if (
      isTagMenuOpen &&
      (event.key === "Enter" || event.key === "Tab") &&
      suggestionOptions[selectedSuggestionIndex]
    ) {
      event.preventDefault();
      commitSuggestion(suggestionOptions[selectedSuggestionIndex]);
      return;
    }

    const shouldCommitTypedTag =
      activeTagInput.query.trim().length > 0 && event.key === " ";

    if (!shouldCommitTypedTag) return;

    event.preventDefault();
    commitActiveTag(activeTagInput.query);
  }

  return (
    <section className="flex min-h-screen w-full max-w-6xl flex-col px-1.5 pt-1">
      <div className="mb-1.5 h-8 px-0">
        <div className="flex h-9 flex-wrap items-start gap-2 overflow-hidden">
          {visibleTags.map((tag, index) =>
            editingTagIndex === index ? (
              <input
                autoFocus
                className="
                  h-7 rounded-full border border-zinc-300 bg-white px-2.5
                  text-xs text-zinc-700 outline-none
                  focus:border-zinc-500
                "
                key={`${tag}-editing`}
                onBlur={commitTagEdit}
                onChange={(event) => setEditingTagValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commitTagEdit();
                  }

                  if (event.key === "Escape") {
                    event.preventDefault();
                    cancelTagEdit();
                  }
                }}
                value={editingTagValue}
              />
            ) : (
              <span
                className="
                  inline-grid grid-cols-[auto_auto] items-center gap-1.5
                  rounded-full bg-sky-50 px-2.5 py-1.5
                  text-sm text-sky-700
                "
                key={tag}
              >
                <button
                  className="text-left transition hover:text-zinc-950"
                  onClick={() => startEditingTag(index, tag)}
                  type="button"
                >
                  #{tag}
                </button>
                <button
                  aria-label={`Удалить тег ${tag}`}
                  className="text-zinc-300 transition hover:text-zinc-700"
                  onClick={() => removeTag(tag)}
                  type="button"
                >
                  ×
                </button>
              </span>
            ),
          )}
        </div>
      </div>

      <div
        className="relative flex min-h-[min(720px,calc(100vh-180px))] flex-1 flex-col rounded-lg border border-zinc-200 bg-white shadow-sm"
        ref={editorCardRef}
      >
        <button
          aria-label="Начать ввод тега"
          onClick={insertHashAtCursor}
          type="button"
          className="
            absolute top-1 right-16 z-20
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
          #
        </button>

        <button
          aria-label={
            analysisEnabled
              ? "Запретить анализ текста"
              : "Разрешить анализ текста"
          }
          aria-pressed={analysisEnabled}
          onClick={onToggleAnalysisEnabled}
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
          {analysisEnabled ? <EyeOpenIcon /> : <EyeClosedIcon />}
        </button>

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

{isTagMenuOpen && menuPosition && (
  <div
    className={[
      "absolute z-30 min-w-[220px] max-h-[205px] overflow-y-auto rounded-md border border-zinc-200 bg-white py-1 shadow-lg",
      menuPosition.direction === "up" ? "-translate-y-full" : "",
    ].join(" ")}
    style={{
      left: `${menuPosition.left}px`,
      top:
        menuPosition.direction === "up"
          ? `${menuPosition.top - 8}px`
          : `${menuPosition.top + 28}px`,
    }}
  >
            {suggestionOptions.map((option, index) => {
              const isSelected = index === selectedSuggestionIndex;

              return (
                <button
                  className={[
                    "grid w-full grid-cols-[minmax(0,1fr)_auto] gap-3 px-3 py-2",
                    "text-left text-xs transition",
                    isSelected
                      ? "bg-sky-50 text-sky-700"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950",
                  ].join(" ")}
                  key={`${option.type}-${option.tag}`}
                  onClick={() => commitSuggestion(option)}
                  type="button"
                >
                  <span>
                    {option.type === "create" ? "Создать " : ""}#{option.tag}
                  </span>
                  {option.count !== null && (
                    <span className="text-zinc-400">{option.count}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3 text-xs text-zinc-600">
          <span>{formatLongDate(entryDate || todayDateOnly())}</span>
        </div>

        <textarea
          ref={textareaRef}
          className="
            min-h-[520px] flex-1 resize-none bg-transparent px-5 py-5
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
