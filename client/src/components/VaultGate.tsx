import { useState, type FormEvent } from "react";
import type {
  LocalVaultError,
} from "../features/vault/useLocalVault";
import { useI18n } from "../i18n/useI18n";
import type { MessageKey } from "../i18n/messages";
import { composeVaultSecret, getActiveVaultProfileId } from "../lib/vaultProfiles";
import { LanguageSelect } from "./LanguageSelect";

type VaultGateProps = {
  error: LocalVaultError | null;
  isBusy: boolean;
  onUnlock: (passphrase: string) => Promise<void>;
};

export function VaultGate({
  error,
  isBusy,
  onUnlock,
}: VaultGateProps) {
  const { t } = useI18n();
  const [passphrase, setPassphrase] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);

    if (passphrase.length < 8) {
      setLocalError(t("vault.error.keyTooShort"));
      return;
    }

    try {
      await onUnlock(
        composeVaultSecret({
          passphrase,
          profileId: getActiveVaultProfileId(),
        }),
      );
    } catch {
      // The hook owns the visible error message.
    }
  }

  return (
    <div className="athena-vault-gate fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-[#fafaf9]/92 px-4 py-4 text-zinc-950 [--lever-bg:#fafaf9]">
      <LanguageSelect className="absolute right-4 top-4 z-10" />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 flex justify-center"
      >
        <div className="relative h-[50vh] w-full max-w-sm">
          <span className="absolute left-[24%] top-0 h-full border-l border-zinc-300" />
          <span className="absolute right-[24%] top-0 h-full border-l border-zinc-300" />
        </div>
      </div>

      <form
        className="relative z-10 max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-visible px-6 font-serif text-zinc-800"
        onSubmit={handleSubmit}
      >
        <div className="mx-auto grid w-full max-w-sm gap-4 text-center">
          <div className="relative pt-32">
            <div className="border-b border-zinc-300 pb-4 text-sm text-zinc-950">
              {t("vault.lockedTitle")}
            </div>
          </div>

          <p className="text-center text-xs text-zinc-400">
            {t("vault.accessKey")}
          </p>

          <label className="grid gap-1.5">
            <span className="sr-only">{t("vault.key")}</span>
            <input
              autoComplete="current-password"
              autoFocus
              className="
                h-9 border-0 border-b border-zinc-300 bg-transparent px-1
                text-center text-sm outline-none transition
                placeholder:text-zinc-300 focus:border-zinc-700
              "
              disabled={isBusy}
              minLength={8}
              onChange={(event) => setPassphrase(event.target.value)}
              placeholder={t("vault.keyPlaceholder")}
              type="password"
              value={passphrase}
            />
          </label>

          <p className="min-h-4 text-center text-xs text-red-700">
            {localError || formatVaultError(error, t) || ""}
          </p>

          <button
            className="
              mx-auto px-1 py-1 text-xs text-zinc-500 transition
              hover:text-zinc-950 disabled:cursor-wait disabled:opacity-50
            "
            disabled={isBusy}
            type="submit"
          >
            {isBusy ? t("common.wait") : t("vault.action.openEntries")}
          </button>
        </div>
      </form>
    </div>
  );
}

function formatVaultError(
  error: LocalVaultError | null,
  t: (key: MessageKey) => string,
) {
  if (!error) return null;

  const keys = {
    cryptoUnavailable: "vault.error.cryptoUnavailable",
    keyTooShort: "vault.error.keyTooShort",
    openFailed: "vault.error.openFailed",
    unlockFailed: "vault.error.unlockFailed",
  } satisfies Record<LocalVaultError, MessageKey>;

  return t(keys[error]);
}
