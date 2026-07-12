import { useState } from "react";
import type { EntryView } from "../features/entries/entryTypes";
import type { Page } from "./navigationTypes";

type AthenaNavigationOptions = {
  editor: {
    activeEntryId: () => string | null;
    changeText: (value: string) => void;
    clearAutosaveTimer: () => void;
    editEntry: (entry: EntryView) => Promise<void>;
    newBlankPage: () => Promise<void>;
    persistEditorText: (text: string) => Promise<void>;
  };
  entries: {
    selectEntry: (entryId: string | null) => void;
  };
  insights: {
    clearEditorInsight: () => void;
  };
  draftText: string;
};

export function useAthenaNavigation({
  editor,
  entries,
  insights,
  draftText,
}: AthenaNavigationOptions) {
  const [page, setPage] = useState<Page>("editor");

  async function newBlankPage() {
    await editor.newBlankPage();
    insights.clearEditorInsight();
    setPage("editor");
  }

  async function editEntry(entry: EntryView) {
    await editor.editEntry(entry);
    insights.clearEditorInsight();
    setPage("editor");
  }

  async function navigate(nextPage: Page) {
    if (nextPage !== "editor") {
      editor.clearAutosaveTimer();
      await editor.persistEditorText(draftText);
    }

    setPage(nextPage);

    if (nextPage === "entries") {
      const activeEntryId = editor.activeEntryId();
      if (activeEntryId) entries.selectEntry(activeEntryId);
    }

  }

  return {
    page,
    setPage,
    handlers: {
      editEntry,
      navigate,
      newBlankPage,
    },
  };
}
