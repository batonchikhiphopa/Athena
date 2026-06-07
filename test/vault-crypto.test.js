import test from "node:test";
import assert from "node:assert/strict";

import {
  addVaultCredential,
  createVaultConfigForPassphrase,
  deleteVaultCredential,
  decryptVaultJsonWithKey,
  encryptVaultJsonWithKey,
  getVaultCredentialSummaries,
  isVaultEncryptedPayload,
  rotateVaultSecret,
  setupVault,
  setupVaultWithoutSecret,
  unlockVaultKeyFromConfig,
  unlockVaultKeyFromPasswordlessConfig,
  unlockVault,
  unlockVaultWithoutSecret,
} from "../client/src/features/vault/vaultApi.ts";

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

test.beforeEach(() => {
  localStorage.clear();
});

test("vault config unlocks only with the original passphrase", async () => {
  const { config } = await createVaultConfigForPassphrase(
    "correct horse battery staple",
    "2026-06-01T12:00:00.000Z",
  );

  await assert.rejects(
    unlockVaultKeyFromConfig(config, "wrong horse battery staple"),
    /vault_unlock_failed|operation-specific reason/,
  );

  const key = await unlockVaultKeyFromConfig(
    config,
    "correct horse battery staple",
  );
  const payload = await encryptVaultJsonWithKey(
    key,
    { text: "raw diary text" },
    "athena:vault:entry:entry-1",
  );
  const decrypted = await decryptVaultJsonWithKey(
    key,
    payload,
    "athena:vault:entry:entry-1",
  );

  assert.deepEqual(decrypted, { text: "raw diary text" });
});

test("vault payload uses authenticated associated data", async () => {
  const { key } = await createVaultConfigForPassphrase(
    "correct horse battery staple",
  );
  const payload = await encryptVaultJsonWithKey(
    key,
    { text: "raw diary text" },
    "athena:vault:entry:entry-1",
  );

  await assert.rejects(
    decryptVaultJsonWithKey(key, payload, "athena:vault:entry:entry-2"),
    /operation-specific reason|decrypt/,
  );
});

test("vault envelope does not expose plaintext fields", async () => {
  const { key } = await createVaultConfigForPassphrase(
    "correct horse battery staple",
  );
  const payload = await encryptVaultJsonWithKey(
    key,
    {
      id: "entry-1",
      text: "raw diary text",
      tags: ["private"],
    },
    "athena:vault:entry:entry-1",
  );
  const serialized = JSON.stringify(payload);

  assert.equal(isVaultEncryptedPayload(payload), true);
  assert.equal(serialized.includes("raw diary text"), false);
  assert.equal(serialized.includes("private"), false);
});

test("vault secret rotation keeps existing encrypted payload readable", async () => {
  await setupVault("athena-vault-secret-v3:personal:old-passphrase");
  const oldKey = await unlockVaultKeyFromConfig(
    JSON.parse(localStorage.getItem("athena_vault_config")),
    "athena-vault-secret-v3:personal:old-passphrase",
  );
  const payload = await encryptVaultJsonWithKey(
    oldKey,
    { text: "still readable" },
    "athena:vault:entry:entry-1",
  );

  await rotateVaultSecret({
    currentSecret: "athena-vault-secret-v3:personal:old-passphrase",
    nextSecret: "athena-vault-secret-v3:work:new-passphrase",
    nextProfileId: "work",
  });

  await unlockVault("athena-vault-secret-v3:work:new-passphrase");
  const newKey = await unlockVaultKeyFromConfig(
    JSON.parse(localStorage.getItem("athena_vault_config")),
    "athena-vault-secret-v3:work:new-passphrase",
  );

  assert.deepEqual(
    await decryptVaultJsonWithKey(
      newKey,
      payload,
      "athena:vault:entry:entry-1",
    ),
    { text: "still readable" },
  );
});

test("vault can add and delete profile passwords without re-encrypting data", async () => {
  const personalSecret = "athena-vault-secret-v3:personal:old-passphrase";
  const workSecret = "athena-vault-secret-v3:work:second-passphrase";

  await setupVaultWithoutSecret("personal");

  const initialKey = await unlockVaultKeyFromPasswordlessConfig(
    JSON.parse(localStorage.getItem("athena_vault_config")),
    "personal",
  );
  const payload = await encryptVaultJsonWithKey(
    initialKey,
    { text: "shared data key" },
    "athena:vault:entry:entry-2",
  );

  await addVaultCredential({
    profileId: "work",
    label: "Рабочий пароль",
    secret: workSecret,
  });

  const addedCredential = getVaultCredentialSummaries().find(
    (credential) =>
      credential.kind === "passphrase" && credential.profile_id === "work",
  );
  assert.ok(addedCredential);
  assert.equal(getVaultCredentialSummaries().length, 2);

  await unlockVault(workSecret);
  const workKey = await unlockVaultKeyFromConfig(
    JSON.parse(localStorage.getItem("athena_vault_config")),
    workSecret,
  );
  assert.deepEqual(
    await decryptVaultJsonWithKey(
      workKey,
      payload,
      "athena:vault:entry:entry-2",
    ),
    { text: "shared data key" },
  );

  await deleteVaultCredential({
    credentialId: addedCredential.id,
  });

  const afterDelete = getVaultCredentialSummaries();
  assert.equal(afterDelete.length, 2);
  assert.equal(
    afterDelete.some(
      (credential) =>
        credential.kind === "passwordless" && credential.profile_id === "work",
    ),
    true,
  );
  assert.equal(
    afterDelete.some(
      (credential) =>
        credential.kind === "passphrase" && credential.profile_id === "work",
    ),
    false,
  );

  await assert.rejects(unlockVault(workSecret), /vault_unlock_failed/);

  await unlockVaultWithoutSecret("work");
  const passwordlessKey = await unlockVaultKeyFromPasswordlessConfig(
    JSON.parse(localStorage.getItem("athena_vault_config")),
    "work",
  );
  assert.deepEqual(
    await decryptVaultJsonWithKey(
      passwordlessKey,
      payload,
      "athena:vault:entry:entry-2",
    ),
    { text: "shared data key" },
  );
});

test("deleting the last password leaves passwordless access", async () => {
  const personalSecret = "athena-vault-secret-v3:personal:old-passphrase";

  await setupVault(personalSecret, "personal");

  const onlyPassword = getVaultCredentialSummaries()[0];
  assert.equal(onlyPassword.kind, "passphrase");

  await deleteVaultCredential({
    authorizingSecret: personalSecret,
    credentialId: onlyPassword.id,
  });

  const summaries = getVaultCredentialSummaries();
  assert.equal(summaries.length, 1);
  assert.equal(summaries[0].kind, "passwordless");

  await unlockVaultWithoutSecret("personal");
});
