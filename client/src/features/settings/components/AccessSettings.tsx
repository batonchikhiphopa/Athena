import { useState, type FormEvent } from "react";
import { useI18n } from "../../../i18n/useI18n";
import {
  getPrimaryVaultProfileId,
  getProfileCredentials,
  isAppProtectionEnabled,
  type AppLockAutoLockPreference,
} from "../../../lib/appLock";
import { composeVaultSecret } from "../../../lib/vaultProfiles";
import type { VaultCredentialSummary } from "../../vault/vaultApi";
import { FormActions, PasswordField, StatusMessage } from "./settingsUi";

type AccessSettingsProps = {
  appProtectionEnabled: boolean;
  autoLockPreference: AppLockAutoLockPreference;
  credentials: VaultCredentialSummary[];
  onAddVaultCredential: (input: {
    authorizingSecret?: string;
    profileId: string;
    label: string;
    secret: string;
  }) => Promise<void>;
  onDeleteVaultCredential: (input: {
    authorizingSecret?: string;
    credentialId: string;
  }) => Promise<void>;
  onChangeAutoLockPreference: (value: AppLockAutoLockPreference) => void;
  onLockAthena: () => void;
  onRotateVaultSecret: (input: {
    currentSecret: string;
    nextSecret: string;
    nextProfileId?: string;
    nextLabel?: string;
  }) => Promise<void>;
};

export function AccessSettings({
  appProtectionEnabled,
  autoLockPreference,
  credentials,
  onAddVaultCredential,
  onChangeAutoLockPreference,
  onDeleteVaultCredential,
  onLockAthena,
  onRotateVaultSecret,
}: AccessSettingsProps) {
  const { t } = useI18n();
  const [mode, setMode] = useState<"idle" | "enable" | "disable" | "change">(
    "idle",
  );
  const [authorizingPassphrase, setAuthorizingPassphrase] = useState("");
  const [nextPassphrase, setNextPassphrase] = useState("");
  const [nextPassphraseConfirmation, setNextPassphraseConfirmation] =
    useState("");
  const [status, setStatus] = useState<{
    tone: "idle" | "ok" | "error";
    text: string;
  }>({ tone: "idle", text: "" });
  const [isSaving, setIsSaving] = useState(false);

  const vaultProfileId = getPrimaryVaultProfileId(credentials);
  const profileCredentials = getProfileCredentials(credentials, vaultProfileId);
  const passwordCredentials = profileCredentials.filter(
    (credential) => credential.kind === "passphrase",
  );
  const passwordlessCredentials = profileCredentials.filter(
    (credential) => credential.kind === "passwordless",
  );
  const protectionEnabled =
    appProtectionEnabled && isAppProtectionEnabled(credentials);

  function getAuthorizingSecret() {
    return composeVaultSecret({
      profileId: vaultProfileId,
      passphrase: authorizingPassphrase,
    });
  }

  function resetForm() {
    setAuthorizingPassphrase("");
    setNextPassphrase("");
    setNextPassphraseConfirmation("");
  }

  function validateCurrentPassphrase() {
    if (authorizingPassphrase.length < 8) {
      setStatus({
        tone: "error",
        text: t("settings.access.status.passwordRequired"),
      });
      return false;
    }

    return true;
  }

  function validateNextPassphrase() {
    if (nextPassphrase.length < 8) {
      setStatus({
        tone: "error",
        text: t("settings.access.status.passwordTooShort"),
      });
      return false;
    }

    if (nextPassphrase !== nextPassphraseConfirmation) {
      setStatus({
        tone: "error",
        text: t("settings.access.status.passwordMismatch"),
      });
      return false;
    }

    return true;
  }

  async function handleEnableProtection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ tone: "idle", text: "" });

    if (!validateNextPassphrase()) {
      return;
    }

    setIsSaving(true);

    try {
      await onAddVaultCredential({
        profileId: vaultProfileId,
        label: t("settings.access.passwordLabelDefault"),
        secret: composeVaultSecret({
          profileId: vaultProfileId,
          passphrase: nextPassphrase,
        }),
      });

      for (const credential of profileCredentials) {
        await onDeleteVaultCredential({ credentialId: credential.id });
      }

      resetForm();
      setMode("idle");
      setStatus({ tone: "ok", text: t("settings.access.status.enableOk") });
    } catch {
      setStatus({
        tone: "error",
        text: t("settings.access.status.enableError"),
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDisableProtection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ tone: "idle", text: "" });

    if (!validateCurrentPassphrase()) {
      return;
    }

    setIsSaving(true);

    try {
      for (const credential of passwordCredentials) {
        await onDeleteVaultCredential({
          authorizingSecret: getAuthorizingSecret(),
          credentialId: credential.id,
        });
      }

      resetForm();
      setMode("idle");
      setStatus({ tone: "ok", text: t("settings.access.status.disableOk") });
    } catch {
      setStatus({
        tone: "error",
        text: t("settings.access.status.disableError"),
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ tone: "idle", text: "" });

    if (!validateCurrentPassphrase() || !validateNextPassphrase()) {
      return;
    }

    setIsSaving(true);

    try {
      await onRotateVaultSecret({
        currentSecret: getAuthorizingSecret(),
        nextSecret: composeVaultSecret({
          profileId: vaultProfileId,
          passphrase: nextPassphrase,
        }),
        nextProfileId: vaultProfileId,
        nextLabel: t("settings.access.passwordLabelDefault"),
      });

      resetForm();
      setMode("idle");
      setStatus({ tone: "ok", text: t("settings.access.status.rotateOk") });
    } catch {
      setStatus({
        tone: "error",
        text: t("settings.access.status.rotateError"),
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <label className="flex cursor-pointer items-start justify-between gap-5">
        <div>
          <div className="text-sm font-medium text-zinc-950">
            {t("settings.access.protectionTitle")}
          </div>
          <div className="mt-1 max-w-lg text-sm text-zinc-400">
            {t("settings.access.protectionDescription")}
          </div>
        </div>

        <input
          checked={protectionEnabled}
          className="mt-0.5 h-5 w-5 accent-zinc-950"
          disabled={isSaving}
          onChange={(event) => {
            setStatus({ tone: "idle", text: "" });
            resetForm();
            setMode(event.target.checked ? "enable" : "disable");
          }}
          type="checkbox"
        />
      </label>

      <div className="mt-4 text-xs text-zinc-400">
        {protectionEnabled
          ? t("settings.access.enabled")
          : t("settings.access.notEnabled")}
        {passwordlessCredentials.length > 0 && !protectionEnabled
          ? ` · ${t("settings.access.opensImmediately")}`
          : ""}
      </div>

      {protectionEnabled ? (
        <div className="mt-5 border-t border-zinc-100 pt-4">
          <label className="block">
            <span className="text-xs uppercase text-zinc-400">
              {t("settings.access.autoLock")}
            </span>
            <select
              className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none transition focus:border-zinc-400"
              onChange={(event) =>
                onChangeAutoLockPreference(
                  event.target.value as AppLockAutoLockPreference,
                )
              }
              value={autoLockPreference}
            >
              <option value="never">{t("settings.access.autoLockNever")}</option>
              <option value="on_hide">
                {t("settings.access.autoLockOnHide")}
              </option>
              <option value="1m">{t("settings.access.autoLock1m")}</option>
              <option value="5m">{t("settings.access.autoLock5m")}</option>
              <option value="15m">{t("settings.access.autoLock15m")}</option>
            </select>
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950"
              onClick={() => {
                setStatus({ tone: "idle", text: "" });
                resetForm();
                setMode("change");
              }}
              type="button"
            >
              {t("settings.access.changePassword")}
            </button>
            <button
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950"
              onClick={onLockAthena}
              type="button"
            >
              {t("settings.access.lockNow")}
            </button>
          </div>
        </div>
      ) : null}

      {mode === "enable" ? (
        <form
          className="mt-5 border-t border-zinc-100 pt-4"
          onSubmit={(event) => void handleEnableProtection(event)}
        >
          <div className="text-sm font-medium text-zinc-950">
            {t("settings.access.turnOn")}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <PasswordField
              autoComplete="new-password"
              label={t("settings.access.newPassword")}
              onChange={setNextPassphrase}
              value={nextPassphrase}
            />
            <PasswordField
              autoComplete="new-password"
              label={t("settings.access.repeat")}
              onChange={setNextPassphraseConfirmation}
              value={nextPassphraseConfirmation}
            />
          </div>
          <FormActions
            isSaving={isSaving}
            primaryLabel={t("settings.access.turnOn")}
            onCancel={() => {
              resetForm();
              setMode("idle");
            }}
          />
        </form>
      ) : null}

      {mode === "disable" ? (
        <form
          className="mt-5 border-t border-zinc-100 pt-4"
          onSubmit={(event) => void handleDisableProtection(event)}
        >
          <div className="text-sm font-medium text-zinc-950">
            {t("settings.access.turnOff")}
          </div>
          <div className="mt-3 max-w-sm">
            <PasswordField
              autoComplete="current-password"
              label={t("settings.access.currentPassword")}
              onChange={setAuthorizingPassphrase}
              value={authorizingPassphrase}
            />
          </div>
          <FormActions
            isSaving={isSaving}
            primaryLabel={t("settings.access.turnOff")}
            onCancel={() => {
              resetForm();
              setMode("idle");
            }}
          />
        </form>
      ) : null}

      {mode === "change" ? (
        <form
          className="mt-5 border-t border-zinc-100 pt-4"
          onSubmit={(event) => void handleChangePassword(event)}
        >
          <div className="text-sm font-medium text-zinc-950">
            {t("settings.access.changePassword")}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <PasswordField
              autoComplete="current-password"
              label={t("settings.access.currentPassword")}
              onChange={setAuthorizingPassphrase}
              value={authorizingPassphrase}
            />
            <PasswordField
              autoComplete="new-password"
              label={t("settings.access.newPassword")}
              onChange={setNextPassphrase}
              value={nextPassphrase}
            />
            <PasswordField
              autoComplete="new-password"
              label={t("settings.access.repeat")}
              onChange={setNextPassphraseConfirmation}
              value={nextPassphraseConfirmation}
            />
          </div>
          <FormActions
            isSaving={isSaving}
            primaryLabel={t("settings.access.changePassword")}
            onCancel={() => {
              resetForm();
              setMode("idle");
            }}
          />
        </form>
      ) : null}

      <StatusMessage status={status} />
    </div>
  );
}
