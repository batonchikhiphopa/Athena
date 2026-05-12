import { useAthenaApp } from "./app/useAthenaApp";
import { Editor } from "./components/Editor";
import { EntriesPage } from "./components/EntriesPage";
import { GraphMock } from "./components/GraphMock";
import { Nav } from "./components/Nav";
import { Observations } from "./components/Observations";
import { Settings } from "./components/Settings";
import { todayDateOnly } from "./lib/dates";
import logoImg from "./assets/logo-bg.jpg";

export default function App() {
  const app = useAthenaApp();
  const { handlers } = app;

  return (
    <div className="h-screen overflow-hidden bg-[#f4efe6] text-zinc-950">
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
      <div className="flex h-full min-h-0">
        <Nav
          currentPage={app.page}
          onNavigate={(nextPage) => void handlers.navigate(nextPage)}
        />
        <main className="flex h-full min-w-0 flex-1 justify-center overflow-hidden px-4">
          {app.page === "editor" && (
        <Editor
          analysisEnabled={app.draftAnalysisEnabled}
          availableTags={app.availableEntryTags}
          entryDate={app.activeEntry?.entryDate ?? todayDateOnly()}
          editorInsight={app.editorInsight}
          personaTextEnabled={app.personaTextEnabled}
          tags={app.draftTags}
          text={app.draftText}
          onChangeTags={handlers.editorTagsChange}
          onChangeText={handlers.editorTextChange}
          onNewBlankPage={() => void handlers.newBlankPage()}
          onToggleAnalysisEnabled={handlers.toggleDraftAnalysisEnabled}
        />
          )}

          {app.page === "entries" && (
            <EntriesPage
              debugMode={app.debugMode}
              entries={app.visibleEntries}
              selectedEntry={app.selectedEntry}
              selectedEntryId={app.selectedEntryId}
              sortDirection={app.entrySortDirection}
              searchQuery={app.entrySearchQuery}
              includedTags={app.includedEntryTags}
              availableTags={app.availableEntryTags}
              hasActiveFilters={app.hasActiveEntryFilters}
              isSearching={app.isSearchingEntries}
              onChangeSortDirection={handlers.changeEntrySortDirection}
              onClearFilters={handlers.clearEntryFilters}
              onDeleteEntry={(entry) => void handlers.deleteEntry(entry)}
              onEditEntry={(entry) => void handlers.editEntry(entry)}
              onRefresh={() => void handlers.refreshEntries()}
              onSearchQueryChange={handlers.setEntrySearchQuery}
              onSelectEntry={handlers.selectEntry}
              onToggleEntryAnalysis={(entry) =>
                void handlers.toggleEntryAnalysisEnabled(entry)
              }
              onToggleTag={handlers.toggleIncludedEntryTag}
            />
          )}

          {app.page === "observations" && (
            <Observations
              insights={app.observationHistory}
              personaTextEnabled={app.personaTextEnabled}
              onDeleteInsight={(insight) => void handlers.deleteInsight(insight)}
              onRefresh={() => void handlers.refreshObservationHistory()}
            />
          )}

          {app.page === "graph" && <GraphMock />}

          {app.page === "settings" && (
            <Settings
              debugMode={app.debugMode}
              isOnline={app.isOnline}
              entries={app.entries}
              extractionConfig={app.extractionConfig}
              extractionSettings={app.extractionSettings}
              extractionStatus={app.extractionStatus}
              personaTextEnabled={app.personaTextEnabled}
              reprocessMessage={app.reprocessMessage}
              reprocessStatus={app.reprocessStatus}
              queueSnapshot={app.queueSnapshot}
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
              onRetryRecoverableQueueJobs={() =>
                void handlers.retryRecoverableQueueJobs()
              }
              onPauseQueue={handlers.pauseQueue}
              onStartQueue={handlers.startQueue}
              onToggleDebugMode={handlers.toggleDebugMode}
              onTogglePersonaText={handlers.togglePersonaText}
            />
          )}
        </main>
      </div>
    </div>
  );
}
