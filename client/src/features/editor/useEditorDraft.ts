import { useCallback, useEffect, useRef, useState } from "react";
import type { EntryView, LocalEntry } from "../../types";
import { deleteServerEntry } from "../../lib/api";
import { todayDateOnly } from "../../lib/dates";
import { createFallbackMetadata, createFallbackSignal } from "../../lib/signals";
import {
  clearLocalDraft,
  createClientEntryId,
  createTextHash,
  deleteLocalEntry,
  getLocalEntry,
  migrateLegacyDraftToIndexedDb,
  saveLocalEntry,
  updateLocalEntry,
} from "../../lib/storage";
import { extractTags } from "../../lib/text";

export type DraftStatus = "loading" | "saved" | "saving";
export type SaveStatus =
  | "idle"
  | "saving"
  | "saved"
  | "local-only"
  | "empty"
  | "error";

type UseEditorDraftOptions = {
  clearSelectedEntry: () => void;
  refreshEntries: () => Promise<EntryView[]>;
  selectEntry: (id: string) => void;
};

export function useEditorDraft({
  clearSelectedEntry,
  refreshEntries,
  selectEntry,
}: UseEditorDraftOptions) {
  const [draftText, setDraftText] = useState("");
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftStatus, setDraftStatus] = useState<DraftStatus>("loading");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  const activeEntryIdRef = useRef<string | null>(null);
  const lastPersistedTextRef = useRef("");
  const autosaveRunRef = useRef(0);
  const autosaveTimerRef = useRef<number | null>(null);

  const persistEditorText = useCallback(
    async (nextText: string) => {
      if (!draftLoaded) return;

      const runId = ++autosaveRunRef.current;
      const text = nextText;
      const trimmed = text.trim();
      const activeEntryId = activeEntryIdRef.current;

      setDraftStatus("saving");

      // ❗ главный блок: пустой ввод
      if (!trimmed) {
        if (activeEntryId) {
          const existing = await getLocalEntry(activeEntryId);
          if (runId !== autosaveRunRef.current) return;

          await deleteLocalEntry(activeEntryId);
          if (existing?.serverId) {
            await deleteServerEntry(existing.serverId).catch((error) =>
              console.warn("[entry:delete-empty-server]", error),
            );
          }

          activeEntryIdRef.current = null;
          setEditingEntryId(null);
          clearSelectedEntry();
          await refreshEntries();
        }

        lastPersistedTextRef.current = "";
        setDraftText(""); // 🔧 синхронизация UI
        setDraftStatus("saved");
        setSaveStatus("idle");
        return;
      }

      if (text === lastPersistedTextRef.current && activeEntryId) {
        setDraftStatus("saved");
        return;
      }

      const sourceTextHash = await createTextHash(text);
      if (runId !== autosaveRunRef.current) return;

      const tags = extractTags(text);
      const now = new Date().toISOString();

      let targetEntryId = activeEntryId;

      if (targetEntryId) {
        const existing = await getLocalEntry(targetEntryId);
        if (runId !== autosaveRunRef.current) return;

        if (!existing) {
          activeEntryIdRef.current = null;
          setEditingEntryId(null);
          clearSelectedEntry();
          targetEntryId = null;
        }
      }

      if (!targetEntryId) {
        const id = createClientEntryId();

        const entry: LocalEntry = {
          id,
          serverId: null,
          text,
          entry_date: todayDateOnly(),
          tags,
          source_text_hash: sourceTextHash,
          signals: createFallbackSignal(),
          metadata: createFallbackMetadata(),
          sync_status: "pending_reextract",
          createdAt: now,
          updatedAt: now,
        };

        await saveLocalEntry(entry);
        if (runId !== autosaveRunRef.current) return;

        activeEntryIdRef.current = id;
        setEditingEntryId(id);
        selectEntry(id);
      } else {
        await updateLocalEntry(targetEntryId, {
          text,
          tags,
          source_text_hash: sourceTextHash,
          sync_status: "pending_reextract",
          updatedAt: now,
        });
      }

      lastPersistedTextRef.current = text;
      setDraftStatus("saved");
      setSaveStatus("saved");
      await refreshEntries();
    },
    [clearSelectedEntry, draftLoaded, refreshEntries, selectEntry],
  );

  const initializeDraft = useCallback(async () => {
    await migrateLegacyDraftToIndexedDb();
    await clearLocalDraft();
    resetDraftState();
    setDraftLoaded(true);
    setDraftStatus("saved");
  }, []);

  useEffect(() => {
    activeEntryIdRef.current = editingEntryId;
  }, [editingEntryId]);

  useEffect(() => {
    if (!draftLoaded) return;

    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      if (!draftText.trim()) {
        setDraftText("");
        lastPersistedTextRef.current = "";
        return;
      }

      void persistEditorText(draftText);
    }, 500);

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [draftLoaded, draftText, persistEditorText]);

  function changeText(value: string) {
    setDraftText(value);
    setDraftStatus("saving");
    setSaveStatus("idle");
  }

  async function newBlankPage() {
    clearAutosaveTimer();
    await persistEditorText(draftText);

    if (!draftText.trim()) {
      setDraftText("");
      lastPersistedTextRef.current = "";
    }

    resetDraftState();
    clearSelectedEntry();
  }

  async function editEntry(entry: EntryView) {
    if (!entry.text) return;

    clearAutosaveTimer();
    await persistEditorText(draftText);

    activeEntryIdRef.current = entry.id;
    setEditingEntryId(entry.id);
    setDraftText(entry.text);
    lastPersistedTextRef.current = entry.text;

    selectEntry(entry.id);
    setDraftStatus("saved");
  }

  function clearIfEditingEntry(entryId: string) {
    if (editingEntryId !== entryId) return;

    activeEntryIdRef.current = null;
    setEditingEntryId(null);
    setDraftText("");
    lastPersistedTextRef.current = "";
  }

  function resetAfterLocalDataClear() {
    activeEntryIdRef.current = null;
    setDraftText("");
    setEditingEntryId(null);
    setSaveStatus("idle");
    lastPersistedTextRef.current = "";
  }

  function activeEntryId() {
    return activeEntryIdRef.current;
  }

  function clearAutosaveTimer() {
    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }
  }

  function resetDraftState() {
    activeEntryIdRef.current = null;
    setEditingEntryId(null);
    setDraftText("");
    lastPersistedTextRef.current = "";
  }

  return {
    draftLoaded,
    draftStatus,
    draftText,
    editingEntryId,
    saveStatus,
    activeEntryId,
    changeText,
    clearAutosaveTimer,
    clearIfEditingEntry,
    editEntry,
    initializeDraft,
    newBlankPage,
    persistEditorText,
    resetAfterLocalDataClear,
  };
}