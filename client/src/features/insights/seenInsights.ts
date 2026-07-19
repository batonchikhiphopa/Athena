import { getProfileScopedStorageKey } from "../vault/vaultProfiles";

export const SEEN_EDITOR_INSIGHT_IDS_KEY = "athena_seen_editor_insight_ids";
export const SEEN_OBSERVATION_IDS_KEY = "athena_seen_observation_ids";
export const SEEN_ACTIVITY_INSIGHT_KEYS_KEY =
  "athena_seen_activity_insight_keys";
export const SEEN_EXTRACTION_PROPOSAL_IDS_KEY =
  "athena_seen_extraction_proposal_ids";

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

export function getSeenObservationIds() {
  return getStoredValues<number>(SEEN_OBSERVATION_IDS_KEY, (value) =>
    typeof value === "number" && Number.isInteger(value) ? value : null,
  );
}

export function getSeenActivityInsightKeys() {
  return getStoredValues<string>(SEEN_ACTIVITY_INSIGHT_KEYS_KEY, (value) =>
    typeof value === "string" ? value : null,
  );
}

export function getSeenExtractionProposalIds() {
  return getStoredValues<string>(SEEN_EXTRACTION_PROPOSAL_IDS_KEY, (value) =>
    typeof value === "string" ? value : null,
  );
}

export function createActivityInsightSeenKey(
  activityId: string,
  generatedAt: string,
) {
  return `${activityId}:${generatedAt}`;
}

export function markObservationFeedSeen({
  observationIds,
  proposalIds,
}: {
  observationIds: number[];
  proposalIds: string[];
}) {
  storeValues(
    SEEN_OBSERVATION_IDS_KEY,
    [...getSeenObservationIds(), ...observationIds],
  );
  storeValues(
    SEEN_EXTRACTION_PROPOSAL_IDS_KEY,
    [...getSeenExtractionProposalIds(), ...proposalIds],
  );
}

function getStoredValues<T>(
  key: string,
  parseValue: (value: unknown) => T | null,
) {
  const raw = localStorage.getItem(getProfileScopedStorageKey(key));
  if (!raw) return new Set<T>();

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set<T>();
    return new Set(
      parsed
        .map(parseValue)
        .filter((value): value is T => value !== null),
    );
  } catch {
    return new Set<T>();
  }
}

function storeValues<T>(key: string, values: T[]) {
  localStorage.setItem(
    getProfileScopedStorageKey(key),
    JSON.stringify([...new Set(values)].slice(-300)),
  );
}
