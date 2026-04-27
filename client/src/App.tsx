import { useAthenaApp } from "./app/useAthenaApp";
import { Editor } from "./components/Editor";
import { EntriesPage } from "./components/EntriesPage";
import { GraphMock } from "./components/GraphMock";
import { Nav } from "./components/Nav";
import { Observations } from "./components/Observations";
import { Settings } from "./components/Settings";
import { todayDateOnly } from "./lib/dates";
import logoImg from "./logo.png";

export default function App() {
  const app = useAthenaApp();
  const { handlers } = app;

  return (
    <div className="min-h-screen bg-[#f4efe6] text-zinc-950">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <img
          src={logoImg}
          alt=""
          className="
            absolute top-[-10%] right-[-10%]
            h-[120%] w-[120%] object-cover

            opacity-60 contrast-90 brightness-105

            [mask-image:radial-gradient(circle_at_70%_30%,black_35%,transparent_80%)]
            [-webkit-mask-image:radial-gradient(circle_at_70%_30%,black_35%,transparent_80%)]
          "
        />
      </div>
      <div className="flex">
        <Nav
          currentPage={app.page}
          onNavigate={(nextPage) => void handlers.navigate(nextPage)}
        />
        <main className="flex-1 px-4 flex justify-center">
          {app.page === "editor" && (
            <Editor
              entryDate={app.activeEntry?.entryDate ?? todayDateOnly()}
              editorInsight={app.editorInsight}
              isEditing={Boolean(app.editingEntryId)}
              draftStatus={app.draftStatus}
              saveStatus={app.saveStatus}
              text={app.draftText}
              onChangeText={handlers.editorTextChange}
              onNewBlankPage={() => void handlers.newBlankPage()}
              onClearLocalData={() => void handlers.clearLocalData()}
            />
          )}

          {app.page === "entries" && (
            <EntriesPage
              debugMode={app.debugMode}
              entries={app.visibleEntries}
              selectedEntry={app.selectedEntry}
              selectedEntryId={app.selectedEntryId}
              sortDirection={app.entrySortDirection}
              onChangeSortDirection={handlers.changeEntrySortDirection}
              onDeleteEntry={(entry) => void handlers.deleteEntry(entry)}
              onEditEntry={(entry) => void handlers.editEntry(entry)}
              onRefresh={() => void handlers.refreshEntries()}
              onSelectEntry={handlers.selectEntry}
            />
          )}

          {app.page === "observations" && (
            <Observations
              insights={app.observationHistory}
              onDeleteInsight={(insight) => void handlers.deleteInsight(insight)}
              onRefresh={() => void handlers.refreshObservationHistory()}
            />
          )}

          {app.page === "graph" && <GraphMock />}

          {app.page === "settings" && (
            <Settings
              debugMode={app.debugMode}
              entries={app.entries}
              extractionConfig={app.extractionConfig}
              extractionSettings={app.extractionSettings}
              extractionStatus={app.extractionStatus}
              reprocessMessage={app.reprocessMessage}
              reprocessStatus={app.reprocessStatus}
              onChangeExtractionSettings={(settings) =>
                void handlers.changeExtractionSettings(settings)
              }
              onClearLocalData={() => void handlers.clearLocalData()}
              onRefreshExtractionStatus={() =>
                void handlers.refreshExtractionStatus(app.extractionSettings)
              }
              onReprocessFallbackEntries={() =>
                void handlers.reprocessFallbackEntries()
              }
              onToggleDebugMode={handlers.toggleDebugMode}
            />
          )}
        </main>
      </div>
    </div>
  );
}
