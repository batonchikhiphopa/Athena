import test from "node:test";
import assert from "node:assert/strict";

import { mapSignalCandidate } from "../shared/signal/signalMapper.js";
import { sanitizeSignalCandidate } from "../server/modules/extraction/sanitization.service.js";
import { metricConfidence, sparseSignal, state, validSignal } from "./signal-fixtures.js";

test("accepts valid Signal v5 candidate", () => {
  const result = sanitizeSignalCandidate(validSignal());

  assert.equal(result.ok, true);
  assert.equal(result.data.signal_quality, "valid");
  assert.equal(result.data.load, 5);
  assert.equal(result.data.metric_confidence.load, "medium");
});

test("keeps only activity-specific contexts that match extracted activities", () => {
  const result = sanitizeSignalCandidate(
    validSignal({
      activities: ["Поиск работы"],
      activity_contexts: [
        {
          activity: "поиск работы",
          kind: "task",
          event: "progressed",
          outcome: "partial",
          blockers: ["uncertainty"],
          strategy: "clear_plan",
          next_step: "explicit",
          agency: "active",
          effect: "draining",
          confidence: "medium",
        },
      ],
    }),
  );

  assert.equal(result.ok, true);
  assert.equal(result.data.activity_contexts[0].activity, "Поиск работы");
  assert.equal(result.data.activity_contexts[0].event, "progressed");
});

test("rejects number as string", () => {
  const result = sanitizeSignalCandidate(
    validSignal({
      load: "5",
    }),
  );

  assert.equal(result.ok, false);
});

test("rejects invalid marker enum", () => {
  const result = sanitizeSignalCandidate(
    validSignal({
      markers: ["random_marker"],
    }),
  );

  assert.equal(result.ok, false);
});

test("rejects out-of-range score", () => {
  const result = sanitizeSignalCandidate(
    validSignal({
      fatigue: 99,
    }),
  );

  assert.equal(result.ok, false);
});

test("rejects missing required field", () => {
  const candidate = validSignal();
  delete candidate.focus;

  const result = sanitizeSignalCandidate(candidate);

  assert.equal(result.ok, false);
});

test("rejects empty object", () => {
  const result = sanitizeSignalCandidate({});

  assert.equal(result.ok, false);
});

test("rejects structurally empty signal", () => {
  const result = sanitizeSignalCandidate(
    sparseSignal({
      topics: [],
      activities: [],
      markers: [],
      quality_reason: "no_relevant_signal",
    }),
  );

  assert.equal(result.ok, false);
});

test("rejects empty-string topic and activity values", () => {
  const result = sanitizeSignalCandidate(
    validSignal({
      topics: [""],
      activities: [""],
    }),
  );

  assert.equal(result.ok, false);
});

test("rejects unknown top-level fields", () => {
  const result = sanitizeSignalCandidate(
    validSignal({
      baseline_deviation: 3,
    }),
  );

  assert.equal(result.ok, false);
});

test("rejects unknown state axes and invalid confidence levels", () => {
  const unknownAxis = sanitizeSignalCandidate(
    validSignal({
      state_inference: {
        distress: state("high"),
        unknown_axis: state("medium"),
      },
    }),
  );
  const invalidConfidence = sanitizeSignalCandidate(
    validSignal({
      state_inference: {
        distress: state("high", "certain"),
      },
    }),
  );

  assert.equal(unknownAxis.ok, false);
  assert.equal(invalidConfidence.ok, false);
});

test("backend maps text-only context to sparse", () => {
  const result = sanitizeSignalCandidate(
    sparseSignal({
      topics: ["сон"],
      markers: ["sleep_issue", "late_night_ideas"],
      signal_quality: "valid",
    }),
  );

  assert.equal(result.ok, true);
  assert.deepEqual(result.data.markers, ["sleep_issue", "late_night_ideas"]);
  assert.equal(result.data.signal_quality, "sparse");
});

test("mapper produces metrics for distress, self-attack, and avoidance evidence", () => {
  const mapped = mapSignalCandidate(
    validSignal({
      topics: [],
      activities: [],
      markers: [],
      state_inference: {
        distress: state("high"),
        self_attack: state("high", "high"),
        avoidance: state("medium"),
      },
      metric_confidence: metricConfidence("low"),
      quality_reason: "model_supplied_reason",
      load: 0,
      fatigue: null,
      focus: 10,
      signal_quality: "sparse",
    }),
  );

  assert.equal(mapped.signal_quality, "valid");
  assert.equal(mapped.load >= 7, true);
  assert.equal(mapped.focus <= 4, true);
  assert.equal(mapped.metric_confidence.load, "high");
  assert.equal(mapped.quality_reason, "state_self_attack_high");
});

test("mapper abstains on dry entries with no relevant signal", () => {
  const mapped = mapSignalCandidate(
    sparseSignal({
      topics: [],
      activities: [],
      markers: [],
      quality_reason: "model_supplied_reason",
    }),
  );

  assert.equal(mapped.load, null);
  assert.equal(mapped.fatigue, null);
  assert.equal(mapped.focus, null);
  assert.equal(mapped.signal_quality, "fallback");
  assert.equal(mapped.quality_reason, "no_relevant_signal");
});
