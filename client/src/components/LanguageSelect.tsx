import {
  LANGUAGE_LABELS,
  SUPPORTED_LANGUAGES,
  type Language,
} from "../i18n/languages";
import { useI18n } from "../i18n/useI18n";

type LanguageSelectProps = {
  className?: string;
  selectClassName?: string;
};

export function LanguageSelect({
  className = "",
  selectClassName = "",
}: LanguageSelectProps) {
  const { language, setLanguage, t } = useI18n();

  return (
    <label className={className}>
      <span className="sr-only">{t("settings.interface.language")}</span>
      <select
        aria-label={t("settings.interface.language")}
        className={[
          "rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600 outline-none transition focus:border-zinc-400",
          selectClassName,
        ].join(" ")}
        onChange={(event) => setLanguage(event.target.value as Language)}
        value={language}
      >
        {SUPPORTED_LANGUAGES.map((option) => (
          <option key={option} value={option}>
            {LANGUAGE_LABELS[option]}
          </option>
        ))}
      </select>
    </label>
  );
}
