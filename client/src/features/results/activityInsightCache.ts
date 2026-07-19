import {
  ACTIVITY_INSIGHT_STORE,
  idbRequest,
  openAthenaLocalDb,
} from "../../platform/storage/athenaDb";
import {
  decryptVaultJson,
  encryptVaultJson,
  type VaultEncryptedPayload,
} from "../vault/vault";
import type { CachedActivityInsight } from "./activityInsightTypes";

type StoredActivityInsight = {
  storageKey: string;
  vaultVersion: 1;
  vaultPayload: VaultEncryptedPayload;
};

export async function loadActivityInsightCache() {
  const db = await openAthenaLocalDb();
  const transaction = db.transaction(ACTIVITY_INSIGHT_STORE, "readonly");
  const records = await idbRequest<StoredActivityInsight[]>(
    transaction.objectStore(ACTIVITY_INSIGHT_STORE).getAll(),
  );
  const values = (
    await Promise.all(
      records.map(async (record) => {
        try {
          return await decryptStoredInsight(record);
        } catch {
          return null;
        }
      }),
    )
  ).filter((value): value is CachedActivityInsight => value !== null);

  return new Map(values.map((value) => [value.activityId, value]));
}

export async function saveActivityInsights(values: CachedActivityInsight[]) {
  if (values.length === 0) return;

  const merged = await loadActivityInsightCache();
  for (const value of values) merged.set(value.activityId, value);

  await replaceActivityInsights(merged);
}

export async function deleteActivityInsight(activityId: string) {
  const remaining = await loadActivityInsightCache();
  if (!remaining.delete(activityId)) return;

  await replaceActivityInsights(remaining);
}

async function replaceActivityInsights(
  values: Map<string, CachedActivityInsight>,
) {
  const records = await Promise.all([...values.values()].map(encryptInsight));

  const db = await openAthenaLocalDb();
  const transaction = db.transaction(ACTIVITY_INSIGHT_STORE, "readwrite");
  const store = transaction.objectStore(ACTIVITY_INSIGHT_STORE);

  await idbRequest(store.clear());
  for (const record of records) {
    await idbRequest(store.put(record));
  }
}

async function encryptInsight(
  value: CachedActivityInsight,
): Promise<StoredActivityInsight> {
  const storageKey = createStorageKey();

  return {
    storageKey,
    vaultVersion: 1,
    vaultPayload: await encryptVaultJson(value, associatedData(storageKey)),
  };
}

function decryptStoredInsight(record: StoredActivityInsight) {
  return decryptVaultJson<CachedActivityInsight>(
    record.vaultPayload,
    associatedData(record.storageKey),
  );
}

function createStorageKey() {
  if (globalThis.crypto.randomUUID) return globalThis.crypto.randomUUID();

  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  return [...bytes]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function associatedData(storageKey: string) {
  return `athena:vault:activity-insight:${storageKey}`;
}
