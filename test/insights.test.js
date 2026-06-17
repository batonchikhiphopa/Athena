import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

import { createEntry } from "../server/services/entry.service.js";
import {
  deleteInsightSnapshot,
  getCurrentInsightSnapshots,
  listInsightSnapshots,
} from "../server/services/insight.service.js";
import { createTestDb } from "./helpers/createTestDb.js";
import {
  fallbackSignal,
  sparseSignal as baseSparseSignal,
  state,
  validSignal as baseValidSignal,
} from "./signal-fixtures.js";

function validSignal(topic = "работа") {
  return baseValidSignal({
    topics: [topic],
    activities: [],
    markers: [],
  });
}

function sparseSignal() {
  return baseSparseSignal({
    topics: ["идея"],
    activities: [],
    markers: [],
  });
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

async function addLevelEntry(db, id, date, levels, topic = "работа") {
  return addEntry(
    db,
    id,
    date,
    baseValidSignal({
      topics: [topic],
      activities: [],
      markers: [],
      state_inference: {
        fatigue: state(levels.fatigue ?? "medium"),
        focus: state(levels.focus ?? "medium"),
        load: state(levels.load ?? "medium"),
      },
    }),
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
    assert.equal(insights[0].topic, "сон");
    assert.match(insights[0].text, /^Наблюдение:/);
    assert.match(insights[0].text, /Ограничение:/);
    assert.match(insights[0].text, /Маленький шаг:/);
    assert.match(insights[0].text, /тема сна/);
    assert.equal(insights[1].topic, "работа");
    assert.match(insights[1].text, /тема работы/);
    assert.match(insights[1].text, /Ограничение:/);
  } finally {
    await db.close();
  }
});

test("week insight sufficiency starts at three distinct valid days", async () => {
  const db = await createTestDb();

  try {
    await addEntry(db, "week-1", "2026-06-08", validSignal("работа"));
    await addEntry(db, "week-2", "2026-06-09", validSignal("работа"));

    const insufficient = await getCurrentInsightSnapshots(db, {
      today: "2026-06-13",
    });

    assert.equal(
      insufficient.some((insight) => insight.layer === "week"),
      false,
    );

    await addEntry(db, "week-3", "2026-06-11", validSignal("работа"));

    const sufficient = await getCurrentInsightSnapshots(db, {
      today: "2026-06-13",
    });

    assert.equal(
      sufficient.some((insight) => insight.layer === "week"),
      true,
    );
  } finally {
    await db.close();
  }
});

test("self-report evidence can produce insights when extraction falls back", async () => {
  const db = await createTestDb();

  try {
    for (const [index, date] of eachDateInRange("2026-06-08", "2026-06-10").entries()) {
      await addEntry(db, `fallback-${date}`, date, fallbackSignal());
      await addSelfReportAggregate(db, date, "function", 8 + index);
    }

    const insights = await getCurrentInsightSnapshots(db, {
      today: "2026-06-14",
    });
    const week = insights.find((insight) => insight.layer === "week");

    assert.ok(week);
    assert.match(week.text, /повседневная функциональность/);
    assert.match(week.text, /опора здесь на самооценку/);
  } finally {
    await db.close();
  }
});

test("Insight V3 grounds snapshots in Analytics V2 evidence packs", async () => {
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

    for (const [index, date] of eachDateInRange("2026-04-29", "2026-05-05").entries()) {
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
        "работа",
      );
      await addSelfReportAggregate(db, date, "stress", shifted ? 8 : 4);
    }

    const insights = await getCurrentInsightSnapshots(db, {
      today: "2026-05-05",
    });
    const week = insights.find((insight) => insight.layer === "week");

    assert.ok(week);
    assert.match(week.text, /^Наблюдение:/);
    assert.match(week.text, /выше своего обычного уровня/);
    assert.match(week.text, /линия растет/);
    assert.match(week.text, /самооценка/);
    assert.match(week.text, /Поддержка:/);
    assert.match(week.text, /Интерпретация:/);
    assert.match(week.text, /измерение:/);
    assert.match(week.text, /качество:/);
    assert.match(week.text, /Ограничение: это наблюдение, не причина/);
    assert.match(week.text, /Маленький шаг:/);
    assert.doesNotMatch(week.text.toLowerCase(), /диагноз|депресс|клиническ/);
  } finally {
    await db.close();
  }
});

test("Insight V3 keeps low-density wording explicit", async () => {
  const db = await createTestDb();

  try {
    for (const date of eachDateInRange("2026-04-06", "2026-04-19")) {
      await addLevelEntry(db, `month-valid-${date}`, date, {
        load: "medium",
      });
    }

    const insights = await getCurrentInsightSnapshots(db, {
      today: "2026-05-05",
    });
    const month = insights.find((insight) => insight.layer === "month");

    assert.ok(month);
    assert.match(month.text, /Ограничение: плотность валидных сигналов снижена/);
  } finally {
    await db.close();
  }
});

test("old snapshot history still renders stored text", async () => {
  const db = await createTestDb();

  try {
    await db.run(
      `
      INSERT INTO insight_snapshots (
        layer,
        period_start,
        period_end,
        topic,
        text,
        generated_at,
        expires_at,
        schema_version,
        prompt_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        "week",
        "2026-04-01",
        "2026-04-07",
        "работа",
        "На этой неделе снова возвращалась тема работы. Старый текст.",
        "2026-04-08T00:00:00.000Z",
        "2026-04-21",
        "signal.v4",
        "extraction.v5",
      ],
    );

    const history = await listInsightSnapshots(db);

    assert.equal(history.length, 1);
    assert.equal(
      history[0].text,
      "На этой неделе снова возвращалась тема работы. Старый текст.",
    );
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
