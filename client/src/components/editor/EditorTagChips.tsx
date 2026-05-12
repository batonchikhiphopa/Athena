type EditorTagChipsProps = {
  editingTagIndex: number | null;
  editingTagValue: string;
  tags: string[];
  onCancelEdit: () => void;
  onChangeEditingValue: (value: string) => void;
  onCommitEdit: () => void;
  onRemoveTag: (tag: string) => void;
  onStartEditingTag: (index: number, tag: string) => void;
};

export function EditorTagChips({
  editingTagIndex,
  editingTagValue,
  tags,
  onCancelEdit,
  onChangeEditingValue,
  onCommitEdit,
  onRemoveTag,
  onStartEditingTag,
}: EditorTagChipsProps) {
  return (
    <div className="mb-1.5 h-8 px-0">
      <div className="flex h-9 flex-wrap items-start gap-2 overflow-hidden">
        {tags.map((tag, index) =>
          editingTagIndex === index ? (
            <input
              autoFocus
              className="
                h-7 rounded-full border border-zinc-300 bg-white px-2.5
                text-xs text-zinc-700 outline-none
                focus:border-zinc-500
              "
              key={`${tag}-editing`}
              onBlur={onCommitEdit}
              onChange={(event) => onChangeEditingValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onCommitEdit();
                }

                if (event.key === "Escape") {
                  event.preventDefault();
                  onCancelEdit();
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
                onClick={() => onStartEditingTag(index, tag)}
                type="button"
              >
                #{tag}
              </button>
              <button
                aria-label={`Удалить тег ${tag}`}
                className="text-zinc-300 transition hover:text-zinc-700"
                onClick={() => onRemoveTag(tag)}
                type="button"
              >
                ×
              </button>
            </span>
          ),
        )}
      </div>
    </div>
  );
}
