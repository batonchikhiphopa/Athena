import { useState, type FormEvent } from "react";
import { useI18n } from "../../../i18n/useI18n";
import {
  getProfileCredentials,
  isAppProtectionEnabled,
  type AppLockAutoLockPreference,
} from "../../vault/appLock";
import {
  composeVaultSecret,
  type VaultProfile,
} from "../../vault/vaultProfiles";
import type { VaultCredentialSummary } from "../../vault/vaultApi";
import {
  FormActions,
  PasswordField,
  SettingsButton,
  SettingsRow,
  SettingsSection,
  SettingsSelect,
  SettingsLineLever,
  StatusMessage,
} from "./settingsUi";

type AccessSettingsProps = {
  activeProfileId: string;
  appProtectionEnabled: boolean;
  autoLockPreference: AppLockAutoLockPreference;
  credentials: VaultCredentialSummary[];
  profiles: VaultProfile[];
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
  onCreateProfile: () => void;
  onDeleteProfile: (profileId: string) => Promise<boolean>;
  onLockAthena: () => void;
  onRenameProfile: (profileId: string, name: string) => void;
  onSelectProfile: (profileId: string) => void;
  onRotateVaultSecret: (input: {
    currentSecret: string;
    nextSecret: string;
    nextProfileId?: string;
    nextLabel?: string;
  }) => Promise<void>;
};

export function AccessSettings({
  activeProfileId,
  appProtectionEnabled,
  autoLockPreference,
  credentials,
  profiles,
  onAddVaultCredential,
  onChangeAutoLockPreference,
  onCreateProfile,
  onDeleteProfile,
  onDeleteVaultCredential,
  onLockAthena,
  onRenameProfile,
  onSelectProfile,
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
  const [profileStatus, setProfileStatus] = useState<{
    tone: "idle" | "ok" | "error";
    text: string;
  }>({ tone: "idle", text: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [isProfileBusy, setIsProfileBusy] = useState(false);
  const [renamingProfileId, setRenamingProfileId] = useState<string | null>(
    null,
  );
  const [profileNameDraft, setProfileNameDraft] = useState("");

  const vaultProfileId = activeProfileId;
  const activeProfile =
    profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0];
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

  function startRenamingProfile(profile: VaultProfile) {
    setProfileStatus({ tone: "idle", text: "" });
    setRenamingProfileId(profile.id);
    setProfileNameDraft(profile.name);
  }

  function cancelRenamingProfile() {
    setRenamingProfileId(null);
    setProfileNameDraft("");
  }

  function handleRenameProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileStatus({ tone: "idle", text: "" });

    const nextName = profileNameDraft.trim();

    if (!renamingProfileId || !nextName) {
      setProfileStatus({
        tone: "error",
        text: t("settings.access.status.profileNameRequired"),
      });
      return;
    }

    onRenameProfile(renamingProfileId, nextName);
    cancelRenamingProfile();
    setProfileStatus({
      tone: "ok",
      text: t("settings.access.status.profileRenameOk"),
    });
  }

  async function handleDeleteProfile(profile: VaultProfile) {
    setProfileStatus({ tone: "idle", text: "" });
    setIsProfileBusy(true);

    try {
      const didDelete = await onDeleteProfile(profile.id);

      if (didDelete) {
        setProfileStatus({
          tone: "ok",
          text: t("settings.access.status.profileDeleteOk"),
        });
      }
    } catch {
      setProfileStatus({
        tone: "error",
        text: t("settings.access.status.profileDeleteError"),
      });
    } finally {
      setIsProfileBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <SettingsSection label={t("settings.tab.access")}>
        <SettingsRow
          action={
            <SettingsButton disabled={isProfileBusy} onClick={onCreateProfile}>
              {t("settings.access.profileCreate")}
            </SettingsButton>
          }
          description={
            activeProfile?.caption ?? t("settings.access.profileDescription")
          }
          title={t("settings.access.profileTitle")}
        >
          <div className="space-y-2">
            {profiles.map((profile) => {
              const isActive = profile.id === activeProfileId;
              const isRenaming = profile.id === renamingProfileId;

              return (
                <div
                  className={[
                    "rounded-md border bg-white/70 px-3 py-3",
                    isActive ? "border-zinc-300" : "border-zinc-100",
                  ].join(" ")}
                  key={profile.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-600">
                        {profile.mark}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-sm text-zinc-800">
                          {profile.name}
                        </div>
                        <div className="mt-0.5 text-[11px] text-zinc-400">
                          {isActive
                            ? t("settings.access.profileActive")
                            : t("settings.access.profileInactive")}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                      {!isActive ? (
                        <SettingsButton
                          disabled={isProfileBusy}
                          onClick={() => onSelectProfile(profile.id)}
                          size="xs"
                        >
                          {t("settings.access.profileSelect")}
                        </SettingsButton>
                      ) : null}
                      <SettingsButton
                        disabled={isProfileBusy}
                        onClick={() => startRenamingProfile(profile)}
                        size="xs"
                        variant="quiet"
                      >
                        {t("settings.access.profileRename")}
                      </SettingsButton>
                      <SettingsButton
                        disabled={isProfileBusy || profiles.length <= 1}
                        onClick={() => void handleDeleteProfile(profile)}
                        size="xs"
                        variant="danger"
                      >
                        {t("settings.access.profileDelete")}
                      </SettingsButton>
                    </div>
                  </div>

                  {isRenaming ? (
                    <form
                      className="mt-3 flex flex-wrap gap-2 border-t border-zinc-100 pt-3"
                      onSubmit={handleRenameProfile}
                    >
                      <label className="min-w-48 flex-1">
                        <span className="sr-only">
                          {t("settings.access.profileName")}
                        </span>
                        <input
                          autoFocus
                          className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none transition focus:border-zinc-400"
                          maxLength={32}
                          onChange={(event) =>
                            setProfileNameDraft(event.target.value)
                          }
                          value={profileNameDraft}
                        />
                      </label>
                      <SettingsButton disabled={isProfileBusy} type="submit">
                        {t("settings.access.profileSave")}
                      </SettingsButton>
                      <SettingsButton
                        disabled={isProfileBusy}
                        onClick={cancelRenamingProfile}
                        variant="quiet"
                      >
                        {t("common.close")}
                      </SettingsButton>
                    </form>
                  ) : null}
                </div>
              );
            })}
          </div>
          <StatusMessage status={profileStatus} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection>
        <SettingsRow
          action={
            <SettingsLineLever
              checked={protectionEnabled}
              disabled={isSaving}
              label={t("settings.access.protectionTitle")}
              onChange={(checked) => {
                setStatus({ tone: "idle", text: "" });
                resetForm();
                setMode(checked ? "enable" : "disable");
              }}
            />
          }
          description={t("settings.access.protectionDescription")}
          title={t("settings.access.protectionTitle")}
        >
          <div className="text-xs text-zinc-400">
            {protectionEnabled
              ? t("settings.access.enabled")
              : t("settings.access.notEnabled")}
            {passwordlessCredentials.length > 0 && !protectionEnabled
              ? ` · ${t("settings.access.opensImmediately")}`
              : ""}
          </div>

          {protectionEnabled ? (
            <div className="mt-4 space-y-4 border-t border-zinc-100 pt-4">
              <label className="block max-w-sm">
                <span className="text-[10px] uppercase tracking-wide text-zinc-400">
                  {t("settings.access.autoLock")}
                </span>
                <SettingsSelect
                  className="mt-2 w-full px-3 py-2 text-sm"
                  onChange={(event) =>
                    onChangeAutoLockPreference(
                      event.target.value as AppLockAutoLockPreference,
                    )
                  }
                  value={autoLockPreference}
                >
                  <option value="never">
                    {t("settings.access.autoLockNever")}
                  </option>
                  <option value="on_hide">
                    {t("settings.access.autoLockOnHide")}
                  </option>
                  <option value="1m">{t("settings.access.autoLock1m")}</option>
                  <option value="5m">{t("settings.access.autoLock5m")}</option>
                  <option value="15m">
                    {t("settings.access.autoLock15m")}
                  </option>
                </SettingsSelect>
              </label>

              <div className="flex flex-wrap gap-2">
                <SettingsButton
                  onClick={() => {
                    setStatus({ tone: "idle", text: "" });
                    resetForm();
                    setMode("change");
                  }}
                >
                  {t("settings.access.changePassword")}
                </SettingsButton>
                <SettingsButton onClick={onLockAthena}>
                  {t("settings.access.lockNow")}
                </SettingsButton>
              </div>
            </div>
          ) : null}

          {mode === "enable" ? (
            <form
              className="mt-5 border-t border-zinc-100 pt-4"
              onSubmit={(event) => void handleEnableProtection(event)}
            >
              <div className="text-sm text-zinc-800">
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
              <div className="text-sm text-zinc-800">
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
              <div className="text-sm text-zinc-800">
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
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}
