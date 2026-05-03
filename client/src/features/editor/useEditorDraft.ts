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

function normalizeDraftTags(tags: string[]) {
  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim().replace(/^#+/, "").toLocaleLowerCase())
        .filter(Boolean),
    ),
  ).slice(0, 12);
}

function tagsAreEqual(left: string[], right: string[]) {
  return (
    normalizeDraftTags(left).join("\u0000") ===
    normalizeDraftTags(right).join("\u0000")
  );
}

export function useEditorDraft({
  clearSelectedEntry,
  refreshEntries,
  selectEntry,
}: UseEditorDraftOptions) {
  const [draftText, setDraftText] = useState("");
  const [draftTags, setDraftTags] = useState<string[]>([]);
  const [draftAnalysisEnabled, setDraftAnalysisEnabled] = useState(true);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftStatus, setDraftStatus] = useState<DraftStatus>("loading");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  const activeEntryIdRef = useRef<string | null>(null);
  const lastPersistedTextRef = useRef("");
  const lastPersistedTagsRef = useRef<string[]>([]);
  const lastPersistedAnalysisEnabledRef = useRef(true);
  const draftTagsRef = useRef<string[]>([]);
  const draftAnalysisEnabledRef = useRef(true);
  const autosaveRunRef = useRef(0);
  const autosaveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    draftTagsRef.current = draftTags;
  }, [draftTags]);

  useEffect(() => {
    draftAnalysisEnabledRef.current = draftAnalysisEnabled;
  }, [draftAnalysisEnabled]);

  const persistEditorText = useCallback(
    async (nextText: string) => {
      if (!draftLoaded) return;

      const runId = ++autosaveRunRef.current;
      const text = nextText;
      const trimmed = text.trim();
      const activeEntryId = activeEntryIdRef.current;
      const tags = normalizeDraftTags(draftTagsRef.current);
      const analysisEnabled = draftAnalysisEnabledRef.current;
      const tagsChanged = !tagsAreEqual(tags, lastPersistedTagsRef.current);
      const analysisEnabledChanged =
        analysisEnabled !== lastPersistedAnalysisEnabledRef.current;
      const hasContent = trimmed.length > 0 || tags.length > 0;

      setDraftStatus("saving");

      if (!hasContent) {
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
        lastPersistedTagsRef.current = [];
        lastPersistedAnalysisEnabledRef.current = analysisEnabled;
        draftTagsRef.current = [];
        draftAnalysisEnabledRef.current = analysisEnabled;
        setDraftText("");
        setDraftTags([]);
        setDraftStatus("saved");
        setSaveStatus("idle");
        return;
      }

      if (
        text === lastPersistedTextRef.current &&
        !tagsChanged &&
        !analysisEnabledChanged &&
        activeEntryId
      ) {
        setDraftStatus("saved");
        return;
      }

      const sourceTextHash = await createTextHash(text);
      if (runId !== autosaveRunRef.current) return;

      const now = new Date().toISOString();

      let targetEntryId = activeEntryId;
      let existingEntry: LocalEntry | null = null;

      if (targetEntryId) {
        existingEntry = (await getLocalEntry(targetEntryId)) ?? null;
        if (runId !== autosaveRunRef.current) return;

        if (!existingEntry) {
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
          analysis_enabled: analysisEnabled,
          source_text_hash: sourceTextHash,
          signals: createFallbackSignal(),
          metadata: createFallbackMetadata(),
          sync_status: analysisEnabled ? "pending_reextract" : "local_only",
          createdAt: now,
          updatedAt: now,
        };

        await saveLocalEntry(entry);
        if (runId !== autosaveRunRef.current) return;

        activeEntryIdRef.current = id;
        setEditingEntryId(id);
        selectEntry(id);
      } else {
        if (!analysisEnabled && existingEntry?.serverId) {
          await deleteServerEntry(existingEntry.serverId).catch((error) =>
            console.warn("[entry:disable-analysis-server]", error),
          );
        }

        await updateLocalEntry(targetEntryId, {
          serverId: analysisEnabled ? existingEntry?.serverId ?? null : null,
          text,
          tags,
          analysis_enabled: analysisEnabled,
          source_text_hash: sourceTextHash,
          sync_status: analysisEnabled ? "pending_reextract" : "local_only",
          updatedAt: now,
        });
      }

      lastPersistedTextRef.current = text;
      lastPersistedTagsRef.current = tags;
      lastPersistedAnalysisEnabledRef.current = analysisEnabled;
      draftTagsRef.current = tags;
      draftAnalysisEnabledRef.current = analysisEnabled;
      setDraftTags(tags);
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
      const normalizedTags = normalizeDraftTags(draftTags);
      const hasContent =
        draftText.trim().length > 0 || normalizedTags.length > 0;

      if (!hasContent) {
        lastPersistedTextRef.current = "";
        lastPersistedTagsRef.current = [];
        lastPersistedAnalysisEnabledRef.current = draftAnalysisEnabledRef.current;
        draftTagsRef.current = [];
        setDraftText("");
        setDraftTags([]);
        setDraftStatus("saved");
        setSaveStatus("idle");
        return;
      }

      void persistEditorText(draftText);
    }, 500);

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [draftLoaded, draftText, draftTags, persistEditorText]);

  function changeText(value: string) {
    setDraftText(value);
    setDraftStatus("saving");
    setSaveStatus("idle");
  }

  function changeTags(nextTags: string[]) {
    const normalizedTags = normalizeDraftTags(nextTags);

    setDraftTags(normalizedTags);
    setDraftStatus("saving");
    setSaveStatus("idle");
  }

  function toggleAnalysisEnabled() {
    setDraftAnalysisEnabled((currentValue) => !currentValue);
    setDraftStatus("saving");
    setSaveStatus("idle");
  }

  async function newBlankPage() {
    clearAutosaveTimer();
    await persistEditorText(draftText);

    resetDraftState();
    clearSelectedEntry();
  }

  async function editEntry(entry: EntryView) {
    if (!entry.text && entry.tags.length === 0) return;

    clearAutosaveTimer();
    await persistEditorText(draftText);

    const normalizedTags = normalizeDraftTags(entry.tags);

    activeEntryIdRef.current = entry.id;
    setEditingEntryId(entry.id);
    setDraftText(entry.text);
    setDraftTags(normalizedTags);
    setDraftAnalysisEnabled(entry.analysisEnabled);
    draftTagsRef.current = normalizedTags;
    draftAnalysisEnabledRef.current = entry.analysisEnabled;
    lastPersistedTextRef.current = entry.text;
    lastPersistedTagsRef.current = normalizedTags;
    lastPersistedAnalysisEnabledRef.current = entry.analysisEnabled;

    selectEntry(entry.id);
    setDraftStatus("saved");
    setSaveStatus("saved");
  }

  function clearIfEditingEntry(entryId: string) {
    if (editingEntryId !== entryId) return;

    activeEntryIdRef.current = null;
    setEditingEntryId(null);
    setDraftText("");
    setDraftTags([]);
    setDraftAnalysisEnabled(true);
    draftTagsRef.current = [];
    draftAnalysisEnabledRef.current = true;
    lastPersistedTextRef.current = "";
    lastPersistedTagsRef.current = [];
    lastPersistedAnalysisEnabledRef.current = true;
  }

  function resetAfterLocalDataClear() {
    activeEntryIdRef.current = null;
    setDraftText("");
    setDraftTags([]);
    setDraftAnalysisEnabled(true);
    setEditingEntryId(null);
    setSaveStatus("idle");
    draftTagsRef.current = [];
    draftAnalysisEnabledRef.current = true;
    lastPersistedTextRef.current = "";
    lastPersistedTagsRef.current = [];
    lastPersistedAnalysisEnabledRef.current = true;
  }

  function activeEntryId() {
    return activeEntryIdRef.current;
  }

  function clearAutosaveTimer() {
    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
  }

  function resetDraftState() {
    activeEntryIdRef.current = null;
    setEditingEntryId(null);
    setDraftText("");
    setDraftTags([]);
    setDraftAnalysisEnabled(true);
    draftTagsRef.current = [];
    draftAnalysisEnabledRef.current = true;
    lastPersistedTextRef.current = "";
    lastPersistedTagsRef.current = [];
    lastPersistedAnalysisEnabledRef.current = true;
  }

  return {
    draftLoaded,
    draftAnalysisEnabled,
    draftStatus,
    draftTags,
    draftText,
    editingEntryId,
    saveStatus,
    activeEntryId,
    changeTags,
    changeText,
    clearAutosaveTimer,
    clearIfEditingEntry,
    editEntry,
    initializeDraft,
    newBlankPage,
    persistEditorText,
    resetAfterLocalDataClear,
    toggleAnalysisEnabled,
  };
}
