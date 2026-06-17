import type { EntrySortDirection, ExtractionSettings, LocalEntry } from "../types";
import { normalizeSignal } from "./signals";
import {
  decryptVaultJson,
  encryptVaultJson,
  isVaultEncryptedPayload,
  type VaultEncryptedPayload,
} from "./vault";
import {
  getProfileScopedDatabaseName,
  getProfileScopedStorageKey,
  getVaultProfiles,
  isDefaultVaultProfile,
} from "./vaultProfiles";
import { LANGUAGE_STORAGE_KEY } from "../i18n/languages";

const ATHENA_LOCAL_DB_NAME = "athena-private-v1";
const ATHENA_LOCAL_DB_VERSION = 3;

const ENTRY_STORE = "entries";
const DRAFT_STORE = "drafts";
export const QUEUE_JOBS_STORE = "queue_jobs";
export const SELF_REPORT_STORE = "self_reports";
export const SELF_REPORT_DAILY_AGGREGATES_STORE =
  "self_report_daily_aggregates";

const CURRENT_DRAFT_ID = "current";
const DEBUG_MODE_KEY = "athena_debug_mode";
const EXTRACTION_SETTINGS_KEY = "athena_extraction_settings";
const ENTRY_SORT_DIRECTION_KEY = "athena_entry_sort_direction";
const GEMINI_DAILY_EXTRACTION_USAGE_KEY = "athena_gemini_daily_extraction_usage";
const LOCAL_EMOTION_SPIKE_ENABLED_KEY = "athena_local_emotion_spike_enabled";
const PERSONA_TEXT_ENABLED_KEY = "athena_persona_text_enabled";
const SEEN_EDITOR_INSIGHT_IDS_KEY = "athena_seen_editor_insight_ids";
const SEEN_OBSERVATION_INSIGHT_IDS_KEY =
  "athena_seen_observation_insight_ids";
const VAULT_CONFIG_KEY = "athena_vault_config";

const PROFILE_LOCAL_STORAGE_KEYS = [
  DEBUG_MODE_KEY,
  ENTRY_SORT_DIRECTION_KEY,
  EXTRACTION_SETTINGS_KEY,
  GEMINI_DAILY_EXTRACTION_USAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  LOCAL_EMOTION_SPIKE_ENABLED_KEY,
  PERSONA_TEXT_ENABLED_KEY,
  SEEN_EDITOR_INSIGHT_IDS_KEY,
  SEEN_OBSERVATION_INSIGHT_IDS_KEY,
  VAULT_CONFIG_KEY,
];

const PROFILE_LOCAL_STORAGE_PREFIXES = [
  "athena_insight_bag:",
  "athena_insight_choice:",
  "athena_phrase_bag:",
];

export const GEMINI_DAILY_EXTRACTION_LIMIT = 20;

type DraftRecord = {
  id: typeof CURRENT_DRAFT_ID;
  text: string;
  updatedAt: string;
};

type EncryptedDraftRecord = {
  id: typeof CURRENT_DRAFT_ID;
  updatedAt: string;
  vault_version: 1;
  vault_payload: VaultEncryptedPayload;
};

type StoredDraftRecord = DraftRecord | EncryptedDraftRecord;

type EncryptedLocalEntryRecord = {
  id: string;
  entry_date: string;
  updatedAt: string;
  vault_version: 1;
  vault_payload: VaultEncryptedPayload;
};

type StoredLocalEntryRecord = LocalEntry | EncryptedLocalEntryRecord;

type GeminiDailyExtractionUsage = {
  date: string;
  count: number;
};

let athenaDbPromise: Promise<IDBDatabase> | null = null;
let athenaDbName: string | null = null;

export function getDebugMode() {
  return localStorage.getItem(getStorageKey(DEBUG_MODE_KEY)) === "true";
}

export function setDebugMode(value: boolean) {
  localStorage.setItem(getStorageKey(DEBUG_MODE_KEY), String(value));
}

export function getPersonaTextEnabled() {
  return localStorage.getItem(getStorageKey(PERSONA_TEXT_ENABLED_KEY)) !== "false";
}

export function setPersonaTextEnabled(value: boolean) {
  localStorage.setItem(getStorageKey(PERSONA_TEXT_ENABLED_KEY), String(value));
}

export function getExtractionSettings(): ExtractionSettings | null {
  const raw = localStorage.getItem(getStorageKey(EXTRACTION_SETTINGS_KEY));

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as ExtractionSettings;
    if (!["ollama", "gemini", "off"].includes(parsed.provider)) return null;
    if (typeof parsed.model !== "string" || !parsed.model.trim()) return null;

    return {
      provider: parsed.provider,
      model: parsed.model,
    };
  } catch {
    return null;
  }
}

export function setExtractionSettings(value: ExtractionSettings) {
  localStorage.setItem(
    getStorageKey(EXTRACTION_SETTINGS_KEY),
    JSON.stringify(value),
  );
}

export function getEntrySortDirection(): EntrySortDirection {
  return localStorage.getItem(getStorageKey(ENTRY_SORT_DIRECTION_KEY)) === "asc"
    ? "asc"
    : "desc";
}

export function setEntrySortDirection(value: EntrySortDirection) {
  localStorage.setItem(getStorageKey(ENTRY_SORT_DIRECTION_KEY), value);
}

export function getLocalEmotionSpikeEnabled() {
  return (
    localStorage.getItem(getStorageKey(LOCAL_EMOTION_SPIKE_ENABLED_KEY)) ===
    "true"
  );
}

export function setLocalEmotionSpikeEnabled(value: boolean) {
  localStorage.setItem(
    getStorageKey(LOCAL_EMOTION_SPIKE_ENABLED_KEY),
    String(value),
  );
}

export function getGeminiDailyExtractionUsage(): GeminiDailyExtractionUsage {
  const today = localDateKey();
  const raw = localStorage.getItem(
    getStorageKey(GEMINI_DAILY_EXTRACTION_USAGE_KEY),
  );

  if (!raw) return { date: today, count: 0 };

  try {
    const parsed = JSON.parse(raw) as Partial<GeminiDailyExtractionUsage>;
    const count =
      typeof parsed.count === "number" && Number.isFinite(parsed.count)
        ? Math.max(0, Math.floor(parsed.count))
        : 0;

    if (parsed.date !== today) {
      return { date: today, count: 0 };
    }

    return {
      date: today,
      count: Math.min(count, GEMINI_DAILY_EXTRACTION_LIMIT),
    };
  } catch {
    return { date: today, count: 0 };
  }
}

export function getRemainingGeminiDailyExtractions() {
  const usage = getGeminiDailyExtractionUsage();

  return Math.max(0, GEMINI_DAILY_EXTRACTION_LIMIT - usage.count);
}

export function reserveGeminiDailyExtraction() {
  const usage = getGeminiDailyExtractionUsage();

  if (usage.count >= GEMINI_DAILY_EXTRACTION_LIMIT) return false;

  localStorage.setItem(
    getStorageKey(GEMINI_DAILY_EXTRACTION_USAGE_KEY),
    JSON.stringify({
      date: usage.date,
      count: usage.count + 1,
    } satisfies GeminiDailyExtractionUsage),
  );

  return true;
}

export function releaseGeminiDailyExtraction() {
  const usage = getGeminiDailyExtractionUsage();

  if (usage.count <= 0) return;

  localStorage.setItem(
    getStorageKey(GEMINI_DAILY_EXTRACTION_USAGE_KEY),
    JSON.stringify({
      date: usage.date,
      count: usage.count - 1,
    } satisfies GeminiDailyExtractionUsage),
  );
}

export function getSeenEditorInsightIds() {
  const raw = localStorage.getItem(getStorageKey(SEEN_EDITOR_INSIGHT_IDS_KEY));

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
    getStorageKey(SEEN_EDITOR_INSIGHT_IDS_KEY),
    JSON.stringify(Array.from(seenIds).slice(-100)),
  );
}

export function getSeenObservationInsightIds() {
  const raw = localStorage.getItem(
    getStorageKey(SEEN_OBSERVATION_INSIGHT_IDS_KEY),
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

export function markObservationInsightsSeen(ids: number[]) {
  if (ids.length === 0) return;

  const seenIds = getSeenObservationInsightIds();

  for (const id of ids) {
    seenIds.add(id);
  }

  localStorage.setItem(
    getStorageKey(SEEN_OBSERVATION_INSIGHT_IDS_KEY),
    JSON.stringify(Array.from(seenIds).slice(-200)),
  );
}

export async function getAllLocalEntries() {
  const db = await openAthenaLocalDb();
  const transaction = db.transaction(ENTRY_STORE, "readonly");
  const entries = await idbRequest<StoredLocalEntryRecord[]>(
    transaction.objectStore(ENTRY_STORE).getAll(),
  );

  const decryptedEntries = await Promise.all(entries.map(readStoredLocalEntry));

  return decryptedEntries.map(normalizeLocalEntry).sort(compareLocalEntries);
}

export async function getLocalEntry(id: string) {
  const db = await openAthenaLocalDb();
  const transaction = db.transaction(ENTRY_STORE, "readonly");

  const entry = await idbRequest<StoredLocalEntryRecord | undefined>(
    transaction.objectStore(ENTRY_STORE).get(id),
  );

  return entry ? normalizeLocalEntry(await readStoredLocalEntry(entry)) : undefined;
}

export async function saveLocalEntry(entry: LocalEntry) {
  const encryptedEntry = await encryptLocalEntry(entry);
  const db = await openAthenaLocalDb();
  const transaction = db.transaction(ENTRY_STORE, "readwrite");

  await idbRequest(transaction.objectStore(ENTRY_STORE).put(encryptedEntry));
}

export async function updateLocalEntry(id: string, patch: Partial<LocalEntry>) {
  const existing = await getLocalEntry(id);
  if (!existing) return null;

  const updated = {
    ...existing,
    ...patch,
    updatedAt: patch.updatedAt ?? new Date().toISOString(),
  };

  await saveLocalEntry(updated);

  return updated;
}

export async function deleteLocalEntry(id: string) {
  const db = await openAthenaLocalDb();
  const transaction = db.transaction(ENTRY_STORE, "readwrite");

  await idbRequest(transaction.objectStore(ENTRY_STORE).delete(id));
}

export async function replaceAllLocalEntries(entries: LocalEntry[]) {
  const encryptedEntries = await Promise.all(entries.map(encryptLocalEntry));
  const db = await openAthenaLocalDb();
  const transaction = db.transaction(ENTRY_STORE, "readwrite");
  const store = transaction.objectStore(ENTRY_STORE);

  await idbRequest(store.clear());

  for (const entry of encryptedEntries) {
    await idbRequest(store.put(entry));
  }
}

export async function saveLocalDraft(text: string) {
  const updatedAt = new Date().toISOString();
  const draft: DraftRecord = {
    id: CURRENT_DRAFT_ID,
    text,
    updatedAt,
  };
  const encryptedDraft = await encryptLocalDraft(draft);
  const db = await openAthenaLocalDb();
  const transaction = db.transaction(DRAFT_STORE, "readwrite");

  await idbRequest(transaction.objectStore(DRAFT_STORE).put(encryptedDraft));
}

export async function clearLocalDraft() {
  await saveLocalDraft("");
}

export async function migrateLegacyDraftToIndexedDb() {
  const legacyDraft = localStorage.getItem("athenaDraft");

  if (legacyDraft === null) return;

  localStorage.removeItem("athenaDraft");
}

export async function migrateLocalStorageToVault() {
  const db = await openAthenaLocalDb();
  await migrateEntriesToVault(db);
  await migrateDraftsToVault(db);
}

export async function deleteAthenaLocalData() {
  if (athenaDbPromise) {
    const existingDb = await athenaDbPromise.catch(() => null);
    existingDb?.close();
    athenaDbPromise = null;
    athenaDbName = null;
  }

  localStorage.removeItem("athenaDraft");
  localStorage.removeItem(getStorageKey(DEBUG_MODE_KEY));
  localStorage.removeItem(getStorageKey(EXTRACTION_SETTINGS_KEY));
  localStorage.removeItem(getStorageKey(ENTRY_SORT_DIRECTION_KEY));
  localStorage.removeItem(getStorageKey(GEMINI_DAILY_EXTRACTION_USAGE_KEY));
  localStorage.removeItem(getStorageKey(LOCAL_EMOTION_SPIKE_ENABLED_KEY));
  localStorage.removeItem(getStorageKey(PERSONA_TEXT_ENABLED_KEY));
  localStorage.removeItem(getStorageKey(SEEN_EDITOR_INSIGHT_IDS_KEY));
  localStorage.removeItem(getStorageKey(SEEN_OBSERVATION_INSIGHT_IDS_KEY));

  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(getAthenaLocalDbName());

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(new Error("Local database deletion was blocked"));
  });

  athenaDbPromise = null;
  athenaDbName = null;
}

export async function deleteAthenaProfileData(profileId: string) {
  await deleteAthenaLocalDatabase(profileId);
  deleteProfileLocalStorage(profileId);
}

export function createClientEntryId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `entry-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function createTextHash(text: string) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function openAthenaLocalDb(): Promise<IDBDatabase> {
  if (athenaDbPromise) return athenaDbPromise;

  const databaseName = getAthenaLocalDbName();
  athenaDbName = databaseName;
  athenaDbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, ATHENA_LOCAL_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(ENTRY_STORE)) {
        const entries = db.createObjectStore(ENTRY_STORE, { keyPath: "id" });
        entries.createIndex("entry_date", "entry_date");
        entries.createIndex("updatedAt", "updatedAt");
      }

      if (!db.objectStoreNames.contains(DRAFT_STORE)) {
        db.createObjectStore(DRAFT_STORE, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(QUEUE_JOBS_STORE)) {
        const queueJobs = db.createObjectStore(QUEUE_JOBS_STORE, {
          keyPath: "id",
        });

        queueJobs.createIndex("status", "status");
        queueJobs.createIndex("type", "type");
        queueJobs.createIndex("run_after", "run_after");
        queueJobs.createIndex("created_at", "created_at");
        queueJobs.createIndex("entity", ["entity_kind", "entity_id"]);
        queueJobs.createIndex("idempotency_key", "idempotency_key", {
          unique: false,
        });
      }

      if (!db.objectStoreNames.contains(SELF_REPORT_STORE)) {
        const selfReports = db.createObjectStore(SELF_REPORT_STORE, {
          keyPath: "id",
        });

        selfReports.createIndex("entry_id", "entry_id", { unique: true });
        selfReports.createIndex("local_day", "local_day");
        selfReports.createIndex("updated_at", "updated_at");
      }

      if (!db.objectStoreNames.contains(SELF_REPORT_DAILY_AGGREGATES_STORE)) {
        const aggregates = db.createObjectStore(
          SELF_REPORT_DAILY_AGGREGATES_STORE,
          {
            keyPath: "id",
          },
        );

        aggregates.createIndex("local_day", "local_day");
        aggregates.createIndex("axis", "axis");
        aggregates.createIndex("updated_at", "updated_at");
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return athenaDbPromise;
}

async function deleteAthenaLocalDatabase(profileId: string) {
  if (typeof indexedDB === "undefined") return;

  const databaseName = getProfileScopedDatabaseName(
    ATHENA_LOCAL_DB_NAME,
    profileId,
  );

  if (athenaDbName === databaseName && athenaDbPromise) {
    const existingDb = await athenaDbPromise.catch(() => null);
    existingDb?.close();
    athenaDbPromise = null;
    athenaDbName = null;
  }

  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(databaseName);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(new Error("Local database deletion was blocked"));
  });
}

function deleteProfileLocalStorage(profileId: string) {
  if (typeof localStorage === "undefined") return;

  if (isDefaultVaultProfile(profileId)) {
    deleteDefaultProfileLocalStorage(profileId);
    return;
  }

  const suffix = `:${profileId}`;

  for (const key of getLocalStorageKeys()) {
    if (key.endsWith(suffix)) {
      localStorage.removeItem(key);
    }
  }
}

function deleteDefaultProfileLocalStorage(profileId: string) {
  for (const key of PROFILE_LOCAL_STORAGE_KEYS) {
    localStorage.removeItem(getProfileScopedStorageKey(key, profileId));
  }

  localStorage.removeItem("athenaDraft");

  const otherProfileSuffixes = getVaultProfiles()
    .filter((profile) => profile.id !== profileId)
    .map((profile) => `:${profile.id}`);

  for (const key of getLocalStorageKeys()) {
    if (!PROFILE_LOCAL_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      continue;
    }

    if (otherProfileSuffixes.some((suffix) => key.endsWith(suffix))) {
      continue;
    }

    localStorage.removeItem(key);
  }
}

function getLocalStorageKeys() {
  return Array.from({ length: localStorage.length }, (_, index) =>
    localStorage.key(index),
  ).filter((key): key is string => Boolean(key));
}

function idbRequest<T = unknown>(request: IDBRequest) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(request.error);
  });
}

function compareLocalEntries(left: LocalEntry, right: LocalEntry) {
  const dateOrder = right.entry_date.localeCompare(left.entry_date);
  if (dateOrder !== 0) return dateOrder;

  return right.createdAt.localeCompare(left.createdAt);
}

function normalizeLocalEntry(entry: LocalEntry): LocalEntry {
  return {
    ...entry,
    signals: normalizeSignal(entry.signals),
  };
}

async function migrateEntriesToVault(db: IDBDatabase) {
  const transaction = db.transaction(ENTRY_STORE, "readonly");
  const records = await idbRequest<StoredLocalEntryRecord[]>(
    transaction.objectStore(ENTRY_STORE).getAll(),
  );

  for (const record of records) {
    if (isEncryptedLocalEntryRecord(record)) continue;

    const encryptedRecord = await encryptLocalEntry(record);
    const writeTransaction = db.transaction(ENTRY_STORE, "readwrite");
    await idbRequest(
      writeTransaction.objectStore(ENTRY_STORE).put(encryptedRecord),
    );
  }
}

async function migrateDraftsToVault(db: IDBDatabase) {
  const transaction = db.transaction(DRAFT_STORE, "readonly");
  const records = await idbRequest<StoredDraftRecord[]>(
    transaction.objectStore(DRAFT_STORE).getAll(),
  );

  for (const record of records) {
    if (isEncryptedDraftRecord(record)) continue;

    const encryptedRecord = await encryptLocalDraft(record);
    const writeTransaction = db.transaction(DRAFT_STORE, "readwrite");
    await idbRequest(
      writeTransaction.objectStore(DRAFT_STORE).put(encryptedRecord),
    );
  }
}

async function readStoredLocalEntry(
  record: StoredLocalEntryRecord,
): Promise<LocalEntry> {
  if (!isEncryptedLocalEntryRecord(record)) return record;

  return decryptVaultJson<LocalEntry>(
    record.vault_payload,
    createEntryVaultAssociatedData(record.id),
  );
}

async function encryptLocalEntry(
  entry: LocalEntry,
): Promise<EncryptedLocalEntryRecord> {
  return {
    id: entry.id,
    entry_date: entry.entry_date,
    updatedAt: entry.updatedAt,
    vault_version: 1,
    vault_payload: await encryptVaultJson(
      entry,
      createEntryVaultAssociatedData(entry.id),
    ),
  };
}

async function encryptLocalDraft(
  draft: DraftRecord,
): Promise<EncryptedDraftRecord> {
  return {
    id: draft.id,
    updatedAt: draft.updatedAt,
    vault_version: 1,
    vault_payload: await encryptVaultJson(
      draft,
      createDraftVaultAssociatedData(draft.id),
    ),
  };
}

function isEncryptedLocalEntryRecord(
  record: StoredLocalEntryRecord,
): record is EncryptedLocalEntryRecord {
  return (
    typeof record === "object" &&
    record !== null &&
    "vault_payload" in record &&
    isVaultEncryptedPayload(record.vault_payload)
  );
}

function isEncryptedDraftRecord(
  record: StoredDraftRecord,
): record is EncryptedDraftRecord {
  return (
    typeof record === "object" &&
    record !== null &&
    "vault_payload" in record &&
    isVaultEncryptedPayload(record.vault_payload)
  );
}

function createEntryVaultAssociatedData(entryId: string) {
  return `athena:vault:entry:${entryId}`;
}

function createDraftVaultAssociatedData(draftId: string) {
  return `athena:vault:draft:${draftId}`;
}

function localDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getStorageKey(key: string) {
  return getProfileScopedStorageKey(key);
}

function getAthenaLocalDbName() {
  return getProfileScopedDatabaseName(ATHENA_LOCAL_DB_NAME);
}
