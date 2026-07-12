import { useCallback, useEffect } from "react";
import type { ExtractionSettings } from "../shared/contracts";
import type { Page } from "./navigationTypes";
import { processPendingReextractEntries } from "../features/settings/pendingReextract";

type AthenaLifecycleOptions = {
  initializeDraft: () => Promise<void>;
  initializeExtractionSettings: () => Promise<ExtractionSettings>;
  refreshEntries: () => Promise<unknown>;
  refreshInsights: () => Promise<void>;
  refreshObservationHistory: () => Promise<unknown>;
  setPage: (page: Page) => void;
};

export function useAthenaLifecycle({
  initializeDraft,
  initializeExtractionSettings,
  refreshEntries,
  refreshInsights,
  refreshObservationHistory,
  setPage,
}: AthenaLifecycleOptions) {
  const initialize = useCallback(async () => {
    try {
      const nextExtractionSettings = await initializeExtractionSettings();

      await initializeDraft();
      setPage("editor");

      // Startup only enqueues persisted pending work. The queue itself starts
      // after first render through useSyncQueue(), so editor startup stays fast.
      await processPendingReextractEntries(nextExtractionSettings);

      await refreshEntries();
      await refreshInsights();
      await refreshObservationHistory();
    } catch (error) {
      console.error(error);
      await initializeDraft().catch((draftError) =>
        console.error("[editor:init]", draftError),
      );
    }
  }, [
    initializeDraft,
    initializeExtractionSettings,
    refreshEntries,
    refreshInsights,
    refreshObservationHistory,
    setPage,
  ]);

  useEffect(() => {
    void initialize();
  }, [initialize]);
}
