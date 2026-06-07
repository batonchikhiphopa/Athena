import { useI18n } from "../../../i18n/useI18n";
import { settingsTabs, type SettingsTab } from "./settingsTypes";

type SettingsTabListProps = {
  activeTab: SettingsTab;
  onChange: (tab: SettingsTab) => void;
};

export function SettingsTabList({ activeTab, onChange }: SettingsTabListProps) {
  const { t } = useI18n();

  return (
    <div className="mb-4 flex flex-wrap gap-2 border-b border-zinc-200 pb-2">
      {settingsTabs.map((tab) => (
        <button
          className={[
            "rounded-md px-3 py-2 text-sm transition",
            activeTab === tab.id
              ? "bg-zinc-950 text-white"
              : "text-zinc-500 hover:bg-white hover:text-zinc-950",
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
