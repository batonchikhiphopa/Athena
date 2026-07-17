import {
  DRAFT_STORE,
  idbRequest,
  openAthenaLocalDb,
} from "../../platform/storage/athenaDb";
import {
  encryptVaultJson,
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
