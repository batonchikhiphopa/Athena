import { useEffect, useState } from "react";
import type { ExtractionSettings } from "../../shared/contracts";
import type { Language } from "../../i18n/languages";
import { generateActivityInsights } from "./activityInsightApi";
import {
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

const ACTIVITY_INSIGHT_FINGERPRINT_VERSION = "activity-insight.v2";
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
            activities,
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

        if (extractionSettings.provider !== "gemini") return;

        const dirtyActivities = activities
          .filter(
            (activity) =>
              activity.insightInput.observationCount >= 2 &&
              activity.insightInput.rhythm !== "insufficient" &&
              cached.get(activity.id)?.fingerprint !==
                fingerprints.get(activity.id),
          )
          .slice(0, MAX_BATCH_SIZE);

        if (
          dirtyActivities.length === 0 ||
          !reserveActivityInsightGeneration()
        ) {
          return;
        }

        setIsRefreshing(true);
        const response = await generateActivityInsights({
          activities: dirtyActivities.map((activity) => activity.insightInput),
          language,
          model: extractionSettings.model,
        });
        const generatedAt = new Date().toISOString();
        const generated = response.insights.map((insight) => ({
          activityId: insight.activityId,
          confidence: insight.confidence,
          fingerprint: fingerprints.get(insight.activityId) ?? "",
          generatedAt,
          model: extractionSettings.model,
          status: insight.status,
          text: insight.text,
        } satisfies CachedActivityInsight));

        await saveActivityInsights(generated);
        if (cancelled) return;

        setInsights((current) => {
          const next = new Map(current);
          for (const insight of generated) {
            next.set(insight.activityId, { ...insight, isStale: false });
          }
          return next;
        });
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
      // A dispatched provider request is deliberately allowed to finish and be
      // cached. Cancelling it would still consume the daily attempt while
      // discarding the useful result.
      cancelled = true;
    };
  }, [activities, extractionSettings.model, extractionSettings.provider, isDemo, language]);

  return { error, insights, isLoading, isRefreshing };
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
          input: activity.insightInput,
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

async function hashValue(value: string) {
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );

  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
