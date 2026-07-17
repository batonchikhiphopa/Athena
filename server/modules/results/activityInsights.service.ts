import type {
  ActivityInsight,
  ActivityInsightInput,
  ActivityInsightLanguage,
  ActivityInsightsRequest,
  ActivityInsightsResponse,
} from "../../../shared/contracts/index.js";
import {
  ActivityInsightsProviderError,
  requestActivityInsightsFromGemini,
} from "./activityInsights.provider.js";

const INSUFFICIENT_TEXT: Record<ActivityInsightLanguage, string> = {
  en: "So far this is only one separate episode, not enough to call it a pattern.",
  de: "Bisher ist das nur eine einzelne Episode und noch kein belastbares Muster.",
  ru: "Пока это только один отдельный эпизод — закономерность из него не получается.",
  uk: "Поки це лише один окремий епізод — закономірності з нього не виходить.",
};

export { ActivityInsightsProviderError } from "./activityInsights.provider.js";

export async function generateActivityInsights(
  request: ActivityInsightsRequest,
  quotaKey: string,
): Promise<ActivityInsightsResponse> {
  const insightsByActivity = new Map<string, ActivityInsight>();
  const providerActivities: ActivityInsightInput[] = [];

  for (const activity of request.activities) {
    if (hasInsufficientEvidence(activity)) {
      insightsByActivity.set(
        activity.id,
        createInsufficientInsight(activity.id, request.language),
      );
    } else {
      providerActivities.push(activity);
    }
  }

  if (providerActivities.length > 0) {
    const generated = await requestActivityInsightsFromGemini({
      activities: providerActivities,
      language: request.language,
      model: request.model,
      quotaKey,
    });

    for (const insight of generated) {
      insightsByActivity.set(insight.activityId, insight);
    }
  }

  return {
    insights: request.activities.map((activity) => {
      const insight = insightsByActivity.get(activity.id);
      if (!insight) {
        throw new ActivityInsightsProviderError("gemini_invalid_response", 502);
      }
      return insight;
    }),
  };
}

function hasInsufficientEvidence(activity: ActivityInsightInput): boolean {
  return activity.observationCount < 2 || activity.rhythm === "insufficient";
}

function createInsufficientInsight(
  activityId: string,
  language: ActivityInsightLanguage,
): ActivityInsight {
  return {
    activityId,
    text: INSUFFICIENT_TEXT[language],
    status: "insufficient",
    confidence: "low",
  };
}
