/** Low-level Web Crypto primitives used by the local vault. */

const VAULT_PAYLOAD_VERSION = 1;

export const VAULT_KDF_ITERATIONS = 600_000;

export const VAULT_SALT_BYTES = 16;

const VAULT_IV_BYTES = 12;

export type VaultKdfConfig = {
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

export async function deriveVaultKey(
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

export async function generateDataKey(): Promise<CryptoKey> {
  return getCrypto().subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"],
  );
}

export async function exportRawKey(key: CryptoKey): Promise<Uint8Array> {
  return new Uint8Array(await getCrypto().subtle.exportKey("raw", key));
}

export async function importRawKey(rawKey: Uint8Array): Promise<CryptoKey> {
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

export function assertUsablePassphrase(passphrase: string): void {
  if (passphrase.length < 8) {
    throw new Error("vault_passphrase_too_short");
  }
}

export function assertValidVaultPayload(payload: VaultEncryptedPayload): void {
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

function encodeAssociatedData(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

export function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function decodeBase64Url(value: string): Uint8Array {
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

export function getCrypto(): Crypto {
  if (!globalThis.crypto?.subtle) {
    throw new Error("vault_crypto_unavailable");
  }

  return globalThis.crypto;
}
