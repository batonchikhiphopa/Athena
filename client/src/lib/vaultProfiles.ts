export type VaultProfile = {
  id: string;
  name: string;
  caption: string;
  mark: string;
};

export type VaultSecretInput = {
  passphrase: string;
  profileId: string;
};

const ACTIVE_VAULT_PROFILE_KEY = "athena_active_vault_profile";

export const DEFAULT_VAULT_PROFILES: VaultProfile[] = [
  {
    id: "personal",
    name: "Локальный профиль",
    caption: "Athena",
    mark: "A",
  },
];

export function composeVaultSecret({
  passphrase,
  profileId,
}: VaultSecretInput) {
  return [
    "athena-vault-secret-v3",
    profileId,
    passphrase,
  ].join(":");
}

export function getVaultProfiles(): VaultProfile[] {
  return DEFAULT_VAULT_PROFILES;
}

export function setVaultProfiles(profiles: VaultProfile[]): VaultProfile[] {
  return normalizeVaultProfiles(profiles).slice(0, 1);
}

export function getActiveVaultProfileId(): string {
  return DEFAULT_VAULT_PROFILES[0].id;
}

export function setActiveVaultProfileId(profileId: string): void {
  localStorage.setItem(ACTIVE_VAULT_PROFILE_KEY, profileId);
}

export function createVaultProfile(): VaultProfile {
  return {
    id: createProfileId(),
    name: "Новый профиль",
    caption: "локальное хранилище",
    mark: "N",
  };
}

function normalizeVaultProfiles(value: unknown): VaultProfile[] {
  if (!Array.isArray(value)) return DEFAULT_VAULT_PROFILES;

  const profiles = value
    .map((item) =>
      typeof item === "object" && item !== null
        ? normalizeVaultProfile(item as Partial<VaultProfile>)
        : null,
    )
    .filter((item): item is VaultProfile => Boolean(item));

  if (profiles.length === 0) return DEFAULT_VAULT_PROFILES;

  const seen = new Set<string>();
  return profiles.filter((profile) => {
    if (seen.has(profile.id)) return false;
    seen.add(profile.id);
    return true;
  });
}

function normalizeVaultProfile(profile: Partial<VaultProfile>): VaultProfile | null {
  const id = normalizeText(profile.id, 64);
  const name = normalizeText(profile.name, 32);

  if (!id || !name) return null;

  return {
    id,
    name,
    caption: normalizeText(profile.caption, 64) || "локальное хранилище",
    mark: normalizeText(profile.mark, 2).toUpperCase() || name[0].toUpperCase(),
  };
}

function normalizeText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function createProfileId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
