import test from "node:test";
import assert from "node:assert/strict";

import { buildActivityIndex } from "../client/src/features/results/resultsModel.ts";
import { validSignal } from "./signal-fixtures.js";

function entry({
  id,
  entryDate,
  activity = null,
  context = null,
  tags = [],
  text,
}) {
  const timestamp = `${entryDate}T12:00:00.000Z`;

  return {
    id,
    serverId: null,
    text,
    textUnavailable: false,
    entryDate,
    tags,
    analysisEnabled: true,
    sourceTextHash: id.padEnd(64, "0").slice(0, 64),
    signals: validSignal({
      activities: activity ? [activity] : [],
      activity_contexts: context && activity
        ? [{ activity, ...context }]
        : [],
    }),
    metadata: {
      schema_version: "signal.v5",
      prompt_version: "extraction.v7",
      provider: "gemini",
      model: "gemini-3.1-flash-lite",
      error_code: null,
      created_at: timestamp,
    },
    syncStatus: "synced",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

test("Results merges multilingual job-search aliases into one localized activity", () => {
  const entries = [
    entry({
      id: "job-hunting-entry",
      entryDate: "2026-07-16",
      activity: "job hunting",
      text: "Сегодня занимался job hunting.",
    }),
    entry({
      id: "job-search-entry",
      entryDate: "2026-07-14",
      activity: "поиск работы",
      text: "Продолжил поиск работы.",
    }),
    entry({
      id: "job-applications-entry",
      entryDate: "2026-07-13",
      activity: "Job and education applications",
      text: "Continued job and education applications.",
    }),
  ];

  const russianModel = buildActivityIndex(entries, "ru");
  const englishModel = buildActivityIndex(entries, "en");

  assert.equal(russianModel.isDemo, false);
  assert.equal(russianModel.activities.length, 1);
  assert.equal(russianModel.activities[0].id, "job search");
  assert.equal(russianModel.activities[0].kind, "task");
  assert.equal(russianModel.activities[0].label, "Поиск работы");
  assert.equal(russianModel.activities[0].latestEntryDate, "2026-07-16");
  assert.equal(russianModel.activities[0].mentions.length, 3);
  assert.deepEqual(
    russianModel.activities[0].mentions.map((mention) => mention.entryId),
    ["job-hunting-entry", "job-search-entry", "job-applications-entry"],
  );
  assert.equal(englishModel.activities[0].label, "Job search");
});

test("Results merges German-learning labels across entry languages", () => {
  const entries = [
    entry({
      id: "german-russian-entry",
      entryDate: "2026-07-16",
      activity: "изучение немецкого",
      text: "Продолжил изучение немецкого.",
    }),
    entry({
      id: "german-english-entry",
      entryDate: "2026-07-15",
      activity: "Learning German",
      text: "Continued learning German.",
    }),
    entry({
      id: "german-language-entry",
      entryDate: "2026-07-14",
      activity: "German language learning",
      text: "German language learning was the main practice today.",
    }),
  ];

  const russianModel = buildActivityIndex(entries, "ru");
  const germanModel = buildActivityIndex(entries, "de");

  assert.equal(russianModel.activities.length, 1);
  assert.equal(russianModel.activities[0].id, "german learning");
  assert.equal(russianModel.activities[0].kind, "activity");
  assert.equal(russianModel.activities[0].label, "Изучение немецкого");
  assert.equal(russianModel.activities[0].mentions.length, 3);
  assert.equal(germanModel.activities[0].label, "Deutsch lernen");
});

test("Results separates finite tasks from repeatable activities", () => {
  const model = buildActivityIndex(
    [
      entry({
        id: "german-study-entry",
        entryDate: "2026-07-16",
        activity: "изучение немецкого",
        text: "Каждый день продолжаю изучение немецкого.",
      }),
      entry({
        id: "lecture-entry",
        entryDate: "2026-07-15",
        activity: "посещение лекций",
        text: "Регулярно продолжаю посещение лекций.",
      }),
      entry({
        id: "athena-entry",
        entryDate: "2026-07-14",
        activity: "Athena",
        text: "В Athena закончил реализацию нового экрана приложения.",
      }),
    ],
    "ru",
  );

  assert.deepEqual(
    model.activities.map(({ kind, label }) => ({ kind, label })),
    [
      { kind: "activity", label: "Изучение немецкого" },
      { kind: "activity", label: "Посещение лекций" },
      { kind: "task", label: "Athena" },
    ],
  );
});

test("Results uses a specific project tag as task identity", () => {
  const model = buildActivityIndex(
    [
      entry({
        id: "athena-tab-entry",
        entryDate: "2026-07-17",
        activity: "Разработка новой вкладки",
        context: {
          kind: "task",
          event: "progressed",
          outcome: "partial",
          blockers: [],
          strategy: "adjusted",
          next_step: "vague",
          agency: "active",
          effect: "neutral",
          confidence: "high",
        },
        tags: ["athena", "it"],
        text: "Собрал новую вкладку приложения Athena и проверил интерфейс.",
      }),
      entry({
        id: "athena-direction-entry",
        entryDate: "2026-07-14",
        tags: ["athena"],
        text: "Для Athena стало яснее дальнейшее направление.",
      }),
    ],
    "ru",
  );

  assert.equal(model.activities.length, 1);
  assert.equal(model.activities[0].id, "athena");
  assert.equal(model.activities[0].label, "Athena");
  assert.equal(model.activities[0].kind, "task");
  assert.deepEqual(
    model.activities[0].mentions.map((mention) => mention.entryId),
    ["athena-tab-entry", "athena-direction-entry"],
  );
  assert.ok(
    model.activities[0].mentions.every((mention) =>
      mention.sources.includes("tag"),
    ),
  );
  assert.equal(model.activities[0].insightInput.recentContexts.length, 1);
});

test("Results does not turn broad or ambiguous tags into project tasks", () => {
  const broadTagModel = buildActivityIndex(
    [
      entry({
        id: "broad-it-entry",
        entryDate: "2026-07-17",
        tags: ["it"],
        text: "Разработал новую вкладку приложения.",
      }),
      entry({
        id: "subject-tag-entry",
        entryDate: "2026-07-16",
        tags: ["deutsch"],
        text: "Практиковал немецкий после лекции.",
      }),
    ],
    "ru",
  );
  const ambiguousTagModel = buildActivityIndex(
    [
      entry({
        id: "two-projects-entry",
        entryDate: "2026-07-17",
        tags: ["athena", "orphe"],
        text: "Переделал интерфейс и проверил сборку.",
      }),
    ],
    "ru",
  );

  assert.equal(broadTagModel.activities.length, 0);
  assert.equal(ambiguousTagModel.activities.length, 0);
});

test("Results carries deidentified activity-specific context into insights", () => {
  const contexts = [
    {
      kind: "task",
      event: "blocked",
      outcome: "missed",
      blockers: ["uncertainty"],
      strategy: "no_plan",
      next_step: "not_mentioned",
      agency: "passive",
      effect: "draining",
      confidence: "high",
    },
    {
      kind: "task",
      event: "progressed",
      outcome: "partial",
      blockers: [],
      strategy: "repeated_attempt",
      next_step: "not_mentioned",
      agency: "mixed",
      effect: "draining",
      confidence: "medium",
    },
    {
      kind: "task",
      event: "started",
      outcome: "none",
      blockers: [],
      strategy: "clear_plan",
      next_step: "explicit",
      agency: "active",
      effect: "neutral",
      confidence: "medium",
    },
  ];
  const model = buildActivityIndex(
    contexts.map((context, index) =>
      entry({
        id: `portfolio-${index}`,
        entryDate: `2026-07-${16 - index}`,
        activity: "редизайн портфолио",
        context,
        text: "Работал над редизайном портфолио.",
      }),
    ),
    "ru",
  );

  const activity = model.activities[0];
  assert.equal(activity.label, "Редизайн портфолио");
  assert.equal(activity.kind, "task");
  assert.equal(activity.insightInput.stage, "stalled");
  assert.equal(activity.insightInput.burnoutRelation, "draining");
  assert.equal(activity.insightInput.observationCount, 3);
  assert.equal(activity.insightInput.recentContexts.length, 3);
  assert.equal("activity" in activity.insightInput.recentContexts[0], false);
  assert.equal(activity.insightInput.recentContexts[0].strategy, "no_plan");
});
