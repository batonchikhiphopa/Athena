import type {
  ExtractionConfig,
  ExtractionResult,
  ExtractionSettings,
  ExtractionStatus,
  ServerEntry,
  Signal,
  SignalMetadata,
} from "../../shared/contracts";
import {
  csrfJsonHeaders,
  handleUnauthorized,
} from "../../shared/http/httpClient";

type EntryResponse = { entry: ServerEntry };

export async function loadExtractionConfig() {
  const response = await fetch("/extractions/config", {
    credentials: "same-origin",
  });
  handleUnauthorized(response);
  if (!response.ok) throw new Error("Не удалось загрузить настройки анализа");
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
  if (!response.ok) throw new Error("Не удалось проверить доступность анализа");
  return (await response.json()) as ExtractionStatus;
}

export async function extractSignal(payload: {
  text: string;
  settings: ExtractionSettings;
  entryDate?: string;
  capturedAt?: string;
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
      entry_date: payload.entryDate,
      captured_at: payload.capturedAt,
    }),
  });
  handleUnauthorized(response);
  if (!response.ok) {
    throw new Error(`Не удалось выполнить анализ текста: ${await response.text()}`);
  }
  return (await response.json()) as ExtractionResult;
}

export async function appendEntrySignal(
  entryId: number | string,
  payload: {
    source_text_hash: string;
    signal: Signal;
    metadata?: SignalMetadata;
  },
) {
  const response = await fetch(`/entries/${encodeURIComponent(entryId)}/signals`, {
    method: "POST",
    credentials: "same-origin",
    headers: csrfJsonHeaders(),
    body: JSON.stringify(payload),
  });
  handleUnauthorized(response);
  if (!response.ok) {
    throw new Error(`Не удалось обновить результаты анализа: ${await response.text()}`);
  }
  return ((await response.json()) as EntryResponse).entry;
}
