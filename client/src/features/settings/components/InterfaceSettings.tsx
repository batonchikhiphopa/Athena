import {
  LANGUAGE_LABELS,
  SUPPORTED_LANGUAGES,
  type Language,
} from "../../../i18n/languages";
import { useI18n } from "../../../i18n/useI18n";
import {
  SettingsLineLever,
  SettingsRow,
  SettingsSection,
  SettingsSelect,
} from "./settingsUi";

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
    <div className="space-y-5">
      <LanguageSettings />

      <SettingsSection label={t("settings.tab.interface")}>
        <SettingsRow
          action={
          <SettingsLineLever
            checked={personaTextEnabled}
            label={t("settings.interface.personaTitle")}
            onChange={onTogglePersonaText}
          />
          }
          description={t("settings.interface.personaDescription")}
          title={t("settings.interface.personaTitle")}
        />
      </SettingsSection>
    </div>
  );
}

function LanguageSettings() {
  const { language, setLanguage, t } = useI18n();

  return (
    <SettingsSection label={t("settings.interface.language")}>
      <SettingsRow
        action={
          <SettingsSelect
            onChange={(event) => setLanguage(event.target.value as Language)}
            value={language}
          >
            {SUPPORTED_LANGUAGES.map((option) => (
              <option key={option} value={option}>
                {LANGUAGE_LABELS[option]}
              </option>
            ))}
          </SettingsSelect>
        }
        title={t("settings.interface.languageScope")}
      />
    </SettingsSection>
  );
}
