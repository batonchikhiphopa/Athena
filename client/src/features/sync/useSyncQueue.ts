import { useEffect, useState } from "react";
import type { ExtractionSettings } from "../../shared/contracts";
import {
  cancelQueueJob,
  clearQueueHistory,
  getQueueSnapshot,
  pauseQueue,
  recoverStaleJobs,
  retryQueueJob,
  startQueue,
  stopQueueForVaultLock,
  subscribeToQueue,
  retryRecoverableQueueJobs,
  wakeQueue,
} from "./queue";
import type { QueueSnapshot } from "./queueTypes";
import { registerSyncQueueHandlers } from "./syncQueue";
import { useQueueWakeups } from "./useQueueWakeups";

type UseSyncQueueInput = {
  extractionSettings: ExtractionSettings;
};

export function useSyncQueue({ extractionSettings }: UseSyncQueueInput) {
  const [snapshot, setSnapshot] = useState<QueueSnapshot>(() =>
    getQueueSnapshot(),
  );

  useQueueWakeups({ enabled: true });

  useEffect(() => {
    registerSyncQueueHandlers(extractionSettings);
    wakeQueue();
  }, [extractionSettings]);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = subscribeToQueue((nextSnapshot) => {
      if (!cancelled) {
        setSnapshot(nextSnapshot);
      }
    });

    void recoverStaleJobs()
      .then(() => clearQueueHistory())
      .then(() => {
        if (!cancelled) {
          setSnapshot(getQueueSnapshot());
          startQueue();
        }
      })
      .catch((error) => {
        console.warn("[queue:init]", error);
      });

    return () => {
      cancelled = true;
      void stopQueueForVaultLock();
      unsubscribe();
    };
  }, []);

  return {
    snapshot,
    retry: retryQueueJob,
    cancel: cancelQueueJob,
    clearHistory: clearQueueHistory,
    pause: pauseQueue,
    start: startQueue,
    retryRecoverable: retryRecoverableQueueJobs,
  };
}
