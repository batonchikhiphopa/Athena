/**
 * Local vault cryptography. A credential unlocks the encrypted data key; the
 * data key encrypts records and stays in memory only while the vault is open.
 * Stored configuration never contains the plaintext credential or data key.
 */
import { getProfileScopedStorageKey } from "./vaultProfiles";

const VAULT_CONFIG_KEY = "athena_vault_config";
const VAULT_CONFIG_VERSION = 3;
const LEGACY_VAULT_CONFIG_VERSION = 2;
const VAULT_PAYLOAD_VERSION = 1;
const VAULT_KDF_ITERATIONS = 600_000;
const VAULT_SALT_BYTES = 16;
const VAULT_IV_BYTES = 12;
const VAULT_VERIFIER_TEXT = "athena:vault:verifier:v1";
const VAULT_VERIFIER_AAD = "athena:vault:verifier:v1";
const VAULT_DATA_KEY_AAD = "athena:vault:data-key:v1";
const VAULT_PASSWORDLESS_SECRET = "athena:vault:passwordless:v1";
const VAULT_PASSWORDLESS_LABEL = "Вход без пароля";

type VaultKdfConfig = {
  name: "PBKDF2-SHA-256";
  iterations: number;
  salt: string;
};

export type VaultEncryptedPayload = {
  __athena_vault: true;
  version: typeof VAULT_PAYLOAD_VERSION;
  algorithm: "AES-GCM";
  iv: string;
  ciphertext: string;
};

export type VaultCredentialKind = "passphrase" | "passwordless";

type LegacyVaultConfig = {
  version: typeof LEGACY_VAULT_CONFIG_VERSION;
  created_at: string;
  kdf: VaultKdfConfig;
  encrypted_data_key: VaultEncryptedPayload;
  verifier: VaultEncryptedPayload;
};

export type VaultCredential = {
  id: string;
  profile_id: string;
  label: string;
  created_at: string;
  kind: VaultCredentialKind;
  kdf: VaultKdfConfig;
  encrypted_data_key: VaultEncryptedPayload;
  verifier: VaultEncryptedPayload;
};

export type VaultCredentialSummary = Pick<
  VaultCredential,
  "id" | "profile_id" | "label" | "created_at" | "kind"
>;

export type VaultConfig = {
  version: typeof VAULT_CONFIG_VERSION;
  created_at: string;
  credentials: VaultCredential[];
};

export type VaultStatus = "unconfigured" | "locked" | "unlocked";

type VaultListener = (status: VaultStatus) => void;

let vaultKey: CryptoKey | null = null;
const vaultListeners = new Set<VaultListener>();

export function getVaultStatus(): VaultStatus {
  if (!readVaultConfig()) return "unconfigured";
  return vaultKey ? "unlocked" : "locked";
}

export function isVaultConfigured(): boolean {
  return Boolean(readVaultConfig());
}

export function isVaultUnlocked(): boolean {
  return Boolean(vaultKey);
}

export function getVaultCredentialSummaries(): VaultCredentialSummary[] {
  return (
    readVaultConfig()?.credentials.map(
      ({ id, profile_id, label, created_at, kind }) => ({
        id,
        profile_id,
        label,
        created_at,
        kind,
      }),
    ) ?? []
  );
}

export function subscribeVault(listener: VaultListener): () => void {
  vaultListeners.add(listener);
  listener(getVaultStatus());

  return () => {
    vaultListeners.delete(listener);
  };
}

export async function setupVault(
  passphrase: string,
  profileId = "personal",
): Promise<void> {
  if (isVaultConfigured()) {
    throw new Error("vault_already_configured");
  }

  assertUsablePassphrase(passphrase);

  const { config, key } = await createVaultConfigForPassphrase(
    passphrase,
    new Date().toISOString(),
    undefined,
    profileId,
    "Основной",
  );
  localStorage.setItem(getVaultConfigKey(), JSON.stringify(config));
  vaultKey = key;
  emitVaultStatus();
}

export async function setupVaultWithoutSecret(
  profileId = "personal",
): Promise<void> {
  if (isVaultConfigured()) {
    throw new Error("vault_already_configured");
  }

  const { config, key } = await createVaultConfigWithoutSecret(
    profileId,
    new Date().toISOString(),
  );
  localStorage.setItem(getVaultConfigKey(), JSON.stringify(config));
  vaultKey = key;
  emitVaultStatus();
}

export async function unlockVault(passphrase: string): Promise<void> {
  const config = readVaultConfig();

  if (!config) {
    throw new Error("vault_not_configured");
  }

  assertUsablePassphrase(passphrase);

  try {
    vaultKey = await unlockVaultKeyFromConfig(config, passphrase);
    emitVaultStatus();
  } catch {
    vaultKey = null;
    emitVaultStatus();
    throw new Error("vault_unlock_failed");
  }
}

export async function unlockVaultWithoutSecret(
  profileId = "personal",
): Promise<void> {
  const config = readVaultConfig();

  if (!config) {
    throw new Error("vault_not_configured");
  }

  try {
    vaultKey = await unlockVaultKeyFromPasswordlessConfig(config, profileId);
    emitVaultStatus();
  } catch {
    vaultKey = null;
    emitVaultStatus();
    throw new Error("vault_unlock_failed");
  }
}

export async function rotateVaultSecret(input: {
  currentSecret: string;
  nextSecret: string;
  nextProfileId?: string;
  nextLabel?: string;
}): Promise<void> {
  const config = readVaultConfig();

  if (!config) {
    throw new Error("vault_not_configured");
  }

  if (!vaultKey) {
    throw new Error("vault_locked");
  }

  assertUsablePassphrase(input.currentSecret);
  assertUsablePassphrase(input.nextSecret);

  let currentCredential: VaultCredential;
  let currentKey: CryptoKey;

  try {
    const result = await findCredentialForSecret(config, input.currentSecret);
    currentCredential = result.credential;
    currentKey = result.key;
  } catch {
    throw new Error("vault_unlock_failed");
  }

  const nextCredential = await createVaultCredential({
    dataKey: currentKey,
    label: input.nextLabel ?? "Основной",
    profileId: input.nextProfileId ?? "personal",
    secret: input.nextSecret,
    createdAt: new Date().toISOString(),
  });
  const nextConfig: VaultConfig = {
    ...config,
    created_at: config.created_at,
    credentials: [
      ...config.credentials.filter((credential) => credential.id !== currentCredential.id),
      nextCredential,
    ],
  };

  localStorage.setItem(getVaultConfigKey(), JSON.stringify(nextConfig));
  vaultKey = currentKey;
  emitVaultStatus();
}

export async function addVaultCredential(input: {
  authorizingSecret?: string;
  profileId: string;
  label: string;
  secret: string;
}): Promise<void> {
  const config = readVaultConfig();
  if (!config) throw new Error("vault_not_configured");
  if (!vaultKey) throw new Error("vault_locked");

  assertUsablePassphrase(input.secret);

  let currentKey = vaultKey;

  if (input.authorizingSecret) {
    assertUsablePassphrase(input.authorizingSecret);

    try {
      currentKey = (await findCredentialForSecret(config, input.authorizingSecret))
        .key;
    } catch {
      throw new Error("vault_unlock_failed");
    }
  }

  const credential = await createVaultCredential({
    dataKey: currentKey,
    label: input.label,
    profileId: input.profileId,
    secret: input.secret,
    createdAt: new Date().toISOString(),
  });

  localStorage.setItem(
    getVaultConfigKey(),
    JSON.stringify({
      ...config,
      credentials: [...config.credentials, credential],
    } satisfies VaultConfig),
  );
  vaultKey = currentKey;
  emitVaultStatus();
}

export async function deleteVaultCredential(input: {
  authorizingSecret?: string;
  credentialId: string;
}): Promise<void> {
  const config = readVaultConfig();
  if (!config) throw new Error("vault_not_configured");
  if (!vaultKey) throw new Error("vault_locked");

  const credentialToDelete = config.credentials.find(
    (credential) => credential.id === input.credentialId,
  );
  if (!credentialToDelete) return;

  let currentKey = vaultKey;

  if (input.authorizingSecret) {
    assertUsablePassphrase(input.authorizingSecret);

    try {
      currentKey = (await findCredentialForSecret(config, input.authorizingSecret))
        .key;
    } catch {
      throw new Error("vault_unlock_failed");
    }
  }

  let credentials = config.credentials.filter(
    (credential) => credential.id !== input.credentialId,
  );

  if (credentials.length === config.credentials.length) return;

  const isDeletingLastPassphrase =
    credentialToDelete.kind === "passphrase" &&
    config.credentials.filter((credential) => credential.kind === "passphrase")
      .length === 1;
  const hasPasswordlessAccess = credentials.some(
    (credential) =>
      credential.kind === "passwordless" &&
      credential.profile_id === credentialToDelete.profile_id,
  );

  if (isDeletingLastPassphrase && !hasPasswordlessAccess) {
    credentials = [
      ...credentials,
      await createVaultPasswordlessCredential({
        dataKey: currentKey,
        profileId: credentialToDelete.profile_id,
        createdAt: new Date().toISOString(),
      }),
    ];
  }

  if (credentials.length === 0) {
    throw new Error("vault_last_credential");
  }

  localStorage.setItem(
    getVaultConfigKey(),
    JSON.stringify({
      ...config,
      credentials,
    } satisfies VaultConfig),
  );
  vaultKey = currentKey;
  emitVaultStatus();
}

export function lockVault(): void {
  vaultKey = null;
  emitVaultStatus();
}

export async function encryptVaultJson(
  value: unknown,
  associatedData: string,
): Promise<VaultEncryptedPayload> {
  return encryptVaultJsonWithKey(requireVaultKey(), value, associatedData);
}

export async function decryptVaultJson<T>(
  payload: VaultEncryptedPayload,
  associatedData: string,
): Promise<T> {
  return decryptVaultJsonWithKey<T>(requireVaultKey(), payload, associatedData);
}

export async function createVaultConfigForPassphrase(
  passphrase: string,
  createdAt = new Date().toISOString(),
  dataKey?: CryptoKey,
  profileId = "personal",
  label = "Основной",
): Promise<{ config: VaultConfig; key: CryptoKey }> {
  const key = dataKey ?? await generateDataKey();
  const credential = await createVaultCredential({
    dataKey: key,
    label,
    profileId,
    secret: passphrase,
    createdAt,
  });

  return {
    config: {
      version: VAULT_CONFIG_VERSION,
      created_at: createdAt,
      credentials: [credential],
    },
    key,
  };
}

export async function createVaultConfigWithoutSecret(
  profileId = "personal",
  createdAt = new Date().toISOString(),
  dataKey?: CryptoKey,
): Promise<{ config: VaultConfig; key: CryptoKey }> {
  const key = dataKey ?? await generateDataKey();
  const credential = await createVaultPasswordlessCredential({
    dataKey: key,
    profileId,
    createdAt,
  });

  return {
    config: {
      version: VAULT_CONFIG_VERSION,
      created_at: createdAt,
      credentials: [credential],
    },
    key,
  };
}

export async function unlockVaultKeyFromConfig(
  config: VaultConfig | LegacyVaultConfig,
  passphrase: string,
): Promise<CryptoKey> {
  const normalizedConfig = normalizeStoredVaultConfig(config);
  assertValidVaultConfig(normalizedConfig);
  return findCredentialForSecret(normalizedConfig, passphrase).then(
    (result) => result.key,
  );
}

export async function unlockVaultKeyFromPasswordlessConfig(
  config: VaultConfig | LegacyVaultConfig,
  profileId = "personal",
): Promise<CryptoKey> {
  const normalizedConfig = normalizeStoredVaultConfig(config);
  assertValidVaultConfig(normalizedConfig);
  return findPasswordlessCredential(normalizedConfig, profileId).then(
    (result) => result.key,
  );
}

async function findCredentialForSecret(
  config: VaultConfig,
  passphrase: string,
): Promise<{ credential: VaultCredential; key: CryptoKey }> {
  assertValidVaultConfig(config);

  for (const credential of config.credentials) {
    try {
      const key = await unlockVaultKeyFromCredential(credential, passphrase);
      return { credential, key };
    } catch {
      // Try the next credential.
    }
  }

  throw new Error("vault_unlock_failed");
}

async function findPasswordlessCredential(
  config: VaultConfig,
  profileId: string,
): Promise<{ credential: VaultCredential; key: CryptoKey }> {
  assertValidVaultConfig(config);

  for (const credential of config.credentials) {
    if (
      credential.kind !== "passwordless" ||
      credential.profile_id !== normalizeProfileId(profileId)
    ) {
      continue;
    }

    try {
      const key = await unlockVaultKeyFromCredential(
        credential,
        getPasswordlessSecret(profileId),
      );
      return { credential, key };
    } catch {
      // Try the next passwordless credential for the same profile.
    }
  }

  throw new Error("vault_unlock_failed");
}

async function unlockVaultKeyFromCredential(
  credential: VaultCredential,
  passphrase: string,
): Promise<CryptoKey> {
  const keyEncryptionKey = await deriveVaultKey(passphrase, credential.kdf);
  const rawDataKey = await decryptVaultJsonWithKey<string>(
    keyEncryptionKey,
    credential.encrypted_data_key,
    VAULT_DATA_KEY_AAD,
  );
  const key = await importRawKey(decodeBase64Url(rawDataKey));
  const verifier = await decryptVaultJsonWithKey<string>(
    key,
    credential.verifier,
    VAULT_VERIFIER_AAD,
  );

  if (verifier !== VAULT_VERIFIER_TEXT) {
    throw new Error("vault_unlock_failed");
  }

  return key;
}

async function createVaultCredential({
  createdAt,
  dataKey,
  kind = "passphrase",
  label,
  profileId,
  secret,
}: {
  createdAt: string;
  dataKey: CryptoKey;
  kind?: VaultCredentialKind;
  label: string;
  profileId: string;
  secret: string;
}): Promise<VaultCredential> {
  const salt = getCrypto().getRandomValues(new Uint8Array(VAULT_SALT_BYTES));
  const kdf: VaultKdfConfig = {
    name: "PBKDF2-SHA-256",
    iterations: VAULT_KDF_ITERATIONS,
    salt: encodeBase64Url(salt),
  };
  const keyEncryptionKey = await deriveVaultKey(secret, kdf);
  const encryptedDataKey = await encryptVaultJsonWithKey(
    keyEncryptionKey,
    encodeBase64Url(await exportRawKey(dataKey)),
    VAULT_DATA_KEY_AAD,
  );
  const verifier = await encryptVaultJsonWithKey(
    dataKey,
    VAULT_VERIFIER_TEXT,
    VAULT_VERIFIER_AAD,
  );

  return {
    id: createCredentialId(),
    profile_id: normalizeProfileId(profileId),
    label: normalizeCredentialLabel(label),
    created_at: createdAt,
    kind,
    kdf,
    encrypted_data_key: encryptedDataKey,
    verifier,
  };
}

async function createVaultPasswordlessCredential({
  createdAt,
  dataKey,
  profileId,
}: {
  createdAt: string;
  dataKey: CryptoKey;
  profileId: string;
}): Promise<VaultCredential> {
  const normalizedProfileId = normalizeProfileId(profileId);

  return createVaultCredential({
    createdAt,
    dataKey,
    kind: "passwordless",
    label: VAULT_PASSWORDLESS_LABEL,
    profileId: normalizedProfileId,
    secret: getPasswordlessSecret(normalizedProfileId),
  });
}

function getPasswordlessSecret(profileId: string): string {
  return `${VAULT_PASSWORDLESS_SECRET}:${normalizeProfileId(profileId)}`;
}

function normalizeProfileId(profileId: string): string {
  return profileId.trim().slice(0, 64) || "personal";
}

function normalizeCredentialLabel(label: string): string {
  return label.trim().slice(0, 64) || "Основной";
}

function createCredentialId(): string {
  if (getCrypto().randomUUID) return getCrypto().randomUUID();
  return `credential-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function encryptVaultJsonWithKey(
  key: CryptoKey,
  value: unknown,
  associatedData: string,
): Promise<VaultEncryptedPayload> {
  const iv = getCrypto().getRandomValues(new Uint8Array(VAULT_IV_BYTES));
  const plaintext = new TextEncoder().encode(JSON.stringify(value));
  const ciphertext = await getCrypto().subtle.encrypt(
    {
      name: "AES-GCM",
      iv: toArrayBuffer(iv),
      additionalData: toArrayBuffer(encodeAssociatedData(associatedData)),
    },
    key,
    plaintext,
  );

  return {
    __athena_vault: true,
    version: VAULT_PAYLOAD_VERSION,
    algorithm: "AES-GCM",
    iv: encodeBase64Url(iv),
    ciphertext: encodeBase64Url(new Uint8Array(ciphertext)),
  };
}

export async function decryptVaultJsonWithKey<T>(
  key: CryptoKey,
  payload: VaultEncryptedPayload,
  associatedData: string,
): Promise<T> {
  assertValidVaultPayload(payload);

  const plaintext = await getCrypto().subtle.decrypt(
    {
      name: "AES-GCM",
      iv: toArrayBuffer(decodeBase64Url(payload.iv)),
      additionalData: toArrayBuffer(encodeAssociatedData(associatedData)),
    },
    key,
    toArrayBuffer(decodeBase64Url(payload.ciphertext)),
  );

  return JSON.parse(new TextDecoder().decode(plaintext)) as T;
}

export function isVaultEncryptedPayload(
  value: unknown,
): value is VaultEncryptedPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "__athena_vault" in value &&
    (value as { __athena_vault?: unknown }).__athena_vault === true
  );
}

function readVaultConfig(): VaultConfig | null {
  const configKey = getVaultConfigKey();
  const raw = localStorage.getItem(configKey);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as VaultConfig | LegacyVaultConfig;
    const config = normalizeStoredVaultConfig(parsed);
    assertValidVaultConfig(config);

    if (parsed.version !== VAULT_CONFIG_VERSION) {
      localStorage.setItem(configKey, JSON.stringify(config));
    }

    return config;
  } catch {
    return null;
  }
}

function getVaultConfigKey() {
  return getProfileScopedStorageKey(VAULT_CONFIG_KEY);
}

function normalizeStoredVaultConfig(
  config: VaultConfig | LegacyVaultConfig,
): VaultConfig {
  if (config.version === LEGACY_VAULT_CONFIG_VERSION) {
    return {
      version: VAULT_CONFIG_VERSION,
      created_at: config.created_at,
      credentials: [
        {
          id: "legacy-primary",
          profile_id: "personal",
          label: "Основной",
          created_at: config.created_at,
          kind: "passphrase",
          kdf: config.kdf,
          encrypted_data_key: config.encrypted_data_key,
          verifier: config.verifier,
        },
      ],
    };
  }

  return {
    ...config,
    credentials: config.credentials.map((credential) => ({
      ...credential,
      kind: credential.kind ?? "passphrase",
    })),
  };
}

function requireVaultKey(): CryptoKey {
  if (!vaultKey) {
    throw new Error("vault_locked");
  }

  return vaultKey;
}

async function deriveVaultKey(
  passphrase: string,
  kdf: VaultKdfConfig,
): Promise<CryptoKey> {
  if (kdf.name !== "PBKDF2-SHA-256") {
    throw new Error("vault_unsupported_kdf");
  }

  const passphraseKey = await getCrypto().subtle.importKey(
    "raw",
    toArrayBuffer(new TextEncoder().encode(passphrase)),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return getCrypto().subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: toArrayBuffer(decodeBase64Url(kdf.salt)),
      iterations: kdf.iterations,
    },
    passphraseKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"],
  );
}

async function generateDataKey(): Promise<CryptoKey> {
  return getCrypto().subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"],
  );
}

async function exportRawKey(key: CryptoKey): Promise<Uint8Array> {
  return new Uint8Array(await getCrypto().subtle.exportKey("raw", key));
}

async function importRawKey(rawKey: Uint8Array): Promise<CryptoKey> {
  return getCrypto().subtle.importKey(
    "raw",
    toArrayBuffer(rawKey),
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"],
  );
}

function assertUsablePassphrase(passphrase: string): void {
  if (passphrase.length < 8) {
    throw new Error("vault_passphrase_too_short");
  }
}

function assertValidVaultConfig(config: VaultConfig): void {
  if (config.version !== VAULT_CONFIG_VERSION) {
    throw new Error("vault_unsupported_config");
  }

  if (
    typeof config.created_at !== "string" ||
    !Array.isArray(config.credentials) ||
    config.credentials.length === 0
  ) {
    throw new Error("vault_invalid_config");
  }

  const credentialIds = new Set<string>();

  for (const credential of config.credentials) {
    assertValidVaultCredential(credential);

    if (credentialIds.has(credential.id)) {
      throw new Error("vault_duplicate_credential");
    }

    credentialIds.add(credential.id);
  }
}

function assertValidVaultCredential(credential: VaultCredential): void {
  if (
    typeof credential.id !== "string" ||
    !credential.id ||
    typeof credential.profile_id !== "string" ||
    !credential.profile_id ||
    typeof credential.label !== "string" ||
    typeof credential.created_at !== "string" ||
    (credential.kind !== "passphrase" && credential.kind !== "passwordless")
  ) {
    throw new Error("vault_invalid_credential");
  }

  if (
    !credential.kdf ||
    credential.kdf.name !== "PBKDF2-SHA-256" ||
    !Number.isInteger(credential.kdf.iterations) ||
    credential.kdf.iterations < 100_000 ||
    typeof credential.kdf.salt !== "string"
  ) {
    throw new Error("vault_invalid_kdf");
  }

  assertValidVaultPayload(credential.encrypted_data_key);
  assertValidVaultPayload(credential.verifier);
}

function assertValidVaultPayload(payload: VaultEncryptedPayload): void {
  if (
    !isVaultEncryptedPayload(payload) ||
    payload.version !== VAULT_PAYLOAD_VERSION ||
    payload.algorithm !== "AES-GCM" ||
    typeof payload.iv !== "string" ||
    typeof payload.ciphertext !== "string"
  ) {
    throw new Error("vault_invalid_payload");
  }
}

function emitVaultStatus(): void {
  const status = getVaultStatus();

  for (const listener of vaultListeners) {
    listener(status);
  }
}

function encodeAssociatedData(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function getCrypto(): Crypto {
  if (!globalThis.crypto?.subtle) {
    throw new Error("vault_crypto_unavailable");
  }

  return globalThis.crypto;
}
