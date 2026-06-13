import { useEffect, useRef, useState, type FormEvent } from "react";
import type { LocalVaultError } from "../features/vault/useLocalVault";
import {
  LANGUAGE_LABELS,
  SUPPORTED_LANGUAGES,
  type Language,
} from "../i18n/languages";
import { useI18n } from "../i18n/useI18n";
import type { MessageKey } from "../i18n/messages";
import { composeVaultSecret, type VaultProfile } from "../lib/vaultProfiles";
import { GlobeIcon, UserCircleIcon } from "./icon";

type VaultGateProps = {
  activeProfileId: string;
  error: LocalVaultError | null;
  isBusy: boolean;
  profiles: VaultProfile[];
  onCreateProfile: () => void;
  onSelectProfile: (profileId: string) => void;
  onUnlock: (passphrase: string) => Promise<void>;
};


export function VaultGate({
  activeProfileId,
  error,
  isBusy,
  profiles,
  onCreateProfile,
  onSelectProfile,
  onUnlock,
}: VaultGateProps) {
  const { language, setLanguage, t } = useI18n();
  const [passphrase, setPassphrase] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const topPanelRef = useRef<HTMLDivElement | null>(null);

  const activeProfile =
    profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0];

  useEffect(() => {
    if (!isProfileMenuOpen && !isLanguageMenuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        topPanelRef.current?.contains(event.target)
      ) {
        return;
      }

      setIsProfileMenuOpen(false);
      setIsLanguageMenuOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      setIsProfileMenuOpen(false);
      setIsLanguageMenuOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLanguageMenuOpen, isProfileMenuOpen]);

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
          profileId: activeProfileId,
        }),
      );
    } catch {
      // The hook owns the visible error message.
    }
  }

  function handleLanguageSelect(nextLanguage: Language) {
    setLanguage(nextLanguage);
    setIsLanguageMenuOpen(false);
  }

  return (
    <div className="athena-vault-gate fixed inset-0 z-[70] overflow-hidden bg-[#f7f4ef] px-4 py-4 text-zinc-950 [--lever-bg:transparent] [--vault-cross-y:51vh]">
      <div
        className="absolute right-20 top-5 z-20 flex items-start gap-2 font-serif"
        ref={topPanelRef}
      >
        <div className="relative">
          <button
            aria-expanded={isProfileMenuOpen}
            aria-haspopup="menu"
            className="
              flex h-8 min-w-[8rem] max-w-[14rem] items-center justify-center gap-2 rounded-full
              px-2.5 text-xs text-zinc-400 outline-none opacity-70 transition
              hover:bg-zinc-200/40 hover:text-zinc-700 hover:opacity-100
              focus-visible:bg-zinc-200/50 focus-visible:text-zinc-700
              focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-zinc-300
              disabled:cursor-wait disabled:opacity-40
            "
            disabled={isBusy}
            onClick={() => {
              setIsLanguageMenuOpen(false);
              setIsProfileMenuOpen((current) => !current);
            }}
            type="button"
          >
            <UserCircleIcon className="h-4 w-4 shrink-0" />
            <span className="min-w-0 truncate">
              {activeProfile?.name ?? t("settings.access.localProfile")}
            </span>
          </button>

          {isProfileMenuOpen ? (
            <div
              className="
                absolute right-0 mt-2 w-[min(8rem,calc(100vw-2.5rem))]
                overflow-hidden rounded-xl border border-zinc-200/80
                bg-[#f7f4ef]/95 py-1 text-sm text-zinc-600 shadow-lg
                backdrop-blur-sm
                motion-safe:animate-[vault-menu-slide_140ms_cubic-bezier(0.16,1,0.3,1)]               
              "
              role="menu"
            >
              {profiles.map((profile) => (
                <button
                  aria-current={
                    profile.id === activeProfileId ? "true" : undefined
                  }
                  className={[
                    "flex w-full items-center justify-between px-3 py-2 text-left transition",
                    profile.id === activeProfileId
                      ? "bg-zinc-200/40 text-zinc-950"
                      : "hover:bg-zinc-200/30 hover:text-zinc-950",
                  ].join(" ")}
                  disabled={isBusy}
                  key={profile.id}
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onSelectProfile(profile.id);
                  }}
                  role="menuitem"
                  type="button"
                >
                  <span className="min-w-0 truncate">{profile.name}</span>
                  {profile.id === activeProfileId ? (
                    <span aria-hidden="true" className="pl-3 text-zinc-400">
                      •
                    </span>
                  ) : null}
                </button>
              ))}

              <button
                className="
                  mt-1 w-full border-t border-zinc-200/70 px-3 py-2 text-left
                  text-zinc-400 transition hover:bg-zinc-200/30
                  hover:text-zinc-950
                "
                disabled={isBusy}
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  onCreateProfile();
                }}
                role="menuitem"
                type="button"
              >
                {t("settings.access.profileCreate")}
              </button>
            </div>
          ) : null}
        </div>

        <div className="relative">
          <button
            aria-expanded={isLanguageMenuOpen}
            aria-haspopup="menu"
            aria-label={t("settings.interface.language")}
            className="
              flex h-8 min-w-[7.25rem] items-center justify-center gap-2 rounded-full px-2.5
              text-xs text-zinc-400 outline-none opacity-70 transition
              hover:bg-zinc-200/40 hover:text-zinc-700 hover:opacity-100
              focus-visible:bg-zinc-200/50 focus-visible:text-zinc-700
              focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-zinc-300
            "
            onClick={() => {
              setIsProfileMenuOpen(false);
              setIsLanguageMenuOpen((current) => !current);
            }}
            type="button"
          >
            <GlobeIcon className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">{LANGUAGE_LABELS[language]}</span>
          </button>

          {isLanguageMenuOpen ? (
            <div
              aria-label={t("settings.interface.language")}
              className="
                absolute right-0 mt-2 w-31 overflow-hidden rounded-xl
                border border-zinc-200/80 bg-[#f7f4ef]/95 py-1 text-sm
                text-zinc-600 shadow-lg backdrop-blur-sm
                motion-safe:animate-[vault-menu-slide_140ms_cubic-bezier(0.16,1,0.3,1)]
              "
              role="menu"
            >
              {SUPPORTED_LANGUAGES.map((option) => {
                const isActive = option === language;

                return (
                  <button
                    aria-current={isActive ? "true" : undefined}
                    className={[
                      "flex w-full items-center justify-between px-3 py-2 text-left transition",
                      isActive
                        ? "bg-zinc-200/40 text-zinc-950"
                        : "hover:bg-zinc-200/30 hover:text-zinc-950",
                    ].join(" ")}
                    key={option}
                    onClick={() => handleLanguageSelect(option)}
                    role="menuitem"
                    type="button"
                  >
                    <span className="min-w-0 truncate">
                      {LANGUAGE_LABELS[option]}
                    </span>
                    {isActive ? (
                      <span aria-hidden="true" className="pl-3 text-zinc-400">
                        •
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 flex justify-center"
      >
        <div className="relative h-[var(--vault-cross-y)] w-full max-w-[27.5rem]">
          <span className="absolute left-[24%] top-0 h-full border-l border-zinc-300/80" />
          <span className="absolute right-[24%] top-0 h-full border-l border-zinc-300/80" />
        </div>
      </div>

      <form
        className="absolute left-1/2 top-0 z-10 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 px-1 font-serif text-zinc-800"
        onSubmit={handleSubmit}
      >
        <div className="mx-auto grid w-full max-w-xl text-center">
          <div className="flex h-[var(--vault-cross-y)] items-end justify-center border-b border-zinc-300/80 pb-6 text-base text-zinc-950">
            {t("vault.lockedTitle")}
          </div>

          <p className="mt-8 text-center text-sm text-zinc-400">
            {t("vault.accessKey")}
          </p>

          <label className="mx-auto mt-9 grid w-full max-w-xl gap-1.5">
            <span className="sr-only">{t("vault.key")}</span>
            <input
              autoComplete="current-password"
              autoFocus
              className="
                h-12 border-0 border-b border-zinc-800 bg-transparent px-3
                text-center text-xl font-semibold text-zinc-700 outline-none
                transition placeholder:text-zinc-300
                focus:border-zinc-950 focus:bg-transparent
                active:bg-transparent:text-zinc-300 focus:border-zinc-950
              "
              disabled={isBusy}
              minLength={8}
              onChange={(event) => setPassphrase(event.target.value)}
              placeholder={t("vault.keyPlaceholder")}
              type="password"
              value={passphrase}
            />
          </label>

          <p className="mt-5 min-h-5 text-center text-xs text-red-700">
            {localError || formatVaultError(error, t) || ""}
          </p>

          <button
            className="
              mx-auto mt-12 px-1 py-1 text-xl font-semibold text-zinc-500 transition
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
