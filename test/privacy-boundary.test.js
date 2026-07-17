import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { createEntrySchema } from "../server/modules/entries/entry.schema.js";
import { validSignal } from "./signal-fixtures.js";

function validPayload(overrides = {}) {
  return {
    client_entry_id: "client-entry-privacy",
    entry_date: "2026-04-24",
    tags: ["athena"],
    source_text_hash: "c".repeat(64),
    signal: validSignal(),
    ...overrides,
  };
}

test("entry API payload rejects raw text", () => {
  const parsed = createEntrySchema.safeParse(
    validPayload({
      text: "raw text must not reach the server",
    })
  );

  assert.equal(parsed.success, false);
});

test("entry API rejects incomplete Signal payloads", () => {
  const parsed = createEntrySchema.safeParse(
    validPayload({
      signal: {
        topics: ["работа"],
        activities: ["кодинг"],
        markers: ["deep_work"],
        load: 4,
        fatigue: null,
        focus: 7,
        signal_quality: "valid",
      },
    }),
  );

  assert.equal(parsed.success, false);
});

test("server boot does not start the extraction worker", async () => {
  const serverSource = await fs.readFile("./server/server.ts", "utf8");

  assert.equal(serverSource.includes("startExtractionWorker"), false);
});
