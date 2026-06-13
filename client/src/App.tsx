import { useEffect, useState } from "react";
import { AthenaWorkspace } from "./app/AthenaWorkspace";
import { useAppAutoLockPreference } from "./app/useAppAutoLock";
import { ServerAuthGate } from "./components/ServerAuthGate";
import { useServerAuth } from "./features/auth/useServerAuth";
import { VaultGate } from "./components/VaultGate";
import { useLocalVault } from "./features/vault/useLocalVault";
import { useI18n } from "./i18n/useI18n";
import {
  isAppProtectionEnabled,
} from "./lib/appLock";
import { deleteAthenaProfileData } from "./lib/storage";
import {
  addVaultProfile,
  deleteVaultProfile,
  getActiveVaultProfileId,
  getVaultProfiles,
  renameVaultProfile,
  setActiveVaultProfileId,
  type VaultProfile,
} from "./lib/vaultProfiles";

export default function App() {
  const { t } = useI18n();
  const serverAuth = useServerAuth();
  const vault = useLocalVault();
  const authPhase = serverAuth.phase;
  const vaultPhase = vault.phase;
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
      isVaultBusy
    ) {
      return;
    }

    if (vaultPhase === "unconfigured") {
      void setupVault(vaultProfileId);
      return;
    }

    if (vaultPhase === "locked" && !appProtectionEnabled) {
      void unlockVaultWithoutSecret(vaultProfileId);
    }
  }, [
    appProtectionEnabled,
    authPhase,
    isVaultBusy,
    setupVault,
    unlockVaultWithoutSecret,
    vaultPhase,
    vaultProfileId,
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
      return null;
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
