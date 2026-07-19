import {
  RESULTS_CUSTOMIZATION_STORE,
  idbRequest,
  openAthenaLocalDb,
} from "../../platform/storage/athenaDb";
import {
  decryptVaultJson,
  encryptVaultJson,
  type VaultEncryptedPayload,
} from "../vault/vault";
import {
  EMPTY_RESULTS_CUSTOMIZATION,
  normalizeResultsCustomization,
  type ResultsCustomization,
} from "./resultsCorrections";

const RESULTS_CUSTOMIZATION_RECORD_ID = "canonical";

type StoredResultsCustomization = {
  id: typeof RESULTS_CUSTOMIZATION_RECORD_ID;
  vaultPayload: VaultEncryptedPayload;
  vaultVersion: 1;
};

export async function loadResultsCustomization(): Promise<ResultsCustomization> {
  const db = await openAthenaLocalDb();
  const transaction = db.transaction(RESULTS_CUSTOMIZATION_STORE, "readonly");
  const record = await idbRequest<StoredResultsCustomization | undefined>(
    transaction
      .objectStore(RESULTS_CUSTOMIZATION_STORE)
      .get(RESULTS_CUSTOMIZATION_RECORD_ID),
  );
  if (!record) return EMPTY_RESULTS_CUSTOMIZATION;

  const value = await decryptVaultJson<unknown>(
    record.vaultPayload,
    associatedData(),
  );
  return normalizeResultsCustomization(value);
}

export async function saveResultsCustomization(
  value: ResultsCustomization,
) {
  const record: StoredResultsCustomization = {
    id: RESULTS_CUSTOMIZATION_RECORD_ID,
    vaultPayload: await encryptVaultJson(value, associatedData()),
    vaultVersion: 1,
  };
  const db = await openAthenaLocalDb();
  const transaction = db.transaction(RESULTS_CUSTOMIZATION_STORE, "readwrite");
  await idbRequest(
    transaction.objectStore(RESULTS_CUSTOMIZATION_STORE).put(record),
  );
}

function associatedData() {
  return "athena:vault:results-customization:canonical";
}
