import test from "node:test";
import assert from "node:assert/strict";

import {
  buildLocalExportPackage,
  sanitizeQueueJobsForExport,
  toLocalExportSettings,
} from "../client/src/features/exportImport/exportPackage.ts";

const NOW = "2026-06-07T12:00:00.000Z";

function createEntry(overrides = {}) {
  return {
    id: "entry-1",
    serverId: 42,
    text: "private diary text that belongs only in local export entries",
    entry_date: "2026-06-07",
    tags: ["work", "work", " health "],
    analysis_enabled: true,
    source_text_hash:
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    signals: {
      topics: ["work"],
      activities: [],
      markers: [],
      load: 7,
      fatigue: null,
      focus: 4,
      signal_quality: "valid",
    },
    metadata: {
      schema_version: "signal.v4",
      prompt_version: "extraction.v5",
      provider: "off",
      model: "off",
      error_code: null,
      created_at: NOW,
    },
    sync_status: "synced",
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function createSelfReportEvent(overrides = {}) {
  return {
    id: "self-report:entry-1",
    entry_id: "entry-1",
    local_day: "2026-06-07",
    created_at: NOW,
    updated_at: NOW,
    values: {
      mood: 6,
      stress: 7,
      energy: 4,
      sleep_quality: 5,
      function: 6,
    },
    schema_version: "self_report.v1",
    sync_status: "pending_sync",
    ...overrides,
  };
}

function createQueueJob(overrides = {}) {
  return {
    id: "job-1",
    type: "entry.reprocess_signal",
    version: 1,
    payload: {
      entry_id: "entry-1",
      source_text_hash:
        "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      raw_text: "this must never be exported",
      reason: "fallback",
      provider: "gemini",
      model: "gemini-pro",
    },
    status: "queued",
    priority: 0,
    attempts: 2,
    max_attempts: 3,
    run_after: "2026-06-07T12:05:00.000Z",
    created_at: NOW,
    updated_at: NOW,
    locked_at: null,
    completed_at: null,
    last_error: "provider error with private context must not be exported",
    idempotency_key: "entry.reprocess_signal:entry:entry-1:rev-1",
    entity_kind: "entry",
    entity_id: "entry-1",
    supersedes: ["old-job"],
    ...overrides,
  };
}

test("buildLocalExportPackage creates local_export.v1 with local diary data", () => {
  const exported = buildLocalExportPackage({
    appVersion: "0.6.0",
    exportedAt: NOW,
    entries: [createEntry()],
    selfReportEvents: [createSelfReportEvent()],
    settings: {
      extraction_provider: "gemini",
      extraction_model: "gemini-1.5-flash",
      interface_language: "en",
      entry_sort_direction: "desc",
      persona_text_enabled: true,
      local_emotion_spike_enabled: false,
    },
    queueJobs: [createQueueJob()],
  });

  assert.equal(exported.app, "athena");
  assert.equal(exported.export_version, "local_export.v1");
  assert.equal(exported.exported_at, NOW);
  assert.equal(exported.source.app_version, "0.6.0");
  assert.equal(exported.source.schema_version, "signal.v4");
  assert.equal(exported.source.prompt_version, "extraction.v5");

  assert.equal(exported.entries.length, 1);
  assert.equal(
    exported.entries[0].text,
    "private diary text that belongs only in local export entries",
  );
  assert.deepEqual(exported.entries[0].tags, ["work", "health"]);
  assert.equal(
    exported.entries[0].source_text_hash,
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  );

  assert.equal(exported.self_reports.events.length, 1);
  assert.deepEqual(exported.self_reports.events[0].values, {
    mood: 6,
    stress: 7,
    energy: 4,
    sleep_quality: 5,
    function: 6,
  });

  assert.deepEqual(exported.settings, {
    extraction_provider: "gemini",
    extraction_model: "gemini-1.5-flash",
    interface_language: "en",
    entry_sort_direction: "desc",
    persona_text_enabled: true,
    local_emotion_spike_enabled: false,
  });
});

test("queue export uses a strict whitelist and excludes durable payload details", () => {
  const exported = buildLocalExportPackage({
    exportedAt: NOW,
    entries: [createEntry()],
    queueJobs: [
      createQueueJob(),
      createQueueJob({
        id: "job-2",
        status: "succeeded",
        entity_id: "entry-2",
      }),
      createQueueJob({
        id: "job-3",
        status: "cancelled",
        entity_id: "entry-3",
      }),
    ],
  });

  assert.deepEqual(exported.queue.pending_jobs, [
    {
      type: "entry.reprocess_signal",
      entity_kind: "entry",
      entity_id: "entry-1",
      status: "queued",
      reason: "fallback",
    },
  ]);

  const serializedQueue = JSON.stringify(exported.queue);

  assert.equal(serializedQueue.includes("raw_text"), false);
  assert.equal(serializedQueue.includes("this must never be exported"), false);
  assert.equal(serializedQueue.includes("source_text_hash"), false);
  assert.equal(serializedQueue.includes("provider"), false);
  assert.equal(serializedQueue.includes("gemini"), false);
  assert.equal(serializedQueue.includes("last_error"), false);
  assert.equal(serializedQueue.includes("attempts"), false);
  assert.equal(serializedQueue.includes("idempotency_key"), false);
  assert.equal(serializedQueue.includes("run_after"), false);
});

test("sanitizeQueueJobsForExport keeps only exportable statuses", () => {
  const summaries = sanitizeQueueJobsForExport([
    createQueueJob({ id: "queued", status: "queued" }),
    createQueueJob({ id: "running", status: "running" }),
    createQueueJob({ id: "blocked", status: "blocked" }),
    createQueueJob({ id: "failed", status: "failed" }),
    createQueueJob({ id: "succeeded", status: "succeeded" }),
    createQueueJob({ id: "cancelled", status: "cancelled" }),
  ]);

  assert.deepEqual(
    summaries.map((summary) => summary.status),
    ["queued", "running", "blocked", "failed"],
  );
});

test("settings export keeps only safe user-facing settings", () => {
  const settings = toLocalExportSettings({
    extraction_provider: "ollama",
    extraction_model: "gpt-oss:20b",
    interface_language: "de",
    entry_sort_direction: "asc",
    persona_text_enabled: false,
    local_emotion_spike_enabled: true,

    api_key: "must-not-export",
    csrf_token: "must-not-export",
    session_token: "must-not-export",
    vault_key: "must-not-export",
    password: "must-not-export",
  });

  assert.deepEqual(settings, {
    extraction_provider: "ollama",
    extraction_model: "gpt-oss:20b",
    interface_language: "de",
    entry_sort_direction: "asc",
    persona_text_enabled: false,
    local_emotion_spike_enabled: true,
  });

  const serialized = JSON.stringify(settings);

  assert.equal(serialized.includes("api_key"), false);
  assert.equal(serialized.includes("csrf_token"), false);
  assert.equal(serialized.includes("session_token"), false);
  assert.equal(serialized.includes("vault_key"), false);
  assert.equal(serialized.includes("password"), false);
});

test("source_text_hash is exported only as entry fingerprint metadata", () => {
  const exported = buildLocalExportPackage({
    exportedAt: NOW,
    entries: [createEntry()],
    queueJobs: [createQueueJob()],
  });

  assert.equal(
    exported.entries[0].source_text_hash,
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  );

  const serializedQueue = JSON.stringify(exported.queue);
  const serializedSettings = JSON.stringify(exported.settings);
  const serializedSelfReports = JSON.stringify(exported.self_reports);

  assert.equal(serializedQueue.includes("aaaaaaaa"), false);
  assert.equal(serializedSettings.includes("aaaaaaaa"), false);
  assert.equal(serializedSelfReports.includes("aaaaaaaa"), false);
});

test("invalid packages are rejected before download", () => {
  assert.throws(
    () =>
      buildLocalExportPackage({
        exportedAt: NOW,
        entries: [
          createEntry({ id: "duplicate" }),
          createEntry({ id: "duplicate" }),
        ],
      }),
    /Duplicate entry id/,
  );

  assert.throws(
    () =>
      buildLocalExportPackage({
        exportedAt: NOW,
        entries: [createEntry({ entry_date: "not-a-day" })],
      }),
    /Invalid entry_date/,
  );

  assert.throws(
    () =>
      buildLocalExportPackage({
        exportedAt: "not-a-date",
        entries: [createEntry()],
      }),
    /Invalid exported_at timestamp/,
  );
});