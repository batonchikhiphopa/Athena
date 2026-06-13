import { useI18n } from "../../../i18n/useI18n";
import { settingsTabs, type SettingsTab } from "./settingsTypes";

type SettingsTabListProps = {
  activeTab: SettingsTab;
  onChange: (tab: SettingsTab) => void;
};

export function SettingsTabList({ activeTab, onChange }: SettingsTabListProps) {
  const { t } = useI18n();

  return (
    <div className="flex gap-0 border-b border-zinc-100/80">
      {settingsTabs.map((tab) => (
        <button
          className={[
            "px-3 pb-2.5 pt-0.5 text-xs transition",
            activeTab === tab.id
              ? "border-b-2 border-zinc-900 font-medium text-zinc-900"
              : "border-b-2 border-transparent text-zinc-400 hover:text-zinc-700",
          ].join(" ")}
          key={tab.id}
          data-testid={`settings-tab-${tab.id}`}
          onClick={() => onChange(tab.id)}
          type="button"
        >
          {t(tab.label)}
        </button>
      ))}
    </div>
  );
}