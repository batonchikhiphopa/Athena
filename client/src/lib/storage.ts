import type { EntrySortDirection, ExtractionSettings, LocalEntry } from "../types";

const ATHENA_LOCAL_DB_NAME = "athena-private-v1";
const ATHENA_LOCAL_DB_VERSION = 1;
const ENTRY_STORE = "entries";
const DRAFT_STORE = "drafts";
const CURRENT_DRAFT_ID = "current";
const DEBUG_MODE_KEY = "athena_debug_mode";
const EXTRACTION_SETTINGS_KEY = "athena_extraction_settings";
const ENTRY_SORT_DIRECTION_KEY = "athena_entry_sort_direction";
const GEMINI_DAILY_EXTRACTION_USAGE_KEY = "athena_gemini_daily_extraction_usage";
const PERSONA_TEXT_ENABLED_KEY = "athena_persona_text_enabled";
const SEEN_EDITOR_INSIGHT_IDS_KEY = "athena_seen_editor_insight_ids";
export const GEMINI_DAILY_EXTRACTION_LIMIT = 20;

type DraftRecord = {
  id: typeof CURRENT_DRAFT_ID;
  text: string;
  updatedAt: string;
};

type GeminiDailyExtractionUsage = {
  date: string;
  count: number;
};

let athenaDbPromise: Promise<IDBDatabase> | null = null;

export function getDebugMode() {
  return localStorage.getItem(DEBUG_MODE_KEY) === "true";
}

export function setDebugMode(value: boolean) {
  localStorage.setItem(DEBUG_MODE_KEY, String(value));
}

export function getPersonaTextEnabled() {
  return localStorage.getItem(PERSONA_TEXT_ENABLED_KEY) !== "false";
}

export function setPersonaTextEnabled(value: boolean) {
  localStorage.setItem(PERSONA_TEXT_ENABLED_KEY, String(value));
}

export function getExtractionSettings(): ExtractionSettings | null {
  const raw = localStorage.getItem(EXTRACTION_SETTINGS_KEY);

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
  localStorage.setItem(EXTRACTION_SETTINGS_KEY, JSON.stringify(value));
}

export function getEntrySortDirection(): EntrySortDirection {
  return localStorage.getItem(ENTRY_SORT_DIRECTION_KEY) === "asc"
    ? "asc"
    : "desc";
}

export function setEntrySortDirection(value: EntrySortDirection) {
  localStorage.setItem(ENTRY_SORT_DIRECTION_KEY, value);
}

export function getGeminiDailyExtractionUsage(): GeminiDailyExtractionUsage {
  const today = localDateKey();
  const raw = localStorage.getItem(GEMINI_DAILY_EXTRACTION_USAGE_KEY);

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
    GEMINI_DAILY_EXTRACTION_USAGE_KEY,
    JSON.stringify({
      date: usage.date,
      count: usage.count + 1,
    } satisfies GeminiDailyExtractionUsage),
  );

  return true;
}

export function getSeenEditorInsightIds() {
  const raw = localStorage.getItem(SEEN_EDITOR_INSIGHT_IDS_KEY);

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
    SEEN_EDITOR_INSIGHT_IDS_KEY,
    JSON.stringify(Array.from(seenIds).slice(-100)),
  );
}

export async function getAllLocalEntries() {
  const db = await openAthenaLocalDb();
  const transaction = db.transaction(ENTRY_STORE, "readonly");
  const entries = await idbRequest<LocalEntry[]>(
    transaction.objectStore(ENTRY_STORE).getAll(),
  );

  return entries.sort(compareLocalEntries);
}

export async function getLocalEntry(id: string) {
  const db = await openAthenaLocalDb();
  const transaction = db.transaction(ENTRY_STORE, "readonly");

  return idbRequest<LocalEntry | undefined>(
    transaction.objectStore(ENTRY_STORE).get(id),
  );
}

export async function saveLocalEntry(entry: LocalEntry) {
  const db = await openAthenaLocalDb();
  const transaction = db.transaction(ENTRY_STORE, "readwrite");

  await idbRequest(transaction.objectStore(ENTRY_STORE).put(entry));
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

export async function saveLocalDraft(text: string) {
  const db = await openAthenaLocalDb();
  const transaction = db.transaction(DRAFT_STORE, "readwrite");

  await idbRequest(
    transaction.objectStore(DRAFT_STORE).put({
      id: CURRENT_DRAFT_ID,
      text,
      updatedAt: new Date().toISOString(),
    } satisfies DraftRecord),
  );
}

export async function clearLocalDraft() {
  await saveLocalDraft("");
}

export async function migrateLegacyDraftToIndexedDb() {
  const legacyDraft = localStorage.getItem("athenaDraft");

  if (legacyDraft === null) return;

  localStorage.removeItem("athenaDraft");
}

export async function deleteAthenaLocalData() {
  if (athenaDbPromise) {
    const existingDb = await athenaDbPromise.catch(() => null);
    existingDb?.close();
    athenaDbPromise = null;
  }

  localStorage.removeItem("athenaDraft");
  localStorage.removeItem(DEBUG_MODE_KEY);
  localStorage.removeItem(EXTRACTION_SETTINGS_KEY);
  localStorage.removeItem(ENTRY_SORT_DIRECTION_KEY);
  localStorage.removeItem(GEMINI_DAILY_EXTRACTION_USAGE_KEY);
  localStorage.removeItem(PERSONA_TEXT_ENABLED_KEY);
  localStorage.removeItem(SEEN_EDITOR_INSIGHT_IDS_KEY);

  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(ATHENA_LOCAL_DB_NAME);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(new Error("Local database deletion was blocked"));
  });
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

function openAthenaLocalDb() {
  if (athenaDbPromise) return athenaDbPromise;

  athenaDbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(ATHENA_LOCAL_DB_NAME, ATHENA_LOCAL_DB_VERSION);

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
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return athenaDbPromise;
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

function localDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
