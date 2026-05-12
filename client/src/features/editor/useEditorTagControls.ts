import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { normalizeTag } from "../entries/entryFilters";
import {
  buildSuggestionOptions,
  findActiveTagInput,
  getTextareaCaretPoint,
  normalizeEditorTag,
  type AvailableTag,
  type MenuPosition,
  type SuggestionOption,
} from "./editorTagUtils";

type UseEditorTagControlsInput = {
  availableTags: AvailableTag[];
  tags: string[];
  text: string;
  onChangeTags: (tags: string[]) => void;
  onChangeText: (value: string) => void;
};

export function useEditorTagControls({
  availableTags,
  tags,
  text,
  onChangeTags,
  onChangeText,
}: UseEditorTagControlsInput) {
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

  const suggestionOptions = useMemo(
    () =>
      buildSuggestionOptions({
        activeTagInput,
        availableTags,
        selectedTagSet,
      }),
    [activeTagInput, availableTags, selectedTagSet],
  );

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

  return {
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
  };
}
