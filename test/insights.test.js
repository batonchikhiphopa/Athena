import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

import { createEntry } from "../server/services/entry.service.js";
import {
  deleteInsightSnapshot,
  getCurrentInsightSnapshots,
  listInsightSnapshots,
} from "../server/services/insight.service.js";

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

function validSignal(topic = "работа") {
  return {
    topics: [topic],
    activities: [],
    markers: [],
    load: 5,
    fatigue: null,
    focus: 6,
    signal_quality: "valid",
  };
}

function sparseSignal() {
  return {
    topics: ["идея"],
    activities: [],
    markers: [],
    load: null,
    fatigue: null,
    focus: null,
    signal_quality: "sparse",
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

test("current insights appear only for valid-day sufficiency", async () => {
  const db = await createTestDb();

  try {
    await addEntry(db, "day-valid", "2026-04-24", validSignal("сон"));
    await addEntry(db, "week-1", "2026-04-19", validSignal("работа"));
    await addEntry(db, "week-2", "2026-04-20", validSignal("работа"));
    await addEntry(db, "week-3", "2026-04-21", validSignal("работа"));
    await addEntry(db, "sparse-only", "2026-04-22", sparseSignal());

    const insights = await getCurrentInsightSnapshots(db, {
      today: "2026-04-25",
    });

    assert.deepEqual(
      insights.map((insight) => insight.layer),
      ["day", "week"],
    );
    assert.equal(insights[0].text, "Вчерашний день зафиксирован.");
    assert.equal(insights[1].text, "На неделе возвращалась тема: работа.");
  } finally {
    await db.close();
  }
});

test("week snapshot can remain visible after current sufficiency is lost", async () => {
  const db = await createTestDb();

  try {
    await addEntry(db, "entry-1", "2026-04-01", validSignal("работа"));
    await addEntry(db, "entry-2", "2026-04-02", validSignal("работа"));
    await addEntry(db, "entry-3", "2026-04-03", validSignal("работа"));
    await addEntry(db, "entry-4", "2026-04-04", validSignal("работа"));

    const initial = await getCurrentInsightSnapshots(db, {
      today: "2026-04-07",
    });

    assert.equal(initial.some((insight) => insight.layer === "week"), true);

    const retained = await getCurrentInsightSnapshots(db, {
      today: "2026-04-12",
    });

    assert.equal(retained.some((insight) => insight.layer === "week"), true);

    const expired = await getCurrentInsightSnapshots(db, {
      today: "2026-04-22",
    });

    assert.equal(expired.some((insight) => insight.layer === "week"), false);
  } finally {
    await db.close();
  }
});

test("insight history can hide deleted snapshots", async () => {
  const db = await createTestDb();

  try {
    await addEntry(db, "day-valid", "2026-04-24", validSignal("сон"));
    await addEntry(db, "week-1", "2026-04-19", validSignal("работа"));
    await addEntry(db, "week-2", "2026-04-20", validSignal("работа"));
    await addEntry(db, "week-3", "2026-04-21", validSignal("работа"));

    await getCurrentInsightSnapshots(db, {
      today: "2026-04-25",
    });

    const history = await listInsightSnapshots(db);
    const daySnapshot = history.find((insight) => insight.layer === "day");

    assert.ok(daySnapshot);
    assert.equal(await deleteInsightSnapshot(db, daySnapshot.id), true);
    assert.equal(await deleteInsightSnapshot(db, daySnapshot.id), false);

    const hiddenHistory = await listInsightSnapshots(db);
    const current = await getCurrentInsightSnapshots(db, {
      today: "2026-04-25",
    });

    assert.equal(
      hiddenHistory.some((insight) => insight.id === daySnapshot.id),
      false,
    );
    assert.equal(current.some((insight) => insight.layer === "day"), false);
  } finally {
    await db.close();
  }
});
