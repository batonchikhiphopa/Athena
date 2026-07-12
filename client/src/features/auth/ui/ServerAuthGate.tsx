import { useEffect, useState, type FormEvent } from "react";
import type {
  ServerAuthError,
  ServerAuthPhase,
} from "../useServerAuth";
import { useI18n } from "../../../i18n/useI18n";
import type { MessageKey } from "../../../i18n/messages";
import { LanguageSelect } from "../../../components/LanguageSelect";

type ServerAuthGateProps = {
  error: ServerAuthError | null;
  isBusy: boolean;
  phase: ServerAuthPhase;
  onLogin: (input: { username: string; password: string }) => Promise<void>;
  onRetry: () => Promise<void>;
  onSetup: (input: { username: string; password: string }) => Promise<void>;
};

export function ServerAuthGate({
  error,
  isBusy,
  phase,
  onLogin,
  onRetry,
  onSetup,
}: ServerAuthGateProps) {
  const { t } = useI18n();
  const [username, setUsername] = useState("owner");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const isSetup = phase === "setup";
  const isChecking = phase === "checking";
  const isError = phase === "error";

  useEffect(() => {
    setLocalError(null);
    setPassword("");
    setConfirmation("");
  }, [phase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);

    if (isError) {
      await onRetry();
      return;
    }

    if (username.trim().length === 0) {
      setLocalError(t("auth.error.usernameRequired"));
      return;
    }

    if (password.length < 8) {
      setLocalError(t("auth.error.passwordTooShort"));
      return;
    }

    if (isSetup && password !== confirmation) {
      setLocalError(t("auth.error.passwordMismatch"));
      return;
    }

    const input = {
      username: username.trim(),
      password,
    };

    if (isSetup) {
      await onSetup(input);
    } else {
      await onLogin(input);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-[#fafaf9]/95 px-4 py-4 text-zinc-950">
      <LanguageSelect className="absolute right-4 top-4" />

      <form
        className="max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto px-6 font-serif text-zinc-800"
        onSubmit={handleSubmit}
      >
        <p className="mb-3 text-center text-sm italic text-zinc-500">
          Athena
        </p>

        <div className="mb-4 border-y border-zinc-300 py-3 text-center">
          <div className="text-xs tracking-[0.28em] text-zinc-500">A</div>
          <div className="mt-1 text-sm text-zinc-950">
            {isSetup ? t("auth.mode.setup") : t("auth.mode.login")}
          </div>
        </div>

        <div className="mx-auto grid max-w-sm gap-3">
          <p className="text-center text-xs text-zinc-400">
            {isChecking
              ? t("auth.status.checking")
              : isError
                ? t("auth.status.error")
                : isSetup
                  ? t("auth.status.setup")
                  : t("auth.status.locked")}
          </p>

          {!isChecking && !isError ? (
            <div className="grid gap-3">
              <label className="grid gap-1.5">
                <span className="sr-only">{t("auth.username")}</span>
                <input
                  autoComplete="username"
                  autoFocus
                  className="
                    h-9 border-0 border-b border-zinc-300 bg-transparent px-1
                    text-center text-sm outline-none transition
                    placeholder:text-zinc-300 focus:border-zinc-700
                  "
                  disabled={isBusy}
                  maxLength={64}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder={t("auth.usernamePlaceholder")}
                  value={username}
                />
              </label>

              <label className="grid gap-1.5">
                <span className="sr-only">{t("auth.password")}</span>
                <input
                  autoComplete={isSetup ? "new-password" : "current-password"}
                  className="
                    h-9 border-0 border-b border-zinc-300 bg-transparent px-1
                    text-center text-sm outline-none transition
                    placeholder:text-zinc-300 focus:border-zinc-700
                  "
                  disabled={isBusy}
                  minLength={8}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t("auth.passwordPlaceholder")}
                  type="password"
                  value={password}
                />
              </label>

              {isSetup ? (
                <label className="grid gap-1.5">
                  <span className="sr-only">{t("auth.repeatPassword")}</span>
                  <input
                    autoComplete="new-password"
                    className="
                      h-9 border-0 border-b border-zinc-300 bg-transparent px-1
                      text-center text-sm outline-none transition
                      placeholder:text-zinc-300 focus:border-zinc-700
                    "
                    disabled={isBusy}
                    minLength={8}
                    onChange={(event) => setConfirmation(event.target.value)}
                    placeholder={t("auth.repeatPlaceholder")}
                    type="password"
                    value={confirmation}
                  />
                </label>
              ) : null}
            </div>
          ) : null}

          <p className="min-h-4 text-center text-xs text-red-700">
            {localError || formatAuthError(error, t) || ""}
          </p>

          <button
            className="
              mx-auto border-b border-zinc-400 px-1 py-1 text-xs
              text-zinc-500 transition hover:border-zinc-950
              hover:text-zinc-950 disabled:cursor-wait disabled:opacity-50
            "
            disabled={isBusy || isChecking}
            type="submit"
          >
            {isBusy || isChecking
              ? t("auth.action.wait")
              : isError
                ? t("auth.action.retry")
                : isSetup
                  ? t("auth.action.createAccess")
                  : t("auth.action.open")}
          </button>
        </div>
      </form>
    </div>
  );
}

function formatAuthError(
  error: ServerAuthError | null,
  t: (key: MessageKey) => string,
) {
  if (!error) return null;

  const keys = {
    invalidCredentials: "auth.error.invalidCredentials",
    serverUnavailable: "auth.error.serverUnavailable",
    setupFailed: "auth.error.setupFailed",
  } satisfies Record<ServerAuthError, MessageKey>;

  return t(keys[error]);
}
