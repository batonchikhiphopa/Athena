import test from "node:test";
import assert from "node:assert/strict";

import {
  applyLocalImportReplace,
  toImportedLocalEntry,
  toImportedSelfReportEvent,
  toSelfReportValues,
} from "../client/src/features/exportImport/importApply.ts";

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
        tags: ["work"],
        analysis_enabled: true,
        created_at: "2026-06-06T10:00:00.000Z",
        updated_at: "2026-06-06T10:05:00.000Z",
        source_text_hash:
          "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        signal: {
          topics: ["work"],
          activities: [],
          markers: [],
          load: 7,
          fatigue: null,
          focus: 4,
          signal_quality: "valid",
          entry_intent: {
            intent: "reflection",
            confidence: "medium",
            basis: [],
          },
          structure_signal: {
            density: "medium",
            coherence: "medium",
            has_question: false,
            has_plan: false,
            basis: [],
          },
          temporal_context: {
            local_date: "2026-06-06",
            time_bucket: "unknown",
            source: "entry_date",
          },
        },
        metadata: {
          schema_version: "signal.v4",
          prompt_version: "extraction.v5",
          provider: "off",
          model: "off",
          error_code: null,
          created_at: "2026-06-06T10:05:00.000Z",
        },
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
            stress: null,
            energy: 4,
            sleep_quality: null,
            function: 8,
          },
          schema_version: "self_report.v1",
        },
      ],
    },
    settings: {},
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

test("toImportedLocalEntry converts export entry to current LocalEntry shape", async () => {
  const packageData = createPackage();
  const entry = await toImportedLocalEntry(packageData.entries[0]);

  assert.equal(entry.id, "entry-1");
  assert.equal(entry.serverId, 1);
  assert.equal(entry.text, "private diary text");
  assert.equal(entry.entry_date, "2026-06-06");
  assert.deepEqual(entry.tags, ["work"]);
  assert.equal(entry.analysis_enabled, true);
  assert.equal(
    entry.source_text_hash,
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  );
  assert.equal(entry.sync_status, "local_only");
  assert.equal(entry.createdAt, "2026-06-06T10:00:00.000Z");
  assert.equal(entry.updatedAt, "2026-06-06T10:05:00.000Z");
});

test("toImportedSelfReportEvent preserves null as unanswered", () => {
  const packageData = createPackage();
  const event = toImportedSelfReportEvent(packageData.self_reports.events[0]);

  assert.equal(event.id, "self-report:entry-1");
  assert.equal(event.entry_id, "entry-1");
  assert.equal(event.local_day, "2026-06-06");
  assert.equal(event.schema_version, "self_report.v1");
  assert.equal(event.sync_status, "pending_sync");
  assert.deepEqual(event.values, {
    mood: 6,
    stress: null,
    energy: 4,
    sleep_quality: null,
    function: 8,
  });
});

test("toSelfReportValues clamps invalid numeric edges without converting null to midpoint", () => {
  const values = toSelfReportValues({
    mood: -2,
    stress: 12,
    energy: 4.4,
    sleep_quality: null,
    function: 8.6,
  });

  assert.deepEqual(values, {
    mood: 0,
    stress: 10,
    energy: 4,
    sleep_quality: null,
    function: 9,
  });
});

test("applyLocalImportReplace writes through injected local storage and does not call backend", async () => {
  const calls = {
    replaceEntries: [],
    replaceSelfReportEvents: [],
  };

  const result = await applyLocalImportReplace(createPackage(), {
    replaceEntries: async (entries) => {
      calls.replaceEntries.push(entries);
    },
    replaceSelfReportEvents: async (events) => {
      calls.replaceSelfReportEvents.push(events);

      return {
        events,
        aggregates: [
          {
            id: "2026-06-06:mood",
            local_day: "2026-06-06",
            axis: "mood",
            count: 1,
            sum: 6,
            sum_squares: 36,
            mean: 6,
            min: 6,
            max: 6,
            schema_version: "self_report.v1",
            aggregate_version: "self_report_daily_aggregate.v1",
            updated_at: NOW,
          },
          {
            id: "2026-06-06:energy",
            local_day: "2026-06-06",
            axis: "energy",
            count: 1,
            sum: 4,
            sum_squares: 16,
            mean: 4,
            min: 4,
            max: 4,
            schema_version: "self_report.v1",
            aggregate_version: "self_report_daily_aggregate.v1",
            updated_at: NOW,
          },
          {
            id: "2026-06-06:function",
            local_day: "2026-06-06",
            axis: "function",
            count: 1,
            sum: 8,
            sum_squares: 64,
            mean: 8,
            min: 8,
            max: 8,
            schema_version: "self_report.v1",
            aggregate_version: "self_report_daily_aggregate.v1",
            updated_at: NOW,
          },
        ],
        recomputedDays: ["2026-06-06"],
      };
    },
  });

  assert.equal(calls.replaceEntries.length, 1);
  assert.equal(calls.replaceEntries[0].length, 1);
  assert.equal(calls.replaceSelfReportEvents.length, 1);
  assert.equal(calls.replaceSelfReportEvents[0].length, 1);

  assert.deepEqual(result, {
    mode: "replace_local_data",
    entries_restored: 1,
    self_report_events_restored: 1,
    self_report_days_recomputed: ["2026-06-06"],
    self_report_aggregates_recomputed: 3,
    queue_summaries_ignored: 1,
    backend_calls_performed: false,
  });
});

test("applyLocalImportReplace rejects invalid packages before writing", async () => {
  let replaceEntriesCalled = false;

  await assert.rejects(
    () =>
      applyLocalImportReplace(
        createPackage({
          export_version: "local_export.v999",
        }),
        {
          replaceEntries: async () => {
            replaceEntriesCalled = true;
          },
          replaceSelfReportEvents: async () => ({
            events: [],
            aggregates: [],
            recomputedDays: [],
          }),
        },
      ),
    /Unsupported export version/,
  );

  assert.equal(replaceEntriesCalled, false);
});