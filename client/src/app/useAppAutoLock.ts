import { useCallback, useEffect, useState } from "react";
import {
  APP_LOCK_AUTO_LOCK_CHANGED_EVENT,
  getAppLockAutoLockDelayMs,
  getAppLockAutoLockPreference,
  setAppLockAutoLockPreference,
  type AppLockAutoLockPreference,
} from "../lib/appLock";

export function useAppAutoLockPreference() {
  const [autoLockPreference, setAutoLockPreferenceState] = useState(() =>
    getAppLockAutoLockPreference(),
  );

  const changeAutoLockPreference = useCallback(
    (nextPreference: AppLockAutoLockPreference) => {
      setAppLockAutoLockPreference(nextPreference);
      setAutoLockPreferenceState(nextPreference);
    },
    [],
  );

  useEffect(() => {
    function handleAutoLockPreferenceChange() {
      setAutoLockPreferenceState(getAppLockAutoLockPreference());
    }

    window.addEventListener(
      APP_LOCK_AUTO_LOCK_CHANGED_EVENT,
      handleAutoLockPreferenceChange,
    );

    return () => {
      window.removeEventListener(
        APP_LOCK_AUTO_LOCK_CHANGED_EVENT,
        handleAutoLockPreferenceChange,
      );
    };
  }, []);

  return { autoLockPreference, changeAutoLockPreference };
}

export function useAthenaAutoLock({
  appProtectionEnabled,
  autoLockPreference,
  onLock,
}: {
  appProtectionEnabled: boolean;
  autoLockPreference: AppLockAutoLockPreference;
  onLock: () => void;
}) {
  useEffect(() => {
    if (!appProtectionEnabled || autoLockPreference === "never") {
      return;
    }

    if (autoLockPreference === "on_hide") {
      function handleVisibilityChange() {
        if (document.visibilityState === "hidden") {
          onLock();
        }
      }

      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }

    const delayMs = getAppLockAutoLockDelayMs(autoLockPreference);

    if (!delayMs) {
      return;
    }

    const autoLockDelayMs = delayMs;
    let timeoutId = window.setTimeout(onLock, autoLockDelayMs);
    const activityEvents = ["pointerdown", "keydown", "wheel", "touchstart"];

    function refreshTimer() {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(onLock, autoLockDelayMs);
    }

    for (const eventName of activityEvents) {
      window.addEventListener(eventName, refreshTimer, { passive: true });
    }

    return () => {
      window.clearTimeout(timeoutId);

      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, refreshTimer);
      }
    };
  }, [appProtectionEnabled, autoLockPreference, onLock]);
}
