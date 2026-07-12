import { useCallback, useEffect, useState } from "react";
import {
  addVaultCredential,
  deleteVaultCredential,
  getVaultStatus,
  getVaultCredentialSummaries,
  lockVault,
  rotateVaultSecret,
  setupVault,
  setupVaultWithoutSecret,
  subscribeVault,
  unlockVault,
  unlockVaultWithoutSecret,
  type VaultStatus,
  type VaultCredentialSummary,
} from "./vaultApi";
import { migrateLocalDataToVault } from "./vaultMigration";

export type LocalVaultPhase = VaultStatus;
export type LocalVaultError =
  | "cryptoUnavailable"
  | "keyTooShort"
  | "openFailed"
  | "unlockFailed";

function toUserMessage(error: unknown) {
  if (!(error instanceof Error)) return "openFailed";

  if (error.message === "vault_passphrase_too_short") {
    return "keyTooShort";
  }

  if (error.message === "vault_unlock_failed") {
    return "unlockFailed";
  }

  if (error.message === "vault_crypto_unavailable") {
    return "cryptoUnavailable";
  }

  return "openFailed";
}

export function useLocalVault() {
  const [phase, setPhase] = useState<LocalVaultPhase>(() => getVaultStatus());
  const [credentials, setCredentials] = useState<VaultCredentialSummary[]>(() =>
    getVaultCredentialSummaries(),
  );
  const [error, setError] = useState<LocalVaultError | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    return subscribeVault((status) => {
      setPhase(status);
      setCredentials(getVaultCredentialSummaries());
    });
  }, []);

  const setup = useCallback(async (profileId: string) => {
    setIsBusy(true);
    setError(null);

    try {
      await setupVaultWithoutSecret(profileId);
      await migrateLocalDataToVault();
      setPhase("unlocked");
    } catch (nextError) {
      setError(toUserMessage(nextError));
      throw nextError;
    } finally {
      setIsBusy(false);
    }
  }, []);

  const setupWithSecret = useCallback(
    async (passphrase: string, profileId?: string) => {
      setIsBusy(true);
      setError(null);

      try {
        await setupVault(passphrase, profileId);
        await migrateLocalDataToVault();
        setPhase("unlocked");
      } catch (nextError) {
        setError(toUserMessage(nextError));
        throw nextError;
      } finally {
        setIsBusy(false);
      }
    },
    [],
  );

  const unlock = useCallback(async (passphrase: string) => {
    setIsBusy(true);
    setError(null);

    try {
      await unlockVault(passphrase);
      await migrateLocalDataToVault();
      setPhase("unlocked");
    } catch (nextError) {
      setError(toUserMessage(nextError));
      throw nextError;
    } finally {
      setIsBusy(false);
    }
  }, []);

  const unlockWithoutSecret = useCallback(async (profileId: string) => {
    setIsBusy(true);
    setError(null);

    try {
      await unlockVaultWithoutSecret(profileId);
      await migrateLocalDataToVault();
      setPhase("unlocked");
    } catch (nextError) {
      setError(toUserMessage(nextError));
      throw nextError;
    } finally {
      setIsBusy(false);
    }
  }, []);

  const rotateSecret = useCallback(
    async (input: {
      currentSecret: string;
      nextSecret: string;
      nextProfileId?: string;
      nextLabel?: string;
    }) => {
      setIsBusy(true);
      setError(null);

      try {
        await rotateVaultSecret(input);
      } catch (nextError) {
        setError(toUserMessage(nextError));
        throw nextError;
      } finally {
        setIsBusy(false);
      }
    },
    [],
  );

  const addCredential = useCallback(
    async (input: {
      authorizingSecret?: string;
      profileId: string;
      label: string;
      secret: string;
    }) => {
      setIsBusy(true);
      setError(null);

      try {
        await addVaultCredential(input);
      } catch (nextError) {
        setError(toUserMessage(nextError));
        throw nextError;
      } finally {
        setIsBusy(false);
      }
    },
    [],
  );

  const deleteCredential = useCallback(
    async (input: { authorizingSecret?: string; credentialId: string }) => {
      setIsBusy(true);
      setError(null);

      try {
        await deleteVaultCredential(input);
      } catch (nextError) {
        setError(toUserMessage(nextError));
        throw nextError;
      } finally {
        setIsBusy(false);
      }
    },
    [],
  );

  const lock = useCallback(() => {
    setError(null);
    lockVault();
    setPhase(getVaultStatus());
  }, []);

  return {
    credentials,
    error,
    addCredential,
    deleteCredential,
    isBusy,
    lock,
    phase,
    rotateSecret,
    setup,
    setupWithSecret,
    unlock,
    unlockWithoutSecret,
  };
}
