import test from "node:test";
import assert from "node:assert/strict";

import { extractSignalForText } from "../client/src/features/extraction/extractSignalForText.ts";
import {
  GEMINI_DAILY_EXTRACTION_LIMIT,
  getRemainingGeminiDailyExtractions,
} from "../client/src/features/extraction/geminiQuota.ts";
import {
  CLIENT_ACTIVE_PROMPT_VERSION,
  CLIENT_ACTIVE_SCHEMA_VERSION,
} from "../client/src/features/extraction/signalVersions.ts";
import { validSignal } from "./signal-fixtures.js";

function createLocalStorageMock() {
  const values = new Map();

  return {
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, String(value)),
    get length() {
      return values.size;
    },
  };
}

test("failed Gemini extraction releases the local daily reservation", async () => {
  const previousLocalStorage = globalThis.localStorage;
  const previousFetch = globalThis.fetch;

  globalThis.localStorage = createLocalStorageMock();
  globalThis.fetch = async () => ({
    ok: false,
    status: 503,
    text: async () => "backend unavailable",
  });

  try {
    const result = await extractSignalForText("synthetic text", {
      provider: "gemini",
      model: "gemini-2.5-flash",
    });

    assert.equal(result.signal.signal_quality, "fallback");
    assert.equal(result.metadata.error_code, "backend_unavailable");
    assert.equal(
      getRemainingGeminiDailyExtractions(),
      GEMINI_DAILY_EXTRACTION_LIMIT,
    );
  } finally {
    globalThis.localStorage = previousLocalStorage;
    globalThis.fetch = previousFetch;
  }
});

test("successful Gemini extraction consumes one local daily attempt", async () => {
  const previousLocalStorage = globalThis.localStorage;
  const previousFetch = globalThis.fetch;

  globalThis.localStorage = createLocalStorageMock();
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      signal: validSignal(),
      metadata: {
        schema_version: CLIENT_ACTIVE_SCHEMA_VERSION,
        prompt_version: CLIENT_ACTIVE_PROMPT_VERSION,
        provider: "gemini",
        model: "gemini-2.5-flash",
        error_code: null,
        created_at: new Date().toISOString(),
      },
    }),
  });

  try {
    const result = await extractSignalForText("synthetic text", {
      provider: "gemini",
      model: "gemini-2.5-flash",
    });

    assert.equal(result.metadata.error_code, null);
    assert.equal(
      getRemainingGeminiDailyExtractions(),
      GEMINI_DAILY_EXTRACTION_LIMIT - 1,
    );
  } finally {
    globalThis.localStorage = previousLocalStorage;
    globalThis.fetch = previousFetch;
  }
});
