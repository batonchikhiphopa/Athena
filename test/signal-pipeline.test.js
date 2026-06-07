import test from "node:test";
import assert from "node:assert/strict";

import {
  ACTIVE_MODEL,
  ACTIVE_PROMPT_VERSION,
  ACTIVE_SCHEMA_VERSION,
} from "../server/config/versions.js";
import {
  appendEntrySignal,
  createEntry,
  getEntryById,
  listEntries,
} from "../server/services/entry.service.js";
import {
  createFallbackSignal,
  sanitizeSignalCandidate,
} from "../server/services/sanitization.service.js";
import { createTestDb } from "./helpers/createTestDb.js";
import { fallbackSignal, state, validSignal } from "./signal-fixtures.js";

test("invalid extraction output persists deterministic fallback without raw text", async () => {
  const db = await createTestDb();

  try {
    const invalidCandidate = {
      topics: [""],
      activities: [],
      markers: [],
      load: null,
      fatigue: null,
      focus: null,
      signal_quality: "sparse",
    };

    const sanitized = sanitizeSignalCandidate(invalidCandidate);
    assert.equal(sanitized.ok, false);

    const entryId = await createEntry(db, {
      client_entry_id: "client-entry-fallback",
      entry_date: "2026-04-24",
      tags: [],
      source_text_hash: "b".repeat(64),
      signal: invalidCandidate,
    });

    const finalizedEntry = await getEntryById(db, entryId);
    const storedSignal = await db.get(
      "SELECT * FROM signals WHERE entry_id = ?",
      [entryId]
    );

    assert.equal("text" in finalizedEntry, false);
    assert.equal(finalizedEntry.status, "fallback");
    assert.equal(storedSignal.source_text_hash, "b".repeat(64));
    assert.equal(storedSignal.signal_quality, "fallback");
    assert.equal(storedSignal.topics, "[]");
    assert.equal(storedSignal.activities, "[]");
    assert.equal(storedSignal.markers, "[]");
    assert.equal(storedSignal.state_inference, "{}");
    assert.equal(storedSignal.emotion_signals, "{}");
    assert.equal(
      storedSignal.metric_confidence,
      '{"load":"low","fatigue":"low","focus":"low"}',
    );
    assert.equal(storedSignal.quality_reason, "fallback");
    assert.equal(storedSignal.load, null);
    assert.equal(storedSignal.fatigue, null);
    assert.equal(storedSignal.focus, null);
    assert.equal(storedSignal.schema_version, ACTIVE_SCHEMA_VERSION);
    assert.equal(storedSignal.prompt_version, ACTIVE_PROMPT_VERSION);
    assert.equal(storedSignal.provider, "ollama");
    assert.equal(storedSignal.model, ACTIVE_MODEL);
    assert.equal(storedSignal.error_code, null);
  } finally {
    await db.close();
  }
});

test("client fallback payload shape remains valid", () => {
  assert.deepEqual(createFallbackSignal(), fallbackSignal());
});

test("fallback entry can receive a later signal for the same text hash", async () => {
  const db = await createTestDb();

  try {
    const entryId = await createEntry(db, {
      client_entry_id: "client-entry-retry",
      entry_date: "2026-04-24",
      tags: [],
      source_text_hash: "d".repeat(64),
      signal: createFallbackSignal(),
    });

    const updated = await appendEntrySignal(db, entryId, {
      source_text_hash: "d".repeat(64),
      signal: validSignal({
        topics: ["работа"],
        activities: ["кодинг"],
        markers: ["deep_work"],
        state_inference: {
          load: state("medium"),
          focus: state("high"),
        },
      }),
      metadata: {
        schema_version: ACTIVE_SCHEMA_VERSION,
        prompt_version: ACTIVE_PROMPT_VERSION,
        provider: "gemini",
        model: "gemini-2.5-flash-lite",
      },
    });
    const signalCount = await db.get(
      "SELECT COUNT(*) AS count FROM signals WHERE entry_id = ?",
      [entryId],
    );

    assert.equal(updated.status, "extracted");
    assert.equal(updated.signal.signal_quality, "valid");
    assert.equal(updated.signal.load, 5);
    assert.equal(updated.signal.focus, 8);
    assert.equal(updated.metadata.provider, "gemini");
    assert.equal(updated.metadata.error_code, null);
    assert.equal(signalCount.count, 2);
  } finally {
    await db.close();
  }
});

test("stored Signal v4 details round-trip through entry reads", async () => {
  const db = await createTestDb();

  try {
    const entryId = await createEntry(db, {
      client_entry_id: "client-entry-v4-details",
      entry_date: "2026-04-24",
      tags: [],
      source_text_hash: "e".repeat(64),
      signal: validSignal({
        state_inference: {
          distress: state("high", "medium", ["explicit pressure"]),
          agency: state("low", "low", ["stuck"]),
        },
      }),
      metadata: {
        schema_version: ACTIVE_SCHEMA_VERSION,
        prompt_version: ACTIVE_PROMPT_VERSION,
        provider: "gemini",
        model: "gemini-2.5-flash-lite",
      },
    });

    const entry = await getEntryById(db, entryId);
    const entries = await listEntries(db);
    const storedSignal = await db.get(
      "SELECT * FROM signals WHERE entry_id = ?",
      [entryId],
    );

    assert.equal(entry.metadata.schema_version, ACTIVE_SCHEMA_VERSION);
    assert.equal(entry.metadata.prompt_version, ACTIVE_PROMPT_VERSION);
    assert.equal(entry.metadata.provider, "gemini");
    assert.deepEqual(entry.signal.state_inference.distress, {
      level: "high",
      confidence: "medium",
      basis: ["explicit pressure"],
    });
    assert.equal(entry.signal.metric_confidence.load, "medium");
    assert.equal(entry.signal.quality_reason, "state_distress_high");
    assert.deepEqual(
      entries[0].signal.state_inference,
      entry.signal.state_inference,
    );
    assert.deepEqual(entries[0].signal.emotion_signals, {});
    assert.equal(entries[0].signal.metric_confidence.load, "medium");
    assert.equal(entries[0].signal.entry_intent.intent, "unknown");
    assert.equal(entries[0].signal.structure_signal.density, "empty");
    assert.equal(entries[0].signal.temporal_context.source, "absent");
    assert.equal(JSON.parse(storedSignal.state_inference).distress.level, "high");
    assert.equal(JSON.parse(storedSignal.metric_confidence).load, "medium");
    assert.equal(JSON.parse(storedSignal.entry_intent).intent, "unknown");
    assert.equal(JSON.parse(storedSignal.structure_signal).density, "empty");
    assert.equal(JSON.parse(storedSignal.temporal_context).source, "absent");
    assert.equal(storedSignal.quality_reason, "state_distress_high");
  } finally {
    await db.close();
  }
});

test("legacy stored signal rows normalize to current read shape", async () => {
  const db = await createTestDb();

  try {
    const now = "2026-04-24T10:00:00.000Z";
    const entry = await db.run(
      `
      INSERT INTO entries (
        client_entry_id,
        entry_date,
        created_at,
        updated_at,
        status,
        tags,
        source_text_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        "client-entry-legacy-row",
        "2026-04-24",
        now,
        now,
        "extracted",
        "[]",
        "f".repeat(64),
      ],
    );

    await db.run(
      `
      INSERT INTO signals (
        entry_id,
        source_text_hash,
        topics,
        activities,
        markers,
        load,
        fatigue,
        focus,
        signal_quality,
        schema_version,
        prompt_version,
        provider,
        model,
        error_code,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        entry.lastID,
        "f".repeat(64),
        '["legacy"]',
        "[]",
        "[]",
        5,
        null,
        6,
        "valid",
        "signal.v2",
        "extraction.v3",
        "ollama",
        "legacy-model",
        null,
        now,
      ],
    );

    const normalized = await getEntryById(db, entry.lastID);

    assert.deepEqual(normalized.signal.state_inference, {});
    assert.deepEqual(normalized.signal.emotion_signals, {});
    assert.deepEqual(normalized.signal.metric_confidence, {
      load: "low",
      fatigue: "low",
      focus: "low",
    });
    assert.equal(normalized.signal.quality_reason, "legacy_signal_v2");
    assert.equal(normalized.signal.load, 5);
    assert.equal(normalized.signal.focus, 6);
  } finally {
    await db.close();
  }
});
