import { useEffect } from "react";
import { wakeQueue } from "../../lib/queue";

type UseQueueWakeupsInput = {
  enabled: boolean;
};

export function useQueueWakeups({ enabled }: UseQueueWakeupsInput): void {
  useEffect(() => {
    if (!enabled) return;

    function wakeWhenOnline() {
      if (navigator.onLine) {
        wakeQueue();
      }
    }

    function wakeWhenFocused() {
      wakeQueue();
    }

    function wakeWhenVisible() {
      if (document.visibilityState === "visible") {
        wakeQueue();
      }
    }

    window.addEventListener("online", wakeWhenOnline);
    window.addEventListener("focus", wakeWhenFocused);
    document.addEventListener("visibilitychange", wakeWhenVisible);

    return () => {
      window.removeEventListener("online", wakeWhenOnline);
      window.removeEventListener("focus", wakeWhenFocused);
      document.removeEventListener("visibilitychange", wakeWhenVisible);
    };
  }, [enabled]);
}