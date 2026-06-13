import type { CSSProperties } from "react";

type LineLeverProps = {
  label: string;
  testId?: string;
  value: number;
  onChange: (value: number) => void;
};

export function LineLever({ label, testId, value, onChange }: LineLeverProps) {
  return (
    <span className="athena-line-lever">
      <input
        aria-label={label}
        className="athena-line-lever-input"
        data-testid={testId}
        max="10"
        min="0"
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        step="1"
        type="range"
        value={value}
      />
      <span
        className="athena-line-lever-visual"
        aria-hidden="true"
        style={{ "--lever-top": `${100 - value * 10}%` } as CSSProperties}
      >
        <span className="athena-line-lever-thumb" />
      </span>
    </span>
  );
}
