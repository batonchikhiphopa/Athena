import assert from "node:assert/strict";
import test from "node:test";
import { syncSelfReportDailyAggregates } from "../server/services/self-report.service.js";
import { syncSelfReportDailyAggregatesSchema } from "../server/core/self-report.schema.js";
import { serializeSelfReportDailyAggregates } from "../client/src/features/selfReports/selfReportApi.ts";
import { createTestDb } from "./helpers/createTestDb.js";

function aggregate(overrides = {}) {
  return {
    local_day: "2026-06-01",
    axis: "mood",
    count: 2,
    sum: 11,
    sum_squares: 61,
    mean: 5.5,
    min: 5,
    max: 6,
    schema_version: "self_report.v1",
    aggregate_version: "self_report_daily_aggregate.v1",
    updated_at: "2026-06-01T12:00:00.000Z",
    ...overrides,
  };
}

test("self-report aggregate sync stores daily numeric aggregates only", async () => {
  const db = await createTestDb();

  try {
    const stored = await syncSelfReportDailyAggregates(db, "2026-06-01", [
      aggregate(),
      aggregate({
        axis: "energy",
        count: 1,
        sum: 7,
        sum_squares: 49,
        mean: 7,
        min: 7,
        max: 7,
      }),
    ]);

    const columns = await db.all("PRAGMA table_info(self_report_daily_aggregates)");

    assert.equal(stored.length, 2);
    assert.deepEqual(
      columns.map((column) => column.name).sort(),
      [
        "aggregate_version",
        "axis",
        "count",
        "id",
        "local_day",
        "max",
        "mean",
        "min",
        "schema_version",
        "sum",
        "sum_squares",
        "updated_at",
      ],
    );
    assert.equal(columns.some((column) => column.name === "entry_id"), false);
    assert.equal(columns.some((column) => column.name === "event_id"), false);
    assert.equal(columns.some((column) => column.name === "created_at"), false);
    assert.equal(columns.some((column) => column.name === "text"), false);
  } finally {
    await db.close();
  }
});

test("self-report aggregate sync replaces a whole day", async () => {
  const db = await createTestDb();

  try {
    await syncSelfReportDailyAggregates(db, "2026-06-01", [
      aggregate(),
      aggregate({ axis: "stress" }),
    ]);
    const replaced = await syncSelfReportDailyAggregates(db, "2026-06-01", [
      aggregate({ axis: "sleep_quality", mean: 8, min: 8, max: 8, sum: 8, sum_squares: 64, count: 1 }),
    ]);
    const rows = await db.all(
      "SELECT axis FROM self_report_daily_aggregates WHERE local_day = ? ORDER BY axis",
      ["2026-06-01"],
    );

    assert.equal(replaced.length, 1);
    assert.deepEqual(rows.map((row) => row.axis), ["sleep_quality"]);
  } finally {
    await db.close();
  }
});

test("self-report aggregate sync deletes a day when no aggregate remains", async () => {
  const db = await createTestDb();

  try {
    await syncSelfReportDailyAggregates(db, "2026-06-01", [aggregate()]);
    await syncSelfReportDailyAggregates(db, "2026-06-01", []);

    const row = await db.get(
      "SELECT COUNT(*) AS count FROM self_report_daily_aggregates WHERE local_day = ?",
      ["2026-06-01"],
    );

    assert.equal(row.count, 0);
  } finally {
    await db.close();
  }
});

test("self-report aggregate payload rejects raw event data", () => {
  const parsed = syncSelfReportDailyAggregatesSchema.safeParse({
    aggregates: [
      aggregate({
        entry_id: "local-entry-id",
        event_id: "raw-event-id",
        created_at: "2026-06-01T11:59:00.000Z",
        values: {
          mood: 5,
        },
      }),
    ],
  });

  assert.equal(parsed.success, false);
});

test("self-report aggregate client payload matches strict server schema", () => {
  const payload = serializeSelfReportDailyAggregates([
    aggregate({
      id: "2026-06-01:mood",
    }),
  ]);

  assert.deepEqual(Object.keys(payload[0]).sort(), [
    "aggregate_version",
    "axis",
    "count",
    "local_day",
    "max",
    "mean",
    "min",
    "schema_version",
    "sum",
    "sum_squares",
    "updated_at",
  ]);

  const parsed = syncSelfReportDailyAggregatesSchema.safeParse({
    aggregates: payload,
  });

  assert.equal(parsed.success, true);
});

test("self-report aggregate payload rejects client-local ids", () => {
  const parsed = syncSelfReportDailyAggregatesSchema.safeParse({
    aggregates: [
      aggregate({
        id: "2026-06-01:mood",
      }),
    ],
  });

  assert.equal(parsed.success, false);
});

test("self-report aggregate sync rejects local day mismatch", async () => {
  const db = await createTestDb();

  try {
    await assert.rejects(
      () =>
        syncSelfReportDailyAggregates(db, "2026-06-02", [
          aggregate({ local_day: "2026-06-01" }),
        ]),
      /self_report_aggregate_day_mismatch/,
    );
  } finally {
    await db.close();
  }
});
