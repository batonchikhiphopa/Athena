import type { Page } from "../types";
import { useI18n } from "../i18n/useI18n";
import { Icon } from "./icon";

type NavProps = {
  canLockAthena: boolean;
  currentPage: Page;
  onLockAthena: () => void;
  onNavigate: (page: Page) => void;
};

const IconComponent = Icon;

const navItems = [
  { icon: "feather", page: "editor" },
  { icon: "list", page: "entries" },
  { icon: "observations", page: "observations" },
] as const;

export function Nav({
  canLockAthena,
  currentPage,
  onLockAthena,
  onNavigate,
}: NavProps) {
  const { t } = useI18n();

  return (
    <aside className="sticky top-0 flex h-screen w-fit flex-col px-2 py-5">
      <nav className="mt-4 flex h-full flex-col items-center gap-2">
        {navItems.map((item) => (
          <button
            className={[
              "flex h-9 w-9 items-center justify-center rounded-full text-sm transition",
              currentPage === item.page
                ? "text-zinc-900"
                : "text-zinc-400 opacity-50 hover:text-zinc-700 hover:opacity-100",
            ].join(" ")}
            key={item.page}
            onClick={() => onNavigate(item.page)}
            type="button"
          >
            <span className="translate-y-[-1px]">
              <IconComponent name={item.icon} className="h-5 w-5" />
            </span>
          </button>
        ))}

        {canLockAthena ? (
          <button
            aria-label={t("nav.lock")}
            className="
              mt-auto flex h-9 w-9 items-center justify-center rounded-full
              border border-zinc-200/70 bg-white/50 text-zinc-500
              shadow-sm transition
              hover:border-zinc-300 hover:bg-white hover:text-zinc-950
            "
            onClick={onLockAthena}
            type="button"
            title={t("nav.lock")}
          >
            <IconComponent name="lock" className="h-4 w-4" />
          </button>
        ) : (
          <div className="mt-auto" />
        )}

        <button
          className={[
            "flex h-9 w-9 items-center justify-center rounded-full text-sm transition",
            currentPage === "settings"
              ? "text-zinc-900"
              : "text-zinc-400 opacity-50 hover:text-zinc-700 hover:opacity-100",
          ].join(" ")}
          onClick={() => onNavigate("settings")}
          type="button"
        >
          <span className="translate-y-[-1px]">
            <IconComponent name="settings" className="h-5 w-5" />
          </span>
        </button>
      </nav>
    </aside>
  );
}
