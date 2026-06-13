import test from "node:test";
import assert from "node:assert/strict";

import {
  analyzeSignalContext,
  createDefaultSignalContext,
} from "../shared/contracts/signalAnalysis.ts";
import { extractSignal } from "../server/services/extraction.service.ts";
import { createEntry } from "../server/services/entry.service.ts";
import { createTestDb } from "./helpers/createTestDb.js";

test("signal context is deterministic, bounded, and textless", () => {
  const rawText =
    "Tomorrow I need to decide the next plan? This private sentence must not be copied.";
  const context = analyzeSignalContext(rawText, {
    entryDate: "2026-06-07",
    capturedAt: "2026-06-07T18:30:00.000Z",
  });
  const serialized = JSON.stringify(context);

  assert.equal(context.entry_intent.intent, "decision");
  assert.equal(context.entry_intent.confidence, "medium");
  assert.equal(context.structure_signal.has_question, true);
  assert.equal(context.structure_signal.has_plan, true);
  assert.equal(context.temporal_context.local_date, "2026-06-07");
  assert.equal(context.temporal_context.time_bucket, "evening");
  assert.equal(context.temporal_context.source, "created_at");
  assert.equal(serialized.includes("private sentence"), false);
  assert.equal(serialized.includes(rawText), false);
});

test("signal context defaults are explicit for legacy and fallback signals", () => {
  assert.deepEqual(createDefaultSignalContext(), {
    entry_intent: {
      intent: "unknown",
      confidence: "low",
      basis: [],
    },
    structure_signal: {
      density: "empty",
      coherence: "low",
      has_question: false,
      has_plan: false,
      basis: [],
    },
    temporal_context: {
      local_date: null,
      time_bucket: "unknown",
      source: "absent",
    },
  });
});

test("provider-off extraction still attaches deterministic signal context", async () => {
  const result = await extractSignal({
    text: "I am planning the next release tomorrow.",
    provider: "off",
    model: "fallback",
    entry_date: "2026-06-07",
    captured_at: "2026-06-07T08:15:00.000Z",
  });

  assert.equal(result.signal.signal_quality, "fallback");
  assert.equal(result.signal.entry_intent.intent, "planning");
  assert.equal(result.signal.structure_signal.has_plan, true);
  assert.equal(result.signal.temporal_context.time_bucket, "morning");
  assert.equal(result.metadata.schema_version, "signal.v4");
  assert.equal(result.metadata.prompt_version, "extraction.v5");
});

test("contextual fallback extraction can be persisted as an entry", async () => {
  const db = await createTestDb();

  try {
    const result = await extractSignal({
      text: "I am planning the next release tomorrow.",
      provider: "off",
      model: "fallback",
      entry_date: "2026-06-07",
      captured_at: "2026-06-07T08:15:00.000Z",
    });

    const entryId = await createEntry(db, {
      client_entry_id: "client-entry-contextual-fallback",
      entry_date: "2026-06-07",
      tags: [],
      source_text_hash: "f".repeat(64),
      signal: result.signal,
      metadata: result.metadata,
    });

    assert.equal(typeof entryId, "number");
  } finally {
    await db.close();
  }
});
