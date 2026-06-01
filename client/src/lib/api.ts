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

type EntriesResponse = {
  entries: ServerEntry[];
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

export async function loadServerEntries() {
  try {
    const response = await fetch("/entries");

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
    const response = await fetch(`/entries/${encodeURIComponent(entryId)}`);

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
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

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
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

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
  });

  if (!response.ok && response.status !== 404) {
    const text = await response.text();
    throw new Error(`Не удалось удалить запись: ${text}`);
  }
}

export async function loadExtractionConfig() {
  const response = await fetch("/extractions/config");

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
  const response = await fetch(`/extractions/status?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Не удалось проверить доступность анализа");
  }

  return (await response.json()) as ExtractionStatus;
}

export async function extractSignal(payload: {
  text: string;
  settings: ExtractionSettings;
}) {
  const response = await fetch("/extractions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: payload.text,
      provider: payload.settings.provider,
      model: payload.settings.model,
    }),
  });

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
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

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
    const response = await fetch(`/insights/current?${params.toString()}`);

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
    const response = await fetch("/insights");

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
  });

  if (!response.ok && response.status !== 404) {
    const text = await response.text();
    throw new Error(`Не удалось удалить наблюдение: ${text}`);
  }
}
