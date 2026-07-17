import { useI18n } from "../../../i18n/useI18n";
import { CloseIcon } from "./entryUiHelpers";
import { tagTestIdValue } from "./entryTagId";

export function EntriesUtilityPanel({
  searchQuery,
  includedTags,
  excludedTags,
  hasActiveFilters,
  isSearching,
  onClearFilters,
  onSearchQueryChange,
  onToggleExcludedTag,
  onToggleTag,
}: {
  searchQuery: string;
  includedTags: string[];
  excludedTags: string[];
  hasActiveFilters: boolean;
  isSearching: boolean;
  onClearFilters: () => void;
  onSearchQueryChange: (query: string) => void;
  onToggleExcludedTag: (tag: string) => void;
  onToggleTag: (tag: string) => void;
}) {
  const { t } = useI18n();

  return (
    <aside
      aria-label={t("entries.searchAria")}
      className="
        flex w-full shrink-0 flex-wrap items-start gap-2
        bg-transparent
        sm:flex-nowrap
      "
    >
      <div className="relative min-w-0 flex-1 basis-[18rem] sm:max-w-[34.5rem]">
        <input
          aria-label={t("entries.searchAria")}
          className="
            h-9 w-full rounded-full border border-white/70 bg-white px-3.5 pr-9
            text-sm text-zinc-800 shadow-sm shadow-zinc-900/5 outline-none
            transition
            placeholder:text-zinc-400
            focus:border-white focus:bg-white focus:shadow-zinc-900/10
          "
          data-testid="entries-search-input"
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder={t("entries.searchPlaceholder")}
          type="search"
          value={searchQuery}
        />

        {hasActiveFilters && (
          <button
            aria-label={t("entries.action.clearFilters")}
            className="
              absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2
              place-items-center rounded-full text-zinc-400 transition
              hover:bg-white/60 hover:text-zinc-950
            "
            data-testid="entries-clear-filters"
            onClick={onClearFilters}
            type="button"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      <ActiveTagFilters
        excludedTags={excludedTags}
        includedTags={includedTags}
        onToggleExcludedTag={onToggleExcludedTag}
        onToggleTag={onToggleTag}
      />

      {isSearching && (
        <div className="flex h-9 items-center text-xs text-zinc-400">
          {t("entries.searching")}
        </div>
      )}

      <div aria-hidden className="-mr-1 ml-auto h-9 w-9 shrink-0" />
    </aside>
  );
}

function ActiveTagFilters({
  includedTags,
  excludedTags,
  onToggleTag,
  onToggleExcludedTag,
}: {
  includedTags: string[];
  excludedTags: string[];
  onToggleTag: (tag: string) => void;
  onToggleExcludedTag: (tag: string) => void;
}) {
  const { t } = useI18n();

  if (includedTags.length === 0 && excludedTags.length === 0) return null;

  return (
    <div className="flex min-h-9 min-w-0 flex-wrap items-center gap-2">
      {includedTags.map((tag) => (
        <button
          aria-label={`${t("entries.action.clearFilters")} #${tag}`}
          className="
            inline-flex h-9 items-center gap-2 rounded-full border border-white/45
            bg-sky-50/70 px-3 text-sm text-sky-700 shadow-sm shadow-zinc-900/5
            backdrop-blur-[2px] transition hover:bg-white/70 hover:text-sky-800
          "
          data-testid={`entry-tag-include-${tagTestIdValue(tag)}`}
          key={`include-${tag}`}
          onClick={() => onToggleTag(tag)}
          type="button"
        >
          <span>#{tag}</span>
          <CloseIcon />
        </button>
      ))}

      {excludedTags.map((tag) => (
        <button
          aria-label={`${t("entries.action.clearFilters")} -#${tag}`}
          className="
            inline-flex h-9 items-center gap-2 rounded-full border border-white/45
            bg-zinc-100/65 px-3 text-sm text-zinc-500 shadow-sm shadow-zinc-900/5
            backdrop-blur-[2px] transition hover:bg-white/70 hover:text-zinc-800
          "
          data-testid={`entry-tag-exclude-${tagTestIdValue(tag)}`}
          key={`exclude-${tag}`}
          onClick={() => onToggleExcludedTag(tag)}
          type="button"
        >
          <span>-#{tag}</span>
          <CloseIcon />
        </button>
      ))}
    </div>
  );
}
