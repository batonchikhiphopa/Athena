import test from "node:test";
import assert from "node:assert/strict";

import { getEntryDebugBlocks } from "../client/src/components/entryDebugBlocks.ts";
import { validSignal } from "./signal-fixtures.js";

test("entry debug tooltip includes local self-report values", () => {
  const blocks = getEntryDebugBlocks({
    id: "entry-1",
    serverId: 12,
    text: "test",
    textUnavailable: false,
    entryDate: "2026-06-13",
    tags: [],
    analysisEnabled: true,
    sourceTextHash: "hash",
    signals: validSignal(),
    metadata: {
      schema_version: "signal.v4",
      prompt_version: "extraction.v5",
      provider: "off",
      model: "fallback",
      error_code: null,
      created_at: "2026-06-13T12:00:00.000Z",
    },
    syncStatus: "synced",
    createdAt: "2026-06-13T12:00:00.000Z",
    updatedAt: "2026-06-13T12:05:00.000Z",
    selfReport: {
      id: "self-report-1",
      entry_id: "entry-1",
      local_day: "2026-06-13",
      created_at: "2026-06-13T12:00:00.000Z",
      updated_at: "2026-06-13T12:05:00.000Z",
      schema_version: "self_report.v1",
      sync_status: "pending_sync",
      values: {
        mood: 7,
        stress: 3,
        energy: 6,
        sleep_quality: 4,
        function: 8,
      },
    },
  });
  const selfReportBlock = blocks.find((block) => block.title === "self report");
  const rowValue = (label) =>
    selfReportBlock?.rows.find((row) => row.label === label)?.value;

  assert.ok(selfReportBlock);
  assert.equal(rowValue("mood"), 7);
  assert.equal(rowValue("stress"), 3);
  assert.equal(rowValue("energy"), 6);
  assert.equal(rowValue("sleep_quality"), 4);
  assert.equal(rowValue("function"), 8);
  assert.equal(rowValue("local day"), "2026-06-13");
  assert.equal(rowValue("sync"), "pending_sync");
  assert.equal(rowValue("updated"), "2026-06-13T12:05:00.000Z");
});
