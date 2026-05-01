import type { Page } from "../types";
import { Icon } from "./icon";

type NavProps = {
  currentPage: Page;
  onNavigate: (page: Page) => void;
};

const IconComponent = Icon;

const navItems = [
  { icon: "feather", page: "editor" },
  { icon: "list", page: "entries" },
  { icon: "graph", page: "graph" },
  { icon: "observations", page: "observations" },
] as const;

export function Nav({ currentPage, onNavigate }: NavProps) {
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

        <button
          className={[
            "mt-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition",
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