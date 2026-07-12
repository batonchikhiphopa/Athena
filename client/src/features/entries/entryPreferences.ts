import type { EntrySortDirection } from "./entryTypes";
import { getProfileScopedStorageKey } from "../vault/vaultProfiles";

export const ENTRY_SORT_DIRECTION_KEY = "athena_entry_sort_direction";

export function getEntrySortDirection(): EntrySortDirection {
  return localStorage.getItem(getProfileScopedStorageKey(ENTRY_SORT_DIRECTION_KEY)) === "asc"
    ? "asc"
    : "desc";
}

export function setEntrySortDirection(value: EntrySortDirection) {
  localStorage.setItem(getProfileScopedStorageKey(ENTRY_SORT_DIRECTION_KEY), value);
}
