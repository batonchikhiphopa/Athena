import { getProfileScopedDatabaseName } from "../../features/vault/vaultProfiles";

export const ATHENA_LOCAL_DB_NAME = "athena-private-v1";
const ATHENA_LOCAL_DB_VERSION = 3;

export const ENTRY_STORE = "entries";
export const DRAFT_STORE = "drafts";
export const QUEUE_JOBS_STORE = "queue_jobs";
export const SELF_REPORT_STORE = "self_reports";
export const SELF_REPORT_DAILY_AGGREGATES_STORE =
  "self_report_daily_aggregates";

let athenaDbPromise: Promise<IDBDatabase> | null = null;
let athenaDbName: string | null = null;

export function openAthenaLocalDb(): Promise<IDBDatabase> {
  if (athenaDbPromise) return athenaDbPromise;

  const databaseName = getProfileScopedDatabaseName(ATHENA_LOCAL_DB_NAME);
  athenaDbName = databaseName;
  athenaDbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, ATHENA_LOCAL_DB_VERSION);

    request.onupgradeneeded = () => initializeSchema(request.result);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return athenaDbPromise;
}

export async function deleteCurrentAthenaDatabase(): Promise<void> {
  const databaseName = getProfileScopedDatabaseName(ATHENA_LOCAL_DB_NAME);
  await closeConnection(databaseName);
  await deleteDatabase(databaseName);
}

export async function deleteAthenaDatabaseForProfile(
  profileId: string,
): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const databaseName = getProfileScopedDatabaseName(
    ATHENA_LOCAL_DB_NAME,
    profileId,
  );
  await closeConnection(databaseName);
  await deleteDatabase(databaseName);
}

export function idbRequest<T = unknown>(request: IDBRequest) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(request.error);
  });
}

function initializeSchema(db: IDBDatabase) {
  if (!db.objectStoreNames.contains(ENTRY_STORE)) {
    const entries = db.createObjectStore(ENTRY_STORE, { keyPath: "id" });
    entries.createIndex("entry_date", "entry_date");
    entries.createIndex("updatedAt", "updatedAt");
  }

  if (!db.objectStoreNames.contains(DRAFT_STORE)) {
    db.createObjectStore(DRAFT_STORE, { keyPath: "id" });
  }

  if (!db.objectStoreNames.contains(QUEUE_JOBS_STORE)) {
    const jobs = db.createObjectStore(QUEUE_JOBS_STORE, { keyPath: "id" });
    jobs.createIndex("status", "status");
    jobs.createIndex("type", "type");
    jobs.createIndex("run_after", "run_after");
    jobs.createIndex("created_at", "created_at");
    jobs.createIndex("entity", ["entity_kind", "entity_id"]);
    jobs.createIndex("idempotency_key", "idempotency_key", { unique: false });
  }

  if (!db.objectStoreNames.contains(SELF_REPORT_STORE)) {
    const reports = db.createObjectStore(SELF_REPORT_STORE, { keyPath: "id" });
    reports.createIndex("entry_id", "entry_id", { unique: true });
    reports.createIndex("local_day", "local_day");
    reports.createIndex("updated_at", "updated_at");
  }

  if (!db.objectStoreNames.contains(SELF_REPORT_DAILY_AGGREGATES_STORE)) {
    const aggregates = db.createObjectStore(
      SELF_REPORT_DAILY_AGGREGATES_STORE,
      { keyPath: "id" },
    );
    aggregates.createIndex("local_day", "local_day");
    aggregates.createIndex("axis", "axis");
    aggregates.createIndex("updated_at", "updated_at");
  }
}

async function closeConnection(databaseName: string) {
  if (athenaDbName !== databaseName || !athenaDbPromise) return;
  const existingDb = await athenaDbPromise.catch(() => null);
  existingDb?.close();
  athenaDbPromise = null;
  athenaDbName = null;
}

async function deleteDatabase(databaseName: string) {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(databaseName);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(new Error("Local database deletion was blocked"));
  });
}
