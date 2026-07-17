import type { LocalEntry } from "./entryTypes";
import { normalizeSignal } from "../extraction/signals";
import {
  ENTRY_STORE,
  idbRequest,
  openAthenaLocalDb,
} from "../../platform/storage/athenaDb";
import {
  decryptVaultJson,
  encryptVaultJson,
  type VaultEncryptedPayload,
} from "../vault/vault";

type EncryptedLocalEntryRecord = {
  id: string;
  entry_date: string;
  updatedAt: string;
  vault_version: 1;
  vault_payload: VaultEncryptedPayload;
};

export async function getAllLocalEntries() {
  const db = await openAthenaLocalDb();
  const transaction = db.transaction(ENTRY_STORE, "readonly");
  const entries = await idbRequest<EncryptedLocalEntryRecord[]>(
    transaction.objectStore(ENTRY_STORE).getAll(),
  );
  const decrypted = await Promise.all(entries.map(readStoredLocalEntry));
  return decrypted.map(normalizeLocalEntry).sort(compareLocalEntries);
}

export async function getLocalEntry(id: string) {
  const db = await openAthenaLocalDb();
  const transaction = db.transaction(ENTRY_STORE, "readonly");
  const entry = await idbRequest<EncryptedLocalEntryRecord | undefined>(
    transaction.objectStore(ENTRY_STORE).get(id),
  );
  return entry ? normalizeLocalEntry(await readStoredLocalEntry(entry)) : undefined;
}

export async function saveLocalEntry(entry: LocalEntry) {
  const encrypted = await encryptLocalEntry(entry);
  const db = await openAthenaLocalDb();
  const transaction = db.transaction(ENTRY_STORE, "readwrite");
  await idbRequest(transaction.objectStore(ENTRY_STORE).put(encrypted));
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
  const encrypted = await Promise.all(entries.map(encryptLocalEntry));
  const db = await openAthenaLocalDb();
  const transaction = db.transaction(ENTRY_STORE, "readwrite");
  const store = transaction.objectStore(ENTRY_STORE);
  await idbRequest(store.clear());
  for (const entry of encrypted) await idbRequest(store.put(entry));
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

function compareLocalEntries(left: LocalEntry, right: LocalEntry) {
  const dateOrder = right.entry_date.localeCompare(left.entry_date);
  return dateOrder !== 0
    ? dateOrder
    : right.createdAt.localeCompare(left.createdAt);
}

function normalizeLocalEntry(entry: LocalEntry): LocalEntry {
  return { ...entry, signals: normalizeSignal(entry.signals) };
}

async function readStoredLocalEntry(
  record: EncryptedLocalEntryRecord,
): Promise<LocalEntry> {
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

function createEntryVaultAssociatedData(entryId: string) {
  return `athena:vault:entry:${entryId}`;
}
