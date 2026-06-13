import type { Page } from "../types";
import type { MessageKey } from "../i18n/messages";
import { useI18n } from "../i18n/useI18n";
import { Icon } from "./icon";
import { TooltipButton } from "./TooltipButton";

type NavProps = {
  canLockAthena: boolean;
  currentPage: Page;
  isSettingsOpen: boolean;
  onLockAthena: () => void;
  onNavigate: (page: Page) => void;
  onOpenSettings: () => void;
};

const IconComponent = Icon;

const navItems: Array<{
  icon: "feather" | "list";
  label: MessageKey;
  page: Extract<Page, "editor" | "entries">;
}> = [
  { icon: "feather", label: "nav.editor", page: "editor" },
  { icon: "list", label: "nav.entries", page: "entries" },
];

export function Nav({
  canLockAthena,
  currentPage,
  isSettingsOpen,
  onLockAthena,
  onNavigate,
  onOpenSettings,
}: NavProps) {
  const { t } = useI18n();

  return (
    <aside className="sticky top-0 flex h-screen w-fit flex-col px-2 py-5">
      <nav className="mt-4 flex h-full flex-col items-center gap-2">
        {navItems.map((item) => (
          <TooltipButton
            aria-current={currentPage === item.page ? "page" : undefined}
            aria-label={t(item.label)}
            className={[
              "flex h-9 w-9 items-center justify-center rounded-full text-sm transition",
              currentPage === item.page
                ? "text-zinc-900"
                : "text-zinc-400 opacity-50 hover:text-zinc-700 hover:opacity-100",
            ].join(" ")}
            data-testid={`nav-${item.page}`}
            key={item.page}
            onClick={() => onNavigate(item.page)}
            tooltip={t(item.label)}
            tooltipPlacement="right"
            type="button"
          >
            <span className="translate-y-[-1px]">
              <IconComponent name={item.icon} className="h-5 w-5" />
            </span>
          </TooltipButton>
        ))}

        {canLockAthena ? (
          <TooltipButton
            aria-label={t("nav.lock")}
            className="
              mt-auto flex h-9 w-9 items-center justify-center rounded-full
              border border-zinc-200/70 bg-white/50 text-zinc-500
              shadow-sm transition
              hover:border-zinc-300 hover:bg-white hover:text-zinc-950
            "
            onClick={onLockAthena}
            tooltip={t("nav.lock")}
            tooltipPlacement="right"
            type="button"
          >
            <IconComponent name="lock" className="h-4 w-4" />
          </TooltipButton>
        ) : (
          <div className="mt-auto" />
        )}

        <TooltipButton
          aria-current={isSettingsOpen ? "page" : undefined}
          aria-expanded={isSettingsOpen}
          aria-label={t("nav.settings")}
          className={[
            "flex h-9 w-9 items-center justify-center rounded-full text-sm transition",
            isSettingsOpen
              ? "text-zinc-900"
              : "text-zinc-400 opacity-50 hover:text-zinc-700 hover:opacity-100",
          ].join(" ")}
          data-testid="nav-settings"
          onClick={onOpenSettings}
          tooltip={t("nav.settings")}
          tooltipPlacement="right"
          type="button"
        >
          <span className="translate-y-[-1px]">
            <IconComponent name="settings" className="h-5 w-5" />
          </span>
        </TooltipButton>
      </nav>
    </aside>
  );
}
