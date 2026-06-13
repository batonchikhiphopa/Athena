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
const VAULT_PROFILES_KEY = "athena_vault_profiles";

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
  if (typeof localStorage === "undefined") {
    return DEFAULT_VAULT_PROFILES;
  }

  try {
    const raw = localStorage.getItem(VAULT_PROFILES_KEY);
    if (!raw) return DEFAULT_VAULT_PROFILES;

    return normalizeVaultProfiles(JSON.parse(raw));
  } catch {
    return DEFAULT_VAULT_PROFILES;
  }
}

export function setVaultProfiles(profiles: VaultProfile[]): VaultProfile[] {
  const normalized = normalizeVaultProfiles(profiles);

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(VAULT_PROFILES_KEY, JSON.stringify(normalized));
  }

  return normalized;
}

export function getActiveVaultProfileId(): string {
  if (typeof localStorage === "undefined") {
    return DEFAULT_VAULT_PROFILES[0].id;
  }

  const profiles = getVaultProfiles();
  const stored = normalizeText(localStorage.getItem(ACTIVE_VAULT_PROFILE_KEY), 64);

  return profiles.some((profile) => profile.id === stored)
    ? stored
    : profiles[0].id;
}

export function setActiveVaultProfileId(profileId: string): void {
  if (typeof localStorage === "undefined") return;

  const normalizedProfileId = normalizeText(profileId, 64);
  const profiles = getVaultProfiles();

  localStorage.setItem(
    ACTIVE_VAULT_PROFILE_KEY,
    profiles.some((profile) => profile.id === normalizedProfileId)
      ? normalizedProfileId
      : profiles[0].id,
  );
}

export function createVaultProfile(profile?: Partial<VaultProfile>): VaultProfile {
  const id = normalizeText(profile?.id, 64) || createProfileId();
  const name = normalizeProfileName(profile?.name);

  return {
    id,
    name,
    caption: normalizeText(profile?.caption, 64) || "локальное хранилище",
    mark:
      normalizeText(profile?.mark, 2).toUpperCase() ||
      createProfileMark(name),
  };
}

export function addVaultProfile(profile?: Partial<VaultProfile>): VaultProfile[] {
  const profiles = getVaultProfiles();
  const nextProfile = createVaultProfile(profile);
  return setVaultProfiles([...profiles, nextProfile]);
}

export function renameVaultProfile(
  profileId: string,
  name: string,
): VaultProfile[] {
  const normalizedProfileId = normalizeText(profileId, 64);
  const normalizedName = normalizeProfileName(name);
  const profiles = getVaultProfiles();

  return setVaultProfiles(
    profiles.map((profile) =>
      profile.id === normalizedProfileId
        ? {
            ...profile,
            name: normalizedName,
            mark: createProfileMark(normalizedName),
          }
        : profile,
    ),
  );
}

export function deleteVaultProfile(profileId: string): VaultProfile[] {
  const normalizedProfileId = normalizeText(profileId, 64);
  const profiles = getVaultProfiles();
  const wasActive = getActiveVaultProfileId() === normalizedProfileId;

  if (profiles.length <= 1) {
    return profiles;
  }

  const nextProfiles = profiles.filter(
    (profile) => profile.id !== normalizedProfileId,
  );

  if (nextProfiles.length === profiles.length || nextProfiles.length === 0) {
    return profiles;
  }

  const normalizedProfiles = setVaultProfiles(nextProfiles);

  if (wasActive) {
    setActiveVaultProfileId(normalizedProfiles[0].id);
  }

  return normalizedProfiles;
}

export function getProfileScopedStorageKey(key: string, profileId = getActiveVaultProfileId()) {
  return profileId === DEFAULT_VAULT_PROFILES[0].id
    ? key
    : `${key}:${profileId}`;
}

export function getProfileScopedDatabaseName(
  name: string,
  profileId = getActiveVaultProfileId(),
) {
  return profileId === DEFAULT_VAULT_PROFILES[0].id
    ? name
    : `${name}:${profileId}`;
}

export function isDefaultVaultProfile(profileId: string): boolean {
  return normalizeText(profileId, 64) === DEFAULT_VAULT_PROFILES[0].id;
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
    mark: normalizeText(profile.mark, 2).toUpperCase() || createProfileMark(name),
  };
}

function normalizeText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeProfileName(value: unknown): string {
  return normalizeText(value, 32) || "Новый профиль";
}

function createProfileMark(name: string): string {
  return name.trim()[0]?.toUpperCase() || "P";
}

function createProfileId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
