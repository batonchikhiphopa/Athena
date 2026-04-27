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
  { icon: "settings", page: "settings" },
] as const;

export function Nav({ currentPage, onNavigate }: NavProps) {
  return (
    <aside className="sticky top-0 h-screen w-fit flex flex-col px-2 py-5">
      <nav className="flex flex-col items-center gap-2 mt-4">
        {navItems.map((item) => (
      <button
        className={[
            "h-9 w-9 flex items-center justify-center rounded-full text-sm transition",
            currentPage === item.page
            ? "text-zinc-900"
            : "text-zinc-400 opacity-50 hover:opacity-100 hover:text-zinc-700",
                    ].join(" ")}
        key={item.page}
        onClick={() => onNavigate(item.page)}
        type="button"
      >
        <span className="translate-y-[-1px]">
          <IconComponent name={item.icon} className="w-5 h-5" />
        </span>
      </button>
        ))}
      </nav>
    </aside>
  );
}
