import assert from "node:assert/strict";
import test from "node:test";
import "fake-indexeddb/auto";
import {
  deleteActivityInsight,
  loadActivityInsightCache,
  saveActivityInsights,
} from "../client/src/features/results/activityInsightCache.ts";
import { setupVaultWithoutSecret } from "../client/src/features/vault/vaultApi.ts";
import { deleteCurrentAthenaDatabase } from "../client/src/platform/storage/athenaDb.ts";

const storage = new Map();

globalThis.localStorage = {
  clear() {
    storage.clear();
  },
  getItem(key) {
    return storage.get(key) ?? null;
  },
  key(index) {
    return Array.from(storage.keys())[index] ?? null;
  },
  removeItem(key) {
    storage.delete(key);
  },
  setItem(key, value) {
    storage.set(key, String(value));
  },
  get length() {
    return storage.size;
  },
};

test("an activity review can be deleted from the encrypted local cache", async () => {
  localStorage.clear();
  await setupVaultWithoutSecret();

  try {
    await saveActivityInsights([
      cachedInsight("athena", "Athena needs a concrete next step."),
      cachedInsight("job-search", "Job search needs a narrower experiment."),
    ]);

    await deleteActivityInsight("athena");

    const remaining = await loadActivityInsightCache();
    assert.equal(remaining.has("athena"), false);
    assert.equal(remaining.get("job-search")?.activityId, "job-search");
    assert.equal(
      remaining.get("job-search")?.sources?.[0]?.url,
      "https://example.com/advice",
    );
  } finally {
    await deleteCurrentAthenaDatabase();
  }
});

function cachedInsight(activityId, text) {
  return {
    activityId,
    confidence: "medium",
    fingerprint: `fingerprint-${activityId}`,
    generatedAt: "2026-07-17T12:00:00.000Z",
    model: "gemini-3.1-flash-lite",
    status: "ready",
    text,
    sources: [
      {
        title: "Example source",
        url: "https://example.com/advice",
      },
    ],
  };
}
