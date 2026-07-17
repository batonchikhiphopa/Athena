import test from "node:test";
import assert from "node:assert/strict";

import { requestActivityInsightsFromGemini } from "../server/modules/results/activityInsights.provider.ts";
import { generateActivityInsights } from "../server/modules/results/activityInsights.service.ts";

function activity(overrides = {}) {
  return {
    id: "local-athena-id",
    label: "Project Borealis",
    kind: "task",
    stage: "active",
    rhythm: "steady",
    burnoutRelation: "mixed",
    recentEvents: ["result", "mention"],
    recentContexts: [
      {
        kind: "task",
        event: "progressed",
        outcome: "partial",
        blockers: [],
        strategy: "adjusted",
        next_step: "explicit",
        agency: "active",
        effect: "neutral",
        confidence: "high",
      },
    ],
    evidenceCount: 3,
    observationCount: 3,
    spanDays: 6,
    ...overrides,
  };
}

test("activity insight provider removes local ids and labels before Gemini", async () => {
  const previousApiKey = process.env.GEMINI_API_KEY;
  const previousFetch = globalThis.fetch;
  let providerBody = "";

  process.env.GEMINI_API_KEY = "test-key";
  globalThis.fetch = async (_url, init) => {
    providerBody = String(init?.body ?? "");
    return new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    insights: [
                      {
                        activityId: "activity_1",
                        text: "Работа движется, но стратегия остаётся неровной. Следующий шаг уже назван.",
                        status: "ready",
                        confidence: "medium",
                      },
                    ],
                  }),
                },
              ],
            },
          },
        ],
      }),
      { headers: { "Content-Type": "application/json" }, status: 200 },
    );
  };

  try {
    const insights = await requestActivityInsightsFromGemini({
      activities: [activity()],
      language: "ru",
      model: "gemini-3.1-flash-lite",
      quotaKey: `test:${crypto.randomUUID()}`,
    });

    assert.equal(insights[0].activityId, "local-athena-id");
    assert.match(providerBody, /activity_1/);
    assert.doesNotMatch(providerBody, /local-athena-id/);
    assert.doesNotMatch(providerBody, /Project Borealis/);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousApiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousApiKey;
  }
});

test("insufficient activity insight is resolved without a provider key", async () => {
  const previousApiKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  try {
    const response = await generateActivityInsights(
      {
        activities: [
          activity({
            evidenceCount: 1,
            observationCount: 1,
            rhythm: "insufficient",
            spanDays: 0,
          }),
        ],
        language: "ru",
      },
      `test:${crypto.randomUUID()}`,
    );

    assert.equal(response.insights[0].status, "insufficient");
    assert.equal(response.insights[0].confidence, "low");
  } finally {
    if (previousApiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousApiKey;
  }
});
