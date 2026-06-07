import {
  LANGUAGE_LABELS,
  SUPPORTED_LANGUAGES,
  type Language,
} from "../../../i18n/languages";
import { useI18n } from "../../../i18n/useI18n";

type InterfaceSettingsProps = {
  personaTextEnabled: boolean;
  onTogglePersonaText: (value: boolean) => void;
};

export function InterfaceSettings({
  personaTextEnabled,
  onTogglePersonaText,
}: InterfaceSettingsProps) {
  const { t } = useI18n();

  return (
    <>
      <LanguageSettings />

      <label className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div>
          <div className="text-sm font-medium text-zinc-950">
            {t("settings.interface.personaTitle")}
          </div>
          <div className="mt-1 text-sm text-zinc-400">
            {t("settings.interface.personaDescription")}
          </div>
        </div>

        <input
          checked={personaTextEnabled}
          className="h-5 w-5 accent-zinc-950"
          onChange={(event) => onTogglePersonaText(event.target.checked)}
          type="checkbox"
        />
      </label>
    </>
  );
}

function LanguageSettings() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-medium text-zinc-950">
        {t("settings.interface.language")}
      </div>

      <label className="mt-4 block">
        <span className="text-xs uppercase text-zinc-400">
          {t("settings.interface.languageScope")}
        </span>
        <select
          className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none transition focus:border-zinc-400"
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
    </div>
  );
}
