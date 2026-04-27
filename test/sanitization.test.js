import test from "node:test";
import assert from "node:assert/strict";

import { sanitizeSignalCandidate } from "../server/services/sanitization.service.js";

function validCandidate(overrides = {}) {
  return {
    topics: ["работа"],
    activities: ["кодинг"],
    markers: ["deep_work"],
    load: 5,
    fatigue: null,
    focus: 7,
    signal_quality: "valid",
    ...overrides,
  };
}

test("accepts valid candidate", () => {
  const result = sanitizeSignalCandidate(validCandidate());

  assert.equal(result.ok, true);
  assert.equal(result.data.signal_quality, "valid");
});

test("rejects number as string", () => {
  const result = sanitizeSignalCandidate(
    validCandidate({
      load: "5",
    })
  );

  assert.equal(result.ok, false);
});

test("rejects invalid marker enum", () => {
  const result = sanitizeSignalCandidate(
    validCandidate({
      markers: ["random_marker"],
    })
  );

  assert.equal(result.ok, false);
});

test("rejects out-of-range score", () => {
  const result = sanitizeSignalCandidate(
    validCandidate({
      fatigue: 99,
    })
  );

  assert.equal(result.ok, false);
});

test("rejects missing required field", () => {
  const candidate = validCandidate();
  delete candidate.focus;

  const result = sanitizeSignalCandidate(candidate);

  assert.equal(result.ok, false);
});

test("rejects empty object", () => {
  const result = sanitizeSignalCandidate({});

  assert.equal(result.ok, false);
});

test("rejects structurally empty signal", () => {
  const result = sanitizeSignalCandidate({
    topics: [],
    activities: [],
    markers: [],
    load: null,
    fatigue: null,
    focus: null,
    signal_quality: "sparse",
  });

  assert.equal(result.ok, false);
});

test("rejects empty-string topic and activity values", () => {
  const result = sanitizeSignalCandidate(
    validCandidate({
      topics: [""],
      activities: [""],
    })
  );

  assert.equal(result.ok, false);
});

test("backend overrides AI signal_quality to sparse when no scores exist", () => {
  const result = sanitizeSignalCandidate(
    validCandidate({
      load: null,
      fatigue: null,
      focus: null,
      signal_quality: "valid",
    })
  );

  assert.equal(result.ok, true);
  assert.equal(result.data.signal_quality, "sparse");
});

test("backend overrides AI signal_quality to valid when score exists", () => {
  const result = sanitizeSignalCandidate(
    validCandidate({
      topics: [],
      activities: [],
      markers: [],
      load: 4,
      fatigue: null,
      focus: null,
      signal_quality: "sparse",
    })
  );

  assert.equal(result.ok, true);
  assert.equal(result.data.signal_quality, "valid");
});
