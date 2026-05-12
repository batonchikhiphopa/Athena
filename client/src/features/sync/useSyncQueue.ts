import { useEffect, useState } from "react";
import type { ExtractionSettings } from "../../types";
import {
  cancelQueueJob,
  getQueueSnapshot,
  pauseQueue,
  recoverStaleJobs,
  retryQueueJob,
  startQueue,
  subscribeToQueue,
  retryRecoverableQueueJobs,
} from "../../lib/queue";
import type { QueueSnapshot } from "../../lib/queueTypes";
import { registerSyncQueueHandlers } from "./syncQueue";

type UseSyncQueueInput = {
  extractionSettings: ExtractionSettings;
};

export function useSyncQueue({ extractionSettings }: UseSyncQueueInput) {
  const [snapshot, setSnapshot] = useState<QueueSnapshot>(() =>
    getQueueSnapshot(),
  );

  useEffect(() => {
    registerSyncQueueHandlers(extractionSettings);
  }, [extractionSettings]);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = subscribeToQueue((nextSnapshot) => {
      if (!cancelled) {
        setSnapshot(nextSnapshot);
      }
    });

    void recoverStaleJobs()
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
      unsubscribe();
    };
  }, []);

  return {
    snapshot,
    retry: retryQueueJob,
    cancel: cancelQueueJob,
    pause: pauseQueue,
    start: startQueue,
    retryRecoverable: retryRecoverableQueueJobs,
  };
}