import test from "node:test";
import assert from "node:assert/strict";

import {
  mergeLocalEmotionSignals,
  normalizeEmotionClassifierOutput,
  requestContainsRawText,
} from "../client/src/features/emotion/localEmotion.ts";
import { fallbackSignal, validSignal } from "./signal-fixtures.js";

function extraction(signal) {
  return {
    signal,
    metadata: {
      schema_version: "signal.v3",
      prompt_version: "extraction.v4",
      provider: "off",
      model: "fallback",
      error_code: null,
    },
  };
}

test("local emotion output normalizes labels and keeps timing metadata", () => {
  const signals = normalizeEmotionClassifierOutput(
    [
      { label: "LABEL_Joy", score: 0.987654 },
      { label: "sadness", score: 0.12 },
    ],
    {
      cache: "cold",
      inferenceMs: 12.3,
      modelLoadMs: 99.8,
    },
  );

  assert.equal(signals.provider, "local_onnx_web");
  assert.equal(signals.top_label, "joy");
  assert.equal(signals.top_score, 0.9877);
  assert.equal(signals.labels.joy, 0.9877);
  assert.equal(signals.timings_ms.model_load, 100);
  assert.equal(signals.timings_ms.inference, 12);
  assert.equal(signals.privacy.raw_text_sent_to_server, false);
});

test("local emotion merge nudges state-derived metrics only", () => {
  const base = extraction(
    validSignal({
      load: 0,
      fatigue: 0,
      focus: 10,
    }),
  );
  const emotion = {
    ok: true,
    signals: normalizeEmotionClassifierOutput(
      [{ label: "fear", score: 0.7 }],
      {
        cache: "warm",
        inferenceMs: 5,
        modelLoadMs: 0,
      },
    ),
  };
  const merged = mergeLocalEmotionSignals(base, emotion);

  assert.equal(merged.signal.load, 6);
  assert.equal(merged.signal.fatigue, 5);
  assert.equal(merged.signal.focus, 4);
  assert.equal(merged.signal.emotion_signals.top_label, "fear");
  assert.match(merged.signal.quality_reason, /emotion_fear_load_focus/);
});

test("local emotion merge keeps fallback shape unchanged", () => {
  const base = extraction(fallbackSignal());
  const emotion = {
    ok: true,
    signals: normalizeEmotionClassifierOutput(
      [{ label: "joy", score: 0.7 }],
      {
        cache: "warm",
        inferenceMs: 5,
        modelLoadMs: 0,
      },
    ),
  };

  assert.deepEqual(mergeLocalEmotionSignals(base, emotion), base);
});

test("raw-text request guard detects accidental text transfer", () => {
  assert.equal(
    requestContainsRawText(
      "https://example.invalid/model.onnx",
      undefined,
      "raw diary text",
    ),
    false,
  );
  assert.equal(
    requestContainsRawText(
      "https://example.invalid/?q=raw%20diary%20text",
      undefined,
      "raw diary text",
    ),
    true,
  );
  assert.equal(
    requestContainsRawText(
      "https://example.invalid",
      { body: "raw diary text" },
      "raw diary text",
    ),
    true,
  );
});
