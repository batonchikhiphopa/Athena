import assert from "node:assert/strict";
import test from "node:test";
import "fake-indexeddb/auto";
import { validSignal } from "./signal-fixtures.js";

const localStorageMock = new Map();

globalThis.localStorage = {
  clear() {
    localStorageMock.clear();
  },
  getItem(key) {
    return localStorageMock.get(key) ?? null;
  },
  key(index) {
    return Array.from(localStorageMock.keys())[index] ?? null;
  },
  removeItem(key) {
    localStorageMock.delete(key);
  },
  setItem(key, value) {
    localStorageMock.set(key, String(value));
  },
  get length() {
    return localStorageMock.size;
  },
};

test.beforeEach(async () => {
  localStorage.clear();
  await deleteDatabase("athena-private-v1");
});

test("local vault migration encrypts old IndexedDB entries without losing data", async () => {
  const { setupVault, isVaultEncryptedPayload } = await import(
    "../client/src/lib/vault.ts"
  );
  const {
    getAllLocalEntries,
    migrateLocalStorageToVault,
    openAthenaLocalDb,
  } = await import("../client/src/lib/storage.ts");
  const legacyEntry = {
    id: "legacy-entry-1",
    serverId: null,
    text: "raw local diary text before vault",
    entry_date: "2026-06-02",
    tags: ["private-tag"],
    analysis_enabled: true,
    source_text_hash: "b".repeat(64),
    signals: validSignal(),
    metadata: {
      schema_version: "signal.v4",
      prompt_version: "extraction.v5",
      provider: "ollama",
      model: "gpt-oss:20b",
    },
    sync_status: "local_only",
    createdAt: "2026-06-02T10:00:00.000Z",
    updatedAt: "2026-06-02T10:00:00.000Z",
  };
  const db = await openAthenaLocalDb();

  await putRecord(db, "entries", legacyEntry);
  await setupVault("athena-vault-secret-v3:personal:correct horse battery staple");
  await migrateLocalStorageToVault();

  const entries = await getAllLocalEntries();
  const storedRecord = await getRecord(db, "entries", legacyEntry.id);
  const serializedRecord = JSON.stringify(storedRecord);

  assert.equal(entries.length, 1);
  assert.equal(entries[0].id, legacyEntry.id);
  assert.equal(entries[0].text, legacyEntry.text);
  assert.deepEqual(entries[0].tags, legacyEntry.tags);
  assert.equal(isVaultEncryptedPayload(storedRecord.vault_payload), true);
  assert.equal(serializedRecord.includes(legacyEntry.text), false);
  assert.equal(serializedRecord.includes("private-tag"), false);
});

function putRecord(db, storeName, value) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const request = transaction.objectStore(storeName).put(value);

    request.onerror = () => reject(request.error);
    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => resolve();
  });
}

function getRecord(db, storeName, key) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function deleteDatabase(name) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("IndexedDB deletion blocked"));
  });
}
