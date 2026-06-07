import test from "node:test";
import assert from "node:assert/strict";

import {
  mergeLocalEmotionSignals,
  normalizeEmotionClassifierOutput,
  requestContainsRawText,
} from "../client/src/features/emotion/localEmotion.ts";
import { extractSignalForText } from "../client/src/lib/extraction.ts";
import { fallbackSignal, validSignal } from "./signal-fixtures.js";

function extraction(signal) {
  return {
    signal,
    metadata: {
      schema_version: "signal.v4",
      prompt_version: "extraction.v5",
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

test("local emotion runtime is gated behind Russian interface language", async () => {
  const values = new Map([
    ["athena_local_emotion_spike_enabled", "true"],
    ["athena_language", "en"],
  ]);
  const previousLocalStorage = globalThis.localStorage;
  const previousFetch = globalThis.fetch;

  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
  };
  globalThis.fetch = async () => ({
    ok: false,
    status: 503,
    text: async () => "backend unavailable",
  });

  try {
    const result = await extractSignalForText("synthetic text", {
      provider: "off",
      model: "fallback",
    });

    assert.equal(result.signal.signal_quality, "fallback");
    assert.deepEqual(result.signal.emotion_signals, {});
  } finally {
    globalThis.localStorage = previousLocalStorage;
    globalThis.fetch = previousFetch;
  }
});
