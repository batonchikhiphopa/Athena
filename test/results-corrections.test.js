import test from "node:test";
import assert from "node:assert/strict";

import { buildActivityIndex } from "../client/src/features/results/resultsModel.ts";
import {
  buildCanonicalActivityIndex,
  buildExtractionProposals,
  normalizeResultsCustomization,
} from "../client/src/features/results/resultsCorrections.ts";
import {
  buildDeterministicReviews,
  formatReviewItemFacts,
} from "../client/src/features/results/reviewModel.ts";
import { createShownReviewInsightInput } from "../client/src/features/results/useActivityInsights.ts";
import { buildActivityOptimizationObservations } from "../client/src/features/insights/content/activityOptimizationObservations.ts";
import { validSignal } from "./signal-fixtures.js";

function entry({ id, entryDate, event, activity = "Athena" }) {
  const timestamp = `${entryDate}T12:00:00.000Z`;
  return {
    id,
    serverId: null,
    text: `Работа над ${activity}: ${event}.`,
    textUnavailable: false,
    entryDate,
    tags: [],
    analysisEnabled: true,
    sourceTextHash: id.padEnd(64, "0").slice(0, 64),
    signals: validSignal({
      activities: [activity],
      activity_contexts: [
        {
          activity,
          kind: "task",
          event,
          outcome: event === "completed" ? "achieved" : "partial",
          blockers: event === "blocked" ? ["technical"] : [],
          strategy: "clear_plan",
          next_step: event === "completed" ? "not_mentioned" : "explicit",
          agency: "active",
          effect: "neutral",
          confidence: "high",
        },
      ],
    }),
    metadata: {
      schema_version: "signal.v5",
      prompt_version: "extraction.v7",
      provider: "gemini",
      model: "gemini-3.1-flash-lite",
      error_code: null,
      created_at: timestamp,
    },
    syncStatus: "synced",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

const emptyCustomization = {
  version: 1,
  entities: [],
  decisions: [],
  manualLinks: [],
};

test("new machine work items stay pending until the user accepts them", () => {
  const entries = [
    entry({ id: "athena-1", entryDate: "2026-07-17", event: "progressed" }),
  ];
  const machineIndex = buildActivityIndex(entries, "ru");
  const proposals = buildExtractionProposals(
    machineIndex,
    emptyCustomization,
  );
  const canonical = buildCanonicalActivityIndex({
    customization: emptyCustomization,
    entries,
    machineIndex,
    proposals,
  });

  assert.equal(proposals.length, 1);
  assert.equal(proposals[0].status, "pending");
  assert.equal(proposals[0].proposedEvent, "progressed");
  assert.equal(proposals[0].confidence, "high");
  assert.equal(proposals[0].sourceEntryId, "athena-1");
  assert.equal(canonical.activities.length, 0);
});

test("the user entity is canonical and an automatic source link can be rejected", () => {
  const entries = [
    entry({ id: "athena-2", entryDate: "2026-07-17", event: "blocked" }),
    entry({ id: "athena-1", entryDate: "2026-07-16", event: "progressed" }),
  ];
  const originalSignals = structuredClone(entries.map((value) => value.signals));
  const machineIndex = buildActivityIndex(entries, "ru");
  const entity = {
    id: "athena-canonical",
    label: "Athena — каноническое дело",
    kind: "task",
    aliases: ["Athena"],
    createdAt: "2026-07-17T12:00:00.000Z",
    updatedAt: "2026-07-17T12:00:00.000Z",
  };
  const acceptedCustomization = {
    ...emptyCustomization,
    entities: [entity],
  };
  const acceptedProposals = buildExtractionProposals(
    machineIndex,
    acceptedCustomization,
  );
  const rejectedProposal = acceptedProposals.find(
    (proposal) => proposal.sourceEntryId === "athena-2",
  );
  const correctedCustomization = {
    ...acceptedCustomization,
    decisions: [
      {
        proposalId: rejectedProposal.id,
        status: "rejected",
        entityId: entity.id,
        correctedEvent: null,
        updatedAt: "2026-07-17T13:00:00.000Z",
      },
    ],
  };
  const proposals = buildExtractionProposals(
    machineIndex,
    correctedCustomization,
  );
  const canonical = buildCanonicalActivityIndex({
    customization: correctedCustomization,
    entries,
    machineIndex,
    proposals,
  });

  assert.equal(proposals.find((value) => value.id === rejectedProposal.id).status, "rejected");
  assert.equal(canonical.activities.length, 1);
  assert.equal(canonical.activities[0].label, entity.label);
  assert.equal(canonical.activities[0].mentions.length, 1);
  assert.equal(canonical.activities[0].mentions[0].entryId, "athena-1");
  assert.deepEqual(
    entries.map((value) => value.signals),
    originalSignals,
    "source extraction must remain unchanged",
  );
});

test("a Results tag rule automatically attaches matching analyzable entries", () => {
  const matching = entry({
    id: "tagged-1",
    entryDate: "2026-07-17",
    event: "progressed",
    activity: "Другое дело",
  });
  matching.tags = ["Athena Work"];
  const excluded = entry({
    id: "tagged-private",
    entryDate: "2026-07-16",
    event: "blocked",
    activity: "Другое дело",
  });
  excluded.tags = ["#athena work"];
  excluded.analysisEnabled = false;

  const entries = [matching, excluded];
  const machineIndex = buildActivityIndex(entries, "ru");
  const customization = {
    ...emptyCustomization,
    entities: [
      {
        id: "athena",
        label: "Athena",
        kind: "task",
        aliases: [],
        monitoringTags: ["athena work"],
        createdAt: "2026-07-17T12:00:00.000Z",
        updatedAt: "2026-07-17T12:00:00.000Z",
      },
    ],
  };
  const proposals = buildExtractionProposals(machineIndex, customization);
  const canonical = buildCanonicalActivityIndex({
    customization,
    entries,
    machineIndex,
    proposals,
  });

  assert.equal(canonical.activities.length, 1);
  assert.equal(canonical.activities[0].mentions.length, 1);
  assert.equal(canonical.activities[0].mentions[0].entryId, "tagged-1");
  assert.equal(canonical.activities[0].mentions[0].context.event, "unknown");
  assert.deepEqual(canonical.activities[0].mentions[0].sources, ["tag"]);
});

test("stored Results entities without tag rules remain compatible", () => {
  const normalized = normalizeResultsCustomization({
    ...emptyCustomization,
    entities: [
      {
        id: "athena",
        label: "Athena",
        kind: "task",
        aliases: ["Athena app"],
        createdAt: "2026-07-17T12:00:00.000Z",
        updatedAt: "2026-07-17T12:00:00.000Z",
      },
    ],
  });

  assert.deepEqual(normalized.entities[0].monitoringTags, []);
  assert.equal(normalized.entities[0].parentId, null);
  assert.equal(normalized.entities[0].priority, 0);
});

test("activity optimisation observations remain tied to confirmed Results facts", () => {
  const activities = [
    {
      id: "read-aloud",
      label: "Читать вслух",
      mentions: [{ marker: null }],
    },
    {
      id: "write-texts",
      label: "Писать тексты",
      mentions: [{ marker: null }],
    },
    {
      id: "dota",
      label: "Играть в Dota",
      mentions: [{ marker: null }],
    },
  ];
  const entities = [
    { id: "read-aloud", parentId: "write-texts", priority: 1 },
    { id: "write-texts", parentId: null, priority: 2 },
    { id: "dota", parentId: null, priority: 0 },
  ];

  const observations = buildActivityOptimizationObservations(activities, entities, "ru");

  assert.equal(observations.length, 1);
  assert.match(observations[0].facts, /Читать вслух/);
  assert.match(observations[0].recommendation, /дочерний шаг/);
});

test("daily and weekly reviews answer deterministic movement questions", () => {
  const entries = [
    entry({ id: "athena-2", entryDate: "2026-07-17", event: "completed" }),
    entry({ id: "athena-1", entryDate: "2026-07-16", event: "blocked" }),
  ];
  const machineIndex = buildActivityIndex(entries, "ru");
  const customization = {
    ...emptyCustomization,
    entities: [
      {
        id: "athena",
        label: "Athena",
        kind: "task",
        aliases: ["Athena"],
        createdAt: "2026-07-17T12:00:00.000Z",
        updatedAt: "2026-07-17T12:00:00.000Z",
      },
    ],
  };
  const proposals = buildExtractionProposals(machineIndex, customization);
  const canonical = buildCanonicalActivityIndex({
    customization,
    entries,
    machineIndex,
    proposals,
  });
  const [daily, weekly] = buildDeterministicReviews(
    canonical.activities,
    "ru",
    "2026-07-17",
  );

  assert.equal(daily.sections.completed.length, 1);
  assert.equal(daily.sections.moved.length, 1);
  assert.equal(weekly.sections.blocked.length, 1);
  assert.equal(weekly.sections.repeated.length, 0);
  assert.match(weekly.items[0].summary, /Результатов — 1/);
  assert.equal(
    formatReviewItemFacts(weekly.items[0], "ru"),
    "Упоминаний — 2. Результатов — 1; эпизодов с препятствием — 1.",
    "Results should show facts inside the owning item without repeating its label",
  );

  const aiInput = createShownReviewInsightInput(canonical.activities[0]);
  assert.equal(aiInput.burnoutRelation, "unclear");
  assert.equal(aiInput.recentContexts[0].strategy, "unknown");
  assert.equal(aiInput.recentContexts[0].agency, "unknown");
  assert.equal(aiInput.recentContexts[0].effect, "unclear");
  assert.deepEqual(aiInput.recentContexts[0].blockers, []);
});
