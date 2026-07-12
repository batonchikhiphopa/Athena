import { LANGUAGE_STORAGE_KEY } from "../i18n/languages";
import {
  deleteAthenaDatabaseForProfile,
  deleteCurrentAthenaDatabase,
} from "../platform/storage/athenaDb";
import { ENTRY_SORT_DIRECTION_KEY } from "../features/entries/entryPreferences";
import { GEMINI_QUOTA_STORAGE_KEYS } from "../features/extraction/geminiQuota";
import { SEEN_EDITOR_INSIGHT_IDS_KEY } from "../features/insights/seenInsights";
import { SETTINGS_STORAGE_KEYS } from "../features/settings/settingsStorage";
import {
  getProfileScopedStorageKey,
  getVaultProfiles,
  isDefaultVaultProfile,
} from "../features/vault/vaultProfiles";

const VAULT_CONFIG_KEY = "athena_vault_config";
const PROFILE_KEYS = [
  ...SETTINGS_STORAGE_KEYS,
  ...GEMINI_QUOTA_STORAGE_KEYS,
  ENTRY_SORT_DIRECTION_KEY,
  LANGUAGE_STORAGE_KEY,
  SEEN_EDITOR_INSIGHT_IDS_KEY,
  VAULT_CONFIG_KEY,
] as const;
const PROFILE_PREFIXES = [
  "athena_insight_bag:",
  "athena_insight_choice:",
  "athena_phrase_bag:",
] as const;

export async function deleteAthenaLocalData() {
  await deleteCurrentAthenaDatabase();
  localStorage.removeItem("athenaDraft");
  for (const key of PROFILE_KEYS) {
    localStorage.removeItem(getProfileScopedStorageKey(key));
  }
}

export async function deleteAthenaProfileData(profileId: string) {
  await deleteAthenaDatabaseForProfile(profileId);
  deleteProfileLocalStorage(profileId);
}

function deleteProfileLocalStorage(profileId: string) {
  if (typeof localStorage === "undefined") return;

  if (!isDefaultVaultProfile(profileId)) {
    const suffix = `:${profileId}`;
    for (const key of getLocalStorageKeys()) {
      if (key.endsWith(suffix)) localStorage.removeItem(key);
    }
    return;
  }

  for (const key of PROFILE_KEYS) {
    localStorage.removeItem(getProfileScopedStorageKey(key, profileId));
  }
  localStorage.removeItem("athenaDraft");

  const otherSuffixes = getVaultProfiles()
    .filter((profile) => profile.id !== profileId)
    .map((profile) => `:${profile.id}`);

  for (const key of getLocalStorageKeys()) {
    if (!PROFILE_PREFIXES.some((prefix) => key.startsWith(prefix))) continue;
    if (otherSuffixes.some((suffix) => key.endsWith(suffix))) continue;
    localStorage.removeItem(key);
  }
}

function getLocalStorageKeys() {
  return Array.from({ length: localStorage.length }, (_, index) =>
    localStorage.key(index),
  ).filter((key): key is string => Boolean(key));
}
