import type {
  ServerEntry,
  Signal,
  SignalMetadata,
} from "../../shared/contracts";
import {
  createApiHttpError,
  jsonHeaders,
} from "../../shared/http/httpClient";

type EntryPayload = {
  entry_date: string;
  tags?: string[];
  source_text_hash: string;
  signal: Signal;
  metadata?: SignalMetadata;
};

type CreateEntryPayload = EntryPayload & { client_entry_id: string };
type EntryResponse = { entry: ServerEntry };
type EntriesResponse = { entries: ServerEntry[] };

export async function loadServerEntries() {
  try {
    const response = await fetch("/entries", { credentials: "same-origin" });
    if (!response.ok) throw new Error("Не удалось загрузить записи");
    return ((await response.json()) as EntriesResponse).entries ?? [];
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
    if (!response.ok) throw new Error("Не удалось загрузить запись");
    return ((await response.json()) as EntryResponse).entry ?? null;
  } catch (error) {
    console.warn("[api:entries:get]", error);
    return null;
  }
}

export async function createEntry(payload: CreateEntryPayload) {
  const response = await fetch("/entries", {
    method: "POST",
    credentials: "same-origin",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await createApiHttpError(response, "Не удалось сохранить запись");
  }
  return ((await response.json()) as EntryResponse).entry;
}

export async function updateServerEntry(
  entryId: number | string,
  payload: EntryPayload,
) {
  const response = await fetch(`/entries/${encodeURIComponent(entryId)}`, {
    method: "PATCH",
    credentials: "same-origin",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await createApiHttpError(response, "Не удалось обновить запись");
  }
  return ((await response.json()) as EntryResponse).entry;
}

export async function deleteServerEntry(entryId: number | string) {
  const response = await fetch(`/entries/${encodeURIComponent(entryId)}`, {
    method: "DELETE",
    credentials: "same-origin",
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Не удалось удалить запись: ${await response.text()}`);
  }
}
