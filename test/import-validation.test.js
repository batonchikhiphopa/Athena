import test from "node:test";
import assert from "node:assert/strict";

import {
  parseAndValidateLocalExportJson,
  validateLocalExportPackage,
} from "../client/src/features/exportImport/importValidation.ts";
import { buildLocalImportPreview } from "../client/src/features/exportImport/importPreview.ts";

const NOW = "2026-06-07T12:00:00.000Z";

function createPackage(overrides = {}) {
  return {
    app: "athena",
    export_version: "local_export.v1",
    exported_at: NOW,
    source: {
      app_version: "0.6.0",
      schema_version: "signal.v4",
      prompt_version: "extraction.v5",
      self_report_schema_version: "self_report.v1",
      self_report_daily_aggregate_version: "self_report_daily_aggregate.v1",
    },
    entries: [
      {
        id: "entry-1",
        server_id: 1,
        text: "private diary text",
        entry_date: "2026-06-06",
        tags: ["work", "health"],
        analysis_enabled: true,
        created_at: "2026-06-06T10:00:00.000Z",
        updated_at: "2026-06-06T10:05:00.000Z",
        source_text_hash:
          "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        signal: {
          topics: ["work"],
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
        },
      },
      {
        id: "entry-2",
        server_id: null,
        text: "",
        entry_date: "2026-06-07",
        tags: [],
        analysis_enabled: false,
        created_at: "2026-06-07T10:00:00.000Z",
        updated_at: "2026-06-07T10:05:00.000Z",
        source_text_hash: null,
        signal: null,
        metadata: null,
      },
    ],
    self_reports: {
      events: [
        {
          id: "self-report:entry-1",
          entry_id: "entry-1",
          local_day: "2026-06-06",
          created_at: "2026-06-06T10:01:00.000Z",
          updated_at: "2026-06-06T10:02:00.000Z",
          values: {
            mood: 6,
            stress: 7,
            energy: 4,
            sleep_quality: 5,
            function: 6,
          },
          schema_version: "self_report.v1",
        },
      ],
    },
    settings: {
      extraction_provider: "off",
      extraction_model: "off",
      interface_language: "en",
      entry_sort_direction: "desc",
      persona_text_enabled: true,
      local_emotion_spike_enabled: false,
    },
    queue: {
      pending_jobs: [
        {
          type: "entry.reprocess_signal",
          entity_kind: "entry",
          entity_id: "entry-1",
          status: "queued",
          reason: "fallback",
        },
      ],
    },
    ...overrides,
  };
}

test("parseAndValidateLocalExportJson accepts valid local_export.v1 JSON", () => {
  const packageData = parseAndValidateLocalExportJson(
    JSON.stringify(createPackage()),
  );

  assert.equal(packageData.app, "athena");
  assert.equal(packageData.export_version, "local_export.v1");
  assert.equal(packageData.entries.length, 2);
  assert.equal(packageData.self_reports.events.length, 1);
  assert.equal(packageData.queue.pending_jobs.length, 1);
});

test("parseAndValidateLocalExportJson rejects malformed JSON", () => {
  assert.throws(
    () => parseAndValidateLocalExportJson("{not json"),
    /Invalid JSON import file/,
  );
});

test("validateLocalExportPackage rejects unsupported export versions", () => {
  assert.throws(
    () =>
      validateLocalExportPackage(
        createPackage({
          export_version: "local_export.v999",
        }),
      ),
    /Unsupported export version/,
  );

  assert.throws(
    () =>
      validateLocalExportPackage({
        app: "athena",
        export_version: "backend_metadata_export.v1",
        exported_at: NOW,
      }),
    /Unsupported export version/,
  );
});

test("validateLocalExportPackage rejects invalid dates", () => {
  const invalidEntryDate = createPackage();
  invalidEntryDate.entries[0].entry_date = "2026-02-31";

  assert.throws(
    () => validateLocalExportPackage(invalidEntryDate),
    /Invalid entry_date/,
  );

  const invalidExportedAt = createPackage({ exported_at: "2026-06-07" });

  assert.throws(
    () => validateLocalExportPackage(invalidExportedAt),
    /Invalid exported_at timestamp/,
  );

  const invalidSelfReportDay = createPackage();
  invalidSelfReportDay.self_reports.events[0].local_day = "2026-13-01";

  assert.throws(
    () => validateLocalExportPackage(invalidSelfReportDay),
    /Invalid self-report local_day/,
  );
});

test("validateLocalExportPackage rejects duplicate ids inside the import file", () => {
  const duplicateEntries = createPackage();
  duplicateEntries.entries[1].id = "entry-1";

  assert.throws(
    () => validateLocalExportPackage(duplicateEntries),
    /Duplicate entry id: entry-1/,
  );

  const duplicateSelfReports = createPackage();
  duplicateSelfReports.self_reports.events.push({
    ...duplicateSelfReports.self_reports.events[0],
  });

  assert.throws(
    () => validateLocalExportPackage(duplicateSelfReports),
    /Duplicate self-report id/,
  );
});

test("validateLocalExportPackage rejects sensitive excluded fields", () => {
  assert.throws(
    () =>
      validateLocalExportPackage({
        ...createPackage(),
        csrf_token: "must-not-import",
      }),
    /Forbidden sensitive field/,
  );

  const packageWithVaultKey = createPackage();
  packageWithVaultKey.settings.vault_key = "must-not-import";

  assert.throws(
    () => validateLocalExportPackage(packageWithVaultKey),
    /Forbidden sensitive field/,
  );

  const packageWithApiKeyInMetadata = createPackage();
  packageWithApiKeyInMetadata.entries[0].metadata.api_key = "must-not-import";

  assert.throws(
    () => validateLocalExportPackage(packageWithApiKeyInMetadata),
    /Forbidden sensitive field/,
  );
});

test("validateLocalExportPackage rejects queue payloads and unknown queue fields", () => {
  const packageWithQueuePayload = createPackage();
  packageWithQueuePayload.queue.pending_jobs[0].payload = {
    raw_text: "must-not-import",
  };

  assert.throws(
    () => validateLocalExportPackage(packageWithQueuePayload),
    /Unexpected queue job summary 0 field: payload/,
  );

  const packageWithLastError = createPackage();
  packageWithLastError.queue.pending_jobs[0].last_error =
    "private provider error must not be imported";

  assert.throws(
    () => validateLocalExportPackage(packageWithLastError),
    /Unexpected queue job summary 0 field: last_error/,
  );
});

test("validateLocalExportPackage rejects unknown top-level fields", () => {
  assert.throws(
    () =>
      validateLocalExportPackage({
        ...createPackage(),
        hidden_cache: {},
      }),
    /Unexpected local export package field: hidden_cache/,
  );
});

test("validateLocalExportPackage rejects invalid self-report values", () => {
  const invalidValue = createPackage();
  invalidValue.self_reports.events[0].values.mood = 11;

  assert.throws(
    () => validateLocalExportPackage(invalidValue),
    /Invalid self-report value: mood/,
  );

  const invalidNullability = createPackage();
  invalidNullability.self_reports.events[0].values.stress = null;

  assert.doesNotThrow(() => validateLocalExportPackage(invalidNullability));
});

test("buildLocalImportPreview returns summary without writing or requiring backend", () => {
  const packageData = validateLocalExportPackage(createPackage());

  const preview = buildLocalImportPreview(packageData, {
    entries: [{ id: "entry-1" }, { id: "current-only-entry" }],
    selfReportEvents: [{ id: "self-report:entry-1" }],
  });

  assert.deepEqual(preview, {
    export_version: "local_export.v1",
    exported_at: NOW,
    entries_count: 2,
    self_report_events_count: 1,
    first_entry_date: "2026-06-06",
    last_entry_date: "2026-06-07",
    possible_duplicate_entry_ids: ["entry-1"],
    possible_duplicate_self_report_ids: ["self-report:entry-1"],
    current_local_data: "exists",
    mode: "replace_local_data",
    backend_calls_required: false,
    writes_during_preview: false,
    warnings: [
      "local_export_contains_raw_diary_text",
      "source_text_hash_is_fingerprint_metadata",
      "replace_local_data_will_overwrite_current_browser_data",
      "possible_duplicate_ids_found",
    ],
  });
});

test("buildLocalImportPreview handles empty current local data", () => {
  const packageData = validateLocalExportPackage(createPackage());

  const preview = buildLocalImportPreview(packageData, {
    entries: [],
    selfReportEvents: [],
  });

  assert.equal(preview.current_local_data, "empty");
  assert.deepEqual(preview.possible_duplicate_entry_ids, []);
  assert.deepEqual(preview.possible_duplicate_self_report_ids, []);
  assert.equal(preview.backend_calls_required, false);
  assert.equal(preview.writes_during_preview, false);
});
