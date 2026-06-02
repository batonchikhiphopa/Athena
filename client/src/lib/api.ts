import type {
  ExtractionConfig,
  ExtractionResult,
  ExtractionSettings,
  ExtractionStatus,
  InsightSnapshot,
  ServerEntry,
  Signal,
  SignalMetadata,
} from "../types";
import type { SelfReportDailyAggregate } from "../features/selfReports/selfReportTypes";

type EntriesResponse = {
  entries: ServerEntry[];
};

export type ServerAuthUser = {
  id: number;
  username: string;
  role: "owner";
};

export type ServerAuthStatus = {
  auth_required: boolean;
  authenticated: boolean;
  setup_required: boolean;
  user: ServerAuthUser | null;
  csrf_token?: string;
};

type ServerAuthResponse = {
  user: ServerAuthUser;
  csrf_token: string;
};

type ServerAuthPayload = {
  username: string;
  password: string;
};

type CreateEntryPayload = {
  client_entry_id: string;
  entry_date: string;
  tags?: string[];
  source_text_hash: string;
  signal: Signal;
  metadata?: SignalMetadata;
};

type UpdateEntryPayload = {
  entry_date: string;
  tags?: string[];
  source_text_hash: string;
  signal: Signal;
  metadata?: SignalMetadata;
};

type CreateEntryResponse = {
  entry: ServerEntry;
};

type EntryResponse = {
  entry: ServerEntry;
};

type CurrentInsightsResponse = {
  insights: InsightSnapshot[];
};

type InsightHistoryResponse = {
  insights: InsightSnapshot[];
};

type AppendSignalPayload = {
  source_text_hash: string;
  signal: Signal;
  metadata?: SignalMetadata;
};

export type SyncSelfReportDailyAggregatePayload = Omit<
  SelfReportDailyAggregate,
  "id"
>;

export const SERVER_AUTH_REQUIRED_EVENT = "athena:server-auth-required";

const CSRF_COOKIE_NAME = "athena_csrf";

export async function loadServerAuthStatus() {
  const response = await fetch("/auth/me", {
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error("Не удалось проверить вход");
  }

  return (await response.json()) as ServerAuthStatus;
}

export async function setupServerOwner(payload: ServerAuthPayload) {
  const response = await fetch("/auth/setup", {
    method: "POST",
    credentials: "same-origin",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Не удалось настроить владельца: ${text}`);
  }

  return (await response.json()) as ServerAuthResponse;
}

export async function loginServerOwner(payload: ServerAuthPayload) {
  const response = await fetch("/auth/login", {
    method: "POST",
    credentials: "same-origin",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Не удалось войти: ${text}`);
  }

  return (await response.json()) as ServerAuthResponse;
}

export async function logoutServerOwner() {
  const response = await fetch("/auth/logout", {
    method: "POST",
    credentials: "same-origin",
    headers: csrfHeaders(),
  });

  if (!response.ok && response.status !== 401) {
    const text = await response.text();
    throw new Error(`Не удалось выйти: ${text}`);
  }
}

export async function loadServerEntries() {
  try {
    const response = await fetch("/entries", {
      credentials: "same-origin",
    });

    handleUnauthorized(response);

    if (!response.ok) {
      throw new Error("Не удалось загрузить записи");
    }

    const data = (await response.json()) as EntriesResponse;
    return data.entries ?? [];
  } catch (error) {
    console.warn("[api:entries:list]", error);
    return [];
  }
}

export async function loadServerEntry(entryId: number | string) {
  try {
    const response = await fetch(`/entries/${encodeURIComponent(entryId)}`, {
      credentials: "same-origin",
    });

    handleUnauthorized(response);

    if (!response.ok) {
      throw new Error("Не удалось загрузить запись");
    }

    const data = (await response.json()) as EntryResponse;
    return data.entry ?? null;
  } catch (error) {
    console.warn("[api:entries:get]", error);
    return null;
  }
}

export async function createEntry(payload: CreateEntryPayload) {
  const response = await fetch("/entries", {
    method: "POST",
    credentials: "same-origin",
    headers: csrfJsonHeaders(),
    body: JSON.stringify(payload),
  });

  handleUnauthorized(response);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Не удалось сохранить запись: ${text}`);
  }

  const data = (await response.json()) as CreateEntryResponse;
  return data.entry;
}

export async function updateServerEntry(
  entryId: number | string,
  payload: UpdateEntryPayload,
) {
  const response = await fetch(`/entries/${encodeURIComponent(entryId)}`, {
    method: "PATCH",
    credentials: "same-origin",
    headers: csrfJsonHeaders(),
    body: JSON.stringify(payload),
  });

  handleUnauthorized(response);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Не удалось обновить запись: ${text}`);
  }

  const data = (await response.json()) as CreateEntryResponse;
  return data.entry;
}

export async function deleteServerEntry(entryId: number | string) {
  const response = await fetch(`/entries/${encodeURIComponent(entryId)}`, {
    method: "DELETE",
    credentials: "same-origin",
    headers: csrfHeaders(),
  });

  handleUnauthorized(response);

  if (!response.ok && response.status !== 404) {
    const text = await response.text();
    throw new Error(`Не удалось удалить запись: ${text}`);
  }
}

export async function loadExtractionConfig() {
  const response = await fetch("/extractions/config", {
    credentials: "same-origin",
  });

  handleUnauthorized(response);

  if (!response.ok) {
    throw new Error("Не удалось загрузить настройки анализа");
  }

  return (await response.json()) as ExtractionConfig;
}

export async function loadExtractionStatus(settings: ExtractionSettings) {
  const params = new URLSearchParams({
    provider: settings.provider,
    model: settings.model,
  });
  const response = await fetch(`/extractions/status?${params.toString()}`, {
    credentials: "same-origin",
  });

  handleUnauthorized(response);

  if (!response.ok) {
    throw new Error("Не удалось проверить доступность анализа");
  }

  return (await response.json()) as ExtractionStatus;
}

export async function extractSignal(payload: {
  text: string;
  settings: ExtractionSettings;
  signal?: AbortSignal;
}) {
  const response = await fetch("/extractions", {
    method: "POST",
    signal: payload.signal,
    credentials: "same-origin",
    headers: csrfJsonHeaders(),
    body: JSON.stringify({
      text: payload.text,
      provider: payload.settings.provider,
      model: payload.settings.model,
    }),
  });

  handleUnauthorized(response);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Не удалось выполнить анализ текста: ${text}`);
  }

  return (await response.json()) as ExtractionResult;
}

export async function appendEntrySignal(
  entryId: number | string,
  payload: AppendSignalPayload,
) {
  const response = await fetch(`/entries/${encodeURIComponent(entryId)}/signals`, {
    method: "POST",
    credentials: "same-origin",
    headers: csrfJsonHeaders(),
    body: JSON.stringify(payload),
  });

  handleUnauthorized(response);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Не удалось обновить результаты анализа: ${text}`);
  }

  const data = (await response.json()) as CreateEntryResponse;
  return data.entry;
}

export async function loadCurrentInsights(today: string) {
  try {
    const params = new URLSearchParams({ today });
    const response = await fetch(`/insights/current?${params.toString()}`, {
      credentials: "same-origin",
    });

    handleUnauthorized(response);

    if (!response.ok) {
      throw new Error("Не удалось загрузить текущие наблюдения");
    }

    const data = (await response.json()) as CurrentInsightsResponse;
    return data.insights ?? [];
  } catch (error) {
    console.warn("[api:insights:current]", error);
    return [];
  }
}

export async function loadInsightHistory() {
  try {
    const response = await fetch("/insights", {
      credentials: "same-origin",
    });

    handleUnauthorized(response);

    if (!response.ok) {
      throw new Error("Не удалось загрузить историю наблюдений");
    }

    const data = (await response.json()) as InsightHistoryResponse;
    return data.insights ?? [];
  } catch (error) {
    console.warn("[api:insights:history]", error);
    return [];
  }
}

export async function deleteInsightSnapshot(insightId: number | string) {
  const response = await fetch(`/insights/${encodeURIComponent(insightId)}`, {
    method: "DELETE",
    credentials: "same-origin",
    headers: csrfHeaders(),
  });

  handleUnauthorized(response);

  if (!response.ok && response.status !== 404) {
    const text = await response.text();
    throw new Error(`Не удалось удалить наблюдение: ${text}`);
  }
}

export async function syncSelfReportDailyAggregates(
  localDay: string,
  aggregates: SelfReportDailyAggregate[],
) {
  const response = await fetch(
    `/self-reports/daily-aggregates/${encodeURIComponent(localDay)}`,
    {
      method: "PUT",
      credentials: "same-origin",
      headers: csrfJsonHeaders(),
      body: JSON.stringify({
        aggregates: serializeSelfReportDailyAggregates(aggregates),
      }),
    },
  );

  handleUnauthorized(response);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Не удалось синхронизировать self-report aggregates: ${text}`);
  }
}

export function serializeSelfReportDailyAggregates(
  aggregates: SelfReportDailyAggregate[],
): SyncSelfReportDailyAggregatePayload[] {
  return aggregates.map((aggregate) => ({
    local_day: aggregate.local_day,
    axis: aggregate.axis,
    count: aggregate.count,
    sum: aggregate.sum,
    sum_squares: aggregate.sum_squares,
    mean: aggregate.mean,
    min: aggregate.min,
    max: aggregate.max,
    schema_version: aggregate.schema_version,
    aggregate_version: aggregate.aggregate_version,
    updated_at: aggregate.updated_at,
  }));
}

function jsonHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
  };
}

function csrfJsonHeaders(): Record<string, string> {
  return {
    ...jsonHeaders(),
    ...csrfHeaders(),
  };
}

function csrfHeaders(): Record<string, string> {
  const token = readBrowserCookie(CSRF_COOKIE_NAME);

  return token ? { "X-CSRF-Token": token } : {};
}

function readBrowserCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const prefix = `${name}=`;
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  if (!cookie) {
    return null;
  }

  try {
    return decodeURIComponent(cookie.slice(prefix.length));
  } catch {
    return cookie.slice(prefix.length);
  }
}

function handleUnauthorized(response: Response): void {
  if (response.status !== 401 || typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(SERVER_AUTH_REQUIRED_EVENT));
}
