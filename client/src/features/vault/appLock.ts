import type { VaultCredentialSummary } from "./vault";

export type AppLockAutoLockPreference =
  | "never"
  | "on_hide"
  | "1m"
  | "5m"
  | "15m";

export const APP_LOCK_AUTO_LOCK_CHANGED_EVENT =
  "athena:app-lock:auto-lock-changed";

const APP_LOCK_AUTO_LOCK_KEY = "athena:app-lock:auto-lock:v1";
const DEFAULT_AUTO_LOCK: AppLockAutoLockPreference = "never";

const AUTO_LOCK_DELAYS_MS: Record<AppLockAutoLockPreference, number | null> = {
  never: null,
  on_hide: null,
  "1m": 60_000,
  "5m": 5 * 60_000,
  "15m": 15 * 60_000,
};

export function getPrimaryVaultProfileId(
  credentials: VaultCredentialSummary[],
): string {
  return credentials[0]?.profile_id ?? "personal";
}

export function getProfileCredentials(
  credentials: VaultCredentialSummary[],
  profileId = getPrimaryVaultProfileId(credentials),
): VaultCredentialSummary[] {
  return credentials.filter((credential) => credential.profile_id === profileId);
}

export function isAppProtectionEnabled(
  credentials: VaultCredentialSummary[],
): boolean {
  const profileCredentials = getProfileCredentials(credentials);
  const hasPassword = profileCredentials.some(
    (credential) => credential.kind === "passphrase",
  );
  const hasPasswordlessAccess = profileCredentials.some(
    (credential) => credential.kind === "passwordless",
  );

  return hasPassword && !hasPasswordlessAccess;
}

export function getAppLockAutoLockPreference(): AppLockAutoLockPreference {
  if (typeof localStorage === "undefined") {
    return DEFAULT_AUTO_LOCK;
  }

  return normalizeAutoLockPreference(
    localStorage.getItem(APP_LOCK_AUTO_LOCK_KEY),
  );
}

export function setAppLockAutoLockPreference(
  value: AppLockAutoLockPreference,
): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(APP_LOCK_AUTO_LOCK_KEY, value);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(APP_LOCK_AUTO_LOCK_CHANGED_EVENT));
  }
}

export function getAppLockAutoLockDelayMs(
  value: AppLockAutoLockPreference,
): number | null {
  return AUTO_LOCK_DELAYS_MS[value] ?? null;
}

function normalizeAutoLockPreference(
  value: string | null,
): AppLockAutoLockPreference {
  if (
    value === "never" ||
    value === "on_hide" ||
    value === "1m" ||
    value === "5m" ||
    value === "15m"
  ) {
    return value;
  }

  return DEFAULT_AUTO_LOCK;
}
