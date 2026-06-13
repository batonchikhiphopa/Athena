import test from "node:test";
import assert from "node:assert/strict";

import { syncLocalEntryToServer } from "../client/src/features/sync/entryServerSync.ts";
import { validSignal } from "./signal-fixtures.js";

test("entry server sync recreates a missing stale server entry", async () => {
  const calls = [];
  const entry = localEntry({ serverId: 42 });

  const syncedEntry = await syncLocalEntryToServer(entry, {
    async updateServerEntry(entryId, payload) {
      calls.push({ type: "update", entryId, payload });

      const error = new Error("Не удалось обновить запись");
      error.status = 404;
      error.code = "http_404";
      throw error;
    },
    async createEntry(payload) {
      calls.push({ type: "create", payload });

      return serverEntry({
        id: 7,
        client_entry_id: payload.client_entry_id,
        entry_date: payload.entry_date,
        tags: payload.tags,
        source_text_hash: payload.source_text_hash,
        signal: payload.signal,
        metadata: payload.metadata,
      });
    },
  });

  assert.equal(syncedEntry.id, 7);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].type, "update");
  assert.equal(calls[0].entryId, 42);
  assert.equal(calls[1].type, "create");
  assert.equal(calls[1].payload.client_entry_id, entry.id);
  assert.equal(Object.hasOwn(calls[1].payload, "text"), false);
});

test("entry server sync keeps non-404 update failures visible", async () => {
  const error = new Error("backend unavailable");
  error.status = 503;

  await assert.rejects(
    () =>
      syncLocalEntryToServer(localEntry({ serverId: 42 }), {
        async updateServerEntry() {
          throw error;
        },
        async createEntry() {
          throw new Error("create should not be called");
        },
      }),
    error,
  );
});

function localEntry(overrides = {}) {
  return {
    id: "054e84dc-80fd-4b91-a9b0-d8afbdddf9fa",
    serverId: null,
    text: "private text remains local",
    entry_date: "2026-06-13",
    tags: ["sync"],
    analysis_enabled: true,
    source_text_hash: "a".repeat(64),
    signals: validSignal(),
    metadata: {
      schema_version: "signal.v4",
      prompt_version: "extraction.v5",
      provider: "gemini",
      model: "gemini-2.5-flash-lite",
      error_code: null,
    },
    sync_status: "pending_reextract",
    createdAt: "2026-06-13T10:00:00.000Z",
    updatedAt: "2026-06-13T10:01:00.000Z",
    ...overrides,
  };
}

function serverEntry(overrides = {}) {
  return {
    id: 1,
    client_entry_id: "entry-1",
    entry_date: "2026-06-13",
    created_at: "2026-06-13T10:00:00.000Z",
    updated_at: "2026-06-13T10:01:00.000Z",
    status: "extracted",
    tags: [],
    source_text_hash: "a".repeat(64),
    signal: validSignal(),
    metadata: {
      schema_version: "signal.v4",
      prompt_version: "extraction.v5",
      provider: "gemini",
      model: "gemini-2.5-flash-lite",
      error_code: null,
    },
    ...overrides,
  };
}
