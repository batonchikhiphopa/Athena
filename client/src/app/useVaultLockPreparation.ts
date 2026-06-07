import { useCallback } from "react";
import { stopQueueForVaultLock } from "../features/sync/queue";

export function useVaultLockPreparation({
  clearAutosaveTimer,
  draftText,
  persistEditorText,
}: {
  clearAutosaveTimer: () => void;
  draftText: string;
  persistEditorText: (text: string) => Promise<void>;
}) {
  return useCallback(async () => {
    await stopQueueForVaultLock();
    clearAutosaveTimer();
    await persistEditorText(draftText);
  }, [clearAutosaveTimer, draftText, persistEditorText]);
}
