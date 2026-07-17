import { useCallback, useEffect, useRef, useState } from "react";
import { AthenaWorkspace } from "./app/AthenaWorkspace";
import { useAppAutoLockPreference } from "./app/useAppAutoLock";
import { ServerAuthGate } from "./features/auth/ui/ServerAuthGate";
import { useServerAuth } from "./features/auth/useServerAuth";
import { VaultGate } from "./features/vault/ui/VaultGate";
import { useLocalVault } from "./features/vault/useLocalVault";
import { useI18n } from "./i18n/useI18n";
import {
  isAppProtectionEnabled,
} from "./features/vault/appLock";
import { deleteAthenaProfileData } from "./app/localData";
import {
  addVaultProfile,
  deleteVaultProfile,
  getActiveVaultProfileId,
  getVaultProfiles,
  renameVaultProfile,
  setActiveVaultProfileId,
  type VaultProfile,
} from "./features/vault/vaultProfiles";

export default function App() {
  const { t } = useI18n();
  const serverAuth = useServerAuth();
  const vault = useLocalVault();
  const authPhase = serverAuth.phase;
  const vaultPhase = vault.phase;
  const vaultError = vault.error;
  const lockVault = vault.lock;
  const setupVault = vault.setup;
  const unlockVaultWithoutSecret = vault.unlockWithoutSecret;
  const vaultCredentials = vault.credentials;
  const isVaultBusy = vault.isBusy;
  const [vaultProfiles, setVaultProfilesState] = useState<VaultProfile[]>(() =>
    getVaultProfiles(),
  );
  const [vaultProfileId, setVaultProfileId] = useState(() =>
    getActiveVaultProfileId(),
  );
  const appProtectionEnabled = isAppProtectionEnabled(vaultCredentials);
  const { autoLockPreference, changeAutoLockPreference } =
    useAppAutoLockPreference();
  const vaultInitializationInFlightRef = useRef(false);

  const initializePasswordlessVault = useCallback(() => {
    if (vaultInitializationInFlightRef.current) return;

    let initialize: (() => Promise<void>) | null = null;

    if (vaultPhase === "unconfigured") {
      initialize = () => setupVault(vaultProfileId);
    } else if (vaultPhase === "locked") {
      initialize = () => unlockVaultWithoutSecret(vaultProfileId);
    }

    if (!initialize) return;

    vaultInitializationInFlightRef.current = true;
    void initialize()
      .catch(() => {
        // useLocalVault owns the visible error state.
      })
      .finally(() => {
        vaultInitializationInFlightRef.current = false;
      });
  }, [setupVault, unlockVaultWithoutSecret, vaultPhase, vaultProfileId]);

  function activateVaultProfile(profileId: string) {
    if (profileId === vaultProfileId) return;

    setActiveVaultProfileId(profileId);
    setVaultProfileId(profileId);
    window.location.reload();
  }

  function createAndActivateVaultProfile() {
    const nextProfiles = addVaultProfile({
      name: `Профиль ${vaultProfiles.length + 1}`,
      mark: String(vaultProfiles.length + 1),
    });
    const nextProfile = nextProfiles[nextProfiles.length - 1];

    setVaultProfilesState(nextProfiles);
    setActiveVaultProfileId(nextProfile.id);
    setVaultProfileId(nextProfile.id);
    window.location.reload();
  }

  function renameAndRefreshVaultProfile(profileId: string, name: string) {
    setVaultProfilesState(renameVaultProfile(profileId, name));
  }

  async function deleteAndRefreshVaultProfile(profileId: string) {
    const profile = vaultProfiles.find((item) => item.id === profileId);

    if (!profile || vaultProfiles.length <= 1) {
      return false;
    }

    const confirmed = window.confirm(
      t("settings.access.profileDeleteConfirm", { name: profile.name }),
    );

    if (!confirmed) return false;

    const wasActive = profileId === vaultProfileId;

    await deleteAthenaProfileData(profileId);

    const nextProfiles = deleteVaultProfile(profileId);
    const nextProfileId = getActiveVaultProfileId();

    setVaultProfilesState(nextProfiles);
    setVaultProfileId(nextProfileId);

    if (wasActive) {
      window.location.reload();
    }

    return true;
  }

  useEffect(() => {
    if (
      authPhase !== "authenticated" &&
      authPhase !== "checking" &&
      vaultPhase === "unlocked"
    ) {
      lockVault();
    }
  }, [authPhase, lockVault, vaultPhase]);

  useEffect(() => {
    if (
      authPhase !== "authenticated" ||
      vaultPhase === "unlocked" ||
      isVaultBusy ||
      appProtectionEnabled ||
      vaultError
    ) {
      return;
    }

    initializePasswordlessVault();
  }, [
    appProtectionEnabled,
    authPhase,
    initializePasswordlessVault,
    isVaultBusy,
    vaultError,
    vaultPhase,
  ]);

  if (serverAuth.isRequired && serverAuth.phase !== "authenticated") {
    return (
      <ServerAuthGate
        error={serverAuth.error}
        isBusy={serverAuth.isBusy}
        phase={serverAuth.phase}
        onLogin={serverAuth.login}
        onRetry={serverAuth.refresh}
        onSetup={serverAuth.setup}
      />
    );
  }

  if (vaultPhase !== "unlocked") {
    if (!appProtectionEnabled) {
      return (
        <main
          className="flex min-h-full items-center justify-center bg-[#fafaf9] px-6 text-zinc-950"
          role={vaultError ? "alert" : "status"}
        >
          <div className="text-center font-serif">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">
              Athena
            </p>
            {vaultError ? (
              <>
                <p className="mt-5 text-sm text-red-800">
                  {formatVaultStartupError(vaultError, t)}
                </p>
                <button
                  className="mt-6 border-b border-zinc-500 px-1 py-1 text-sm text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950 disabled:cursor-wait disabled:opacity-50"
                  disabled={isVaultBusy}
                  onClick={initializePasswordlessVault}
                  type="button"
                >
                  {t("auth.action.retry")}
                </button>
              </>
            ) : (
              <div className="mt-5 flex items-center justify-center gap-3 text-sm text-zinc-500">
                <span
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin rounded-full border border-zinc-300 border-t-zinc-700 motion-reduce:animate-none"
                />
                <span>{t("common.wait")}</span>
              </div>
            )}
          </div>
        </main>
      );
    }

    return (
      <VaultGate
        error={vault.error}
        isBusy={vault.isBusy}
        activeProfileId={vaultProfileId}
        profiles={vaultProfiles}
        onCreateProfile={createAndActivateVaultProfile}
        onSelectProfile={activateVaultProfile}
        onUnlock={vault.unlock}
      />
    );
  }

  return (
    <AthenaWorkspace
      appProtectionEnabled={appProtectionEnabled}
      autoLockPreference={autoLockPreference}
      activeVaultProfileId={vaultProfileId}
      vaultProfiles={vaultProfiles}
      vaultCredentials={vaultCredentials}
      onAddVaultCredential={vault.addCredential}
      onChangeAutoLockPreference={changeAutoLockPreference}
      onCreateVaultProfile={createAndActivateVaultProfile}
      onDeleteVaultProfile={deleteAndRefreshVaultProfile}
      onDeleteVaultCredential={vault.deleteCredential}
      onLockVault={vault.lock}
      onRenameVaultProfile={renameAndRefreshVaultProfile}
      onSelectVaultProfile={activateVaultProfile}
      onRotateVaultSecret={vault.rotateSecret}
    />
  );
}

function formatVaultStartupError(
  error: NonNullable<ReturnType<typeof useLocalVault>["error"]>,
  t: ReturnType<typeof useI18n>["t"],
) {
  const keys = {
    cryptoUnavailable: "vault.error.cryptoUnavailable",
    keyTooShort: "vault.error.keyTooShort",
    openFailed: "vault.error.openFailed",
    unlockFailed: "vault.error.unlockFailed",
  } as const;

  return t(keys[error]);
}
