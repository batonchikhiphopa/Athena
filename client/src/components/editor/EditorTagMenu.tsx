import type {
  MenuPosition,
  SuggestionOption,
} from "../../features/editor/editorTagUtils";

type EditorTagMenuProps = {
  isOpen: boolean;
  menuPosition: MenuPosition | null;
  selectedIndex: number;
  suggestions: SuggestionOption[];
  onCommitSuggestion: (option: SuggestionOption) => void;
};

export function EditorTagMenu({
  isOpen,
  menuPosition,
  selectedIndex,
  suggestions,
  onCommitSuggestion,
}: EditorTagMenuProps) {
  if (!isOpen || !menuPosition) return null;

  return (
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
      {suggestions.map((option, index) => {
        const isSelected = index === selectedIndex;

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
            onClick={() => onCommitSuggestion(option)}
            type="button"
          >
            <span>{option.type === "create" ? "Создать " : ""}#{option.tag}</span>
            {option.count !== null && (
              <span className="text-zinc-400">{option.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
