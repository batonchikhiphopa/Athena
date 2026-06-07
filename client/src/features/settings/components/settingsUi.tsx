import { useI18n } from "../../../i18n/useI18n";
import type { StatusMessageState } from "./settingsTypes";

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
      <span className="text-xs uppercase text-zinc-400">{label}</span>
      <input
        autoComplete={autoComplete}
        className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none transition focus:border-zinc-400"
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
      <button
        className="rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950 disabled:cursor-wait disabled:opacity-40"
        disabled={isSaving}
        type="submit"
      >
        {isSaving ? t("common.wait") : primaryLabel}
      </button>
      <button
        className="rounded-md border border-zinc-100 px-3 py-2 text-sm text-zinc-400 transition hover:border-zinc-200 hover:text-zinc-700"
        disabled={isSaving}
        onClick={onCancel}
        type="button"
      >
        {t("common.close")}
      </button>
    </div>
  );
}

export function StatusMessage({ status }: { status: StatusMessageState }) {
  if (!status.text) return null;

  return (
    <div
      className={[
        "mt-4 text-xs",
        status.tone === "ok" ? "text-emerald-700" : "text-red-700",
      ].join(" ")}
    >
      {status.text}
    </div>
  );
}

export function QueueStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2">
      <div className="uppercase tracking-wide text-zinc-400">{label}</div>
      <div className="mt-1 text-sm text-zinc-700">{value}</div>
    </div>
  );
}
