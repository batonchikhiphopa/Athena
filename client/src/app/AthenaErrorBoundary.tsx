import { Component, type ErrorInfo, type ReactNode } from "react";
import { clearAthenaAppShell } from "../shared/lib/serviceWorker";

type AthenaErrorBoundaryProps = {
  children: ReactNode;
};

type AthenaErrorBoundaryState = {
  error: Error | null;
  isRecovering: boolean;
};

const RECOVERY_COPY = {
  de: {
    action: "Athena neu starten",
    body: "Deine Tagebuchdaten bleiben unberührt. Nur der App-Cache wird erneuert.",
    title: "Athena konnte nicht gestartet werden",
  },
  en: {
    action: "Restart Athena",
    body: "Your journal data will stay untouched. Only the app cache will be refreshed.",
    title: "Athena could not start",
  },
  ru: {
    action: "Перезапустить Athena",
    body: "Данные дневника останутся нетронутыми. Обновится только кэш приложения.",
    title: "Athena не смогла запуститься",
  },
  uk: {
    action: "Перезапустити Athena",
    body: "Дані щоденника залишаться недоторканими. Оновиться лише кеш застосунку.",
    title: "Athena не змогла запуститися",
  },
} as const;

export class AthenaErrorBoundary extends Component<
  AthenaErrorBoundaryProps,
  AthenaErrorBoundaryState
> {
  state: AthenaErrorBoundaryState = {
    error: null,
    isRecovering: false,
  };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[app:render]", error, errorInfo);
  }

  private recover = async () => {
    this.setState({ isRecovering: true });

    try {
      await clearAthenaAppShell();
    } catch (error) {
      console.warn("[app:recovery]", error);
    } finally {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    const language = document.documentElement.lang;
    const copy =
      RECOVERY_COPY[language as keyof typeof RECOVERY_COPY] ?? RECOVERY_COPY.en;

    return (
      <main
        className="flex min-h-full items-center justify-center bg-[#fafaf9] px-6 text-zinc-950"
        role="alert"
      >
        <div className="max-w-md text-center font-serif">
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">
            Athena
          </p>
          <h1 className="mt-5 text-2xl font-medium">{copy.title}</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">{copy.body}</p>
          <button
            className="mt-8 border-b border-zinc-500 px-1 py-1 text-sm text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950 disabled:cursor-wait disabled:opacity-50"
            disabled={this.state.isRecovering}
            onClick={() => void this.recover()}
            type="button"
          >
            {copy.action}
          </button>
        </div>
      </main>
    );
  }
}
