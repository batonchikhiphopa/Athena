import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

import { createEntry } from "../server/modules/entries/entry.service.js";
import {
  buildAnalyticsV2Overview,
  buildAnalyticsV2Summary,
} from "../server/modules/analytics/analyticsV2.service.js";
import { ANALYTICS_V2_ENTRY_SIGNAL_ROWS_IN_RANGE_SQL } from "../server/modules/analytics/analyticsV2.repository.js";
import { createTestDb } from "./helpers/createTestDb.js";
import {
  fallbackSignal,
  sparseSignal,
  state,
  validSignal,
} from "./signal-fixtures.js";

async function addEntry(db, id, date, signal, tags = []) {
  return createEntry(db, {
    client_entry_id: id,
    entry_date: date,
    tags,
    source_text_hash: crypto.createHash("sha256").update(id).digest("hex"),
    signal,
  });
}

async function addLevelEntry(db, id, date, levels, tags = []) {
  return addEntry(
    db,
    id,
    date,
    validSignal({
      state_inference: {
        fatigue: state(levels.fatigue ?? "medium"),
        focus: state(levels.focus ?? "medium"),
        load: state(levels.load ?? "medium"),
      },
    }),
    tags,
  );
}

async function addSelfReportAggregate(db, date, axis, mean, count = 1) {
  await db.run(
    `
    INSERT INTO self_report_daily_aggregates (
      local_day,
      axis,
      count,
      sum,
      sum_squares,
      mean,
      min,
      max,
      schema_version,
      aggregate_version,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      date,
      axis,
      count,
      mean * count,
      mean * mean * count,
      mean,
      mean,
      mean,
      "self_report.v1",
      "self_report_daily_aggregate.v1",
      `${date}T12:00:00.000Z`,
    ],
  );
}

test("Analytics V2 computes baseline, trend, self-report axes, and associations", async () => {
  const db = await createTestDb();

  try {
    for (const date of eachDateInRange("2026-04-01", "2026-04-21")) {
      await addLevelEntry(db, `baseline-${date}`, date, {
        fatigue: "medium",
        focus: "medium",
        load: "medium",
      });
      await addSelfReportAggregate(db, date, "stress", 4);
    }

    const currentDates = eachDateInRange("2026-04-29", "2026-05-05");

    for (const [index, date] of currentDates.entries()) {
      const shifted = index >= 4;
      await addLevelEntry(
        db,
        `current-${date}`,
        date,
        {
          fatigue: shifted ? "high" : "medium",
          focus: shifted ? "low" : "medium",
          load: shifted ? "high" : "medium",
        },
        ["focus"],
      );
      await addSelfReportAggregate(db, date, "stress", shifted ? 8 : 4);
    }

    const response = await buildAnalyticsV2Summary(db, {
      from: "2026-04-29",
      kind: "week",
      to: "2026-05-05",
    });

    assert.equal(response.reason, null);
    assert.equal(response.summary.window.days, 7);
    assert.equal(response.summary.baseline_window.start, "2026-04-01");
    assert.equal(response.summary.baseline_window.end, "2026-04-28");
    assert.equal(response.summary.density.entry_days, 7);
    assert.equal(response.summary.density.valid_density, 1);

    const { load, focus, stress } = response.summary.axes;

    assert.equal(load.source, "extracted");
    assert.equal(load.baseline_sample_days, 21);
    assert.equal(load.baseline_quality, "strong");
    assert.equal(load.current_sample_days, 7);
    assert.equal(load.current_mean, 6.286);
    assert.equal(load.baseline_mean, 5);
    assert.equal(load.direction, "up");
    assert.equal(load.trend_direction, "rising");
    assert.equal(load.sudden_change, true);

    assert.equal(focus.direction, "down");
    assert.equal(focus.trend_direction, "falling");

    assert.equal(stress.source, "self_report");
    assert.equal(stress.baseline_quality, "strong");
    assert.equal(stress.current_mean, 5.714);
    assert.equal(stress.direction, "up");

    const loadStress = response.summary.associations.find(
      (association) =>
        association.left_axis === "load" &&
        association.right_axis === "stress",
    );

    assert.equal(loadStress.direction, "positive");
    assert.equal(loadStress.strength, "strong");
    assert.equal(loadStress.correlation, 1);
    assert.deepEqual(loadStress.uncertainty, ["association_not_causation"]);

    assert.equal(response.summary.quality.grade, "strong");
    assert.equal(response.summary.quality.reason, "ok");
    assert.deepEqual(response.summary.quality.flags, []);
    assert.equal(response.summary.context.tags[0].name, "focus");
  } finally {
    await db.close();
  }
});

test("Analytics V2 keeps sparse context but does not invent state metrics", async () => {
  const db = await createTestDb();

  try {
    await addEntry(
      db,
      "sparse-entry",
      "2026-05-05",
      sparseSignal({
        markers: ["sleep_issue"],
        topics: ["сон"],
      }),
      ["recovery"],
    );
    await addEntry(db, "fallback-entry", "2026-05-04", fallbackSignal());

    const response = await buildAnalyticsV2Summary(db, {
      from: "2026-04-29",
      kind: "week",
      to: "2026-05-05",
    });

    assert.equal(response.reason, null);
    assert.equal(response.summary.density.valid_days, 0);
    assert.equal(response.summary.density.sparse_days, 1);
    assert.equal(response.summary.density.fallback_days, 1);
    assert.equal(response.summary.axes.load.current_mean, null);
    assert.equal(response.summary.axes.load.direction, "unknown");
    assert.equal(response.summary.context.topics[0].name, "сон");
    assert.equal(response.summary.context.markers[0].name, "sleep_issue");
    assert.equal(response.summary.quality.grade, "insufficient");
    assert.equal(response.summary.quality.reason, "no_valid_signals");
  } finally {
    await db.close();
  }
});

test("Analytics V2 blocks extracted baseline deltas across schema boundaries", async () => {
  const db = await createTestDb();

  try {
    for (const date of eachDateInRange("2026-04-01", "2026-04-21")) {
      await addLevelEntry(db, `baseline-boundary-${date}`, date, {
        load: "medium",
      });
      await addSelfReportAggregate(db, date, "stress", 4);
    }

    for (const date of eachDateInRange("2026-04-29", "2026-05-05")) {
      await addLevelEntry(db, `current-boundary-${date}`, date, {
        load: "high",
      });
      await addSelfReportAggregate(db, date, "stress", 8);
    }

    await db.run(
      `
      UPDATE signals
      SET prompt_version = ?
      WHERE entry_id IN (
        SELECT id FROM entries WHERE entry_date BETWEEN ? AND ?
      )
      `,
      ["extraction.v-next", "2026-04-29", "2026-05-05"],
    );

    const response = await buildAnalyticsV2Summary(db, {
      from: "2026-04-29",
      kind: "week",
      to: "2026-05-05",
    });

    assert.equal(response.summary.versions.version_boundary_blocks_comparison, true);
    assert.equal(response.summary.axes.load.baseline_mean, 5);
    assert.equal(response.summary.axes.load.delta_from_baseline, null);
    assert.equal(response.summary.axes.load.z_delta, null);
    assert.ok(
      response.summary.axes.load.uncertainty.includes(
        "version_boundary_blocks_comparison",
      ),
    );
    assert.equal(response.summary.axes.stress.delta_from_baseline, 4);
    assert.equal(response.summary.quality.reason, "version_boundary");
  } finally {
    await db.close();
  }
});

test("Analytics V2 does not create windows from orphan self-report aggregates", async () => {
  const db = await createTestDb();

  try {
    await addSelfReportAggregate(db, "2026-05-05", "stress", 7);

    const overview = await buildAnalyticsV2Overview(db);

    assert.deepEqual(overview.week, {
      reason: "no_data",
      summary: null,
    });
    assert.deepEqual(overview.month, {
      reason: "no_data",
      summary: null,
    });
  } finally {
    await db.close();
  }
});

test("Analytics V2 entry query filters entries before latest signal lookup", async () => {
  const db = await createTestDb();

  try {
    const planRows = await db.all(
      `EXPLAIN QUERY PLAN ${ANALYTICS_V2_ENTRY_SIGNAL_ROWS_IN_RANGE_SQL}`,
      ["2026-04-01", "2026-05-05"],
    );
    const plan = planRows.map((row) => row.detail).join("\n");

    assert.match(plan, /SEARCH e USING INDEX/);
    assert.doesNotMatch(plan, /effective_signals/i);
    assert.doesNotMatch(plan, /MATERIALIZE/i);
  } finally {
    await db.close();
  }
});

test("Analytics V2 applies latest signal override after date-first lookup", async () => {
  const db = await createTestDb();

  try {
    const entryId = await addLevelEntry(db, "override-entry", "2026-05-05", {
      load: "medium",
    });

    await db.run(
      `
      INSERT INTO signal_overrides (
        entry_id,
        load,
        fatigue,
        focus,
        created_at
      ) VALUES (?, ?, ?, ?, ?)
      `,
      [entryId, 9, null, null, "2026-05-05T13:00:00.000Z"],
    );

    const response = await buildAnalyticsV2Summary(db, {
      from: "2026-05-05",
      kind: "day",
      to: "2026-05-05",
    });

    assert.equal(response.summary.axes.load.current_mean, 9);
  } finally {
    await db.close();
  }
});

function eachDateInRange(from, to) {
  const dates = [];
  const current = parseDateOnly(from);
  const end = parseDateOnly(to);

  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

function parseDateOnly(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}
