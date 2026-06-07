import test from "node:test";
import assert from "node:assert/strict";

import {
  filterEntriesByTags,
  getAvailableTags,
  normalizeTag,
  pruneUnavailableTags,
} from "../client/src/features/entries/entryFilters.ts";
import {
  createEntrySearchSnippet,
  normalizeSearchQuery,
  parseEntrySearchQuery,
  searchEntries,
  tokenizeSearchQuery,
} from "../client/src/features/entries/entrySearch.ts";

function entry(overrides = {}) {
  return {
    id: overrides.id ?? "entry-1",
    serverId: null,
    text: overrides.text ?? "",
    textUnavailable: false,
    entryDate: overrides.entryDate ?? "2026-05-03",
    tags: overrides.tags ?? [],
    analysisEnabled: true,
    sourceTextHash: "0".repeat(64),
    signals: {
      topics: [],
      activities: [],
      markers: [],
      state_inference: {},
      emotion_signals: {},
      metric_confidence: {
        load: "low",
        fatigue: "low",
        focus: "low",
      },
      quality_reason: "fallback",
      load: null,
      fatigue: null,
      focus: null,
      signal_quality: "fallback",
    },
    metadata: {
      schema_version: "signal.v4",
      prompt_version: "extraction.v5",
      provider: "off",
      model: "fallback",
      error_code: null,
    },
    syncStatus: "local_only",
    createdAt: "2026-05-03T10:00:00.000Z",
    updatedAt: "2026-05-03T10:00:00.000Z",
    ...overrides,
  };
}

test("entry tag filters normalize labels, count each entry once, and use AND/NOT semantics", () => {
  const entries = [
    entry({
      id: "one",
      tags: ["#Work", "work", "Deep Focus"],
      text: "first",
    }),
    entry({
      id: "two",
      tags: ["work", "sleep"],
      text: "second",
    }),
    entry({
      id: "three",
      tags: ["sleep"],
      text: "third",
    }),
  ];

  assert.equal(normalizeTag("  ##Deep   Focus  "), "deep focus");
  assert.deepEqual(getAvailableTags(entries), [
    { tag: "Deep Focus", count: 1 },
    { tag: "sleep", count: 2 },
    { tag: "Work", count: 2 },
  ]);
  assert.deepEqual(
    filterEntriesByTags(entries, ["work", "deep focus"]).map((item) => item.id),
    ["one"],
  );
  assert.deepEqual(
    filterEntriesByTags(entries, ["work"], ["sleep"]).map((item) => item.id),
    ["one"],
  );
});

test("entry tag pruning removes filters whose source tag disappeared", () => {
  const availableTags = [
    { tag: "Work", count: 2 },
    { tag: "sleep", count: 1 },
  ];

  assert.deepEqual(
    pruneUnavailableTags(["work", "missing", "#SLEEP"], availableTags),
    ["work", "#SLEEP"],
  );
  assert.deepEqual(pruneUnavailableTags(["missing"], []), []);
});

test("entry search parses text, dates, included tags, and excluded tags deterministically", () => {
  assert.equal(normalizeSearchQuery("  РАБОТА   над  "), "работа над");
  assert.deepEqual(tokenizeSearchQuery(" работа  работа над "), [
    "работа",
    "над",
  ]);
  assert.deepEqual(parseEntrySearchQuery("#Work -#Sleep not:#noise 2026-05-03 deep focus"), {
    raw: "#Work -#Sleep not:#noise 2026-05-03 deep focus",
    normalized: "#work -#sleep not:#noise 2026-05-03 deep focus",
    textTerms: ["deep", "focus"],
    dateTerms: ["2026-05-03"],
    includedTags: ["work"],
    excludedTags: ["sleep", "noise"],
  });
});

test("entry search ranks explicit date and tag matches above text matches", () => {
  const entries = [
    entry({
      id: "text",
      entryDate: "2026-05-01",
      text: "Сегодня была спокойная работа над проектом",
      tags: ["notes"],
    }),
    entry({
      id: "tag",
      entryDate: "2026-05-02",
      text: "Короткая запись",
      tags: ["работа"],
    }),
    entry({
      id: "date",
      entryDate: "2026-05-03",
      text: "Другая запись",
      tags: [],
    }),
  ];

  const tagResults = searchEntries(entries, "#работа");
  assert.deepEqual(tagResults.map((result) => result.entry.id), ["tag"]);
  assert.deepEqual(tagResults[0].matchedFields, ["tag"]);
  assert.deepEqual(tagResults[0].matches, [
    { field: "tag", value: "работа", score: 90 },
  ]);

  const dateResults = searchEntries(entries, "2026-05-03");
  assert.deepEqual(dateResults.map((result) => result.entry.id), ["date"]);
  assert.deepEqual(dateResults[0].matchedFields, ["date"]);

  const textResults = searchEntries(entries, "работа над");
  assert.deepEqual(textResults.map((result) => result.entry.id), ["text", "tag"]);
  assert.deepEqual(textResults[0].matchedFields, ["text"]);
});

test("entry search supports negated tag tokens without sending anything to backend", () => {
  const entries = [
    entry({ id: "work", text: "Deep work", tags: ["work"] }),
    entry({ id: "work-sleep", text: "Deep work after bad sleep", tags: ["work", "sleep"] }),
    entry({ id: "sleep", text: "Sleep notes", tags: ["sleep"] }),
  ];

  assert.deepEqual(
    searchEntries(entries, "#work -#sleep").map((result) => result.entry.id),
    ["work"],
  );
  assert.deepEqual(
    searchEntries(entries, "not:#sleep").map((result) => result.entry.id),
    ["work"],
  );
});

test("empty entry search preserves the existing entry order", () => {
  const entries = [
    entry({ id: "first" }),
    entry({ id: "second" }),
    entry({ id: "third" }),
  ];

  assert.deepEqual(
    searchEntries(entries, "   ").map((result) => result.entry.id),
    ["first", "second", "third"],
  );
});

test("entry search snippets are generated locally from text terms", () => {
  const snippet = createEntrySearchSnippet(
    "Сегодня была спокойная работа над проектом и нормальный фокус.",
    "работа над",
    42,
  );

  assert.deepEqual(snippet, {
    before: "… была спокойная ",
    match: "работа над",
    after: " проектом и норм…",
  });
  assert.equal(createEntrySearchSnippet("#work only", "#work"), null);
});

test("entry search keeps deterministic order on larger local datasets", () => {
  const entries = Array.from({ length: 1000 }, (_, index) =>
    entry({
      id: `entry-${String(index).padStart(4, "0")}`,
      entryDate: `2026-05-${String((index % 28) + 1).padStart(2, "0")}`,
      text:
        index % 10 === 0
          ? `Synthetic local search fixture with focus marker ${index}`
          : `Synthetic local search fixture ${index}`,
      tags: index % 15 === 0 ? ["focus", "sleep"] : index % 10 === 0 ? ["focus"] : ["notes"],
    }),
  );

  const startedAt = performance.now();
  const results = searchEntries(entries, "focus -#sleep");
  const elapsedMs = performance.now() - startedAt;

  assert.deepEqual(
    results.slice(0, 3).map((result) => result.entry.id),
    ["entry-0010", "entry-0020", "entry-0040"],
  );
  assert.ok(elapsedMs < 800, `search took ${elapsedMs}ms`);
});
