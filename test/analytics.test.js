import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

import { createEntry } from "../server/services/entry.service.js";
import {
  buildSummary,
  calculateAverage,
  calculateDensity,
  normalizeRows,
} from "../server/services/analytics.service.js";

async function createTestDb() {
  const db = await open({
    filename: ":memory:",
    driver: sqlite3.Database,
  });

  await db.exec("PRAGMA foreign_keys = ON;");

  const files = (await fs.readdir("./migrations"))
    .filter((filename) => filename.endsWith(".sql"))
    .sort();

  for (const filename of files) {
    await db.exec(await fs.readFile(`./migrations/${filename}`, "utf8"));
  }

  return db;
}

function validSignal(overrides = {}) {
  return {
    topics: ["работа"],
    activities: ["кодинг"],
    markers: ["deep_work"],
    load: 8,
    fatigue: 7,
    focus: 2,
    signal_quality: "valid",
    ...overrides,
  };
}

function sparseSignal(overrides = {}) {
  return {
    topics: ["работа", "дом"],
    activities: [],
    markers: [],
    load: null,
    fatigue: null,
    focus: null,
    signal_quality: "sparse",
    ...overrides,
  };
}

function fallbackSignal() {
  return {
    topics: [],
    activities: [],
    markers: [],
    load: null,
    fatigue: null,
    focus: null,
    signal_quality: "fallback",
  };
}

async function addEntry(db, id, date, signal) {
  return createEntry(db, {
    client_entry_id: id,
    entry_date: date,
    tags: [],
    source_text_hash: crypto.createHash("sha256").update(id).digest("hex"),
    signal,
  });
}

test("analytics helpers keep nulls strict and calculate valid density", () => {
  assert.equal(calculateAverage([null, null]), null);
  assert.equal(calculateAverage([0, 10, null]), 5);
  assert.equal(
    calculateDensity({
      finalized: [{}, {}, {}, {}],
      valid: [{}, {}],
    }),
    0.5
  );

  const normalized = normalizeRows([
    {
      entry_id: 1,
      entry_date: "2026-04-24",
      status: "extracted",
      topics: '["работа"]',
      activities: "[]",
      markers: '["deep_work"]',
      load: 5,
      fatigue: null,
      focus: 6,
      signal_quality: "valid",
      schema_version: "signal.v1",
      prompt_version: "extraction.v1",
      model: "m",
    },
  ]);

  assert.deepEqual(normalized[0].topics, ["работа"]);
  assert.equal(normalized[0].fatigue, null);
});

test("buildSummary derives deterministic aggregates without fallback averages", async () => {
  const db = await createTestDb();

  try {
    await addEntry(db, "entry-1", "2026-04-01", validSignal());
    await addEntry(db, "entry-2", "2026-04-03", sparseSignal());
    await addEntry(db, "entry-3", "2026-04-04", fallbackSignal());
    await addEntry(
      db,
      "entry-4",
      "2026-04-08",
      validSignal({
        topics: ["сон"],
        markers: ["sleep"],
        load: 4,
        fatigue: 5,
        focus: 6,
      })
    );

    const summary = await buildSummary(db, {
      from: "2026-04-01",
      to: "2026-04-08",
      window: "week",
    });

    assert.equal(summary.metrics.entries, 4);
    assert.equal(summary.metrics.valid_entries, 2);
    assert.equal(summary.metrics.sparse_entries, 1);
    assert.equal(summary.metrics.fallback_entries, 1);
    assert.equal(summary.metrics.density, 0.5);
    assert.equal(summary.metrics.avg_load, 6);
    assert.equal(summary.metrics.avg_fatigue, 6);
    assert.equal(summary.metrics.avg_focus, 4);
    assert.deepEqual(summary.metrics.metric_samples, {
      load: 2,
      fatigue: 2,
      focus: 2,
    });
    assert.equal(summary.topics["работа"], 2);
    assert.equal(summary.topics["дом"], 1);
    assert.equal(summary.topics["сон"], 1);
    assert.equal(summary.markers.deep_work, 1);
    assert.equal(summary.markers.sleep, 1);
    assert.equal(summary.gaps.total_missing_days, 4);
    assert.equal(summary.gaps.max_gap_days, 3);
    assert.equal(summary.recurrence.topics[0].name, "работа");
    assert.equal(summary.daily.find((day) => day.date === "2026-04-03").density, 0);
    assert.match(summary.observation, /тема|пропуски/);
  } finally {
    await db.close();
  }
});

test("analytics reads latest overrides through effective signals", async () => {
  const db = await createTestDb();

  try {
    const entryId = await addEntry(db, "entry-override", "2026-04-24", validSignal());

    await db.run(
      `
      INSERT INTO signal_overrides (entry_id, load, fatigue, focus, created_at)
      VALUES (?, ?, ?, ?, ?)
      `,
      [entryId, 2, null, null, "2026-04-24T12:00:00.000Z"]
    );

    const summary = await buildSummary(db, {
      from: "2026-04-24",
      to: "2026-04-24",
      window: "day",
    });

    assert.equal(summary.metrics.avg_load, 2);
    assert.equal(summary.metrics.avg_fatigue, 7);
    assert.equal(summary.metrics.avg_focus, 2);
  } finally {
    await db.close();
  }
});

test("mixed signal versions are explicit version boundaries", async () => {
  const db = await createTestDb();

  try {
    await addEntry(db, "entry-v1", "2026-04-23", validSignal());
    const entryId = await addEntry(db, "entry-v2", "2026-04-24", validSignal());

    await db.run(
      `
      UPDATE signals
      SET schema_version = ?
      WHERE entry_id = ?
      `,
      ["signal.v2", entryId]
    );

    const summary = await buildSummary(db, {
      from: "2026-04-23",
      to: "2026-04-24",
      window: "week",
    });

    assert.equal(summary.flags.mixed_version, true);
    assert.equal(summary.flags.version_boundary, true);
    assert.equal(summary.versions.boundaries.length, 1);
    assert.equal(summary.versions.boundaries[0].date, "2026-04-24");
    assert.match(summary.observation, /границу версий/);
  } finally {
    await db.close();
  }
});

test("empty analytics window returns null", async () => {
  const db = await createTestDb();

  try {
    const summary = await buildSummary(db, {
      from: "2026-04-01",
      to: "2026-04-07",
      window: "week",
    });

    assert.equal(summary, null);
  } finally {
    await db.close();
  }
});
