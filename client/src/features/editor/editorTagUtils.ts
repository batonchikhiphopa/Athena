import { normalizeTag } from "../entries/entryFilters";

export type AvailableTag = {
  tag: string;
  count: number;
};

export type ActiveTagInput = {
  start: number;
  end: number;
  query: string;
};

export type SuggestionOption =
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

export type MenuPosition = {
  left: number;
  top: number;
  direction: "down" | "up";
};

export function findActiveTagInput(
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

export function normalizeEditorTag(tag: string) {
  return tag.trim().replace(/^#+/, "").toLocaleLowerCase();
}

export function buildSuggestionOptions({
  activeTagInput,
  availableTags,
  selectedTagSet,
}: {
  activeTagInput: ActiveTagInput | null;
  availableTags: AvailableTag[];
  selectedTagSet: Set<string>;
}): SuggestionOption[] {
  if (!activeTagInput) return [];

  const normalizedQuery = normalizeTag(activeTagInput.query);
  const existingOptions: SuggestionOption[] = availableTags
    .filter(({ tag }) => {
      const normalizedTag = normalizeTag(tag);

      if (selectedTagSet.has(normalizedTag)) return false;
      if (!normalizedQuery) return true;

      return normalizedTag.includes(normalizedQuery);
    })
    .map(({ tag, count }) => ({
      type: "existing",
      tag,
      count,
    }));

  const normalizedEditorQuery = normalizeEditorTag(activeTagInput.query);

  if (!normalizedEditorQuery || selectedTagSet.has(normalizedEditorQuery)) {
    return existingOptions;
  }

  const alreadySuggested = existingOptions.some(
    (option) => normalizeTag(option.tag) === normalizedEditorQuery,
  );

  if (alreadySuggested) return existingOptions;

  return [
    ...existingOptions,
    {
      type: "create",
      tag: normalizedEditorQuery,
      count: null,
    },
  ];
}

export function getTextareaCaretPoint(
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
