import {
  DRAFT_STORE,
  idbRequest,
  openAthenaLocalDb,
} from "../../platform/storage/athenaDb";
import {
  encryptVaultJson,
  isVaultEncryptedPayload,
  type VaultEncryptedPayload,
} from "../vault/vault";

const CURRENT_DRAFT_ID = "current" as const;

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

export async function saveLocalDraft(text: string) {
  const draft: DraftRecord = {
    id: CURRENT_DRAFT_ID,
    text,
    updatedAt: new Date().toISOString(),
  };
  const db = await openAthenaLocalDb();
  const transaction = db.transaction(DRAFT_STORE, "readwrite");
  await idbRequest(
    transaction.objectStore(DRAFT_STORE).put(await encryptLocalDraft(draft)),
  );
}

export async function clearLocalDraft() {
  await saveLocalDraft("");
}

export async function migrateLegacyDraftToIndexedDb() {
  if (localStorage.getItem("athenaDraft") === null) return;
  localStorage.removeItem("athenaDraft");
}

export async function migrateDraftsToVault() {
  const db = await openAthenaLocalDb();
  const transaction = db.transaction(DRAFT_STORE, "readonly");
  const records = await idbRequest<StoredDraftRecord[]>(
    transaction.objectStore(DRAFT_STORE).getAll(),
  );

  for (const record of records) {
    if (isEncryptedDraftRecord(record)) continue;
    const writeTransaction = db.transaction(DRAFT_STORE, "readwrite");
    await idbRequest(
      writeTransaction.objectStore(DRAFT_STORE).put(await encryptLocalDraft(record)),
    );
  }
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
      `athena:vault:draft:${draft.id}`,
    ),
  };
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
