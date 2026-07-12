import { getProfileScopedStorageKey } from "../vault/vaultProfiles";

export const SEEN_EDITOR_INSIGHT_IDS_KEY = "athena_seen_editor_insight_ids";

export function getSeenEditorInsightIds() {
  const raw = localStorage.getItem(
    getProfileScopedStorageKey(SEEN_EDITOR_INSIGHT_IDS_KEY),
  );
  if (!raw) return new Set<number>();

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set<number>();
    return new Set(
      parsed.filter(
        (value): value is number =>
          typeof value === "number" && Number.isInteger(value),
      ),
    );
  } catch {
    return new Set<number>();
  }
}

export function markEditorInsightSeen(id: number) {
  const seenIds = getSeenEditorInsightIds();
  seenIds.add(id);
  localStorage.setItem(
    getProfileScopedStorageKey(SEEN_EDITOR_INSIGHT_IDS_KEY),
    JSON.stringify(Array.from(seenIds).slice(-100)),
  );
}
