import { useCallback, useEffect, useMemo, useState } from "react";
import type { ExtractionSettings } from "../../shared/contracts";
import type { Language } from "../../i18n/languages";
import { generateActivityInsights } from "./activityInsightApi";
import {
  deleteActivityInsight,
  loadActivityInsightCache,
  saveActivityInsights,
} from "./activityInsightCache";
import type {
  ActivityInsightState,
  ActivityInsightView,
  CachedActivityInsight,
} from "./activityInsightTypes";
import { reserveActivityInsightGeneration } from "./activityInsightQuota";
import type { ActivityGroup } from "./resultsTypes";
import { buildWeeklyReviewActivities } from "./reviewModel";

const ACTIVITY_INSIGHT_FINGERPRINT_VERSION = "activity-insight.v3";
const MAX_BATCH_SIZE = 8;

export function useActivityInsights({
  activities,
  extractionSettings,
  isDemo,
  language,
}: {
  activities: ActivityGroup[];
  extractionSettings: ExtractionSettings;
  isDemo: boolean;
  language: Language;
}): ActivityInsightState {
  const [insights, setInsights] = useState<Map<string, ActivityInsightView>>(
    () => new Map(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const reviewActivities = useMemo(
    () => buildWeeklyReviewActivities(activities),
    [activities],
  );

  useEffect(() => {
    let cancelled = false;

    if (isDemo) {
      setError(null);
      setInsights(new Map());
      setIsLoading(false);
      setIsRefreshing(false);
      return () => {
        cancelled = true;
      };
    }

    void (async () => {
      setError(null);
      setIsLoading(true);

      try {
        const [cached, fingerprints] = await Promise.all([
          loadActivityInsightCache(),
          createFingerprints(
            reviewActivities,
            language,
            extractionSettings.model,
          ),
        ]);
        if (cancelled) return;

        const visibleCache = new Map<string, ActivityInsightView>();
        for (const activity of activities) {
          const cachedInsight = cached.get(activity.id);
          if (!cachedInsight) continue;

          visibleCache.set(activity.id, {
            ...cachedInsight,
            isStale: cachedInsight.fingerprint !== fingerprints.get(activity.id),
          });
        }
        setInsights(visibleCache);
        setIsLoading(false);

      } catch (caughtError) {
        if (!cancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError
              : new Error("activity_insight_failed"),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activities, extractionSettings.model, isDemo, language, reviewActivities]);

  const formulateReview = useCallback(async () => {
    const eligibleActivities = reviewActivities
      .filter(
        (activity) =>
          activity.insightInput.observationCount >= 2 &&
          activity.insightInput.rhythm !== "insufficient",
      )
      .slice(0, MAX_BATCH_SIZE);

    if (
      isDemo ||
      extractionSettings.provider !== "gemini" ||
      eligibleActivities.length === 0
    ) {
      return;
    }

    if (!reserveActivityInsightGeneration()) {
      setError(new Error("activity_insight_daily_limit"));
      return;
    }

    setError(null);
    setIsRefreshing(true);

    try {
      const fingerprints = await createFingerprints(
        eligibleActivities,
        language,
        extractionSettings.model,
      );
      const response = await generateActivityInsights({
        activities: eligibleActivities.map(createShownReviewInsightInput),
        language,
        model: extractionSettings.model,
      });
      const generatedAt = new Date().toISOString();
      const generated = response.insights.map(
        (insight) =>
          ({
            activityId: insight.activityId,
            confidence: insight.confidence,
            fingerprint: fingerprints.get(insight.activityId) ?? "",
            generatedAt,
            model: extractionSettings.model,
            status: insight.status,
            text: insight.text,
            sources: insight.sources ?? [],
          }) satisfies CachedActivityInsight,
      );

      await saveActivityInsights(generated);
      setInsights((current) => {
        const next = new Map(current);
        for (const insight of generated) {
          next.set(insight.activityId, { ...insight, isStale: false });
        }
        return next;
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError
          : new Error("activity_insight_failed"),
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [
    extractionSettings.model,
    extractionSettings.provider,
    isDemo,
    language,
    reviewActivities,
  ]);

  const canFormulateReview =
    !isDemo &&
    extractionSettings.provider === "gemini" &&
    reviewActivities.some(
      (activity) =>
        activity.insightInput.observationCount >= 2 &&
        activity.insightInput.rhythm !== "insufficient",
    );

  const deleteInsight = useCallback(async (activityId: string) => {
    setError(null);

    try {
      await deleteActivityInsight(activityId);
      setInsights((current) => {
        const next = new Map(current);
        next.delete(activityId);
        return next;
      });
    } catch (caughtError) {
      const nextError =
        caughtError instanceof Error
          ? caughtError
          : new Error("activity_insight_delete_failed");
      setError(nextError);
    }
  }, []);

  return {
    canFormulateReview,
    deleteInsight,
    error,
    formulateReview,
    insights,
    isLoading,
    isRefreshing,
  };
}

async function createFingerprints(
  activities: ActivityGroup[],
  language: Language,
  model: string,
) {
  const values = await Promise.all(
    activities.map(async (activity) => {
      const fingerprint = await hashValue(
        JSON.stringify({
          input: createShownReviewInsightInput(activity),
          language,
          model,
          version: ACTIVITY_INSIGHT_FINGERPRINT_VERSION,
        }),
      );

      return [activity.id, fingerprint] as const;
    }),
  );

  return new Map(values);
}

export function createShownReviewInsightInput(activity: ActivityGroup) {
  return {
    ...activity.insightInput,
    burnoutRelation: "unclear" as const,
    recentContexts: activity.insightInput.recentContexts.map((context) => ({
      ...context,
      agency: "unknown" as const,
      blockers: [],
      effect: "unclear" as const,
      strategy: "unknown" as const,
    })),
  };
}

async function hashValue(value: string) {
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );

  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
