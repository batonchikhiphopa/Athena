import { useEffect } from "react";
import { AthenaWorkspace } from "./app/AthenaWorkspace";
import { useAppAutoLockPreference } from "./app/useAppAutoLock";
import { ServerAuthGate } from "./components/ServerAuthGate";
import { useServerAuth } from "./features/auth/useServerAuth";
import { VaultGate } from "./components/VaultGate";
import { useLocalVault } from "./features/vault/useLocalVault";
import {
  getPrimaryVaultProfileId,
  isAppProtectionEnabled,
} from "./lib/appLock";

export default function App() {
  const serverAuth = useServerAuth();
  const vault = useLocalVault();
  const authPhase = serverAuth.phase;
  const vaultPhase = vault.phase;
  const lockVault = vault.lock;
  const setupVault = vault.setup;
  const unlockVaultWithoutSecret = vault.unlockWithoutSecret;
  const vaultCredentials = vault.credentials;
  const isVaultBusy = vault.isBusy;
  const appProtectionEnabled = isAppProtectionEnabled(vaultCredentials);
  const vaultProfileId = getPrimaryVaultProfileId(vaultCredentials);
  const { autoLockPreference, changeAutoLockPreference } =
    useAppAutoLockPreference();

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
        onUnlock={vault.unlock}
      />
    );
  }

  return (
    <AthenaWorkspace
      appProtectionEnabled={appProtectionEnabled}
      autoLockPreference={autoLockPreference}
      vaultCredentials={vaultCredentials}
      onAddVaultCredential={vault.addCredential}
      onChangeAutoLockPreference={changeAutoLockPreference}
      onDeleteVaultCredential={vault.deleteCredential}
      onLockVault={vault.lock}
      onRotateVaultSecret={vault.rotateSecret}
    />
  );
}
