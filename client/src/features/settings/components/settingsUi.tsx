import { useState, useRef } from "react";
import type { CSSProperties } from "react";
import type {
  ButtonHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import { useI18n } from "../../../i18n/useI18n";
import type { StatusMessageState } from "./settingsTypes";

type SettingsSectionProps = {
  children: ReactNode;
  label?: string;
};

export function SettingsSection({ children, label }: SettingsSectionProps) {
  return (
    <section>
      {label ? (
        <div className="mb-3 text-[10px] uppercase tracking-wide text-zinc-500">
          {label}
        </div>
      ) : null}
      <div className="space-y-0">{children}</div>
    </section>
  );
}

type SettingsRowProps = {
  action?: ReactNode;
  children?: ReactNode;
  description?: ReactNode;
  title: ReactNode;
  tone?: "default" | "danger";
};

export function SettingsRow({
  action,
  children,
  description,
  title,
  tone = "default",
}: SettingsRowProps) {
  return (
    <div className="border-t border-zinc-100/80 py-3">
      <div className="flex items-start justify-between gap-5">
        <div className="min-w-0">
          <div
            className={[
              "text-sm",
              tone === "danger" ? "text-red-700" : "text-zinc-800",
            ].join(" ")}
          >
            {title}
          </div>
          {description ? (
            <div className="mt-0.5 max-w-xl text-xs leading-relaxed text-zinc-400">
              {description}
            </div>
          ) : null}
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

type SettingsButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "xs" | "sm";
  variant?: "default" | "danger" | "quiet";
};

export function SettingsButton({
  children,
  className = "",
  size = "sm",
  variant = "default",
  ...props
}: SettingsButtonProps) {
  return (
    <button
      {...props}
      className={[
        "rounded-md border bg-white transition disabled:cursor-not-allowed disabled:opacity-40",
        size === "xs" ? "px-3 py-2 text-xs" : "px-3 py-2 text-sm",
        variant === "danger"
          ? "border-red-200 text-red-700 hover:border-red-300 hover:bg-red-50"
          : variant === "quiet"
            ? "border-zinc-100 text-zinc-400 hover:border-zinc-200 hover:text-zinc-700"
            : "border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-950",
        className,
      ].join(" ")}
      type={props.type ?? "button"}
    >
      {children}
    </button>
  );
}

type SettingsSelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function SettingsSelect({
  className = "",
  ...props
}: SettingsSelectProps) {
  return (
    <select
      {...props}
      className={[
        "rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-800 outline-none transition focus:border-zinc-400",
        className,
      ].join(" ")}
    />
  );
}

type PasswordFieldProps = {
  autoComplete: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
};

export function PasswordField({
  autoComplete,
  label,
  onChange,
  value,
}: PasswordFieldProps) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wide text-zinc-400">
        {label}
      </span>
      <input
        autoComplete={autoComplete}
        className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none transition focus:border-zinc-400 [&:-webkit-autofill]:shadow-[0_0_0_1000px_white_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#27272a]"
        onChange={(event) => onChange(event.target.value)}
        type="password"
        value={value}
      />
    </label>
  );
}

type FormActionsProps = {
  isSaving: boolean;
  primaryLabel: string;
  onCancel: () => void;
};

export function FormActions({
  isSaving,
  primaryLabel,
  onCancel,
}: FormActionsProps) {
  const { t } = useI18n();

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <SettingsButton disabled={isSaving} type="submit">
        {isSaving ? t("common.wait") : primaryLabel}
      </SettingsButton>
      <SettingsButton disabled={isSaving} onClick={onCancel} variant="quiet">
        {t("common.close")}
      </SettingsButton>
    </div>
  );
}

export function StatusMessage({ status }: { status: StatusMessageState }) {
  if (!status.text) return null;

  return (
    <div
      aria-live="polite"
      className={[
        "mt-3 rounded-md border px-3 py-2 text-xs",
        status.tone === "ok"
          ? "border-emerald-100 bg-emerald-50 text-emerald-800"
          : "border-red-100 bg-red-50 text-red-700",
      ].join(" ")}
    >
      {status.text}
    </div>
  );
}

export function QueueStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-100/80 py-2.5 last:border-0">
      <span className="text-[10px] uppercase tracking-wide text-zinc-400">
        {label}
      </span>
      <span className="font-mono text-sm text-zinc-700">{value}</span>
    </div>
  );
}

type SettingsLineLeverProps = {
  checked: boolean;
  disabled?: boolean;
  label: string;
  testId?: string;
  onChange: (value: boolean) => void;
};

export function SettingsLineLever({
  checked,
  disabled = false,
  label,
  testId,
  onChange,
}: SettingsLineLeverProps) {
  const thumbColor = checked ? "bg-zinc-900" : "bg-zinc-300";
  
  // Локальный стейт для динамического положения ползунка при драге (от 0 до 1)
  const [activeX, setActiveX] = useState<number | null>(null);
  
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const hasMovedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePointerDown = (event: React.PointerEvent<HTMLSpanElement>) => {
    if (disabled) return;
    
    inputRef.current?.focus();
    
    event.currentTarget.setPointerCapture(event.pointerId);
    isDraggingRef.current = true;
    startXRef.current = event.clientX;
    hasMovedRef.current = false;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLSpanElement>) => {
    if (!isDraggingRef.current) return;

    const deltaX = Math.abs(event.clientX - startXRef.current);
    if (deltaX > 4) {
      hasMovedRef.current = true;
    }

    if (hasMovedRef.current) {
      const rect = event.currentTarget.getBoundingClientRect();
      const relX = (event.clientX - rect.left) / rect.width;
      setActiveX(Math.max(0, Math.min(1, relX)));
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLSpanElement>) => {
    if (!isDraggingRef.current) return;
    
    event.currentTarget.releasePointerCapture(event.pointerId);
    isDraggingRef.current = false;
    setActiveX(null);

    const rect = event.currentTarget.getBoundingClientRect();
    const finalRelX = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));

    if (!hasMovedRef.current) {
      if (finalRelX >= 0.35 && finalRelX <= 0.65) {
        onChange(!checked);
      } else if (finalRelX < 0.35) {
        onChange(false);
      } else {
        onChange(true);
      }
    } else {
      onChange(finalRelX > 0.5);
    }
  };

  const leftStyle = activeX !== null
    ? `calc(0.25rem + ${activeX} * (100% - 0.5rem))`
    : (checked ? "calc(100% - 0.25rem)" : "0.25rem");

  return (
    <span
      className={[
        "relative block h-6 w-12 shrink-0 cursor-pointer select-none touch-none",
        disabled ? "opacity-40" : "",
      ].join(" ")}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <input
        ref={inputRef}
        aria-label={label}
        role="switch"
        aria-checked={checked}
        className="pointer-events-none absolute inset-0 opacity-0 h-full w-full"
        data-testid={testId}
        disabled={disabled}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />

      <span
        aria-hidden="true"
        className={[
          "pointer-events-none absolute left-2.5 top-0 bottom-0 overflow-hidden",
          activeX === null ? "transition-[right] duration-150" : ""
        ].join(" ")}
        style={{ right: `calc(100% - (${leftStyle}) + 5px)` } as CSSProperties}
      >
        <span className="absolute inset-x-0 top-[calc(50%-4px)] h-px bg-zinc-300" />
        <span className="absolute inset-x-0 top-[calc(50%+4px)] h-px bg-zinc-300" />
      </span>

      <span
        aria-hidden="true"
        className={[
          "pointer-events-none absolute right-2.5 top-0 bottom-0 overflow-hidden",
          activeX === null ? "transition-[left] duration-150" : ""
        ].join(" ")}
        style={{ left: `calc(${leftStyle} + 5px)` } as CSSProperties}
      >
        <span className="absolute inset-x-0 top-[calc(50%-4px)] h-px bg-zinc-300" />
        <span className="absolute inset-x-0 top-[calc(50%+4px)] h-px bg-zinc-300" />
      </span>

      <span
        aria-hidden="true"
        className={[
          "pointer-events-none absolute top-1/2 flex h-5 w-2.5",
          "-translate-x-1/2 -translate-y-1/2 items-center justify-between",
          activeX === null ? "transition-[left] duration-150" : ""
        ].join(" ")}
        style={{ left: leftStyle } as CSSProperties}
      >
        <span className={`h-full w-px ${thumbColor}`} />
        <span className={`h-full w-px ${thumbColor}`} />
      </span>
    </span>
  );
}