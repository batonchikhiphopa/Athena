import test from "node:test";
import assert from "node:assert/strict";

import {
  filterEntriesByTags,
  getAvailableTags,
  normalizeTag,
  pruneUnavailableTags,
} from "../client/src/features/entries/entryFilters.ts";
import {
  normalizeSearchQuery,
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
      load: null,
      fatigue: null,
      focus: null,
      signal_quality: "fallback",
    },
    metadata: {
      schema_version: "signal.v2",
      prompt_version: "extraction.v2",
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

test("entry search normalizes Cyrillic queries and ranks date/tag matches first", () => {
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

  assert.equal(normalizeSearchQuery("  РАБОТА   над  "), "работа над");
  assert.deepEqual(tokenizeSearchQuery(" работа  работа над "), [
    "работа",
    "над",
  ]);

  const tagResults = searchEntries(entries, "#работа");
  assert.deepEqual(tagResults.map((result) => result.entry.id), ["tag"]);
  assert.deepEqual(tagResults[0].matchedFields, ["tag"]);

  const dateResults = searchEntries(entries, "2026-05-03");
  assert.deepEqual(dateResults.map((result) => result.entry.id), ["date"]);
  assert.deepEqual(dateResults[0].matchedFields, ["date"]);

  const textResults = searchEntries(entries, "работа над");
  assert.deepEqual(textResults.map((result) => result.entry.id), ["text", "tag"]);
  assert.deepEqual(textResults[0].matchedFields, ["text"]);
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
