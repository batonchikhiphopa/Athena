import { useEffect, useState, type CSSProperties } from "react";

type LineLeverProps = {
  label: string;
  max?: number;
  min?: number;
  testId?: string;
  value: number;
  onChange?: (value: number) => void;
  onCommit?: (value: number) => void;
};

export function LineLever({
  label,
  max = 10,
  min = 0,
  testId,
  value,
  onChange,
  onCommit,
}: LineLeverProps) {
  const [draftValue, setDraftValue] = useState(value);
  const isDeferred = Boolean(onCommit);
  const displayedValue = isDeferred ? draftValue : value;

  useEffect(() => {
    setDraftValue(value);
  }, [value]);

  function commit() {
    if (onCommit && draftValue !== value) onCommit(draftValue);
  }

  return (
    <span className="athena-line-lever">
      <input
        aria-label={label}
        className="athena-line-lever-input"
        data-testid={testId}
        max={max}
        min={min}
        onBlur={(event) => {
          event.stopPropagation();
          commit();
        }}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => {
          event.stopPropagation();
          const nextValue = Number(event.currentTarget.value);
          if (isDeferred) setDraftValue(nextValue);
          else onChange?.(nextValue);
        }}
        onKeyDown={(event) => event.stopPropagation()}
        onKeyUp={(event) => {
          event.stopPropagation();
          if (
            ["ArrowDown", "ArrowLeft", "ArrowRight", "ArrowUp", "End", "Home", "PageDown", "PageUp"].includes(event.key)
          ) {
            commit();
          }
        }}
        onPointerDown={(event) => event.stopPropagation()}
        onPointerUp={(event) => {
          event.stopPropagation();
          commit();
        }}
        step="1"
        type="range"
        value={displayedValue}
      />
      <span
        className="athena-line-lever-visual"
        aria-hidden="true"
        style={{
          "--lever-top": `${100 - ((displayedValue - min) / (max - min)) * 100}%`,
        } as CSSProperties}
      >
        <span className="athena-line-lever-thumb" />
      </span>
    </span>
  );
}
