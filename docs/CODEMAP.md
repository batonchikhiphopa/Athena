# Athena code map

> Этот файл генерируется командой `npm run docs:codemap`. Не редактируйте каталог и диапазоны строк вручную: исправляйте код или `scripts/generate-code-map.mjs`.

## Как читать карту

- Сначала идёт компактная карта всех файлов и их зон ответственности.
- После карты расположен подробный справочник именованных функций, методов и вложенных helpers.
- Для каждой функции указаны назначение, область видимости, параметры, основные вызовы и диапазон строк `Lx–Ly`.
- Описания критических функций заданы вручную; простые helpers документируются по имени, параметрам и вызовам. Если описание неточно, функцию стоит переименовать или добавить override в генератор.
- Анонимные React callbacks и inline route handlers не получают искусственных имён; HTTP routes перечисляются отдельно.
- Диапазоны строк относятся к текущему состоянию кода; после изменений перегенерируйте карту.
- `node_modules`, build artifacts, runtime `data/` и сам этот generated-файл в каталог не входят.

## Основные потоки

```text
main.tsx -> App.tsx -> auth/vault gates -> AthenaWorkspace
                                      -> useAthenaApp
                                         |- editor + local IndexedDB
                                         |- entries/search
                                         |- durable queue -> backend API
                                         `- insights/settings

Express route -> service -> repository -> SQLite
entry text -> transient extraction -> sanitized Signal -> deterministic analytics -> insight snapshot
```

## Границы данных

- Сырой текст записей, drafts, search index и raw self-reports принадлежат браузеру.
- Backend принимает transient text только на extraction endpoint и хранит textless metadata/signals/aggregates/snapshots.
- `shared/contracts` задаёт протокол между клиентом и сервером; изменения required fields требуют осознанной версии контракта.
- UI не должен обращаться к SQLite напрямую: client API вызывает route, route — service, service — repository.

## Карта файлов

### Client runtime

| Файл | Ответственность |
| --- | --- |
| `client/src/App.tsx` | Верхняя граница клиентского приложения: серверная авторизация, локальный vault, профили и допуск в рабочую область. |
| `client/src/app/AthenaErrorBoundary.tsx` | Клиентская оркестрация приложения и lifecycle hook: athena error boundary. |
| `client/src/app/AthenaWorkspace.tsx` | Компонует видимые поверхности Athena и связывает состояние приложения с UI-обработчиками. |
| `client/src/app/localData.ts` | Клиентская оркестрация приложения и lifecycle hook: local data. |
| `client/src/app/navigationTypes.ts` | Клиентская оркестрация приложения и lifecycle hook: navigation types. |
| `client/src/app/useAppAutoLock.ts` | Клиентская оркестрация приложения и lifecycle hook: use app auto lock. |
| `client/src/app/useAthenaApp.ts` | Главный composition hook клиента; собирает editor, entries, insights, settings, queue и lifecycle в один фасад. |
| `client/src/app/useAthenaLifecycle.ts` | Клиентская оркестрация приложения и lifecycle hook: use athena lifecycle. |
| `client/src/app/useAthenaNavigation.ts` | Клиентская оркестрация приложения и lifecycle hook: use athena navigation. |
| `client/src/app/useVaultLockPreparation.ts` | Клиентская оркестрация приложения и lifecycle hook: use vault lock preparation. |
| `client/src/assets/editor-feather-mask.png` | Статический визуальный asset; функций не содержит. |
| `client/src/assets/entries-parchment-mask.png` | Статический визуальный asset; функций не содержит. |
| `client/src/assets/logo-bg.jpg` | Статический визуальный asset; функций не содержит. |
| `client/src/assets/observations-stars-mask.png` | Статический визуальный asset; функций не содержит. |
| `client/src/assets/results-icon-mask.png` | Статический визуальный asset; функций не содержит. |
| `client/src/components/desktop.ini` | Пользовательский UI-компонент: desktop. |
| `client/src/components/floating/FloatingLayerContext.ts` | Инфраструктура плавающих панелей и их геометрии: floating layer context. |
| `client/src/components/floating/FloatingLayerProvider.tsx` | Инфраструктура плавающих панелей и их геометрии: floating layer provider. |
| `client/src/components/floating/FloatingPanel.tsx` | Инфраструктура плавающих панелей и их геометрии: floating panel. |
| `client/src/components/floating/index.ts` | Инфраструктура плавающих панелей и их геометрии: index. |
| `client/src/components/floating/useFloatingLayer.ts` | Инфраструктура плавающих панелей и их геометрии: use floating layer. |
| `client/src/components/floating/useFloatingTextOcclusion.ts` | Инфраструктура плавающих панелей и их геометрии: use floating text occlusion. |
| `client/src/components/icon.tsx` | Пользовательский UI-компонент: icon. |
| `client/src/components/LanguageSelect.tsx` | Пользовательский UI-компонент: language select. |
| `client/src/components/Nav.tsx` | Пользовательский UI-компонент: nav. |
| `client/src/components/TooltipButton.tsx` | Пользовательский UI-компонент: tooltip button. |
| `client/src/features/auth/authApi.ts` | Клиентская feature server-auth: auth api. |
| `client/src/features/auth/ui/ServerAuthGate.tsx` | Клиентская feature server-auth: server auth gate. |
| `client/src/features/auth/useServerAuth.ts` | Клиентская feature server-auth: use server auth. |
| `client/src/features/editor/content/athenaPhraseLibraries.ts` | Клиентская feature редактора: athena phrase libraries. |
| `client/src/features/editor/content/athenaPhrasesDe.ts` | Клиентская feature редактора: athena phrases de. |
| `client/src/features/editor/content/athenaPhrasesEn.ts` | Клиентская feature редактора: athena phrases en. |
| `client/src/features/editor/content/athenaPhrasesRu.ts` | Клиентская feature редактора: athena phrases ru. |
| `client/src/features/editor/content/athenaPhrasesTypes.ts` | Клиентская feature редактора: athena phrases types. |
| `client/src/features/editor/content/athenaPhrasesUk.ts` | Клиентская feature редактора: athena phrases uk. |
| `client/src/features/editor/content/athenaPlaceholder.ts` | Клиентская feature редактора: athena placeholder. |
| `client/src/features/editor/content/phrasePicker.ts` | Клиентская feature редактора: phrase picker. |
| `client/src/features/editor/draftRepository.ts` | Локальный зашифрованный repository текущего editor draft. |
| `client/src/features/editor/editorInsight.ts` | Клиентская feature редактора: editor insight. |
| `client/src/features/editor/editorPlaceholder.ts` | Клиентская feature редактора: editor placeholder. |
| `client/src/features/editor/editorTagUtils.ts` | Клиентская feature редактора: editor tag utils. |
| `client/src/features/editor/ui/Editor.tsx` | Клиентская feature редактора: editor. |
| `client/src/features/editor/ui/EditorActionButtons.tsx` | Клиентская feature редактора: editor action buttons. |
| `client/src/features/editor/ui/EditorTagChips.tsx` | Клиентская feature редактора: editor tag chips. |
| `client/src/features/editor/ui/EditorTagMenu.tsx` | Клиентская feature редактора: editor tag menu. |
| `client/src/features/editor/ui/LineLever.tsx` | Клиентская feature редактора: line lever. |
| `client/src/features/editor/ui/SelfReportMenu.tsx` | Клиентская feature редактора: self report menu. |
| `client/src/features/editor/useEditorDraft.ts` | Владеет жизненным циклом черновика и записи: автосохранение, локальная запись, удаление пустых записей и постановка sync/extraction jobs. |
| `client/src/features/editor/useEditorTagControls.ts` | Клиентская feature редактора: use editor tag controls. |
| `client/src/features/entries/entriesApi.ts` | Клиентская feature архива записей: entries api. |
| `client/src/features/entries/entryFilters.ts` | Клиентская feature архива записей: entry filters. |
| `client/src/features/entries/entryPreferences.ts` | Клиентская feature архива записей: entry preferences. |
| `client/src/features/entries/entrySearch.ts` | Чистый поисковый движок архива: разбор запроса, индексирование, lexical/semantic scoring и построение snippets. |
| `client/src/features/entries/entryState.ts` | Клиентская feature архива записей: entry state. |
| `client/src/features/entries/entryTypes.ts` | Клиентская feature архива записей: entry types. |
| `client/src/features/entries/localEntryRepository.ts` | Локальный зашифрованный repository записей и их browser-only текста. |
| `client/src/features/entries/ui/EntriesPage.tsx` | Клиентская feature архива записей: entries page. |
| `client/src/features/entries/ui/EntriesUtilityPanel.tsx` | Клиентская feature архива записей: entries utility panel. |
| `client/src/features/entries/ui/entryDebugBlocks.ts` | Клиентская feature архива записей: entry debug blocks. |
| `client/src/features/entries/ui/EntryDebugTooltip.tsx` | Клиентская feature архива записей: entry debug tooltip. |
| `client/src/features/entries/ui/entryGrid.ts` | Клиентская feature архива записей: entry grid. |
| `client/src/features/entries/ui/entryTagId.ts` | Клиентская feature архива записей: entry tag id. |
| `client/src/features/entries/ui/EntryTile.tsx` | Клиентская feature архива записей: entry tile. |
| `client/src/features/entries/ui/entryUiHelpers.tsx` | Клиентская feature архива записей: entry ui helpers. |
| `client/src/features/entries/ui/useEntryDebugTooltip.ts` | Клиентская feature архива записей: use entry debug tooltip. |
| `client/src/features/entries/useEntries.ts` | Клиентская feature архива записей: use entries. |
| `client/src/features/entries/useEntrySearch.ts` | Клиентская feature архива записей: use entry search. |
| `client/src/features/exportImport/exportPackage.ts` | Локальный export/import: export package. |
| `client/src/features/exportImport/exportTypes.ts` | Локальный export/import: export types. |
| `client/src/features/exportImport/importApply.ts` | Локальный export/import: import apply. |
| `client/src/features/exportImport/importPreview.ts` | Локальный export/import: import preview. |
| `client/src/features/exportImport/importReaders.ts` | Локальный export/import: import readers. |
| `client/src/features/exportImport/importValidation.ts` | Локальный export/import: import validation. |
| `client/src/features/extraction/extractionApi.ts` | Клиентский адаптер extraction API: extraction api. |
| `client/src/features/extraction/extractSignalForText.ts` | Клиентский адаптер extraction API: extract signal for text. |
| `client/src/features/extraction/geminiQuota.ts` | Клиентский адаптер extraction API: gemini quota. |
| `client/src/features/extraction/signals.ts` | Клиентский адаптер extraction API: signals. |
| `client/src/features/extraction/signalVersions.ts` | Клиентский адаптер extraction API: signal versions. |
| `client/src/features/insights/content/athenaInsightPhraseLibraries.ts` | Клиентская feature observations/insights: athena insight phrase libraries. |
| `client/src/features/insights/content/athenaInsightPhrasesDe.ts` | Клиентская feature observations/insights: athena insight phrases de. |
| `client/src/features/insights/content/athenaInsightPhrasesEn.ts` | Клиентская feature observations/insights: athena insight phrases en. |
| `client/src/features/insights/content/athenaInsightPhrasesRu.ts` | Клиентская feature observations/insights: athena insight phrases ru. |
| `client/src/features/insights/content/athenaInsightPhrasesTypes.ts` | Клиентская feature observations/insights: athena insight phrases types. |
| `client/src/features/insights/content/athenaInsightPhrasesUk.ts` | Клиентская feature observations/insights: athena insight phrases uk. |
| `client/src/features/insights/content/insightPhrases.ts` | Клиентская feature observations/insights: insight phrases. |
| `client/src/features/insights/content/insightText.ts` | Клиентская feature observations/insights: insight text. |
| `client/src/features/insights/content/plainInsightPhraseLibraries.ts` | Клиентская feature observations/insights: plain insight phrase libraries. |
| `client/src/features/insights/insightsApi.ts` | Клиентская feature observations/insights: insights api. |
| `client/src/features/insights/seenInsights.ts` | Клиентская feature observations/insights: seen insights. |
| `client/src/features/insights/ui/InsightStrip.tsx` | Клиентская feature observations/insights: insight strip. |
| `client/src/features/insights/ui/Observations.tsx` | Клиентская feature observations/insights: observations. |
| `client/src/features/insights/ui/ObservationsButton.tsx` | Клиентская feature observations/insights: observations button. |
| `client/src/features/insights/useInsights.ts` | Клиентская feature observations/insights: use insights. |
| `client/src/features/insights/useObservationNotifications.ts` | Клиентская feature observations/insights: use observation notifications. |
| `client/src/features/rag/evidencePack.ts` | Локальная evidence-pack и ограниченная интерпретация: evidence pack. |
| `client/src/features/rag/localInterpretation.ts` | Локальная evidence-pack и ограниченная интерпретация: local interpretation. |
| `client/src/features/results/activityAggregation.ts` | Проектный файл: activity aggregation. |
| `client/src/features/results/activityCatalog.ts` | Проектный файл: activity catalog. |
| `client/src/features/results/activityInsightApi.ts` | Проектный файл: activity insight api. |
| `client/src/features/results/activityInsightCache.ts` | Проектный файл: activity insight cache. |
| `client/src/features/results/activityInsightQuota.ts` | Проектный файл: activity insight quota. |
| `client/src/features/results/activityInsightTypes.ts` | Проектный файл: activity insight types. |
| `client/src/features/results/demoResults.ts` | Проектный файл: demo results. |
| `client/src/features/results/resultsCopy.ts` | Проектный файл: results copy. |
| `client/src/features/results/resultsModel.ts` | Проектный файл: results model. |
| `client/src/features/results/resultsTypes.ts` | Проектный файл: results types. |
| `client/src/features/results/ui/ActivityDebug.tsx` | Проектный файл: activity debug. |
| `client/src/features/results/ui/ActivityGraph.tsx` | Проектный файл: activity graph. |
| `client/src/features/results/ui/AnimatedActivityPanel.tsx` | Проектный файл: animated activity panel. |
| `client/src/features/results/ui/ResultsPage.tsx` | Проектный файл: results page. |
| `client/src/features/results/useActivityInsights.ts` | Проектный файл: use activity insights. |
| `client/src/features/selfReports/selfReportActions.ts` | Локальные self-reports и синхронизация агрегатов: self report actions. |
| `client/src/features/selfReports/selfReportApi.ts` | Локальные self-reports и синхронизация агрегатов: self report api. |
| `client/src/features/selfReports/selfReportQueue.ts` | Локальные self-reports и синхронизация агрегатов: self report queue. |
| `client/src/features/selfReports/selfReportStorage.ts` | Локальные self-reports и синхронизация агрегатов: self report storage. |
| `client/src/features/selfReports/selfReportTypes.ts` | Локальные self-reports и синхронизация агрегатов: self report types. |
| `client/src/features/semantic/localEmbeddings.ts` | Локальные embeddings и semantic index: local embeddings. |
| `client/src/features/semantic/semanticIndex.ts` | Локальные embeddings и semantic index: semantic index. |
| `client/src/features/settings/extractionSettings.ts` | Состояние и UI настроек: extraction settings. |
| `client/src/features/settings/pendingReextract.ts` | Состояние и UI настроек: pending reextract. |
| `client/src/features/settings/settingsStorage.ts` | Состояние и UI настроек: settings storage. |
| `client/src/features/settings/ui/AccessSettings.tsx` | Состояние и UI настроек: access settings. |
| `client/src/features/settings/ui/DataSettings.tsx` | Состояние и UI настроек: data settings. |
| `client/src/features/settings/ui/EntriesSettings.tsx` | Состояние и UI настроек: entries settings. |
| `client/src/features/settings/ui/InterfaceSettings.tsx` | Состояние и UI настроек: interface settings. |
| `client/src/features/settings/ui/SettingsPage.tsx` | Состояние и UI настроек: settings page. |
| `client/src/features/settings/ui/SettingsTabList.tsx` | Состояние и UI настроек: settings tab list. |
| `client/src/features/settings/ui/settingsTypes.ts` | Состояние и UI настроек: settings types. |
| `client/src/features/settings/ui/settingsUi.tsx` | Состояние и UI настроек: settings ui. |
| `client/src/features/settings/useSettingsState.ts` | Состояние и UI настроек: use settings state. |
| `client/src/features/sync/entryReprocessJob.ts` | Политики и jobs фоновой синхронизации: entry reprocess job. |
| `client/src/features/sync/entryServerSync.ts` | Политики и jobs фоновой синхронизации: entry server sync. |
| `client/src/features/sync/entrySyncJob.ts` | Политики и jobs фоновой синхронизации: entry sync job. |
| `client/src/features/sync/entrySyncPolicy.ts` | Политики и jobs фоновой синхронизации: entry sync policy. |
| `client/src/features/sync/queue.ts` | Исполнитель durable queue: handlers, retries, recovery и lifecycle processor. |
| `client/src/features/sync/queueErrors.ts` | Политики и jobs фоновой синхронизации: queue errors. |
| `client/src/features/sync/queueStorage.ts` | Политики и jobs фоновой синхронизации: queue storage. |
| `client/src/features/sync/queueTypes.ts` | Политики и jobs фоновой синхронизации: queue types. |
| `client/src/features/sync/reprocessPolicy.ts` | Политики и jobs фоновой синхронизации: reprocess policy. |
| `client/src/features/sync/syncQueue.ts` | Регистрирует обработчики durable queue и маршрутизирует jobs синхронизации, reprocess и self-report. |
| `client/src/features/sync/useQueueWakeups.ts` | Политики и jobs фоновой синхронизации: use queue wakeups. |
| `client/src/features/sync/useSyncQueue.ts` | Политики и jobs фоновой синхронизации: use sync queue. |
| `client/src/features/vault/appLock.ts` | React/API-адаптеры локального vault: app lock. |
| `client/src/features/vault/ui/VaultGate.tsx` | React/API-адаптеры локального vault: vault gate. |
| `client/src/features/vault/useLocalVault.ts` | React/API-адаптеры локального vault: use local vault. |
| `client/src/features/vault/vault.ts` | React/API-адаптеры локального vault: vault. |
| `client/src/features/vault/vaultApi.ts` | React/API-адаптеры локального vault: vault api. |
| `client/src/features/vault/vaultCrypto.ts` | Низкоуровневые Web Crypto primitives без React и продуктовой оркестрации. |
| `client/src/features/vault/vaultProfiles.ts` | React/API-адаптеры локального vault: vault profiles. |
| `client/src/i18n/i18nContext.ts` | Интернационализация интерфейса: i18n context. |
| `client/src/i18n/I18nProvider.tsx` | Интернационализация интерфейса: i18n provider. |
| `client/src/i18n/languages.ts` | Интернационализация интерфейса: languages. |
| `client/src/i18n/messages.ts` | Интернационализация интерфейса: messages. |
| `client/src/i18n/useI18n.ts` | Интернационализация интерфейса: use i18n. |
| `client/src/index.css` | Стили соответствующей клиентской поверхности. |
| `client/src/main.tsx` | Точка запуска React-клиента: подключает стили, i18n, корневой App и service worker. |
| `client/src/platform/storage/athenaDb.ts` | Единственная точка владения IndexedDB schema, object stores и profile-scoped соединением. |
| `client/src/shared/contracts.ts` | Действительно общая клиентская инфраструктура и примитивы: contracts. |
| `client/src/shared/http/httpClient.ts` | Общие HTTP-механизмы: CSRF, auth-required event и типизированные ошибки. |
| `client/src/shared/lib/dates.ts` | Действительно общая клиентская инфраструктура и примитивы: dates. |
| `client/src/shared/lib/offline.ts` | Действительно общая клиентская инфраструктура и примитивы: offline. |
| `client/src/shared/lib/serviceWorker.ts` | Действительно общая клиентская инфраструктура и примитивы: service worker. |
| `client/src/shared/lib/text.ts` | Действительно общая клиентская инфраструктура и примитивы: text. |

### Server runtime

| Файл | Ответственность |
| --- | --- |
| `server/app.ts` | Собирает Express middleware и API routers, затем раздаёт собранный frontend. |
| `server/config/constants.ts` | Конфигурация backend: constants. |
| `server/config/env.ts` | Конфигурация backend: env. |
| `server/config/load-env.ts` | Конфигурация backend: load env. |
| `server/config/versions.ts` | Конфигурация backend: versions. |
| `server/core/types.ts` | Доменные схемы, типы и чистые mapper-функции backend: types. |
| `server/db/migrate.ts` | SQLite bootstrap и миграции: migrate. |
| `server/db/migration-runner.ts` | Планирует, проверяет и атомарно применяет SQL-миграции с integrity checks. |
| `server/db/sqlite.ts` | Открывает SQLite и сериализует write transactions. |
| `server/modules/analytics/analytics.route.ts` | Вертикальный backend-модуль analytics: analytics route. |
| `server/modules/analytics/analyticsCollections.ts` | Вертикальный backend-модуль analytics: analytics collections. |
| `server/modules/analytics/analyticsDates.ts` | Вертикальный backend-модуль analytics: analytics dates. |
| `server/modules/analytics/analyticsStatistics.ts` | Вертикальный backend-модуль analytics: analytics statistics. |
| `server/modules/analytics/analyticsV2.repository.ts` | Вертикальный backend-модуль analytics: analytics v2 repository. |
| `server/modules/analytics/analyticsV2.service.ts` | Композиция Analytics V2 поверх отдельных date, statistics, collection и repository модулей. |
| `server/modules/analytics/analyticsV2.types.ts` | Вертикальный backend-модуль analytics: analytics v2 types. |
| `server/modules/auth/auth.middleware.ts` | Вертикальный backend-модуль owner auth: auth middleware. |
| `server/modules/auth/auth.repository.ts` | Вертикальный backend-модуль owner auth: auth repository. |
| `server/modules/auth/auth.route.ts` | Вертикальный backend-модуль owner auth: auth route. |
| `server/modules/auth/auth.schema.ts` | Вертикальный backend-модуль owner auth: auth schema. |
| `server/modules/auth/auth.service.ts` | Вертикальный backend-модуль owner auth: auth service. |
| `server/modules/entries/entries.route.ts` | Вертикальный backend-модуль entries и signal persistence: entries route. |
| `server/modules/entries/entry.repository.ts` | Вертикальный backend-модуль entries и signal persistence: entry repository. |
| `server/modules/entries/entry.schema.ts` | Вертикальный backend-модуль entries и signal persistence: entry schema. |
| `server/modules/entries/entry.service.ts` | Вертикальный backend-модуль entries и signal persistence: entry service. |
| `server/modules/entries/signal.repository.ts` | Вертикальный backend-модуль entries и signal persistence: signal repository. |
| `server/modules/exports/export.service.ts` | Вертикальный backend-модуль metadata export: export service. |
| `server/modules/exports/exports.route.ts` | Вертикальный backend-модуль metadata export: exports route. |
| `server/modules/extraction/extraction.schema.ts` | Вертикальный backend-модуль extraction и signal contracts: extraction schema. |
| `server/modules/extraction/extraction.service.ts` | Вертикальный backend-модуль extraction и signal contracts: extraction service. |
| `server/modules/extraction/extractions.route.ts` | Вертикальный backend-модуль extraction и signal contracts: extractions route. |
| `server/modules/extraction/markers.ts` | Вертикальный backend-модуль extraction и signal contracts: markers. |
| `server/modules/extraction/sanitization.service.ts` | Вертикальный backend-модуль extraction и signal contracts: sanitization service. |
| `server/modules/extraction/signal.schema.ts` | Вертикальный backend-модуль extraction и signal contracts: signal schema. |
| `server/modules/insights/insight.repository.ts` | Вертикальный backend-модуль insight snapshots: insight repository. |
| `server/modules/insights/insight.service.ts` | Вертикальный backend-модуль insight snapshots: insight service. |
| `server/modules/insights/insightInput.ts` | Вертикальный backend-модуль insight snapshots: insight input. |
| `server/modules/insights/insights.route.ts` | Вертикальный backend-модуль insight snapshots: insights route. |
| `server/modules/insights/insightV3.ts` | Вертикальный backend-модуль insight snapshots: insight v3. |
| `server/modules/results/activityInsights.provider.ts` | Проектный файл: activity insights provider. |
| `server/modules/results/activityInsights.schema.ts` | Проектный файл: activity insights schema. |
| `server/modules/results/activityInsights.service.ts` | Проектный файл: activity insights service. |
| `server/modules/results/results.route.ts` | Проектный файл: results route. |
| `server/modules/selfReports/selfReport.repository.ts` | Вертикальный backend-модуль self-report aggregates: self report repository. |
| `server/modules/selfReports/selfReport.schema.ts` | Вертикальный backend-модуль self-report aggregates: self report schema. |
| `server/modules/selfReports/selfReport.service.ts` | Вертикальный backend-модуль self-report aggregates: self report service. |
| `server/modules/selfReports/selfReports.route.ts` | Вертикальный backend-модуль self-report aggregates: self reports route. |
| `server/platform/http/config.route.ts` | Общая backend platform infrastructure: config route. |
| `server/platform/http/error.middleware.ts` | Общая backend platform infrastructure: error middleware. |
| `server/platform/http/http.ts` | Общая backend platform infrastructure: http. |
| `server/server.ts` | Исполняемая точка запуска Express-сервера. |

### Shared contracts

| Файл | Ответственность |
| --- | --- |
| `shared/contracts/activityInsights.ts` | Общий runtime/type контракт клиента и сервера: activity insights. |
| `shared/contracts/entries.ts` | Общий runtime/type контракт клиента и сервера: entries. |
| `shared/contracts/extraction.ts` | Общий runtime/type контракт клиента и сервера: extraction. |
| `shared/contracts/index.ts` | Публичный barrel общих client/server контрактов. |
| `shared/contracts/insights.ts` | Общий runtime/type контракт клиента и сервера: insights. |
| `shared/contracts/selfReports.ts` | Общий runtime/type контракт клиента и сервера: self reports. |
| `shared/contracts/signal.ts` | Общий runtime/type контракт клиента и сервера: signal. |
| `shared/contracts/signalAnalysis.ts` | Детерминированно выводит intent, структуру и временной контекст из одной записи и её metadata. |
| `shared/contracts/signalVersions.ts` | Общий runtime/type контракт клиента и сервера: signal versions. |
| `shared/README.md` | Ручная документация по теме, обозначенной именем файла. |
| `shared/signal/signalMapper.ts` | Единый pure Signal mapper для клиентского и серверного runtime. |

### Database migrations

| Файл | Ответственность |
| --- | --- |
| `migrations/001_init.sql` | Создаёт entries, immutable signals, overrides, insights и effective_signals view. |
| `migrations/002_refresh_effective_signals.sql` | Пересобирает read model effective_signals. |
| `migrations/003_insight_snapshots.sql` | Вводит версионированные day/week/month insight snapshots. |
| `migrations/004_signal_provider_metadata.sql` | Добавляет provider/error metadata к signals. |
| `migrations/005_soft_delete_insight_snapshots.sql` | Добавляет мягкое удаление insight snapshots. |
| `migrations/006_insight_snapshot_topic.sql` | Добавляет topic к insight snapshots. |
| `migrations/007_perf_indexes.sql` | Добавляет индексы для основных read paths. |
| `migrations/008_signal_v3_contract.sql` | Расширяет signals полями Signal v3 и обновляет effective_signals. |
| `migrations/009_self_report_daily_aggregates.sql` | Создаёт textless daily aggregates добровольных self-reports. |
| `migrations/010_auth.sql` | Создаёт owner users и server sessions. |
| `migrations/011_signal_v4_context.sql` | Добавляет deterministic context Signal v4 и обновляет effective_signals. |
| `migrations/012_signal_v5_activity_context.sql` | SQL-миграция схемы SQLite. |
| `migrations/013_remove_emotion_signals.sql` | SQL-миграция схемы SQLite. |

### Tests

| Файл | Ответственность |
| --- | --- |
| `test/activity-insights.test.js` | Node test для соответствующего сценария: activity insights test. |
| `test/analytics-v2.test.js` | Node test для соответствующего сценария: analytics v2 test. |
| `test/auth-api.test.js` | Node test для соответствующего сценария: auth api test. |
| `test/auth.test.js` | Node test для соответствующего сценария: auth test. |
| `test/backend-metadata-export.test.js` | Node test для соответствующего сценария: backend metadata export test. |
| `test/e2e/editor-smoke.spec.ts` | Playwright end-to-end проверка: editor smoke spec. |
| `test/entry-debug-tooltip.test.js` | Node test для соответствующего сценария: entry debug tooltip test. |
| `test/entry-flow.test.js` | Node test для соответствующего сценария: entry flow test. |
| `test/entry-search.test.js` | Node test для соответствующего сценария: entry search test. |
| `test/entry-server-sync.test.js` | Node test для соответствующего сценария: entry server sync test. |
| `test/entry-sync-backend.test.js` | Node test для соответствующего сценария: entry sync backend test. |
| `test/entry-sync-job.test.js` | Node test для соответствующего сценария: entry sync job test. |
| `test/entry-sync-policy.test.js` | Node test для соответствующего сценария: entry sync policy test. |
| `test/gemini-quota.test.js` | Node test для соответствующего сценария: gemini quota test. |
| `test/helpers/createTestDb.js` | Тестовая инфраструктура: create test db. |
| `test/import-apply.test.js` | Node test для соответствующего сценария: import apply test. |
| `test/import-validation.test.js` | Node test для соответствующего сценария: import validation test. |
| `test/insights.test.js` | Node test для соответствующего сценария: insights test. |
| `test/migrations.test.js` | Node test для соответствующего сценария: migrations test. |
| `test/privacy-boundary.test.js` | Node test для соответствующего сценария: privacy boundary test. |
| `test/privacy-export.test.js` | Node test для соответствующего сценария: privacy export test. |
| `test/queue-errors.test.js` | Node test для соответствующего сценария: queue errors test. |
| `test/reprocess-policy.test.js` | Node test для соответствующего сценария: reprocess policy test. |
| `test/results-model.test.js` | Node test для соответствующего сценария: results model test. |
| `test/sanitization.test.js` | Node test для соответствующего сценария: sanitization test. |
| `test/self-reports.test.js` | Node test для соответствующего сценария: self reports test. |
| `test/signal-context.test.js` | Node test для соответствующего сценария: signal context test. |
| `test/signal-fixtures.js` | Node test для соответствующего сценария: signal fixtures. |
| `test/signal-pipeline.test.js` | Node test для соответствующего сценария: signal pipeline test. |
| `test/startup-resilience.test.js` | Node test для соответствующего сценария: startup resilience test. |
| `test/vault-crypto.test.js` | Node test для соответствующего сценария: vault crypto test. |
| `test/vault-profiles.test.js` | Node test для соответствующего сценария: vault profiles test. |

### Documentation

| Файл | Ответственность |
| --- | --- |
| `docs/API.md` | Ручная документация по теме, обозначенной именем файла. |
| `docs/ARCHITECTURE.md` | Ручная документация по теме, обозначенной именем файла. |
| `docs/CONTRACTS.md` | Ручная документация по теме, обозначенной именем файла. |
| `docs/DEPLOYMENT.md` | Ручная документация по теме, обозначенной именем файла. |
| `docs/EXPORT_IMPORT.md` | Ручная документация по теме, обозначенной именем файла. |
| `docs/MIGRATIONS.md` | Ручная документация по теме, обозначенной именем файла. |
| `docs/PERFORMANCE.md` | Ручная документация по теме, обозначенной именем файла. |
| `docs/PRIVACY.md` | Ручная документация по теме, обозначенной именем файла. |
| `docs/README.md` | Ручная документация по теме, обозначенной именем файла. |
| `docs/SEARCH.md` | Ручная документация по теме, обозначенной именем файла. |
| `docs/SECURITY_CHECKLIST.md` | Ручная документация по теме, обозначенной именем файла. |
| `docs/SECURITY.md` | Ручная документация по теме, обозначенной именем файла. |
| `docs/SELF_HOSTING.md` | Ручная документация по теме, обозначенной именем файла. |
| `docs/TESTING.md` | Ручная документация по теме, обозначенной именем файла. |

### Client support files

| Файл | Ответственность |
| --- | --- |
| `client/.gitignore` | Проектный файл:  gitignore. |
| `client/assets/editor.png` | Статический визуальный asset; функций не содержит. |
| `client/assets/entries.png` | Статический визуальный asset; функций не содержит. |
| `client/assets/Observation.png` | Статический визуальный asset; функций не содержит. |
| `client/assets/Settings.png` | Статический визуальный asset; функций не содержит. |
| `client/eslint.config.js` | Проектный файл: eslint config. |
| `client/index.html` | Проектный файл: index. |
| `client/package-lock.json` | Автогенерируемая фиксация npm dependency tree. |
| `client/package.json` | npm manifest, scripts и dependency policy соответствующего workspace. |
| `client/postcss.config.js` | Проектный файл: postcss config. |
| `client/public/favicon.svg` | Статический визуальный asset; функций не содержит. |
| `client/public/icons.svg` | Статический визуальный asset; функций не содержит. |
| `client/public/sw.js` | Статический browser asset: sw. |
| `client/README.md` | Ручная документация по теме, обозначенной именем файла. |
| `client/tailwind.config.js` | Проектный файл: tailwind config. |
| `client/tsconfig.app.json` | Конфигурация TypeScript для соответствующей цели сборки. |
| `client/tsconfig.json` | Конфигурация TypeScript для соответствующей цели сборки. |
| `client/tsconfig.node.json` | Конфигурация TypeScript для соответствующей цели сборки. |
| `client/vite.config.ts` | Проектный файл: vite config. |

### Maintenance scripts

| Файл | Ответственность |
| --- | --- |
| `scripts/generate-code-map.mjs` | Проектный файл: generate code map. |

### Root and deployment files

| Файл | Ответственность |
| --- | --- |
| `.dockerignore` | Проектный файл:  dockerignore. |
| `.env.example` | Проектный файл:  env. |
| `.github/workflows/ci.yml` | Проектный файл: ci. |
| `.gitignore` | Проектный файл:  gitignore. |
| `CHANGELOG.md` | Ручная документация по теме, обозначенной именем файла. |
| `compose.yaml` | Проектный файл: compose. |
| `Dockerfile` | Проектный файл: dockerfile. |
| `LICENSE` | Проектный файл: license. |
| `package-lock.json` | Автогенерируемая фиксация npm dependency tree. |
| `package.json` | npm manifest, scripts и dependency policy соответствующего workspace. |
| `playwright.config.ts` | Проектный файл: playwright config. |
| `README.md` | Ручная документация по теме, обозначенной именем файла. |
| `run-dev.bat` | Проектный файл: run dev. |
| `tsconfig.server.build.json` | Конфигурация TypeScript для соответствующей цели сборки. |
| `tsconfig.server.json` | Конфигурация TypeScript для соответствующей цели сборки. |

## Справочник функций

Здесь перечислены все именованные function declarations, функции в переменных, class methods и вложенные именованные helpers. Диапазон строк показывает, какой участок файла реализует функцию.

## Client runtime: функции

### `client/src/App.tsx`

Верхняя граница клиентского приложения: серверная авторизация, локальный vault, профили и допуск в рабочую область.

#### `App` — L23–L238 · public API

Собирает внешний access flow приложения: server auth, выбор vault-профиля, локальную разблокировку и переход в AthenaWorkspace.

- Основные вызовы: `useI18n`, `useServerAuth`, `useLocalVault`, `useState`, `getVaultProfiles`, `getActiveVaultProfileId`, `isAppProtectionEnabled`, `useAppAutoLockPreference`.

#### `activateVaultProfile` — L69–L75 · nested helper в App

Выполняет локальную операцию activate vault profile внутри ответственности этого файла.

- Параметры: `profileId`.

- Основные вызовы: `setActiveVaultProfileId`, `setVaultProfileId`, `reload`.

#### `createAndActivateVaultProfile` — L77–L88 · nested helper в App

Создаёт and activate vault profile из переданных данных, не отдавая вызывающему коду детали сборки.

- Основные вызовы: `addVaultProfile`, `String`, `setVaultProfilesState`, `setActiveVaultProfileId`, `setVaultProfileId`, `reload`.

#### `renameAndRefreshVaultProfile` — L90–L92 · nested helper в App

Выполняет локальную операцию rename and refresh vault profile внутри ответственности этого файла.

- Параметры: `profileId`, `name`.

- Основные вызовы: `setVaultProfilesState`, `renameVaultProfile`.

#### `deleteAndRefreshVaultProfile` — L94–L122 · nested helper в App

Удаляет или очищает and refresh vault profile с необходимыми связанными действиями.

- Параметры: `profileId`.

- Основные вызовы: `window.confirm`, `t`, `deleteAthenaProfileData`, `deleteVaultProfile`, `getActiveVaultProfileId`, `setVaultProfilesState`, `setVaultProfileId`, `reload`.

#### `formatVaultStartupError` — L240–L252 · internal helper

Преобразует vault startup error в стабильное представление для UI, сети или хранения.

- Параметры: `error`, `t`.

- Основные вызовы: `t`.

### `client/src/app/AthenaErrorBoundary.tsx`

Клиентская оркестрация приложения и lifecycle hook: athena error boundary.

#### `getDerivedStateFromError` — L45–L47 · class/object method

Получает derived state from error из принадлежащего модулю источника данных.

- Параметры: `error`.

#### `componentDidCatch` — L49–L51 · class/object method

Выполняет локальную операцию component did catch внутри ответственности этого файла.

- Параметры: `error`, `errorInfo`.

- Основные вызовы: `console.error`.

#### `render` — L65–L96 · class/object method

Возвращает вычисленное значение render для использования внутри данного модуля.

- Основные вызовы: `recover`.

#### Публичные типы, классы и константы

- `class AthenaErrorBoundary` — L36

### `client/src/app/AthenaWorkspace.tsx`

Компонует видимые поверхности Athena и связывает состояние приложения с UI-обработчиками.

#### `AthenaWorkspace` — L89–L390 · public API

Рендерит основную рабочую область и связывает editor, archive, observations, settings и floating panels с фасадом useAthenaApp.

- Параметры: `{ activeVaultProfileId, appProtectionEnabled, autoLockPreference, vaultProfiles, vaultCredentials, onAddVaultCredential, onChangeAutoLockPreference, onCreateVaultProfile, onDeleteVaultProfile, onDeleteVaultCredential, onLockVault, onRenameVaultProfile, onSelectVaultProfile, onRotateVaultSecret, }`.

- Основные вызовы: `useAthenaApp`, `useI18n`, `useState`, `useMemo`, `buildActivityIndex`, `useActivityInsights`, `useObservationNotifications`, `useCallback`.

#### `handleOpenObservations` — L154–L158 · nested helper в AthenaWorkspace

Исполняет сценарий open observations и координирует его побочные эффекты.

- Основные вызовы: `setIsObservationsOpen`, `markAllObservationsSeen`, `refreshObservationHistory`.

#### `handleRefreshObservations` — L160–L162 · nested helper в AthenaWorkspace

Исполняет сценарий refresh observations и координирует его побочные эффекты.

- Основные вызовы: `refreshObservationHistory`.

#### `handleOpenActivity` — L168–L175 · nested helper в AthenaWorkspace

Исполняет сценарий open activity и координирует его побочные эффекты.

- Параметры: `activityId`.

- Основные вызовы: `setFocusedActivity`, `setIsObservationsOpen`, `navigate`.

### `client/src/app/localData.ts`

Клиентская оркестрация приложения и lifecycle hook: local data.

#### `deleteAthenaLocalData` — L39–L45 · public API

Удаляет или очищает athena local data с необходимыми связанными действиями.

- Основные вызовы: `deleteCurrentAthenaDatabase`, `removeItem`, `getProfileScopedStorageKey`.

#### `deleteAthenaProfileData` — L47–L50 · public API

Удаляет или очищает athena profile data с необходимыми связанными действиями.

- Параметры: `profileId`.

- Основные вызовы: `deleteAthenaDatabaseForProfile`, `deleteProfileLocalStorage`.

#### `deleteProfileLocalStorage` — L52–L77 · internal helper

Удаляет или очищает profile local storage с необходимыми связанными действиями.

- Параметры: `profileId`.

- Основные вызовы: `isDefaultVaultProfile`, `getLocalStorageKeys`, `endsWith`, `removeItem`, `getProfileScopedStorageKey`, `getVaultProfiles`, `startsWith`.

#### `getLocalStorageKeys` — L79–L83 · internal helper

Получает local storage keys из принадлежащего модулю источника данных.

- Основные вызовы: `Array.from`, `key`, `Boolean`.

### `client/src/app/navigationTypes.ts`

Клиентская оркестрация приложения и lifecycle hook: navigation types.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `type Page` — L1

### `client/src/app/useAppAutoLock.ts`

Клиентская оркестрация приложения и lifecycle hook: use app auto lock.

#### `useAppAutoLockPreference` — L10–L42 · public API

Управляет React-состоянием, derived values и side effects для app auto lock preference.

- Основные вызовы: `useState`, `getAppLockAutoLockPreference`, `useCallback`, `setAppLockAutoLockPreference`, `setAutoLockPreferenceState`, `useEffect`, `window.addEventListener`, `window.removeEventListener`.

#### `handleAutoLockPreferenceChange` — L24–L26 · nested helper в useAppAutoLockPreference

Исполняет сценарий auto lock preference change и координирует его побочные эффекты.

- Основные вызовы: `setAutoLockPreferenceState`, `getAppLockAutoLockPreference`.

#### `useAthenaAutoLock` — L44–L99 · public API

Управляет React-состоянием, derived values и side effects для athena auto lock.

- Параметры: `{ appProtectionEnabled, autoLockPreference, onLock, }`.

- Основные вызовы: `useEffect`, `onLock`, `addEventListener`, `removeEventListener`, `getAppLockAutoLockDelayMs`, `window.setTimeout`, `window.clearTimeout`, `window.addEventListener`.

#### `handleVisibilityChange` — L59–L63 · nested helper в useAthenaAutoLock

Исполняет сценарий visibility change и координирует его побочные эффекты.

- Основные вызовы: `onLock`.

#### `refreshTimer` — L82–L85 · nested helper в useAthenaAutoLock

Выполняет локальную операцию refresh timer внутри ответственности этого файла.

- Основные вызовы: `window.clearTimeout`, `window.setTimeout`.

### `client/src/app/useAthenaApp.ts`

Главный composition hook клиента; собирает editor, entries, insights, settings, queue и lifecycle в один фасад.

#### `useAthenaApp` — L15–L165 · public API

Создаёт единый фасад состояния и handlers для AthenaWorkspace, соединяя независимые feature hooks без переноса их логики в UI.

- Основные вызовы: `useI18n`, `useEntries`, `useEditorDraft`, `selectEntry`, `useSettingsState`, `useInsights`, `useSyncQueue`, `useAthenaNavigation`.

#### `handleDeleteEntry` — L69–L74 · nested helper в useAthenaApp

Исполняет сценарий delete entry и координирует его побочные эффекты.

- Параметры: `entry`.

- Основные вызовы: `deleteEntry`, `clearIfEditingEntry`, `refreshInsights`, `refreshObservationHistory`.

#### `handleClearLocalData` — L76–L87 · nested helper в useAthenaApp

Исполняет сценарий clear local data и координирует его побочные эффекты.

- Основные вызовы: `window.confirm`, `t`, `deleteAthenaLocalData`, `resetAfterLocalDataClear`, `resetEntries`, `refreshEntries`, `setPage`.

#### `handleReprocessFallbackEntries` — L89–L95 · nested helper в useAthenaApp

Исполняет сценарий reprocess fallback entries и координирует его побочные эффекты.

- Основные вызовы: `reprocessFallbackEntries`.

### `client/src/app/useAthenaLifecycle.ts`

Клиентская оркестрация приложения и lifecycle hook: use athena lifecycle.

#### `useAthenaLifecycle` — L15–L55 · public API

Управляет React-состоянием, derived values и side effects для athena lifecycle.

- Параметры: `{ initializeDraft, initializeExtractionSettings, refreshEntries, refreshInsights, refreshObservationHistory, setPage, }`.

- Основные вызовы: `useCallback`, `initializeExtractionSettings`, `initializeDraft`, `setPage`, `processPendingReextractEntries`, `refreshEntries`, `refreshInsights`, `refreshObservationHistory`.

### `client/src/app/useAthenaNavigation.ts`

Клиентская оркестрация приложения и lifecycle hook: use athena navigation.

#### `useAthenaNavigation` — L24–L72 · public API

Управляет React-состоянием, derived values и side effects для athena navigation.

- Параметры: `{ editor, entries, insights, draftText, }`.

- Основные вызовы: `useState`, `newBlankPage`, `clearEditorInsight`, `setPage`, `editEntry`, `clearAutosaveTimer`, `persistEditorText`, `refreshEntries`.

#### `newBlankPage` — L32–L36 · nested helper в useAthenaNavigation

Выполняет локальную операцию new blank page внутри ответственности этого файла.

- Основные вызовы: `newBlankPage`, `clearEditorInsight`, `setPage`.

#### `editEntry` — L38–L42 · nested helper в useAthenaNavigation

Выполняет локальную операцию edit entry внутри ответственности этого файла.

- Параметры: `entry`.

- Основные вызовы: `editEntry`, `clearEditorInsight`, `setPage`.

#### `navigate` — L44–L61 · nested helper в useAthenaNavigation

Выполняет локальную операцию navigate внутри ответственности этого файла.

- Параметры: `nextPage`.

- Основные вызовы: `clearAutosaveTimer`, `persistEditorText`, `setPage`, `refreshEntries`, `activeEntryId`, `selectEntry`.

### `client/src/app/useVaultLockPreparation.ts`

Клиентская оркестрация приложения и lifecycle hook: use vault lock preparation.

#### `useVaultLockPreparation` — L4–L18 · public API

Управляет React-состоянием, derived values и side effects для vault lock preparation.

- Параметры: `{ clearAutosaveTimer, draftText, persistEditorText, }`.

- Основные вызовы: `useCallback`, `stopQueueForVaultLock`, `clearAutosaveTimer`, `persistEditorText`.

### `client/src/components/floating/FloatingLayerContext.ts`

Инфраструктура плавающих панелей и их геометрии: floating layer context.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `type FloatingPanelId` — L3
- `type FloatingPanelPosition` — L5
- `type FloatingPanelRect` — L10
- `type FloatingPanelOcclusion` — L15
- `type FloatingPanelRects` — L17
- `type FloatingPanelOcclusions` — L21
- `type FloatingPanelZIndexes` — L25
- `type FloatingLayerContextValue` — L27
- `const FLOATING_PANEL_BASE_Z_INDEX` — L39
- `const FloatingLayerContext` — L41

### `client/src/components/floating/FloatingLayerProvider.tsx`

Инфраструктура плавающих панелей и их геометрии: floating layer provider.

#### `FloatingLayerProvider` — L23–L97 · public API

Рендерит React-компонент FloatingLayerProvider и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ children, }`.

- Основные вызовы: `useRef`, `useState`, `useCallback`, `setPanelZIndexes`, `setPanelRects`, `setPanelOcclusions`, `useMemo`.

### `client/src/components/floating/FloatingPanel.tsx`

Инфраструктура плавающих панелей и их геометрии: floating panel.

#### `FloatingPanel` — L78–L313 · public API

Рендерит React-компонент FloatingPanel и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ "aria-label": ariaLabel, children, className, defaultPosition = DEFAULT_PANEL_POSITION, id, isOpen, maxViewportInset = DEFAULT_VIEWPORT_INSET, occlusion, onClose, storageKey, style, testId, }`.

- Основные вызовы: `useRef`, `useFloatingLayer`, `useState`, `getInitialPosition`, `useMemo`, `useCallback`, `setPosition`, `getBoundingClientRect`.

#### `handleResize` — L198–L200 · nested helper в FloatingPanel

Исполняет сценарий resize и координирует его побочные эффекты.

- Основные вызовы: `clampAndStorePosition`.

#### `handleKeyDown` — L215–L217 · nested helper в FloatingPanel

Исполняет сценарий key down и координирует его побочные эффекты.

- Параметры: `event`.

- Основные вызовы: `closePanel`.

#### `handlePointerDown` — L228–L244 · nested helper в FloatingPanel

Исполняет сценарий pointer down и координирует его побочные эффекты.

- Параметры: `event`.

- Основные вызовы: `activatePanel`, `isInteractiveDragTarget`, `setPointerCapture`, `setIsDragging`.

#### `handlePointerMove` — L246–L261 · nested helper в FloatingPanel

Исполняет сценарий pointer move и координирует его побочные эффекты.

- Параметры: `event`.

- Основные вызовы: `clampPosition`, `getPanelSize`, `setPanelPosition`, `schedulePanelRectUpdate`.

#### `handlePointerUp` — L263–L271 · nested helper в FloatingPanel

Исполняет сценарий pointer up и координирует его побочные эффекты.

- Параметры: `event`.

- Основные вызовы: `setIsDragging`, `releasePointerCapture`, `clampAndStorePosition`.

#### `handlePointerCancel` — L273–L281 · nested helper в FloatingPanel

Исполняет сценарий pointer cancel и координирует его побочные эффекты.

- Параметры: `event`.

- Основные вызовы: `setIsDragging`, `releasePointerCapture`, `clampAndStorePosition`.

#### `getInitialPosition` — L315–L324 · internal helper

Получает initial position из принадлежащего модулю источника данных.

- Параметры: `id`, `defaultPosition`, `storageKey`.

- Основные вызовы: `readStoredPosition`.

#### `isInteractiveDragTarget` — L326–L329 · internal helper

Проверяет условие interactive drag target и возвращает логический результат без изменения состояния.

- Параметры: `target`.

- Основные вызовы: `Boolean`, `closest`.

#### `getPanelSize` — L331–L339 · internal helper

Получает panel size из принадлежащего модулю источника данных.

- Параметры: `panel`.

- Основные вызовы: `getBoundingClientRect`.

#### `clampPosition` — L341–L361 · internal helper

Ограничивает position допустимым диапазоном или точностью.

- Параметры: `position`, `panelSize`, `viewportInset`.

- Основные вызовы: `Math.max`, `clamp`.

#### `clamp` — L363–L365 · internal helper

Ограничивает clamp допустимым диапазоном или точностью.

- Параметры: `value`, `min`, `max`.

- Основные вызовы: `Math.min`, `Math.max`.

#### `releasePointerCapture` — L367–L371 · internal helper

Исполняет сценарий release pointer capture и координирует его побочные эффекты.

- Параметры: `element`, `pointerId`.

- Основные вызовы: `hasPointerCapture`, `releasePointerCapture`.

#### `cancelPanelRectAnimationFrame` — L373–L380 · internal helper

Проверяет условие cancel panel rect animation frame и возвращает логический результат без изменения состояния.

- Параметры: `animationFrameRef`.

- Основные вызовы: `cancelAnimationFrame`.

#### `readStoredPosition` — L382–L401 · internal helper

Получает stored position из принадлежащего модулю источника данных.

- Параметры: `storageKey`.

- Основные вызовы: `getItem`.

#### `writeStoredPosition` — L403–L415 · internal helper

Сохраняет stored position в принадлежащем модулю хранилище или read model.

- Параметры: `storageKey`, `position`.

- Основные вызовы: `setItem`.

#### `toFloatingPanelRect` — L417–L424 · internal helper

Возвращает вычисленное значение to floating panel rect для использования внутри данного модуля.

- Параметры: `rect`.

### `client/src/components/floating/index.ts`

Инфраструктура плавающих панелей и их геометрии: index.

Именованных функций нет: файл служит re-export границей.

### `client/src/components/floating/useFloatingLayer.ts`

Инфраструктура плавающих панелей и их геометрии: use floating layer.

#### `useFloatingLayer` — L15–L23 · public API

Управляет React-состоянием, derived values и side effects для floating layer.

- Основные вызовы: `useContext`.

#### `useFloatingOcclusions` — L25–L44 · public API

Управляет React-состоянием, derived values и side effects для floating occlusions.

- Параметры: `occlusion`.

- Основные вызовы: `useFloatingLayer`, `useMemo`, `flatMap`.

#### `useFloatingPanel` — L46–L57 · public API

Управляет React-состоянием, derived values и side effects для floating panel.

- Параметры: `id`.

- Основные вызовы: `useFloatingLayer`, `useMemo`, `activatePanel`.

### `client/src/components/floating/useFloatingTextOcclusion.ts`

Инфраструктура плавающих панелей и их геометрии: use floating text occlusion.

#### `useFloatingTextOcclusion` — L29–L124 · public API

Управляет React-состоянием, derived values и side effects для floating text occlusion.

- Параметры: `targetRef`.

- Основные вызовы: `useFloatingOcclusions`, `useRef`, `useState`, `useMemo`, `useCallback`, `setTargetRect`, `toFloatingPanelRect`, `getBoundingClientRect`.

#### `handleViewportChange` — L67–L69 · nested helper в useFloatingTextOcclusion

Исполняет сценарий viewport change и координирует его побочные эффекты.

- Основные вызовы: `syncTargetRect`.

#### `getTextOcclusionStyle` — L126–L168 · internal helper

Получает text occlusion style из принадлежащего модулю источника данных.

- Параметры: `targetRect`, `occlusionRects`.

- Основные вызовы: `getIntersectionRects`.

#### `getTextBlurMirrorStyles` — L170–L200 · internal helper

Получает text blur mirror styles из принадлежащего модулю источника данных.

- Параметры: `targetRect`, `occlusionRects`.

- Основные вызовы: `getIntersectionRects`, `flatMap`, `getInsetRect`, `Math.min`, `getTextBlurMirrorZoneStyle`.

#### `getTextBlurMirrorZoneStyle` — L202–L250 · internal helper

Получает text blur mirror zone style из принадлежащего модулю источника данных.

- Параметры: `{ blurPx, opacity, outerRect, targetRect, thickness, }`.

#### `getIntersectionRects` — L252–L262 · internal helper

Получает intersection rects из принадлежащего модулю источника данных.

- Параметры: `targetRect`, `occlusionRects`.

- Основные вызовы: `flatMap`, `getIntersectionRect`.

#### `getIntersectionRect` — L264–L283 · internal helper

Получает intersection rect из принадлежащего модулю источника данных.

- Параметры: `first`, `second`.

- Основные вызовы: `Math.max`, `Math.min`.

#### `getInsetRect` — L285–L300 · internal helper

Получает inset rect из принадлежащего модулю источника данных.

- Параметры: `rect`, `inset`.

#### `toFloatingPanelRect` — L302–L309 · internal helper

Возвращает вычисленное значение to floating panel rect для использования внутри данного модуля.

- Параметры: `rect`.

#### `areSameFloatingPanelRect` — L311–L323 · internal helper

Возвращает вычисленное значение are same floating panel rect для использования внутри данного модуля.

- Параметры: `first`, `second`.

### `client/src/components/icon.tsx`

Пользовательский UI-компонент: icon.

#### `Icon` — L85–L124 · public API

Рендерит React-компонент Icon и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ name, className, }`.

#### `EyeOpenIcon` — L126–L143 · public API

Рендерит React-компонент EyeOpenIcon и связывает его props с соответствующей UI-поверхностью.

#### `EyeClosedIcon` — L145–L181 · public API

Рендерит React-компонент EyeClosedIcon и связывает его props с соответствующей UI-поверхностью.

#### `HeartIcon` — L183–L194 · public API

Рендерит React-компонент HeartIcon и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ className = "h-4 w-4" }`.

#### `UserCircleIcon` — L196–L225 · public API

Рендерит React-компонент UserCircleIcon и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ className = "h-5 w-5", }`.

#### `GlobeIcon` — L227–L257 · public API

Рендерит React-компонент GlobeIcon и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ className = "h-5 w-5" }`.

### `client/src/components/LanguageSelect.tsx`

Пользовательский UI-компонент: language select.

#### `LanguageSelect` — L13–L39 · public API

Рендерит React-компонент LanguageSelect и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ className = "", selectClassName = "", }`.

- Основные вызовы: `useI18n`, `t`, `setLanguage`.

### `client/src/components/Nav.tsx`

Пользовательский UI-компонент: nav.

#### `Nav` — L28–L107 · public API

Рендерит React-компонент Nav и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ canLockAthena, currentPage, isSettingsOpen, onLockAthena, onNavigate, onOpenSettings, }`.

- Основные вызовы: `useI18n`, `t`, `onNavigate`.

### `client/src/components/TooltipButton.tsx`

Пользовательский UI-компонент: tooltip button.

#### `TooltipButton` — L32–L161 · public API

Рендерит React-компонент TooltipButton и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ onBlur, onClick, onFocus, onPointerEnter, onPointerLeave, tooltip, tooltipPlacement = "top", ...props }`.

- Основные вызовы: `useRef`, `useState`, `useCallback`, `window.clearTimeout`, `clearShowTimer`, `clearHideTimer`, `setPosition`, `window.setTimeout`.

#### `handlePointerEnter` — L106–L109 · nested helper в TooltipButton

Исполняет сценарий pointer enter и координирует его побочные эффекты.

- Параметры: `event`.

- Основные вызовы: `onPointerEnter`, `scheduleShow`.

#### `handlePointerLeave` — L111–L114 · nested helper в TooltipButton

Исполняет сценарий pointer leave и координирует его побочные эффекты.

- Параметры: `event`.

- Основные вызовы: `onPointerLeave`, `hideTooltip`.

#### `handleFocus` — L116–L119 · nested helper в TooltipButton

Исполняет сценарий focus и координирует его побочные эффекты.

- Параметры: `event`.

- Основные вызовы: `onFocus`, `scheduleShow`.

#### `handleBlur` — L121–L124 · nested helper в TooltipButton

Исполняет сценарий blur и координирует его побочные эффекты.

- Параметры: `event`.

- Основные вызовы: `onBlur`, `hideTooltip`.

#### `handleClick` — L126–L129 · nested helper в TooltipButton

Исполняет сценарий click и координирует его побочные эффекты.

- Параметры: `event`.

- Основные вызовы: `onClick`, `hideTooltip`.

#### `getTooltipPosition` — L163–L198 · internal helper

Получает tooltip position из принадлежащего модулю источника данных.

- Параметры: `rect`, `placement`.

- Основные вызовы: `Math.max`.

### `client/src/features/auth/authApi.ts`

Клиентская feature server-auth: auth api.

#### `loadServerAuthStatus` — L33–L37 · public API

Получает server auth status из принадлежащего модулю источника данных.

- Основные вызовы: `fetch`, `json`.

#### `setupServerOwner` — L39–L50 · public API

Изменяет up server owner, сохраняя инварианты данного модуля.

- Параметры: `payload`.

- Основные вызовы: `fetch`, `jsonHeaders`, `text`, `json`.

#### `loginServerOwner` — L52–L63 · public API

Возвращает вычисленное значение login server owner для использования внутри данного модуля.

- Параметры: `payload`.

- Основные вызовы: `fetch`, `jsonHeaders`, `text`, `json`.

#### `logoutServerOwner` — L65–L74 · public API

Выполняет локальную операцию logout server owner внутри ответственности этого файла.

- Основные вызовы: `fetch`, `csrfHeaders`, `text`.

#### Публичные типы, классы и константы

- `type ServerAuthUser` — L9
- `type ServerAuthStatus` — L15

### `client/src/features/auth/ui/ServerAuthGate.tsx`

Клиентская feature server-auth: server auth gate.

#### `ServerAuthGate` — L19–L193 · public API

Рендерит React-компонент ServerAuthGate и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ error, isBusy, phase, onLogin, onRetry, onSetup, }`.

- Основные вызовы: `useI18n`, `useState`, `useEffect`, `setLocalError`, `setPassword`, `setConfirmation`, `preventDefault`, `onRetry`.

#### `handleSubmit` — L42–L76 · nested helper в ServerAuthGate

Исполняет сценарий submit и координирует его побочные эффекты.

- Параметры: `event`.

- Основные вызовы: `preventDefault`, `setLocalError`, `onRetry`, `t`, `onSetup`, `onLogin`.

#### `formatAuthError` — L195–L208 · internal helper

Преобразует auth error в стабильное представление для UI, сети или хранения.

- Параметры: `error`, `t`.

- Основные вызовы: `t`.

### `client/src/features/auth/useServerAuth.ts`

Клиентская feature server-auth: use server auth.

#### `useServerAuth` — L23–L162 · public API

Управляет React-состоянием, derived values и side effects для server auth.

- Основные вызовы: `useState`, `useRef`, `useCallback`, `setIsBusy`, `setError`, `loadServerAuthStatus`, `setIsRequired`, `setUser`.

#### `handleAuthRequired` — L73–L75 · nested helper в useServerAuth

Исполняет сценарий auth required и координирует его побочные эффекты.

- Основные вызовы: `refresh`.

#### `setup` — L84–L100 · nested helper в useServerAuth

Изменяет up, сохраняя инварианты данного модуля.

- Параметры: `input`.

- Основные вызовы: `setIsBusy`, `setError`, `setupServerOwner`, `setAuthSecretVersion`, `setUser`, `setPhase`.

#### `login` — L102–L118 · nested helper в useServerAuth

Выполняет локальную операцию login внутри ответственности этого файла.

- Параметры: `input`.

- Основные вызовы: `setIsBusy`, `setError`, `loginServerOwner`, `setAuthSecretVersion`, `setUser`, `setPhase`.

#### `lock` — L120–L139 · nested helper в useServerAuth

Управляет состоянием lock и соответствующей границей доступа.

- Основные вызовы: `setIsBusy`, `setError`, `logoutServerOwner`, `setUser`, `setPhase`.

#### Публичные типы, классы и константы

- `type ServerAuthPhase` — L11
- `type ServerAuthError` — L18

### `client/src/features/editor/content/athenaPhraseLibraries.ts`

Клиентская feature редактора: athena phrase libraries.

#### `getAthenaPhraseLibrary` — L20–L24 · public API

Получает athena phrase library из принадлежащего модулю источника данных.

- Параметры: `language`.

#### Публичные типы, классы и константы

- `const ATHENA_PHRASE_LANGUAGES` — L7
- `type AthenaPhraseLanguage` — L9
- `const DEFAULT_ATHENA_PHRASE_LANGUAGE` — L11

### `client/src/features/editor/content/athenaPhrasesDe.ts`

Клиентская feature редактора: athena phrases de.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `const ATHENA_LIBRARY_DE` — L3

### `client/src/features/editor/content/athenaPhrasesEn.ts`

Клиентская feature редактора: athena phrases en.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `const ATHENA_LIBRARY_EN` — L3

### `client/src/features/editor/content/athenaPhrasesRu.ts`

Клиентская feature редактора: athena phrases ru.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `const ATHENA_LIBRARY_RU` — L3

### `client/src/features/editor/content/athenaPhrasesTypes.ts`

Клиентская feature редактора: athena phrases types.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `type AthenaPhraseTime` — L1
- `type AthenaPhraseTone` — L3
- `type AthenaPhrase` — L5
- `type AthenaPhraseLibrary` — L12

### `client/src/features/editor/content/athenaPhrasesUk.ts`

Клиентская feature редактора: athena phrases uk.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `const ATHENA_LIBRARY_UK` — L3

### `client/src/features/editor/content/athenaPlaceholder.ts`

Клиентская feature редактора: athena placeholder.

#### `weightByTone` — L11–L28 · internal helper

Возвращает вычисленное значение weight by tone для использования внутри данного модуля.

- Параметры: `phrases`.

- Основные вызовы: `push`.

#### `getTimeBucket` — L30–L35 · internal helper

Получает time bucket из принадлежащего модулю источника данных.

- Параметры: `hours`.

#### `filterByTime` — L37–L42 · internal helper

Выбирает by time, удовлетворяющий ограничениям текущего сценария.

- Параметры: `phrases`, `current`.

#### `pickGreetingWithSignals` — L44–L66 · internal helper

Выбирает greeting with signals, удовлетворяющий ограничениям текущего сценария.

- Параметры: `phrases`, `signals`, `language`.

- Основные вызовы: `pickPhrase`.

#### `pickCTAWithSignals` — L68–L95 · internal helper

Выбирает ctawith signals, удовлетворяющий ограничениям текущего сценария.

- Параметры: `phrases`, `signals`, `language`.

- Основные вызовы: `weightByTone`, `pickPhrase`.

#### `generateAthenaPlaceholder` — L97–L132 · public API

Создаёт athena placeholder из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `insights`, `signals`, `language`.

- Основные вызовы: `getHours`, `getTimeBucket`, `getAthenaPhraseLibrary`, `Math.random`, `pickCTAWithSignals`, `filterByTime`, `pickGreetingWithSignals`.

### `client/src/features/editor/content/phrasePicker.ts`

Клиентская feature редактора: phrase picker.

#### `getBagKey` — L8–L10 · internal helper

Получает bag key из принадлежащего модулю источника данных.

- Параметры: `group`.

- Основные вызовы: `getProfileScopedStorageKey`.

#### `pickPhrase` — L12–L39 · public API

Выбирает phrase, удовлетворяющий ограничениям текущего сценария.

- Параметры: `group`, `phrases`.

- Основные вызовы: `getItem`, `getBagKey`, `Math.floor`, `Math.random`, `splice`, `setItem`.

### `client/src/features/editor/draftRepository.ts`

Локальный зашифрованный repository текущего editor draft.

#### `saveLocalDraft` — L26–L37 · public API

Сохраняет local draft в принадлежащем модулю хранилище или read model.

- Параметры: `text`.

- Основные вызовы: `toISOString`, `openAthenaLocalDb`, `transaction`, `idbRequest`, `put`, `objectStore`, `encryptLocalDraft`.

#### `clearLocalDraft` — L39–L41 · public API

Удаляет или очищает local draft с необходимыми связанными действиями.

- Основные вызовы: `saveLocalDraft`.

#### `encryptLocalDraft` — L43–L55 · internal helper

Выполняет криптографическое преобразование local draft в рамках локальной privacy boundary.

- Параметры: `draft`.

- Основные вызовы: `encryptVaultJson`.

### `client/src/features/editor/editorInsight.ts`

Клиентская feature редактора: editor insight.

#### `pickLatestUnseenEditorInsight` — L3–L12 · public API

Выбирает latest unseen editor insight, удовлетворяющий ограничениям текущего сценария.

- Параметры: `insights`, `seenInsightIds`.

- Основные вызовы: `at`, `has`.

#### `compareInsightsByRecency` — L14–L25 · internal helper

Сравнивает insights by recency для стабильного детерминированного порядка.

- Параметры: `left`, `right`.

- Основные вызовы: `localeCompare`.

### `client/src/features/editor/editorPlaceholder.ts`

Клиентская feature редактора: editor placeholder.

#### `buildAthenaPlaceholder` — L6–L23 · public API

Создаёт athena placeholder из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `editorInsight`, `personaTextEnabled`, `language`.

- Основные вызовы: `formatInsightText`, `generateAthenaPlaceholder`.

### `client/src/features/editor/editorTagUtils.ts`

Клиентская feature редактора: editor tag utils.

#### `findActiveTagInput` — L32–L50 · public API

Выбирает active tag input, удовлетворяющий ограничениям текущего сценария.

- Параметры: `text`, `cursorPosition`.

- Основные вызовы: `match`, `lastIndexOf`.

#### `normalizeEditorTag` — L52–L54 · public API

Приводит editor tag к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `tag`.

- Основные вызовы: `toLocaleLowerCase`, `replace`.

#### `buildSuggestionOptions` — L56–L103 · public API

Создаёт suggestion options из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `{ activeTagInput, availableTags, selectedTagSet, }`.

- Основные вызовы: `normalizeTag`, `has`, `normalizeEditorTag`.

#### `getTextareaCaretPoint` — L105–L169 · public API

Получает textarea caret point из принадлежащего модулю источника данных.

- Параметры: `textarea`, `editorCard`, `text`, `position`.

- Основные вызовы: `getBoundingClientRect`, `window.getComputedStyle`, `createElement`, `appendChild`, `removeChild`, `parseFloat`, `Math.floor`.

#### Публичные типы, классы и константы

- `type AvailableTag` — L3
- `type ActiveTagInput` — L8
- `type SuggestionOption` — L14
- `type MenuPosition` — L26

### `client/src/features/editor/ui/Editor.tsx`

Клиентская feature редактора: editor.

#### `Editor` — L42–L268 · public API

Рендерит React-компонент Editor и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ analysisEnabled, availableTags, editingEntryId, entryDate, editorInsight, personaTextEnabled, tags, text, onChangeTags, onChangeText, onNewBlankPage, onToggleAnalysisEnabled, }`.

- Основные вызовы: `useI18n`, `useState`, `useRef`, `useMemo`, `buildAthenaPlaceholder`, `useEditorTagControls`, `useFloatingTextOcclusion`, `useCallback`.

#### `loadOrAttachSelfReport` — L113–L141 · nested helper в Editor

Получает or attach self report из принадлежащего модулю источника данных.

- Основные вызовы: `setSelfReportValues`, `catch`, `persistSelfReport`, `getEntrySelfReport`.

### `client/src/features/editor/ui/EditorActionButtons.tsx`

Клиентская feature редактора: editor action buttons.

#### `EditorActionButtons` — L18–L171 · public API

Рендерит React-компонент EditorActionButtons и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ analysisEnabled, selfReportCloseSignal, selfReportValues, onInsertTag, onSelfReportCommit, onNewBlankPage, onToggleAnalysisEnabled, }`.

- Основные вызовы: `useI18n`, `useState`, `useRef`, `useEffect`, `window.clearTimeout`, `setIsSelfReportMenuOpen`, `setIsHeartPulsing`, `setHeartPulseKey`.

#### `handleSelfReportClick` — L41–L54 · nested helper в EditorActionButtons

Исполняет сценарий self report click и координирует его побочные эффекты.

- Основные вызовы: `window.clearTimeout`, `setIsSelfReportMenuOpen`, `setIsHeartPulsing`, `setHeartPulseKey`, `window.setTimeout`.

### `client/src/features/editor/ui/EditorTagChips.tsx`

Клиентская feature редактора: editor tag chips.

#### `EditorTagChips` — L14–L85 · public API

Рендерит React-компонент EditorTagChips и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ editingTagIndex, editingTagValue, tags, onCancelEdit, onChangeEditingValue, onCommitEdit, onRemoveTag, onStartEditingTag, }`.

- Основные вызовы: `useI18n`, `onChangeEditingValue`, `preventDefault`, `onCommitEdit`, `onCancelEdit`, `onStartEditingTag`, `t`, `onRemoveTag`.

### `client/src/features/editor/ui/EditorTagMenu.tsx`

Клиентская feature редактора: editor tag menu.

#### `EditorTagMenu` — L15–L68 · public API

Рендерит React-компонент EditorTagMenu и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ isOpen, menuPosition, selectedIndex, suggestions, onCommitSuggestion, }`.

- Основные вызовы: `useI18n`, `onCommitSuggestion`, `t`.

### `client/src/features/editor/ui/LineLever.tsx`

Клиентская feature редактора: line lever.

#### `LineLever` — L10–L33 · public API

Рендерит React-компонент LineLever и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ label, testId, value, onChange }`.

- Основные вызовы: `onChange`, `Number`.

### `client/src/features/editor/ui/SelfReportMenu.tsx`

Клиентская feature редактора: self report menu.

#### `SelfReportMenu` — L61–L175 · public API

Рендерит React-компонент SelfReportMenu и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ externalCloseSignal, isOpen, values: savedValues, onCommit, onClose, }`.

- Основные вызовы: `useI18n`, `useRef`, `useState`, `useEffect`, `setValues`, `setHasInteracted`, `useCallback`, `onCommit`.

#### `handlePointerDown` — L94–L104 · nested helper в SelfReportMenu

Исполняет сценарий pointer down и координирует его побочные эффекты.

- Параметры: `event`.

- Основные вызовы: `closest`, `closePanel`.

#### `setAxisValue` — L119–L125 · nested helper в SelfReportMenu

Изменяет axis value, сохраняя инварианты данного модуля.

- Параметры: `axis`, `value`.

- Основные вызовы: `setHasInteracted`, `setValues`.

#### `getSelfReportDefaultPosition` — L177–L201 · internal helper

Получает self report default position из принадлежащего модулю источника данных.

- Основные вызовы: `parseFloat`, `window.getComputedStyle`, `isFinite`, `Math.min`, `Math.max`.

### `client/src/features/editor/useEditorDraft.ts`

Владеет жизненным циклом черновика и записи: автосохранение, локальная запись, удаление пустых записей и постановка sync/extraction jobs.

#### `normalizeDraftTags` — L42–L50 · internal helper

Приводит draft tags к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `tags`.

- Основные вызовы: `Array.from`, `toLocaleLowerCase`, `replace`.

#### `tagsAreEqual` — L52–L57 · internal helper

Сравнивает два набора тегов после одинаковой нормализации, чтобы autosave не реагировал на эквивалентные значения.

- Параметры: `left`, `right`.

- Основные вызовы: `normalizeDraftTags`.

#### `useEditorDraft` — L59–L424 · public API

Управляет черновиком и активной записью, защищает autosave от гонок, пишет локально и ставит textless sync/extraction jobs.

- Параметры: `{ clearSelectedEntry, refreshEntries, selectEntry, }`.

- Основные вызовы: `useState`, `useRef`, `useEffect`, `useCallback`, `normalizeDraftTags`, `tagsAreEqual`, `setDraftStatus`, `getLocalEntry`.

#### `changeText` — L299–L303 · nested helper в useEditorDraft

Обновляет текст текущего draft и помечает editor state ожидающим autosave.

- Параметры: `value`.

- Основные вызовы: `setDraftText`, `setDraftStatus`, `setSaveStatus`.

#### `changeTags` — L305–L311 · nested helper в useEditorDraft

Нормализует новый набор тегов draft и помечает его ожидающим сохранения.

- Параметры: `nextTags`.

- Основные вызовы: `normalizeDraftTags`, `setDraftTags`, `setDraftStatus`, `setSaveStatus`.

#### `toggleAnalysisEnabled` — L313–L317 · nested helper в useEditorDraft

Переключает пользовательское разрешение на анализ активной записи и инициирует сохранение нового состояния.

- Основные вызовы: `setDraftAnalysisEnabled`, `setDraftStatus`, `setSaveStatus`.

#### `newBlankPage` — L319–L325 · nested helper в useEditorDraft

Завершает pending autosave текущей страницы, затем очищает editor для новой записи.

- Основные вызовы: `clearAutosaveTimer`, `persistEditorText`, `resetDraftState`, `clearSelectedEntry`.

#### `editEntry` — L327–L349 · nested helper в useEditorDraft

Сохраняет текущий draft и загружает выбранную локальную запись в editor без потери её metadata.

- Параметры: `entry`.

- Основные вызовы: `clearAutosaveTimer`, `persistEditorText`, `normalizeDraftTags`, `setEditingEntryId`, `setDraftText`, `setDraftTags`, `setDraftAnalysisEnabled`, `selectEntry`.

#### `clearIfEditingEntry` — L351–L364 · nested helper в useEditorDraft

Сбрасывает editor только когда удалённая запись сейчас открыта для редактирования.

- Параметры: `entryId`.

- Основные вызовы: `setEditingEntryId`, `setDraftText`, `setDraftTags`, `setDraftAnalysisEnabled`.

#### `resetAfterLocalDataClear` — L366–L378 · nested helper в useEditorDraft

Очищает все editor refs и React state после удаления локальных данных профиля.

- Основные вызовы: `setDraftText`, `setDraftTags`, `setDraftAnalysisEnabled`, `setEditingEntryId`, `setSaveStatus`.

#### `activeEntryId` — L380–L382 · nested helper в useEditorDraft

Возвращает id записи, которой сейчас принадлежит editor draft.

#### `clearAutosaveTimer` — L384–L389 · nested helper в useEditorDraft

Отменяет pending autosave timeout и очищает ссылку на него.

- Основные вызовы: `window.clearTimeout`.

#### `resetDraftState` — L391–L402 · nested helper в useEditorDraft

Возвращает editor draft, refs и статусы сохранения в исходное пустое состояние.

- Основные вызовы: `setEditingEntryId`, `setDraftText`, `setDraftTags`, `setDraftAnalysisEnabled`.

#### `enqueuePendingEntrySyncJob` — L426–L446 · internal helper

Оркестрирует pending entry sync job в инфраструктуре синхронизации или фоновой очереди.

- Параметры: `{ analysisEnabled, entryId, sourceTextHash, localRevision, }`.

- Основные вызовы: `catch`, `enqueueEntrySyncJob`.

#### `enqueuePendingSignalJob` — L448–L469 · internal helper

Оркестрирует pending signal job в инфраструктуре синхронизации или фоновой очереди.

- Параметры: `{ analysisEnabled, entryId, serverId, sourceTextHash, }`.

- Основные вызовы: `catch`, `enqueueEntrySignalReprocessJob`.

#### Публичные типы, классы и константы

- `type DraftStatus` — L27
- `type SaveStatus` — L28

### `client/src/features/editor/useEditorTagControls.ts`

Клиентская feature редактора: use editor tag controls.

#### `useEditorTagControls` — L28–L271 · public API

Управляет React-состоянием, derived values и side effects для editor tag controls.

- Параметры: `{ availableTags, tags, text, onChangeTags, onChangeText, }`.

- Основные вызовы: `useState`, `useRef`, `useMemo`, `Array.from`, `findActiveTagInput`, `buildSuggestionOptions`, `Boolean`, `useEffect`.

#### `focusTextareaAt` — L105–L114 · nested helper в useEditorTagControls

Выполняет локальную операцию focus textarea at внутри ответственности этого файла.

- Параметры: `position`.

- Основные вызовы: `window.requestAnimationFrame`, `focus`, `setSelectionRange`, `setCursorPosition`.

#### `insertHashAtCursor` — L116–L132 · nested helper в useEditorTagControls

Сохраняет insert hash at cursor в принадлежащем модулю хранилище или read model.

- Основные вызовы: `test`, `setDismissedTagInputKey`, `onChangeText`, `focusTextareaAt`.

#### `addTag` — L134–L140 · nested helper в useEditorTagControls

Выполняет локальную операцию tag внутри ответственности этого файла.

- Параметры: `rawTag`.

- Основные вызовы: `normalizeEditorTag`, `has`, `onChangeTags`.

#### `commitActiveTag` — L142–L161 · nested helper в useEditorTagControls

Выполняет локальную операцию commit active tag внутри ответственности этого файла.

- Параметры: `rawTag`.

- Основные вызовы: `normalizeEditorTag`, `endsWith`, `startsWith`, `addTag`, `onChangeText`, `setDismissedTagInputKey`, `focusTextareaAt`.

#### `commitSuggestion` — L163–L165 · nested helper в useEditorTagControls

Выполняет локальную операцию commit suggestion внутри ответственности этого файла.

- Параметры: `option`.

- Основные вызовы: `commitActiveTag`.

#### `removeTag` — L167–L173 · nested helper в useEditorTagControls

Удаляет или очищает tag с необходимыми связанными действиями.

- Параметры: `tagToRemove`.

- Основные вызовы: `normalizeTag`, `onChangeTags`.

#### `startEditingTag` — L175–L178 · nested helper в useEditorTagControls

Исполняет сценарий start editing tag и координирует его побочные эффекты.

- Параметры: `index`, `tag`.

- Основные вызовы: `setEditingTagIndex`, `setEditingTagValue`.

#### `commitTagEdit` — L180–L199 · nested helper в useEditorTagControls

Выполняет локальную операцию commit tag edit внутри ответственности этого файла.

- Основные вызовы: `normalizeEditorTag`, `onChangeTags`, `setEditingTagIndex`, `setEditingTagValue`, `Array.from`.

#### `cancelTagEdit` — L201–L204 · nested helper в useEditorTagControls

Проверяет условие cancel tag edit и возвращает логический результат без изменения состояния.

- Основные вызовы: `setEditingTagIndex`, `setEditingTagValue`.

#### `handleTextareaKeyDown` — L206–L248 · nested helper в useEditorTagControls

Исполняет сценарий textarea key down и координирует его побочные эффекты.

- Параметры: `event`.

- Основные вызовы: `preventDefault`, `setSelectedSuggestionIndex`, `Math.min`, `Math.max`, `setDismissedTagInputKey`, `commitSuggestion`, `commitActiveTag`.

### `client/src/features/entries/entriesApi.ts`

Клиентская feature архива записей: entries api.

#### `loadServerEntries` — L25–L35 · public API

Получает server entries из принадлежащего модулю источника данных.

- Основные вызовы: `fetch`, `handleUnauthorized`, `json`.

#### `loadServerEntry` — L37–L49 · public API

Получает server entry из принадлежащего модулю источника данных.

- Параметры: `entryId`.

- Основные вызовы: `fetch`, `encodeURIComponent`, `handleUnauthorized`, `json`.

#### `createEntry` — L51–L63 · public API

Создаёт entry из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `payload`.

- Основные вызовы: `fetch`, `csrfJsonHeaders`, `handleUnauthorized`, `createApiHttpError`, `json`.

#### `updateServerEntry` — L65–L80 · public API

Изменяет server entry, сохраняя инварианты данного модуля.

- Параметры: `entryId`, `payload`.

- Основные вызовы: `fetch`, `encodeURIComponent`, `csrfJsonHeaders`, `handleUnauthorized`, `createApiHttpError`, `json`.

#### `deleteServerEntry` — L82–L92 · public API

Удаляет или очищает server entry с необходимыми связанными действиями.

- Параметры: `entryId`.

- Основные вызовы: `fetch`, `encodeURIComponent`, `csrfHeaders`, `handleUnauthorized`, `text`.

### `client/src/features/entries/entryFilters.ts`

Клиентская feature архива записей: entry filters.

#### `normalizeTag` — L3–L9 · public API

Приводит tag к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `tag`.

- Основные вызовы: `toLocaleLowerCase`, `replace`.

#### `getEntryTagSet` — L11–L13 · public API

Получает entry tag set из принадлежащего модулю источника данных.

- Параметры: `entry`.

#### `getAvailableTags` — L15–L48 · public API

Получает available tags из принадлежащего модулю источника данных.

- Параметры: `entries`.

- Основные вызовы: `normalizeTag`, `has`, `add`, `get`, `set`, `replace`, `Array.from`, `values`.

#### `entryMatchesIncludedTags` — L50–L59 · public API

Возвращает вычисленное значение entry matches included tags для использования внутри данного модуля.

- Параметры: `entry`, `includedTags`.

- Основные вызовы: `getEntryTagSet`, `has`, `normalizeTag`.

#### `entryMatchesExcludedTags` — L61–L70 · public API

Возвращает вычисленное значение entry matches excluded tags для использования внутри данного модуля.

- Параметры: `entry`, `excludedTags`.

- Основные вызовы: `getEntryTagSet`, `has`, `normalizeTag`.

#### `filterEntriesByTags` — L72–L82 · public API

Выбирает entries by tags, удовлетворяющий ограничениям текущего сценария.

- Параметры: `entries`, `includedTags`, `excludedTags`.

- Основные вызовы: `entryMatchesIncludedTags`, `entryMatchesExcludedTags`.

#### `pruneUnavailableTags` — L84–L93 · public API

Выбирает unavailable tags, удовлетворяющий ограничениям текущего сценария.

- Параметры: `selectedTags`, `availableTags`.

- Основные вызовы: `normalizeTag`, `has`.

### `client/src/features/entries/entryPreferences.ts`

Клиентская feature архива записей: entry preferences.

#### `getEntrySortDirection` — L6–L10 · public API

Получает entry sort direction из принадлежащего модулю источника данных.

- Основные вызовы: `getItem`, `getProfileScopedStorageKey`.

#### `setEntrySortDirection` — L12–L14 · public API

Изменяет entry sort direction, сохраняя инварианты данного модуля.

- Параметры: `value`.

- Основные вызовы: `setItem`, `getProfileScopedStorageKey`.

#### Публичные типы, классы и константы

- `const ENTRY_SORT_DIRECTION_KEY` — L4

### `client/src/features/entries/entrySearch.ts`

Чистый поисковый движок архива: разбор запроса, индексирование, lexical/semantic scoring и построение snippets.

#### `normalizeSearchQuery` — L92–L94 · public API

Приводит search query к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `query`.

- Основные вызовы: `toLocaleLowerCase`, `replace`.

#### `tokenizeSearchQuery` — L96–L107 · public API

Возвращает вычисленное значение tokenize search query для использования внутри данного модуля.

- Параметры: `query`.

- Основные вызовы: `normalizeSearchQuery`, `uniqueNormalizedValues`, `split`.

#### `parseEntrySearchQuery` — L109–L154 · public API

Разбирает entry search query и преобразует вход в типизированное представление.

- Параметры: `query`.

- Основные вызовы: `normalizeSearchQuery`, `tokenizeSearchQuery`, `test`, `push`, `startsWith`, `normalizeTag`, `has`, `uniqueNormalizedValues`.

#### `createEntrySearchIndex` — L156–L160 · public API

Предварительно нормализует локальные записи для повторных поисковых запросов без передачи текста на backend.

- Параметры: `entries`.

#### `indexEntryForSearch` — L162–L169 · public API

Возвращает вычисленное значение index entry for search для использования внутри данного модуля.

- Параметры: `entry`.

- Основные вызовы: `normalizeSearchQuery`.

#### `scoreEntryForQuery` — L171–L176 · public API

Детерминированно вычисляет entry for query из входных данных.

- Параметры: `entry`, `query`.

- Основные вызовы: `scoreIndexedEntryForQuery`, `indexEntryForSearch`.

#### `scoreIndexedEntryForQuery` — L178–L262 · public API

Детерминированно вычисляет indexed entry for query из входных данных.

- Параметры: `indexedEntry`, `query`.

- Основные вызовы: `parseEntrySearchQuery`, `createSearchResult`, `has`, `push`, `normalizeTag`.

#### `searchEntries` — L264–L269 · public API

Возвращает вычисленное значение search entries для использования внутри данного модуля.

- Параметры: `entries`, `query`.

- Основные вызовы: `searchIndexedEntries`, `createEntrySearchIndex`.

#### `searchEntriesHybrid` — L271–L277 · public API

Возвращает вычисленное значение search entries hybrid для использования внутри данного модуля.

- Параметры: `entries`, `query`, `mode`.

- Основные вызовы: `searchIndexedEntriesHybrid`, `createEntrySearchIndex`.

#### `searchIndexedEntries` — L279–L305 · public API

Возвращает вычисленное значение search indexed entries для использования внутри данного модуля.

- Параметры: `indexedEntries`, `query`.

- Основные вызовы: `parseEntrySearchQuery`, `createSearchResult`, `scoreIndexedEntryForQuery`.

#### `searchIndexedEntriesHybrid` — L307–L403 · public API

Объединяет lexical и локальные semantic matches, затем возвращает детерминированно отсортированные результаты.

- Параметры: `indexedEntries`, `query`, `mode`.

- Основные вызовы: `parseEntrySearchQuery`, `createSearchResult`, `searchIndexedEntries`, `get`, `set`, `passesStructuredFilters`, `loadSemanticIndexModule`, `getSemanticDocuments`.

#### `createEntrySearchSnippet` — L405–L422 · public API

Создаёт entry search snippet из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `text`, `query`, `maxLength`.

- Основные вызовы: `getSnippetSearchTerms`, `findCaseInsensitiveRange`, `createSnippetFromRange`.

#### `createSearchResult` — L424–L435 · internal helper

Создаёт search result из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `entry`, `score`, `matches`.

- Основные вызовы: `getMatchedFields`.

#### `getMatchedFields` — L437–L441 · internal helper

Получает matched fields из принадлежащего модулю источника данных.

- Параметры: `matches`.

- Основные вызовы: `has`.

#### `passesStructuredFilters` — L443–L471 · internal helper

Возвращает вычисленное значение passes structured filters для использования внутри данного модуля.

- Параметры: `indexedEntry`, `parsedQuery`.

- Основные вызовы: `has`.

#### `mergeMatches` — L473–L489 · internal helper

Преобразует или объединяет matches по правилам домена.

- Параметры: `left`, `right`.

- Основные вызовы: `has`, `add`, `push`.

#### `getSemanticDocuments` — L491–L513 · internal helper

Получает semantic documents из принадлежащего модулю источника данных.

- Параметры: `indexedEntries`, `semanticIndex`.

- Основные вызовы: `getSemanticDocument`, `push`, `yieldToEventLoop`.

#### `getSemanticDocument` — L515–L541 · internal helper

Получает semantic document из принадлежащего модулю источника данных.

- Параметры: `indexedEntry`, `semanticIndex`.

- Основные вызовы: `createSemanticDocumentCacheKey`, `createSemanticEntryDocument`.

#### `loadSemanticIndexModule` — L543–L554 · internal helper

Получает semantic index module из принадлежащего модулю источника данных.

- Основные вызовы: `catch`.

#### `yieldToEventLoop` — L556–L584 · internal helper

Возвращает вычисленное значение yield to event loop для использования внутри данного модуля.

- Основные вызовы: `yield`, `close`, `resolve`, `postMessage`, `setTimeout`.

#### `createSemanticDocumentCacheKey` — L586–L593 · internal helper

Создаёт semantic document cache key из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `entry`.

#### `getSnippetSearchTerms` — L595–L600 · internal helper

Получает snippet search terms из принадлежащего модулю источника данных.

- Параметры: `query`.

- Основные вызовы: `parseEntrySearchQuery`, `uniqueNormalizedValues`.

#### `findCaseInsensitiveRange` — L602–L616 · internal helper

Выбирает case insensitive range, удовлетворяющий ограничениям текущего сценария.

- Параметры: `text`, `term`.

- Основные вызовы: `toLocaleLowerCase`, `indexOf`.

#### `createSnippetFromRange` — L618–L642 · internal helper

Создаёт snippet from range из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `text`, `matchStart`, `matchEnd`, `maxLength`.

- Основные вызовы: `Math.max`, `Math.floor`, `Math.min`.

#### `uniqueNormalizedValues` — L644–L646 · internal helper

Возвращает вычисленное значение unique normalized values для использования внутри данного модуля.

- Параметры: `values`.

- Основные вызовы: `Array.from`.

#### Публичные типы, классы и константы

- `type EntrySearchField` — L7
- `type EntrySearchMode` — L9
- `type EntrySearchMatch` — L11
- `type EntrySearchResult` — L17
- `type EntrySearchSnippet` — L24
- `type ParsedEntrySearchQuery` — L30
- `type IndexedEntrySearchData` — L39

### `client/src/features/entries/entryState.ts`

Клиентская feature архива записей: entry state.

#### `mergeEntryState` — L9–L49 · public API

Преобразует или объединяет entry state по правилам домена.

- Параметры: `localEntry`, `serverEntry`.

- Основные вызовы: `normalizeSignal`, `normalizeMetadata`.

#### `mergeServerEntryIntoView` — L51–L67 · public API

Преобразует или объединяет server entry into view по правилам домена.

- Параметры: `entry`, `serverEntry`.

- Основные вызовы: `normalizeSignal`, `normalizeMetadata`.

#### `sortEntries` — L69–L76 · public API

Сравнивает entries для стабильного детерминированного порядка.

- Параметры: `entriesToSort`, `direction`.

- Основные вызовы: `compareEntries`.

#### `normalizeMetadata` — L78–L87 · internal helper

Приводит metadata к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `metadata`.

#### `compareEntries` — L89–L103 · internal helper

Сравнивает entries для стабильного детерминированного порядка.

- Параметры: `left`, `right`, `direction`.

- Основные вызовы: `localeCompare`.

### `client/src/features/entries/entryTypes.ts`

Клиентская feature архива записей: entry types.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `type EntrySortDirection` — L4
- `type LocalEntry` — L6
- `type EntryView` — L21

### `client/src/features/entries/localEntryRepository.ts`

Локальный зашифрованный repository записей и их browser-only текста.

#### `getAllLocalEntries` — L22–L30 · public API

Получает all local entries из принадлежащего модулю источника данных.

- Основные вызовы: `openAthenaLocalDb`, `transaction`, `idbRequest`, `getAll`, `objectStore`, `Promise.all`.

#### `getLocalEntry` — L32–L39 · public API

Получает local entry из принадлежащего модулю источника данных.

- Параметры: `id`.

- Основные вызовы: `openAthenaLocalDb`, `transaction`, `idbRequest`, `get`, `objectStore`, `normalizeLocalEntry`, `readStoredLocalEntry`.

#### `saveLocalEntry` — L41–L46 · public API

Сохраняет local entry в принадлежащем модулю хранилище или read model.

- Параметры: `entry`.

- Основные вызовы: `encryptLocalEntry`, `openAthenaLocalDb`, `transaction`, `idbRequest`, `put`, `objectStore`.

#### `updateLocalEntry` — L48–L58 · public API

Изменяет local entry, сохраняя инварианты данного модуля.

- Параметры: `id`, `patch`.

- Основные вызовы: `getLocalEntry`, `toISOString`, `saveLocalEntry`.

#### `deleteLocalEntry` — L60–L64 · public API

Удаляет или очищает local entry с необходимыми связанными действиями.

- Параметры: `id`.

- Основные вызовы: `openAthenaLocalDb`, `transaction`, `idbRequest`, `delete`, `objectStore`.

#### `replaceAllLocalEntries` — L66–L73 · public API

Сохраняет replace all local entries в принадлежащем модулю хранилище или read model.

- Параметры: `entries`.

- Основные вызовы: `Promise.all`, `openAthenaLocalDb`, `transaction`, `objectStore`, `idbRequest`, `clear`, `put`.

#### `createClientEntryId` — L75–L78 · public API

Создаёт client entry id из переданных данных, не отдавая вызывающему коду детали сборки.

- Основные вызовы: `crypto.randomUUID`, `now`, `Math.random`.

#### `createTextHash` — L80–L86 · public API

Создаёт text hash из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `text`.

- Основные вызовы: `encode`, `digest`, `Array.from`, `padStart`.

#### `compareLocalEntries` — L88–L93 · internal helper

Сравнивает local entries для стабильного детерминированного порядка.

- Параметры: `left`, `right`.

- Основные вызовы: `localeCompare`.

#### `normalizeLocalEntry` — L95–L97 · internal helper

Приводит local entry к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `entry`.

- Основные вызовы: `normalizeSignal`.

#### `readStoredLocalEntry` — L99–L106 · internal helper

Получает stored local entry из принадлежащего модулю источника данных.

- Параметры: `record`.

- Основные вызовы: `decryptVaultJson`, `createEntryVaultAssociatedData`.

#### `encryptLocalEntry` — L108–L121 · internal helper

Выполняет криптографическое преобразование local entry в рамках локальной privacy boundary.

- Параметры: `entry`.

- Основные вызовы: `encryptVaultJson`, `createEntryVaultAssociatedData`.

#### `createEntryVaultAssociatedData` — L123–L125 · internal helper

Создаёт entry vault associated data из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `entryId`.

### `client/src/features/entries/ui/EntriesPage.tsx`

Клиентская feature архива записей: entries page.

#### `EntriesPage` — L29–L144 · public API

Рендерит React-компонент EntriesPage и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ debugMode, entries, selectedEntryId, searchQuery, includedTags, excludedTags, hasActiveFilters, isSearching, onClearFilters, onDeleteEntry, onEditEntry, onSearchQueryChange, onSelectEntry, onToggleEntryAnalysis, onToggleExcludedTag, onToggleTag, }`.

- Основные вызовы: `useI18n`, `useRef`, `useState`, `useEntryColumnCount`, `useMemo`, `distributeEntriesByColumn`, `useEffect`, `setExpandedEntryId`.

#### `handleSelectEntry` — L66–L71 · nested helper в EntriesPage

Исполняет сценарий select entry и координирует его побочные эффекты.

- Параметры: `entryId`.

- Основные вызовы: `setExpandedEntryId`, `onSelectEntry`.

### `client/src/features/entries/ui/EntriesUtilityPanel.tsx`

Клиентская feature архива записей: entries utility panel.

#### `EntriesUtilityPanel` — L5–L87 · public API

Рендерит React-компонент EntriesUtilityPanel и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ searchQuery, includedTags, excludedTags, hasActiveFilters, isSearching, onClearFilters, onSearchQueryChange, onToggleExcludedTag, onToggleTag, }`.

- Основные вызовы: `useI18n`, `t`, `onSearchQueryChange`.

#### `ActiveTagFilters` — L89–L143 · internal helper

Рендерит React-компонент ActiveTagFilters и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ includedTags, excludedTags, onToggleTag, onToggleExcludedTag, }`.

- Основные вызовы: `useI18n`, `t`, `tagTestIdValue`, `onToggleTag`, `onToggleExcludedTag`.

### `client/src/features/entries/ui/entryDebugBlocks.ts`

Клиентская feature архива записей: entry debug blocks.

#### `getEntryDebugBlocks` — L14–L103 · public API

Получает entry debug blocks из принадлежащего модулю источника данных.

- Параметры: `entry`.

- Основные вызовы: `formatNullable`, `Object.entries`, `formatBasis`, `formatNullReasons`.

#### `formatDebugValue` — L105–L108 · public API

Преобразует debug value в стабильное представление для UI, сети или хранения.

- Параметры: `value`.

- Основные вызовы: `String`.

#### `formatEntryDebugText` — L110–L121 · public API

Преобразует entry debug text в стабильное представление для UI, сети или хранения.

- Параметры: `blocks`.

- Основные вызовы: `flatMap`, `formatDebugValue`.

#### `formatNullable` — L123–L125 · internal helper

Преобразует nullable в стабильное представление для UI, сети или хранения.

- Параметры: `value`.

#### `formatBasis` — L127–L129 · internal helper

Преобразует basis в стабильное представление для UI, сети или хранения.

- Параметры: `basis`.

#### `formatNullReasons` — L131–L141 · internal helper

Преобразует null reasons в стабильное представление для UI, сети или хранения.

- Параметры: `signals`.

#### Публичные типы, классы и константы

- `type DebugBlock` — L4
- `type DebugRow` — L9

### `client/src/features/entries/ui/EntryDebugTooltip.tsx`

Клиентская feature архива записей: entry debug tooltip.

#### `EntryDebugWaitCue` — L19–L31 · public API

Рендерит React-компонент EntryDebugWaitCue и связывает его props с соответствующей UI-поверхностью.

#### `EntryDebugTooltip` — L33–L174 · public API

Рендерит React-компонент EntryDebugTooltip и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ entry, maxHeight, onBlur, onFocus, onPointerEnter, onPointerLeave, style, tooltipRef, }`.

- Основные вызовы: `useMemo`, `getEntryDebugBlocks`, `formatEntryDebugText`, `useRef`, `useState`, `useEffect`, `window.clearTimeout`, `useCallback`.

#### `CopyIcon` — L176–L193 · internal helper

Рендерит React-компонент CopyIcon и связывает его props с соответствующей UI-поверхностью.

#### `CheckIcon` — L195–L207 · internal helper

Рендерит React-компонент CheckIcon и связывает его props с соответствующей UI-поверхностью.

#### `DebugTooltipRow` — L209–L218 · internal helper

Рендерит React-компонент DebugTooltipRow и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ label, value }`.

- Основные вызовы: `formatDebugValue`.

#### `writeTextToClipboard` — L220–L250 · internal helper

Сохраняет text to clipboard в принадлежащем модулю хранилище или read model.

- Параметры: `text`.

- Основные вызовы: `writeText`, `createElement`, `setAttribute`, `appendChild`, `focus`, `select`, `execCommand`, `removeChild`.

### `client/src/features/entries/ui/entryGrid.ts`

Клиентская feature архива записей: entry grid.

#### `useEntryColumnCount` — L4–L37 · public API

Управляет React-состоянием, derived values и side effects для entry column count.

- Параметры: `containerRef`, `itemCount`.

- Основные вызовы: `useState`, `useEffect`, `getEntryColumnCount`, `setColumnCount`, `updateColumnCount`, `window.addEventListener`, `window.removeEventListener`, `observe`.

#### `updateColumnCount` — L14–L21 · nested helper в useEntryColumnCount

Изменяет column count, сохраняя инварианты данного модуля.

- Основные вызовы: `getEntryColumnCount`, `setColumnCount`.

#### `getEntryColumnCount` — L39–L55 · internal helper

Получает entry column count из принадлежащего модулю источника данных.

- Параметры: `containerWidth`, `itemCount`.

- Основные вызовы: `parseFloat`, `getComputedStyle`, `Math.max`, `Math.floor`, `Math.min`.

#### `distributeEntriesByColumn` — L57–L68 · public API

Возвращает вычисленное значение distribute entries by column для использования внутри данного модуля.

- Параметры: `entries`, `columnCount`.

- Основные вызовы: `Array.from`, `Math.max`, `Math.min`, `push`.

### `client/src/features/entries/ui/entryTagId.ts`

Клиентская feature архива записей: entry tag id.

#### `tagTestIdValue` — L3–L5 · public API

Возвращает вычисленное значение tag test id value для использования внутри данного модуля.

- Параметры: `tag`.

- Основные вызовы: `replace`, `normalizeTag`.

### `client/src/features/entries/ui/EntryTile.tsx`

Клиентская feature архива записей: entry tile.

#### `EntryTile` — L15–L274 · public API

Рендерит React-компонент EntryTile и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ compact = false, debugMode, entry, isExpanded, isSelected, language, searchQuery, onDeleteEntry, onEditEntry, onSelectEntry, onToggleEntryAnalysis, onToggleTag, }`.

- Основные вызовы: `useI18n`, `useEntryDebugTooltip`, `createPortal`, `preventDefault`, `onSelectEntry`, `t`, `stopPropagation`, `onToggleEntryAnalysis`.

#### `handleKeyDown` — L84–L90 · nested helper в EntryTile

Исполняет сценарий key down и координирует его побочные эффекты.

- Параметры: `event`.

- Основные вызовы: `preventDefault`, `onSelectEntry`.

#### `EntryText` — L276–L290 · internal helper

Рендерит React-компонент EntryText и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ text, query }`.

- Основные вызовы: `findSearchHighlightRange`.

#### `findSearchHighlightRange` — L292–L306 · internal helper

Выбирает search highlight range, удовлетворяющий ограничениям текущего сценария.

- Параметры: `text`, `query`.

- Основные вызовы: `parseEntrySearchQuery`, `findCaseInsensitiveRange`.

#### `findCaseInsensitiveRange` — L308–L322 · internal helper

Выбирает case insensitive range, удовлетворяющий ограничениям текущего сценария.

- Параметры: `text`, `term`.

- Основные вызовы: `toLocaleLowerCase`, `indexOf`.

### `client/src/features/entries/ui/entryUiHelpers.tsx`

Клиентская feature архива записей: entry ui helpers.

#### `EditIcon` — L1–L18 · public API

Рендерит React-компонент EditIcon и связывает его props с соответствующей UI-поверхностью.

#### `CloseIcon` — L20–L31 · public API

Рендерит React-компонент CloseIcon и связывает его props с соответствующей UI-поверхностью.

### `client/src/features/entries/ui/useEntryDebugTooltip.ts`

Клиентская feature архива записей: use entry debug tooltip.

#### `useEntryDebugTooltip` — L25–L167 · public API

Управляет React-состоянием, derived values и side effects для entry debug tooltip.

- Параметры: `{ enabled }`.

- Основные вызовы: `useRef`, `useState`, `useCallback`, `window.clearTimeout`, `clearOpenTimer`, `clearCloseTimer`, `setPosition`, `setStatus`.

#### `handleAnchorPointerEnter` — L110–L112 · nested helper в useEntryDebugTooltip

Исполняет сценарий anchor pointer enter и координирует его побочные эффекты.

- Основные вызовы: `start`.

#### `handleAnchorPointerLeave` — L114–L116 · nested helper в useEntryDebugTooltip

Исполняет сценарий anchor pointer leave и координирует его побочные эффекты.

- Основные вызовы: `closeSoon`.

#### `handleAnchorFocus` — L118–L120 · nested helper в useEntryDebugTooltip

Исполняет сценарий anchor focus и координирует его побочные эффекты.

- Основные вызовы: `start`.

#### `handleAnchorBlur` — L122–L125 · nested helper в useEntryDebugTooltip

Исполняет сценарий anchor blur и координирует его побочные эффекты.

- Параметры: `event`.

- Основные вызовы: `isMovingWithinDebugSurface`, `closeSoon`.

#### `handleTooltipPointerEnter` — L127–L129 · nested helper в useEntryDebugTooltip

Исполняет сценарий tooltip pointer enter и координирует его побочные эффекты.

- Основные вызовы: `cancelClose`.

#### `handleTooltipPointerLeave` — L131–L133 · nested helper в useEntryDebugTooltip

Исполняет сценарий tooltip pointer leave и координирует его побочные эффекты.

- Основные вызовы: `closeSoon`.

#### `handleTooltipFocus` — L135–L137 · nested helper в useEntryDebugTooltip

Исполняет сценарий tooltip focus и координирует его побочные эффекты.

- Основные вызовы: `cancelClose`.

#### `handleTooltipBlur` — L139–L142 · nested helper в useEntryDebugTooltip

Исполняет сценарий tooltip blur и координирует его побочные эффекты.

- Параметры: `event`.

- Основные вызовы: `isMovingWithinDebugSurface`, `closeSoon`.

#### `isMovingWithinDebugSurface` — L144–L150 · nested helper в useEntryDebugTooltip

Проверяет условие moving within debug surface и возвращает логический результат без изменения состояния.

- Параметры: `target`.

- Основные вызовы: `Boolean`, `contains`.

#### `getDebugTooltipPosition` — L169–L199 · internal helper

Получает debug tooltip position из принадлежащего модулю источника данных.

- Параметры: `anchor`.

- Основные вызовы: `getBoundingClientRect`, `Math.min`, `clamp`.

#### `clamp` — L201–L203 · internal helper

Ограничивает clamp допустимым диапазоном или точностью.

- Параметры: `value`, `min`, `max`.

- Основные вызовы: `Math.min`, `Math.max`.

#### Публичные типы, классы и константы

- `type DebugTooltipPosition` — L9
- `type DebugTooltipStatus` — L16

### `client/src/features/entries/useEntries.ts`

Клиентская feature архива записей: use entries.

#### `useEntries` — L23–L208 · public API

Управляет React-состоянием, derived values и side effects для entries.

- Основные вызовы: `useState`, `useRef`, `getEntrySortDirection`, `useEntrySearch`, `useEffect`, `useCallback`, `loadServerEntry`, `setEntries`.

#### `changeEntrySortDirection` — L164–L167 · nested helper в useEntries

Обновляет или переключает change entry sort direction и связанные derived state.

- Параметры: `nextValue`.

- Основные вызовы: `setEntrySortDirection`, `persistEntrySortDirection`.

#### `resetEntries` — L169–L174 · nested helper в useEntries

Сбрасывает reset entries в исходное согласованное состояние.

- Основные вызовы: `setEntries`, `setSelectedEntryId`, `clearFilters`.

#### `selectEntry` — L176–L182 · nested helper в useEntries

Выбирает entry, удовлетворяющий ограничениям текущего сценария.

- Параметры: `entryId`.

- Основные вызовы: `setSelectedEntryId`, `refreshServerEntryDetails`.

### `client/src/features/entries/useEntrySearch.ts`

Клиентская feature архива записей: use entry search.

#### `useEntrySearch` — L36–L201 · public API

Управляет React-состоянием, derived values и side effects для entry search.

- Параметры: `{ entries, sortDirection, }`.

- Основные вызовы: `useState`, `sortEntries`, `useRef`, `useMemo`, `createEntrySearchIndex`, `getAvailableTags`, `useEffect`, `setIncludedTags`.

#### `toggleIncludedTag` — L129–L153 · nested helper в useEntrySearch

Обновляет или переключает toggle included tag и связанные derived state.

- Параметры: `tag`.

- Основные вызовы: `normalizeTag`, `setExcludedTags`, `setIncludedTags`.

#### `toggleExcludedTag` — L155–L179 · nested helper в useEntrySearch

Обновляет или переключает toggle excluded tag и связанные derived state.

- Параметры: `tag`.

- Основные вызовы: `normalizeTag`, `setIncludedTags`, `setExcludedTags`.

#### `clearFilters` — L181–L186 · nested helper в useEntrySearch

Удаляет или очищает filters с необходимыми связанными действиями.

- Основные вызовы: `setQuery`, `setDebouncedQuery`, `setIncludedTags`, `setExcludedTags`.

#### `resolveVisibleEntries` — L203–L230 · internal helper

Возвращает вычисленное значение resolve visible entries для использования внутри данного модуля.

- Параметры: `{ debouncedQuery, excludedTags, includedTags, indexedEntries, }`.

- Основные вызовы: `filterIndexedEntriesByTags`, `searchIndexedEntriesHybrid`.

#### `filterIndexedEntriesByTags` — L232–L252 · internal helper

Выбирает indexed entries by tags, удовлетворяющий ограничениям текущего сценария.

- Параметры: `indexedEntries`, `includedTags`, `excludedTags`.

- Основные вызовы: `has`.

### `client/src/features/exportImport/exportPackage.ts`

Локальный export/import: export package.

#### `buildLocalExportPackage` — L36–L59 · public API

Создаёт local export package из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `input`.

- Основные вызовы: `toISOString`, `createExportSource`, `toLocalExportSettings`, `sanitizeQueueJobsForExport`, `assertValidLocalExportPackage`.

#### `createExportSource` — L61–L74 · public API

Создаёт export source из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `input`.

#### `toLocalExportEntry` — L76–L90 · public API

Возвращает вычисленное значение to local export entry для использования внутри данного модуля.

- Параметры: `entry`.

- Основные вызовы: `Array.from`.

#### `toLocalExportSelfReportEvent` — L92–L104 · public API

Возвращает вычисленное значение to local export self report event для использования внутри данного модуля.

- Параметры: `event`.

- Основные вызовы: `toLocalExportSelfReportValues`.

#### `toLocalExportSelfReportValues` — L106–L116 · public API

Возвращает вычисленное значение to local export self report values для использования внутри данного модуля.

- Параметры: `values`.

- Основные вызовы: `normalizeSelfReportValue`.

#### `toLocalExportSettings` — L118–L151 · public API

Возвращает вычисленное значение to local export settings для использования внутри данного модуля.

- Параметры: `settings`.

#### `sanitizeQueueJobsForExport` — L153–L175 · public API

Приводит sanitize queue jobs for export к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `jobs`.

- Основные вызовы: `isExportableQueueStatus`, `extractSafeQueueReason`.

#### `assertValidLocalExportPackage` — L177–L250 · public API

Проверяет корректность valid local export package и явно отклоняет нарушение контракта.

- Параметры: `packageData`.

- Основные вызовы: `assertCondition`, `assertIsoDate`, `assertExportSource`, `assertNonEmptyString`, `has`, `add`, `assertLocalDay`, `Array.isArray`.

#### `isExportableQueueStatus` — L252–L256 · internal helper

Проверяет условие exportable queue status и возвращает логический результат без изменения состояния.

- Параметры: `status`.

#### `extractSafeQueueReason` — L258–L268 · internal helper

Извлекает safe queue reason из входных данных без самостоятельного сохранения результата.

- Параметры: `job`.

- Основные вызовы: `Array.isArray`, `has`.

#### `normalizeSelfReportValue` — L270–L275 · internal helper

Приводит self report value к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `value`.

- Основные вызовы: `isFinite`, `Math.max`, `Math.min`, `Math.round`.

#### `assertExportSource` — L277–L299 · internal helper

Проверяет корректность export source и явно отклоняет нарушение контракта.

- Параметры: `source`.

- Основные вызовы: `assertCondition`.

#### `assertSelfReportValue` — L301–L306 · internal helper

Проверяет корректность self report value и явно отклоняет нарушение контракта.

- Параметры: `value`.

- Основные вызовы: `assertCondition`, `isInteger`.

#### `assertLocalDay` — L308–L312 · internal helper

Проверяет корректность local day и явно отклоняет нарушение контракта.

- Параметры: `value`, `message`.

- Основные вызовы: `assertCondition`, `test`, `isNaN`, `getTime`.

#### `assertIsoDate` — L314–L317 · internal helper

Проверяет корректность iso date и явно отклоняет нарушение контракта.

- Параметры: `value`, `message`.

- Основные вызовы: `assertCondition`, `isNaN`, `getTime`.

#### `assertNonEmptyString` — L319–L321 · internal helper

Проверяет корректность non empty string и явно отклоняет нарушение контракта.

- Параметры: `value`, `message`.

- Основные вызовы: `assertCondition`.

#### `assertCondition` — L323–L327 · internal helper

Проверяет корректность condition и явно отклоняет нарушение контракта.

- Параметры: `condition`, `message`.

### `client/src/features/exportImport/exportTypes.ts`

Локальный export/import: export types.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `const ATHENA_EXPORT_APP_ID` — L10
- `const LOCAL_EXPORT_VERSION` — L11
- `const BACKEND_METADATA_EXPORT_VERSION` — L12
- `const EXPORT_SIGNAL_SCHEMA_VERSION` — L14
- `const EXPORT_PROMPT_VERSION` — L15
- `const EXPORT_SELF_REPORT_SCHEMA_VERSION` — L16
- `const EXPORT_SELF_REPORT_DAILY_AGGREGATE_VERSION` — L17
- `const EXPORTABLE_QUEUE_STATUSES` — L20
- `type ExportableQueueStatus` — L27
- `type LocalExportSourceV1` — L29
- `type LocalExportEntryV1` — L37
- `type LocalExportSelfReportValuesV1` — L51
- `type LocalExportSelfReportEventV1` — L59
- `type LocalExportSettingsV1` — L69
- `type QueueExportSummaryV1` — L77
- `type AthenaLocalExportV1` — L85
- `type BuildLocalExportPackageInput` — L100
- `type AthenaBackendMetadataExportV1` — L110

### `client/src/features/exportImport/importApply.ts`

Локальный export/import: import apply.

#### `applyLocalImportReplace` — L41–L65 · public API

Преобразует или объединяет local import replace по правилам домена.

- Параметры: `packageData`, `storage`.

- Основные вызовы: `validateLocalExportPackage`, `replaceEntries`, `replaceSelfReportEvents`.

#### `toImportedLocalEntry` — L67–L84 · public API

Возвращает вычисленное значение to imported local entry для использования внутри данного модуля.

- Параметры: `entry`.

#### `toImportedSelfReportEvent` — L86–L99 · public API

Возвращает вычисленное значение to imported self report event для использования внутри данного модуля.

- Параметры: `event`.

- Основные вызовы: `toSelfReportValues`.

#### `toSelfReportValues` — L101–L111 · public API

Возвращает вычисленное значение to self report values для использования внутри данного модуля.

- Параметры: `values`.

- Основные вызовы: `normalizeSelfReportValue`.

#### `normalizeSelfReportValue` — L113–L118 · internal helper

Приводит self report value к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `value`.

- Основные вызовы: `isFinite`, `Math.max`, `Math.min`, `Math.round`.

#### Публичные типы, классы и константы

- `type LocalImportApplyMode` — L17
- `type LocalImportApplyResult` — L19
- `type LocalImportApplyStorage` — L29

### `client/src/features/exportImport/importPreview.ts`

Локальный export/import: import preview.

#### `buildLocalImportPreview` — L25–L75 · public API

Создаёт local import preview из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `packageData`, `currentData`.

- Основные вызовы: `validateLocalExportPackage`, `has`, `localeCompare`, `at`, `buildWarnings`.

#### `buildWarnings` — L77–L102 · internal helper

Создаёт warnings из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `data`, `currentLocalData`, `duplicates`.

- Основные вызовы: `push`.

#### Публичные типы, классы и константы

- `type LocalImportCurrentDataSummary` — L4
- `type LocalImportPreview` — L9

### `client/src/features/exportImport/importReaders.ts`

Локальный export/import: import readers.

#### `assertNoForbiddenKeys` — L36–L51 · public API

Проверяет корректность no forbidden keys и явно отклоняет нарушение контракта.

- Параметры: `value`, `path`.

- Основные вызовы: `Array.isArray`, `assertNoForbiddenKeys`, `isPlainObject`, `Object.entries`, `assertCondition`, `has`.

#### `assertAllowedKeys` — L53–L63 · public API

Проверяет корректность allowed keys и явно отклоняет нарушение контракта.

- Параметры: `value`, `allowedKeys`, `context`.

- Основные вызовы: `Object.keys`, `assertCondition`, `has`.

#### `assertPlainObject` — L65–L71 · public API

Проверяет корректность plain object и явно отклоняет нарушение контракта.

- Параметры: `value`, `message`.

- Основные вызовы: `assertCondition`, `isPlainObject`.

#### `isPlainObject` — L73–L75 · internal helper

Проверяет условие plain object и возвращает логический результат без изменения состояния.

- Параметры: `value`.

- Основные вызовы: `Array.isArray`.

#### `readExact` — L77–L85 · public API

Получает exact из принадлежащего модулю источника данных.

- Параметры: `object`, `key`, `expected`, `message`.

- Основные вызовы: `assertEquals`.

#### `readString` — L87–L95 · public API

Получает string из принадлежащего модулю источника данных.

- Параметры: `object`, `key`, `message`.

- Основные вызовы: `assertCondition`.

#### `readNonEmptyString` — L97–L105 · public API

Получает non empty string из принадлежащего модулю источника данных.

- Параметры: `object`, `key`, `message`.

- Основные вызовы: `readString`, `assertCondition`.

#### `readNullableString` — L107–L118 · public API

Получает nullable string из принадлежащего модулю источника данных.

- Параметры: `object`, `key`, `message`.

- Основные вызовы: `assertCondition`.

#### `readBoolean` — L120–L128 · public API

Получает boolean из принадлежащего модулю источника данных.

- Параметры: `object`, `key`, `message`.

- Основные вызовы: `assertCondition`.

#### `readNullableNonNegativeInteger` — L130–L145 · public API

Получает nullable non negative integer из принадлежащего модулю источника данных.

- Параметры: `object`, `key`, `message`.

- Основные вызовы: `assertCondition`, `isInteger`.

#### `readStringArray` — L147–L173 · public API

Получает string array из принадлежащего модулю источника данных.

- Параметры: `object`, `key`, `message`.

- Основные вызовы: `assertCondition`, `Array.isArray`, `has`, `add`, `push`.

#### `readLocalDay` — L175–L183 · public API

Получает local day из принадлежащего модулю источника данных.

- Параметры: `object`, `key`, `message`.

- Основные вызовы: `readString`, `assertCondition`, `isValidLocalDay`.

#### `readIsoDate` — L185–L193 · public API

Получает iso date из принадлежащего модулю источника данных.

- Параметры: `object`, `key`, `message`.

- Основные вызовы: `readString`, `assertIsoDate`.

#### `readNullableSelfReportValue` — L195–L212 · public API

Получает nullable self report value из принадлежащего модулю источника данных.

- Параметры: `object`, `key`.

- Основные вызовы: `assertCondition`, `isInteger`.

#### `readNullableJsonValue` — L214–L226 · public API

Получает nullable json value из принадлежащего модулю источника данных.

- Параметры: `object`, `key`, `message`.

- Основные вызовы: `assertJsonValue`.

#### `assertJsonValue` — L228–L253 · internal helper

Проверяет корректность json value и явно отклоняет нарушение контракта.

- Параметры: `value`, `message`.

- Основные вызовы: `assertCondition`, `isFinite`, `Array.isArray`, `assertJsonValue`, `isPlainObject`, `Object.values`.

#### `isValidLocalDay` — L255–L270 · internal helper

Проверяет условие valid local day и возвращает логический результат без изменения состояния.

- Параметры: `value`.

- Основные вызовы: `match`, `Number`, `UTC`, `getUTCFullYear`, `getUTCMonth`, `getUTCDate`.

#### `assertIsoDate` — L272–L277 · internal helper

Проверяет корректность iso date и явно отклоняет нарушение контракта.

- Параметры: `value`, `message`.

- Основные вызовы: `parse`, `assertCondition`, `isNaN`, `toISOString`.

#### `assertEquals` — L279–L285 · public API

Проверяет корректность equals и явно отклоняет нарушение контракта.

- Параметры: `actual`, `expected`, `message`.

- Основные вызовы: `assertCondition`.

#### `assertCondition` — L287–L291 · public API

Проверяет корректность condition и явно отклоняет нарушение контракта.

- Параметры: `condition`, `message`.

### `client/src/features/exportImport/importValidation.ts`

Локальный export/import: import validation.

#### `parseAndValidateLocalExportJson` — L134–L150 · public API

Разбирает and validate local export json и преобразует вход в типизированное представление.

- Параметры: `jsonText`.

- Основные вызовы: `validateLocalExportPackage`.

#### `validateLocalExportPackage` — L152–L184 · public API

Проверяет корректность local export package и явно отклоняет нарушение контракта.

- Параметры: `value`.

- Основные вызовы: `assertNoForbiddenKeys`, `assertPlainObject`, `assertAllowedKeys`, `assertEquals`, `readIsoDate`, `validateSource`, `validateEntries`, `validateSelfReports`.

#### `validateSource` — L186–L217 · internal helper

Проверяет корректность source и явно отклоняет нарушение контракта.

- Параметры: `value`.

- Основные вызовы: `assertPlainObject`, `assertAllowedKeys`, `readNullableString`, `readExact`.

#### `validateEntries` — L219–L273 · internal helper

Проверяет корректность entries и явно отклоняет нарушение контракта.

- Параметры: `value`.

- Основные вызовы: `assertCondition`, `Array.isArray`, `assertPlainObject`, `assertAllowedKeys`, `readNonEmptyString`, `has`, `add`, `readString`.

#### `validateCurrentSignal` — L275–L278 · internal helper

Проверяет корректность current signal и явно отклоняет нарушение контракта.

- Параметры: `value`.

- Основные вызовы: `assertCondition`, `isCurrentSignal`.

#### `validateSignalMetadata` — L280–L324 · internal helper

Проверяет корректность signal metadata и явно отклоняет нарушение контракта.

- Параметры: `value`.

- Основные вызовы: `assertPlainObject`, `assertAllowedKeys`, `readString`, `assertCondition`, `readExact`, `readNonEmptyString`, `readNullableString`, `readIsoDate`.

#### `validateSelfReports` — L326–L381 · internal helper

Проверяет корректность self reports и явно отклоняет нарушение контракта.

- Параметры: `value`.

- Основные вызовы: `assertPlainObject`, `assertAllowedKeys`, `assertCondition`, `Array.isArray`, `readNonEmptyString`, `has`, `add`, `readLocalDay`.

#### `validateSelfReportValues` — L383–L394 · internal helper

Проверяет корректность self report values и явно отклоняет нарушение контракта.

- Параметры: `value`.

- Основные вызовы: `assertPlainObject`, `assertAllowedKeys`, `readNullableSelfReportValue`.

#### `validateSettings` — L396–L446 · internal helper

Проверяет корректность settings и явно отклоняет нарушение контракта.

- Параметры: `value`.

- Основные вызовы: `assertPlainObject`, `assertAllowedKeys`, `assertCondition`, `readNonEmptyString`, `readBoolean`.

#### `validateQueue` — L448–L462 · internal helper

Проверяет корректность queue и явно отклоняет нарушение контракта.

- Параметры: `value`.

- Основные вызовы: `assertPlainObject`, `assertAllowedKeys`, `assertCondition`, `Array.isArray`, `validateQueueExportSummary`.

#### `validateQueueExportSummary` — L464–L498 · internal helper

Проверяет корректность queue export summary и явно отклоняет нарушение контракта.

- Параметры: `value`, `index`.

- Основные вызовы: `assertPlainObject`, `assertAllowedKeys`, `readNonEmptyString`, `assertCondition`, `has`, `readNullableString`.

### `client/src/features/extraction/extractionApi.ts`

Клиентский адаптер extraction API: extraction api.

#### `loadExtractionConfig` — L17–L24 · public API

Получает extraction config из принадлежащего модулю источника данных.

- Основные вызовы: `fetch`, `handleUnauthorized`, `json`.

#### `loadExtractionStatus` — L26–L37 · public API

Получает extraction status из принадлежащего модулю источника данных.

- Параметры: `settings`.

- Основные вызовы: `fetch`, `handleUnauthorized`, `json`.

#### `extractSignal` — L39–L64 · public API

Извлекает signal из входных данных без самостоятельного сохранения результата.

- Параметры: `payload`.

- Основные вызовы: `fetch`, `csrfJsonHeaders`, `handleUnauthorized`, `text`, `json`.

#### `appendEntrySignal` — L66–L85 · public API

Возвращает вычисленное значение append entry signal для использования внутри данного модуля.

- Параметры: `entryId`, `payload`.

- Основные вызовы: `fetch`, `encodeURIComponent`, `csrfJsonHeaders`, `handleUnauthorized`, `text`, `json`.

### `client/src/features/extraction/extractSignalForText.ts`

Клиентский адаптер extraction API: extract signal for text.

#### `extractSignalForText` — L13–L83 · public API

Извлекает signal for text из входных данных без самостоятельного сохранения результата.

- Параметры: `rawText`, `settings`, `context`, `signal`.

- Основные вызовы: `releaseGeminiDailyExtraction`, `reserveGeminiDailyExtraction`, `withSignalContext`, `createFallbackSignal`, `createFallbackMetadata`, `extractSignal`, `hasExtractionError`, `releaseGeminiReservation`.

#### `releaseGeminiReservation` — L24–L29 · nested helper в extractSignalForText

Исполняет сценарий release gemini reservation и координирует его побочные эффекты.

- Основные вызовы: `releaseGeminiDailyExtraction`.

#### `withSignalContext` — L85–L97 · internal helper

Возвращает вычисленное значение with signal context для использования внутри данного модуля.

- Параметры: `extraction`, `rawText`, `context`.

- Основные вызовы: `analyzeSignalContext`.

#### `hasExtractionError` — L99–L103 · internal helper

Проверяет условие extraction error и возвращает логический результат без изменения состояния.

- Параметры: `extraction`.

- Основные вызовы: `Boolean`.

### `client/src/features/extraction/geminiQuota.ts`

Клиентский адаптер extraction API: gemini quota.

#### `getGeminiDailyExtractionUsage` — L9–L24 · public API

Получает gemini daily extraction usage из принадлежащего модулю источника данных.

- Основные вызовы: `localDateKey`, `getItem`, `storageKey`, `isFinite`, `Math.max`, `Math.floor`, `Math.min`.

#### `getRemainingGeminiDailyExtractions` — L26–L31 · public API

Получает remaining gemini daily extractions из принадлежащего модулю источника данных.

- Основные вызовы: `Math.max`, `getGeminiDailyExtractionUsage`.

#### `reserveGeminiDailyExtraction` — L33–L38 · public API

Возвращает вычисленное значение reserve gemini daily extraction для использования внутри данного модуля.

- Основные вызовы: `getGeminiDailyExtractionUsage`, `persist`.

#### `releaseGeminiDailyExtraction` — L40–L44 · public API

Исполняет сценарий release gemini daily extraction и координирует его побочные эффекты.

- Основные вызовы: `getGeminiDailyExtractionUsage`, `persist`.

#### `persist` — L46–L48 · internal helper

Выполняет локальную операцию persist внутри ответственности этого файла.

- Параметры: `usage`.

- Основные вызовы: `setItem`, `storageKey`.

#### `storageKey` — L50–L52 · internal helper

Возвращает вычисленное значение storage key для использования внутри данного модуля.

- Основные вызовы: `getProfileScopedStorageKey`.

#### `localDateKey` — L54–L60 · internal helper

Возвращает вычисленное значение local date key для использования внутри данного модуля.

- Основные вызовы: `getFullYear`, `padStart`, `String`, `getMonth`, `getDate`.

#### Публичные типы, классы и константы

- `const GEMINI_DAILY_EXTRACTION_LIMIT` — L4
- `const GEMINI_QUOTA_STORAGE_KEYS` — L5

### `client/src/features/extraction/signals.ts`

Клиентский адаптер extraction API: signals.

#### `createFallbackSignal` — L61–L80 · public API

Создаёт fallback signal из переданных данных, не отдавая вызывающему коду детали сборки.

- Основные вызовы: `createDefaultSignalContext`, `createEmptyMetricConfidence`.

#### `createFallbackMetadata` — L82–L95 · public API

Создаёт fallback metadata из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `provider`, `model`, `errorCode`.

- Основные вызовы: `toISOString`.

#### `normalizeSignal` — L97–L99 · public API

Приводит signal к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `value`.

- Основные вызовы: `isCurrentSignal`, `createFallbackSignal`.

#### `isCurrentSignal` — L101–L122 · public API

Проверяет условие current signal и возвращает логический результат без изменения состояния.

- Параметры: `value`.

- Основные вызовы: `isRecord`, `isBoundedStringArray`, `isNormalizedActivityContexts`, `isNormalizedStateInference`, `isNormalizedMetricConfidence`, `isNormalizedEntryIntent`, `isNormalizedStructureSignal`, `isNormalizedTemporalContext`.

#### `isNormalizedActivityContexts` — L124–L153 · internal helper

Проверяет условие normalized activity contexts и возвращает логический результат без изменения состояния.

- Параметры: `value`.

- Основные вызовы: `Array.isArray`, `isRecord`, `has`, `String`.

#### `isBoundedStringArray` — L155–L161 · internal helper

Проверяет условие bounded string array и возвращает логический результат без изменения состояния.

- Параметры: `value`, `maxLength`.

- Основные вызовы: `Array.isArray`.

#### `isNormalizedStateInference` — L163–L170 · internal helper

Проверяет условие normalized state inference и возвращает логический результат без изменения состояния.

- Параметры: `value`.

- Основные вызовы: `isRecord`, `Object.entries`, `has`, `isNormalizedStateInferenceValue`.

#### `isNormalizedStateInferenceValue` — L172–L181 · internal helper

Проверяет условие normalized state inference value и возвращает логический результат без изменения состояния.

- Параметры: `value`.

- Основные вызовы: `isRecord`, `has`, `String`, `isBoundedStringArray`.

#### `isNormalizedMetricConfidence` — L183–L192 · internal helper

Проверяет условие normalized metric confidence и возвращает логический результат без изменения состояния.

- Параметры: `value`.

- Основные вызовы: `isRecord`, `has`, `String`.

#### `isNormalizedEntryIntent` — L194–L207 · internal helper

Проверяет условие normalized entry intent и возвращает логический результат без изменения состояния.

- Параметры: `value`.

- Основные вызовы: `isRecord`, `has`, `String`, `isBoundedStringArray`.

#### `isNormalizedStructureSignal` — L209–L223 · internal helper

Проверяет условие normalized structure signal и возвращает логический результат без изменения состояния.

- Параметры: `value`.

- Основные вызовы: `isRecord`, `has`, `String`, `isBoundedStringArray`.

#### `isNormalizedTemporalContext` — L225–L242 · internal helper

Проверяет условие normalized temporal context и возвращает логический результат без изменения состояния.

- Параметры: `value`.

- Основные вызовы: `isRecord`, `test`.

#### `isNormalizedScore` — L244–L252 · internal helper

Проверяет условие normalized score и возвращает логический результат без изменения состояния.

- Параметры: `value`.

- Основные вызовы: `isInteger`.

#### `isRecord` — L254–L256 · internal helper

Проверяет условие record и возвращает логический результат без изменения состояния.

- Параметры: `value`.

- Основные вызовы: `Array.isArray`.

#### Публичные типы, классы и константы

- `const SIGNAL_AXES` — L36

### `client/src/features/extraction/signalVersions.ts`

Клиентский адаптер extraction API: signal versions.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `const CLIENT_ACTIVE_SCHEMA_VERSION` — L6
- `const CLIENT_ACTIVE_PROMPT_VERSION` — L7

### `client/src/features/insights/content/athenaInsightPhraseLibraries.ts`

Клиентская feature observations/insights: athena insight phrase libraries.

#### `getAthenaInsightTopics` — L20–L24 · public API

Получает athena insight topics из принадлежащего модулю источника данных.

- Параметры: `language`.

#### Публичные типы, классы и константы

- `const ATHENA_INSIGHT_LANGUAGES` — L7
- `type AthenaInsightLanguage` — L9
- `const DEFAULT_ATHENA_INSIGHT_LANGUAGE` — L11

### `client/src/features/insights/content/athenaInsightPhrasesDe.ts`

Клиентская feature observations/insights: athena insight phrases de.

#### `createTopic` — L31–L37 · internal helper

Создаёт topic из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `seed`.

#### Публичные типы, классы и константы

- `const ATHENA_INSIGHT_TOPICS_DE` — L39

### `client/src/features/insights/content/athenaInsightPhrasesEn.ts`

Клиентская feature observations/insights: athena insight phrases en.

#### `createTopic` — L31–L37 · internal helper

Создаёт topic из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `seed`.

#### Публичные типы, классы и константы

- `const ATHENA_INSIGHT_TOPICS_EN` — L39

### `client/src/features/insights/content/athenaInsightPhrasesRu.ts`

Клиентская feature observations/insights: athena insight phrases ru.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `const ATHENA_INSIGHT_TOPICS_RU` — L3

### `client/src/features/insights/content/athenaInsightPhrasesTypes.ts`

Клиентская feature observations/insights: athena insight phrases types.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `type AthenaInsightTopic` — L1

### `client/src/features/insights/content/athenaInsightPhrasesUk.ts`

Клиентская feature observations/insights: athena insight phrases uk.

#### `createTopic` — L31–L37 · internal helper

Создаёт topic из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `seed`.

#### Публичные типы, классы и константы

- `const ATHENA_INSIGHT_TOPICS_UK` — L39

### `client/src/features/insights/content/insightPhrases.ts`

Клиентская feature observations/insights: insight phrases.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `type PlainInsightTopic` — L1
- `const PLAIN_INSIGHT_TOPICS` — L9

### `client/src/features/insights/content/insightText.ts`

Клиентская feature observations/insights: insight text.

#### `formatInsightText` — L23–L72 · public API

Преобразует insight text в стабильное представление для UI, сети или хранения.

- Параметры: `insight`, `{ language = DEFAULT_ATHENA_INSIGHT_LANGUAGE, personaTextEnabled, }`.

- Основные вызовы: `getInsightTopic`, `getAthenaInsightTopics`, `getPlainInsightTopics`, `findTopicProfile`, `getAthenaInsightTone`, `getPlainInsightTone`, `normalizeTopic`, `pickInsightLine`.

#### `findTopicProfile` — L74–L82 · internal helper

Выбирает topic profile, удовлетворяющий ограничениям текущего сценария.

- Параметры: `topic`, `topics`.

- Основные вызовы: `normalizeTopic`.

#### `getInsightTopic` — L84–L88 · internal helper

Получает insight topic из принадлежащего модулю источника данных.

- Параметры: `insight`.

#### `fallbackTemplate` — L90–L188 · internal helper

Возвращает вычисленное значение fallback template для использования внутри данного модуля.

- Параметры: `layer`, `personaTextEnabled`, `language`.

#### `fallbackAdvice` — L190–L223 · internal helper

Возвращает вычисленное значение fallback advice для использования внутри данного модуля.

- Параметры: `personaTextEnabled`, `language`.

#### `getAthenaInsightTone` — L225–L229 · internal helper

Получает athena insight tone из принадлежащего модулю источника данных.

- Параметры: `language`.

#### `getPlainInsightTone` — L231–L235 · internal helper

Получает plain insight tone из принадлежащего модулю источника данных.

- Параметры: `language`.

#### `renderTemplate` — L237–L239 · internal helper

Возвращает вычисленное значение render template для использования внутри данного модуля.

- Параметры: `template`, `subject`.

- Основные вызовы: `replaceAll`.

#### `joinSentences` — L241–L246 · internal helper

Возвращает вычисленное значение join sentences для использования внутри данного модуля.

- Параметры: `first`, `second`.

#### `pickInsightLine` — L248–L282 · internal helper

Выбирает insight line, удовлетворяющий ограничениям текущего сценария.

- Параметры: `items`, `seed`, `scope`.

- Основные вызовы: `getLocalStorage`, `deterministicPick`, `getChoiceKey`, `readIndex`, `getItem`, `getBagKey`, `readBag`, `hashSeed`.

#### `getChoiceKey` — L284–L301 · internal helper

Получает choice key из принадлежащего модулю источника данных.

- Параметры: `scope`, `itemCount`.

- Основные вызовы: `getProfileScopedStorageKey`.

#### `getBagKey` — L303–L318 · internal helper

Получает bag key из принадлежащего модулю источника данных.

- Параметры: `scope`, `itemCount`.

- Основные вызовы: `getProfileScopedStorageKey`.

#### `readIndex` — L320–L327 · internal helper

Получает index из принадлежащего модулю источника данных.

- Параметры: `raw`, `itemCount`.

- Основные вызовы: `Number`, `isInteger`.

#### `readBag` — L329–L351 · internal helper

Получает bag из принадлежащего модулю источника данных.

- Параметры: `raw`, `itemCount`.

- Основные вызовы: `Array.from`, `freshBag`, `Array.isArray`, `isInteger`.

#### `freshBag` — L330–L331 · nested helper в readBag

Возвращает вычисленное значение fresh bag для использования внутри данного модуля.

- Основные вызовы: `Array.from`.

#### `getLocalStorage` — L353–L359 · internal helper

Получает local storage из принадлежащего модулю источника данных.

#### `deterministicPick` — L361–L365 · internal helper

Возвращает вычисленное значение deterministic pick для использования внутри данного модуля.

- Параметры: `items`, `seed`.

- Основные вызовы: `hashSeed`.

#### `hashSeed` — L367–L374 · internal helper

Проверяет условие seed и возвращает логический результат без изменения состояния.

- Параметры: `seed`.

- Основные вызовы: `charCodeAt`.

#### `normalizeTopic` — L376–L378 · internal helper

Приводит topic к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `topic`.

- Основные вызовы: `toLowerCase`.

### `client/src/features/insights/content/plainInsightPhraseLibraries.ts`

Клиентская feature observations/insights: plain insight phrase libraries.

#### `getPlainInsightTopics` — L149–L151 · public API

Получает plain insight topics из принадлежащего модулю источника данных.

- Параметры: `language`.

#### `topic` — L153–L155 · internal helper

Возвращает вычисленное значение topic для использования внутри данного модуля.

- Параметры: `id`, `aliases`, `subject`.

#### `buildTopics` — L157–L167 · internal helper

Создаёт topics из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `definitions`, `templates`, `advice`.

### `client/src/features/insights/insightsApi.ts`

Клиентская feature observations/insights: insights api.

#### `loadCurrentInsights` — L9–L22 · public API

Получает current insights из принадлежащего модулю источника данных.

- Параметры: `today`.

- Основные вызовы: `fetch`, `handleUnauthorized`, `json`.

#### `loadInsightHistory` — L24–L34 · public API

Получает insight history из принадлежащего модулю источника данных.

- Основные вызовы: `fetch`, `handleUnauthorized`, `json`.

#### `deleteInsightSnapshot` — L36–L46 · public API

Удаляет или очищает insight snapshot с необходимыми связанными действиями.

- Параметры: `insightId`.

- Основные вызовы: `fetch`, `encodeURIComponent`, `csrfHeaders`, `handleUnauthorized`, `text`.

### `client/src/features/insights/seenInsights.ts`

Клиентская feature observations/insights: seen insights.

#### `getSeenEditorInsightIds` — L8–L26 · public API

Получает seen editor insight ids из принадлежащего модулю источника данных.

- Основные вызовы: `getItem`, `getProfileScopedStorageKey`, `Array.isArray`, `isInteger`.

#### `markEditorInsightSeen` — L28–L35 · public API

Изменяет editor insight seen, сохраняя инварианты данного модуля.

- Параметры: `id`.

- Основные вызовы: `getSeenEditorInsightIds`, `add`, `setItem`, `getProfileScopedStorageKey`, `Array.from`.

#### `getSeenObservationIds` — L37–L41 · public API

Получает seen observation ids из принадлежащего модулю источника данных.

- Основные вызовы: `getStoredValues`, `isInteger`.

#### `getSeenActivityInsightKeys` — L43–L47 · public API

Получает seen activity insight keys из принадлежащего модулю источника данных.

- Основные вызовы: `getStoredValues`.

#### `createActivityInsightSeenKey` — L49–L54 · public API

Создаёт activity insight seen key из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `activityId`, `generatedAt`.

#### `markObservationFeedSeen` — L56–L71 · public API

Изменяет observation feed seen, сохраняя инварианты данного модуля.

- Параметры: `{ activityInsightKeys, observationIds, }`.

- Основные вызовы: `storeValues`, `getSeenObservationIds`, `getSeenActivityInsightKeys`.

#### `getStoredValues` — L73–L91 · internal helper

Получает stored values из принадлежащего модулю источника данных.

- Параметры: `key`, `parseValue`.

- Основные вызовы: `getItem`, `getProfileScopedStorageKey`, `Array.isArray`.

#### `storeValues` — L93–L98 · internal helper

Выполняет локальную операцию store values внутри ответственности этого файла.

- Параметры: `key`, `values`.

- Основные вызовы: `setItem`, `getProfileScopedStorageKey`.

#### Публичные типы, классы и константы

- `const SEEN_EDITOR_INSIGHT_IDS_KEY` — L3
- `const SEEN_OBSERVATION_IDS_KEY` — L4
- `const SEEN_ACTIVITY_INSIGHT_KEYS_KEY` — L5

### `client/src/features/insights/ui/InsightStrip.tsx`

Клиентская feature observations/insights: insight strip.

#### `InsightStrip` — L9–L29 · public API

Рендерит React-компонент InsightStrip и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ insights }`.

- Основные вызовы: `useI18n`, `t`, `getLayerLabelKey`.

#### `getLayerLabelKey` — L31–L35 · internal helper

Получает layer label key из принадлежащего модулю источника данных.

- Параметры: `layer`.

### `client/src/features/insights/ui/Observations.tsx`

Клиентская feature observations/insights: observations.

#### `Observations` — L23–L189 · public API

Рендерит React-компонент Observations и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ activities, activityInsights, insights, personaTextEnabled, onClose, onDeleteInsight, onOpenActivity, onRefresh, }`.

- Основные вызовы: `useI18n`, `groupInsightsByDate`, `getResultsCopy`, `flatMap`, `values`, `get`, `localeCompare`, `t`.

#### `groupInsightsByDate` — L191–L204 · internal helper

Возвращает вычисленное значение insights by date для использования внутри данного модуля.

- Параметры: `insights`.

- Основные вызовы: `set`, `get`, `Array.from`.

#### `compareInsights` — L206–L214 · internal helper

Сравнивает insights для стабильного детерминированного порядка.

- Параметры: `left`, `right`.

- Основные вызовы: `localeCompare`, `layerWeight`.

#### `layerWeight` — L216–L220 · internal helper

Возвращает вычисленное значение layer weight для использования внутри данного модуля.

- Параметры: `layer`.

#### `formatPeriod` — L222–L231 · internal helper

Преобразует period в стабильное представление для UI, сети или хранения.

- Параметры: `insight`, `language`.

- Основные вызовы: `formatLongDate`.

#### `formatGeneratedAt` — L233–L240 · internal helper

Преобразует generated at в стабильное представление для UI, сети или хранения.

- Параметры: `value`, `language`.

- Основные вызовы: `toLocaleString`, `getLocale`.

#### `getLayerLabelKey` — L242–L246 · internal helper

Получает layer label key из принадлежащего модулю источника данных.

- Параметры: `layer`.

### `client/src/features/insights/ui/ObservationsButton.tsx`

Клиентская feature observations/insights: observations button.

#### `ObservationsButton` — L5–L33 · public API

Рендерит React-компонент ObservationsButton и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ hasUnread, onClick, }`.

- Основные вызовы: `useI18n`, `t`.

### `client/src/features/insights/useInsights.ts`

Клиентская feature observations/insights: use insights.

#### `useInsights` — L21–L103 · public API

Управляет React-состоянием, derived values и side effects для insights.

- Параметры: `{ draftLoaded, draftText, personaTextEnabled, }`.

- Основные вызовы: `useState`, `useCallback`, `loadCurrentInsights`, `todayDateOnly`, `setInsights`, `loadInsightHistory`, `setObservationHistory`, `useEffect`.

#### `deleteInsight` — L74–L88 · nested helper в useInsights

Удаляет или очищает insight с необходимыми связанными действиями.

- Параметры: `insight`.

- Основные вызовы: `deleteInsightSnapshot`, `setEditorInsight`, `refreshInsights`, `refreshObservationHistory`.

#### `clearEditorInsight` — L90–L92 · nested helper в useInsights

Удаляет или очищает editor insight с необходимыми связанными действиями.

- Основные вызовы: `setEditorInsight`.

### `client/src/features/insights/useObservationNotifications.ts`

Клиентская feature observations/insights: use observation notifications.

#### `useObservationNotifications` — L11–L47 · public API

Управляет React-состоянием, derived values и side effects для observation notifications.

- Параметры: `{ activityInsights, observations, }`.

- Основные вызовы: `useState`, `useMemo`, `values`, `createActivityInsightSeenKey`, `has`, `useCallback`, `markObservationFeedSeen`, `setSeenObservationIds`.

### `client/src/features/rag/evidencePack.ts`

Локальная evidence-pack и ограниченная интерпретация: evidence pack.

#### `buildLocalRagEvidencePack` — L63–L146 · public API

Создаёт local rag evidence pack из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `entries`, `query`, `options`.

- Основные вызовы: `Math.max`, `createEntrySearchIndex`, `searchIndexedEntriesHybrid`, `searchSemanticEntryIndex`, `createSemanticEntryIndex`, `flatMap`, `get`, `extractEmbeddingConcepts`.

#### `collectMeasuredSignals` — L148–L167 · internal helper

Извлекает measured signals из входных данных без самостоятельного сохранения результата.

- Параметры: `entries`.

- Основные вызовы: `flatMap`.

#### `createIncludedBecause` — L169–L183 · internal helper

Создаёт included because из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `query`, `topics`, `index`.

- Основные вызовы: `push`.

#### `createEvidenceUncertainty` — L185–L206 · internal helper

Создаёт evidence uncertainty из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `support`, `measuredSignals`.

- Основные вызовы: `push`.

#### `trimExcerpt` — L208–L213 · internal helper

Возвращает вычисленное значение trim excerpt для использования внутри данного модуля.

- Параметры: `text`.

- Основные вызовы: `replace`.

#### `roundScore` — L215–L217 · internal helper

Ограничивает score допустимым диапазоном или точностью.

- Параметры: `score`.

- Основные вызовы: `Math.round`, `Math.max`.

#### Публичные типы, классы и константы

- `type LocalRagEvidenceKind` — L15
- `type LocalRagMeasuredSignal` — L17
- `type LocalRagRetrievedSupport` — L27
- `type LocalRagEvidencePack` — L40

### `client/src/features/rag/localInterpretation.ts`

Локальная evidence-pack и ограниченная интерпретация: local interpretation.

#### `interpretLocalEvidencePack` — L38–L72 · public API

Возвращает вычисленное значение interpret local evidence pack для использования внутри данного модуля.

- Параметры: `pack`.

- Основные вызовы: `composeRetrievedSupportObservation`, `composeMeasuredSignalObservation`, `composeHypothesisObservation`, `composeSuggestionObservation`, `composeUncertaintyObservation`.

#### `composeRetrievedSupportObservation` — L74–L85 · internal helper

Создаёт retrieved support observation из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `support`.

- Основные вызовы: `unique`.

#### `composeMeasuredSignalObservation` — L87–L125 · internal helper

Создаёт measured signal observation из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `signals`.

- Основные вызовы: `get`, `push`, `set`, `at`, `Array.from`, `entries`, `Math.abs`, `localeCompare`.

#### `composeHypothesisObservation` — L127–L144 · internal helper

Создаёт hypothesis observation из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `pack`.

#### `composeSuggestionObservation` — L146–L158 · internal helper

Создаёт suggestion observation из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `pack`.

#### `composeUncertaintyObservation` — L160–L174 · internal helper

Создаёт uncertainty observation из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `pack`.

#### `unique` — L176–L178 · internal helper

Возвращает вычисленное значение unique для использования внутри данного модуля.

- Параметры: `values`.

- Основные вызовы: `Array.from`.

#### Публичные типы, классы и константы

- `type LocalEvidenceObservationKind` — L7
- `type LocalEvidenceObservation` — L14
- `type LocalEvidenceInterpretation` — L21

### `client/src/features/results/activityAggregation.ts`

Проектный файл: activity aggregation.

#### `createActivityGroupFromMentions` — L21–L51 · public API

Создаёт activity group from mentions из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `{ id, kind, label, latestEntryDate, mentions, }`.

- Основные вызовы: `deriveStage`, `deriveRhythm`, `deriveBurnoutRelation`, `createInsightInput`.

#### `detectMentionMarker` — L53–L59 · public API

Возвращает вычисленное значение mention marker для использования внутри данного модуля.

- Параметры: `text`.

- Основные вызовы: `test`.

#### `normalizeMetric` — L61–L64 · public API

Приводит metric к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `value`.

- Основные вызовы: `isFinite`, `Math.max`, `Math.min`.

#### `deriveStage` — L66–L99 · internal helper

Возвращает вычисленное значение derive stage для использования внутри данного модуля.

- Параметры: `kind`, `mentions`.

- Основные вызовы: `test`, `uniqueDates`, `daysBetween`, `at`.

#### `deriveRhythm` — L101–L125 · internal helper

Возвращает вычисленное значение derive rhythm для использования внутри данного модуля.

- Параметры: `mentions`.

- Основные вызовы: `uniqueDates`, `dateOnly`, `daysBetween`, `Math.floor`, `at`, `Math.max`.

#### `deriveBurnoutRelation` — L127–L152 · internal helper

Возвращает вычисленное значение derive burnout relation для использования внутри данного модуля.

- Параметры: `mentions`.

- Основные вызовы: `flatMap`, `classifyBurnoutSamples`.

#### `classifyBurnoutSamples` — L154–L172 · internal helper

Возвращает вычисленное значение classify burnout samples для использования внутри данного модуля.

- Параметры: `sampleCount`, `drainingSamples`, `restorativeSamples`.

- Основные вызовы: `Math.max`, `Math.ceil`.

#### `createInsightInput` — L174–L247 · internal helper

Создаёт insight input из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `{ burnoutRelation, id, kind, label, mentions, rhythm, stage, }`.

- Основные вызовы: `uniqueDates`, `flatMap`, `Math.max`, `Math.min`, `daysBetween`, `at`.

#### `uniqueDates` — L249–L253 · internal helper

Возвращает вычисленное значение unique dates для использования внутри данного модуля.

- Параметры: `mentions`.

- Основные вызовы: `localeCompare`.

#### `daysBetween` — L255–L260 · internal helper

Возвращает вычисленное значение days between для использования внутри данного модуля.

- Параметры: `startDate`, `endDate`.

- Основные вызовы: `parse`, `isFinite`, `Math.max`, `Math.round`.

#### `dateOnly` — L262–L267 · internal helper

Возвращает вычисленное значение date only для использования внутри данного модуля.

- Параметры: `date`.

- Основные вызовы: `getFullYear`, `padStart`, `String`, `getMonth`, `getDate`.

### `client/src/features/results/activityCatalog.ts`

Проектный файл: activity catalog.

#### `cleanActivityLabel` — L254–L260 · public API

Возвращает вычисленное значение clean activity label для использования внутри данного модуля.

- Параметры: `value`.

- Основные вызовы: `replace`.

#### `normalizeActivityLabel` — L262–L265 · public API

Приводит activity label к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `value`.

- Основные вызовы: `normalizeText`, `cleanActivityLabel`, `get`.

#### `getActivityDisplayLabel` — L267–L275 · public API

Получает activity display label из принадлежащего модулю источника данных.

- Параметры: `activityId`, `fallback`, `language`.

- Основные вызовы: `get`, `sentenceCaseLabel`.

#### `getConfiguredActivityKind` — L277–L281 · public API

Получает configured activity kind из принадлежащего модулю источника данных.

- Параметры: `activityId`.

- Основные вызовы: `get`.

#### `hasConfiguredActivity` — L283–L285 · public API

Проверяет условие configured activity и возвращает логический результат без изменения состояния.

- Параметры: `activityId`.

- Основные вызовы: `has`.

#### `isSpecificProjectIdentityTag` — L287–L292 · public API

Проверяет условие specific project identity tag и возвращает логический результат без изменения состояния.

- Параметры: `activityId`.

- Основные вызовы: `isUsefulActivityName`, `has`.

#### `textContainsActivity` — L294–L303 · public API

Возвращает вычисленное значение text contains activity для использования внутри данного модуля.

- Параметры: `text`, `activityId`.

- Основные вызовы: `normalizeText`, `get`.

#### `isUsefulActivityName` — L305–L313 · public API

Проверяет условие useful activity name и возвращает логический результат без изменения состояния.

- Параметры: `value`.

- Основные вызовы: `has`, `test`.

#### `sentenceCaseLabel` — L315–L326 · internal helper

Возвращает вычисленное значение sentence case label для использования внутри данного модуля.

- Параметры: `value`, `language`.

- Основные вызовы: `Array.from`, `findIndex`, `test`, `toLocaleUpperCase`.

#### `normalizeText` — L328–L334 · internal helper

Приводит text к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `value`.

- Основные вызовы: `replace`, `toLocaleLowerCase`, `normalize`.

#### Публичные типы, классы и константы

- `const NEGATED_RESULT_PATTERN` — L237
- `const BLOCKER_PATTERN` — L239
- `const RESULT_PATTERN` — L241
- `const COMPLETION_PATTERN` — L243
- `const PROJECT_LANGUAGE_PATTERN` — L245
- `const BOUNDED_TASK_LANGUAGE_PATTERN` — L247
- `const RECURRING_LANGUAGE_PATTERN` — L249
- `const KNOWN_RECURRING_ACTIVITY_PATTERN` — L251

### `client/src/features/results/activityInsightApi.ts`

Проектный файл: activity insight api.

#### `generateActivityInsights` — L11–L32 · public API

Создаёт activity insights из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `payload`, `signal`.

- Основные вызовы: `fetch`, `csrfJsonHeaders`, `handleUnauthorized`, `createApiHttpError`, `json`.

### `client/src/features/results/activityInsightCache.ts`

Проектный файл: activity insight cache.

#### `loadActivityInsightCache` — L19–L38 · public API

Получает activity insight cache из принадлежащего модулю источника данных.

- Основные вызовы: `openAthenaLocalDb`, `transaction`, `idbRequest`, `getAll`, `objectStore`, `Promise.all`, `decryptStoredInsight`.

#### `saveActivityInsights` — L40–L55 · public API

Сохраняет activity insights в принадлежащем модулю хранилище или read model.

- Параметры: `values`.

- Основные вызовы: `loadActivityInsightCache`, `set`, `Promise.all`, `values`, `openAthenaLocalDb`, `transaction`, `objectStore`, `idbRequest`.

#### `encryptInsight` — L57–L67 · internal helper

Выполняет криптографическое преобразование insight в рамках локальной privacy boundary.

- Параметры: `value`.

- Основные вызовы: `createStorageKey`, `encryptVaultJson`, `associatedData`.

#### `decryptStoredInsight` — L69–L74 · internal helper

Выполняет криптографическое преобразование stored insight в рамках локальной privacy boundary.

- Параметры: `record`.

- Основные вызовы: `decryptVaultJson`, `associatedData`.

#### `createStorageKey` — L76–L83 · internal helper

Создаёт storage key из переданных данных, не отдавая вызывающему коду детали сборки.

- Основные вызовы: `randomUUID`, `getRandomValues`, `padStart`.

#### `associatedData` — L85–L87 · internal helper

Возвращает вычисленное значение associated data для использования внутри данного модуля.

- Параметры: `storageKey`.

### `client/src/features/results/activityInsightQuota.ts`

Проектный файл: activity insight quota.

#### `reserveActivityInsightGeneration` — L14–L20 · public API

Возвращает вычисленное значение reserve activity insight generation для использования внутри данного модуля.

- Основные вызовы: `readUsage`, `persistUsage`.

#### `readUsage` — L22–L44 · internal helper

Получает usage из принадлежащего модулю источника данных.

- Основные вызовы: `localDateKey`, `getItem`, `storageKey`, `isFinite`, `Math.min`, `Math.max`, `Math.floor`.

#### `persistUsage` — L46–L48 · internal helper

Выполняет локальную операцию persist usage внутри ответственности этого файла.

- Параметры: `usage`.

- Основные вызовы: `setItem`, `storageKey`.

#### `storageKey` — L50–L52 · internal helper

Возвращает вычисленное значение storage key для использования внутри данного модуля.

- Основные вызовы: `getProfileScopedStorageKey`.

#### `localDateKey` — L54–L60 · internal helper

Возвращает вычисленное значение local date key для использования внутри данного модуля.

- Основные вызовы: `getFullYear`, `padStart`, `String`, `getMonth`, `getDate`.

#### Публичные типы, классы и константы

- `const ACTIVITY_INSIGHT_DAILY_LIMIT` — L4
- `const ACTIVITY_INSIGHT_STORAGE_KEYS` — L5

### `client/src/features/results/activityInsightTypes.ts`

Проектный файл: activity insight types.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `type CachedActivityInsight` — L1
- `type ActivityInsightView` — L11
- `type ActivityInsightState` — L15

### `client/src/features/results/demoResults.ts`

Проектный файл: demo results.

#### `createDemoActivities` — L24–L58 · public API

Создаёт demo activities из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `language`.

- Основные вызовы: `getDemoData`, `dateOnly`, `getFullYear`, `getMonth`, `getDate`, `detectMentionMarker`, `createActivityGroupFromMentions`, `normalizeActivityLabel`.

#### `getDemoData` — L60–L180 · internal helper

Получает demo data из принадлежащего модулю источника данных.

- Параметры: `language`.

#### `dateOnly` — L182–L187 · internal helper

Возвращает вычисленное значение date only для использования внутри данного модуля.

- Параметры: `date`.

- Основные вызовы: `getFullYear`, `padStart`, `String`, `getMonth`, `getDate`.

### `client/src/features/results/resultsCopy.ts`

Проектный файл: results copy.

#### `getResultsCopy` — L260–L262 · public API

Получает results copy из принадлежащего модулю источника данных.

- Параметры: `language`.

#### Публичные типы, классы и константы

- `type ResultsCopy` — L3

### `client/src/features/results/resultsModel.ts`

Проектный файл: results model.

#### `buildActivityIndex` — L47–L74 · public API

Создаёт activity index из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `entries`, `language`.

- Основные вызовы: `localeCompare`, `createDemoActivities`, `collectCandidates`, `createActivityGroup`.

#### `collectCandidates` — L76–L130 · internal helper

Извлекает candidates из входных данных без самостоятельного сохранения результата.

- Параметры: `entries`, `language`.

- Основные вызовы: `getProjectTagHint`, `cleanActivityLabel`, `normalizeActivityLabel`, `Boolean`, `hasConfiguredActivity`, `shouldUseProjectTagForActivity`, `getActivityDisplayLabel`, `addCandidate`.

#### `addCandidate` — L132–L175 · internal helper

Выполняет локальную операцию candidate внутри ответственности этого файла.

- Параметры: `{ candidates, countedInEntry, entryDate, id, kindHint, label, }`.

- Основные вызовы: `isUsefulActivityName`, `has`, `get`, `add`, `set`.

#### `getProjectTagHint` — L177–L199 · internal helper

Получает project tag hint из принадлежащего модулю источника данных.

- Параметры: `entry`, `language`.

- Основные вызовы: `hasProjectWorkEvidence`, `cleanActivityLabel`, `normalizeActivityLabel`, `isSpecificProjectIdentityTag`, `set`, `entries`, `getActivityDisplayLabel`.

#### `hasProjectWorkEvidence` — L201–L212 · internal helper

Проверяет условие project work evidence и возвращает логический результат без изменения состояния.

- Параметры: `entry`.

- Основные вызовы: `test`.

#### `shouldUseProjectTagForActivity` — L214–L229 · internal helper

Проверяет условие should use project tag for activity и возвращает логический результат без изменения состояния.

- Параметры: `entry`, `activityLabel`.

- Основные вызовы: `normalizeActivityLabel`, `test`.

#### `createActivityGroup` — L231–L248 · internal helper

Создаёт activity group из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `candidate`, `entries`.

- Основные вызовы: `findMention`, `localeCompare`, `classifyActivity`, `createActivityGroupFromMentions`.

#### `findMention` — L250–L297 · internal helper

Выбирает mention, удовлетворяющий ограничениям текущего сценария.

- Параметры: `entry`, `activityId`.

- Основные вызовы: `normalizeActivityLabel`, `push`, `textContainsActivity`, `findRelevantText`, `findTagBackedTaskContext`, `normalizeMetric`, `contextToMentionMarker`, `detectMentionMarker`.

#### `findTagBackedTaskContext` — L299–L303 · internal helper

Выбирает tag backed task context, удовлетворяющий ограничениям текущего сценария.

- Параметры: `entry`.

#### `classifyActivity` — L305–L345 · internal helper

Возвращает вычисленное значение classify activity для использования внутри данного модуля.

- Параметры: `id`, `mentions`, `kindHint`.

- Основные вызовы: `getConfiguredActivityKind`, `flatMap`, `getClassificationText`, `test`.

#### `getClassificationText` — L347–L356 · internal helper

Получает classification text из принадлежащего модулю источника данных.

- Параметры: `mention`, `activityId`.

- Основные вызовы: `findRelevantText`.

#### `contextToMentionMarker` — L358–L364 · internal helper

Возвращает вычисленное значение context to mention marker для использования внутри данного модуля.

- Параметры: `event`.

#### `findRelevantText` — L366–L381 · internal helper

Выбирает relevant text, удовлетворяющий ограничениям текущего сценария.

- Параметры: `text`, `activityId`, `canUseWholeEntry`.

- Основные вызовы: `split`, `textContainsActivity`.

#### `compareActivityCandidates` — L383–L393 · internal helper

Сравнивает activity candidates для стабильного детерминированного порядка.

- Параметры: `left`, `right`.

- Основные вызовы: `localeCompare`.

#### `compareActivityGroups` — L395–L402 · internal helper

Сравнивает activity groups для стабильного детерминированного порядка.

- Параметры: `left`, `right`.

- Основные вызовы: `localeCompare`.

### `client/src/features/results/resultsTypes.ts`

Проектный файл: results types.

Именованных функций нет: файл служит re-export границей.
#### Публичные типы, классы и константы

- `type ActivityMentionSource` — L11
- `type ActivityKind` — L12
- `type ActivityMentionMarker` — L13
- `type ActivityStage` — L14
- `type ActivityRhythm` — L15
- `type ActivityBurnoutRelation` — L16
- `type ActivityInsightEventType` — L17
- `type ActivityMentionDebugSignals` — L20
- `type ActivityMention` — L26
- `type ActivityGroup` — L36
- `type ActivityIndex` — L45

### `client/src/features/results/ui/ActivityDebug.tsx`

Проектный файл: activity debug.

#### `ActivityDebug` — L6–L56 · public API

Рендерит React-компонент ActivityDebug и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ activity, copy, insight, language, model, }`.

- Основные вызовы: `String`, `formatAverageSignal`, `toLocaleString`.

#### `formatAverageSignal` — L58–L70 · internal helper

Преобразует average signal в стабильное представление для UI, сети или хранения.

- Параметры: `activity`, `key`.

- Основные вызовы: `toFixed`.

### `client/src/features/results/ui/ActivityGraph.tsx`

Проектный файл: activity graph.

#### `ActivityGraph` — L6–L78 · public API

Рендерит React-компонент ActivityGraph и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ activity, copy, language, }`.

- Основные вызовы: `createActivityGraphValues`, `Math.max`, `localeCompare`, `formatShortDate`, `at`.

#### `createActivityGraphValues` — L80–L105 · internal helper

Создаёт activity graph values из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `mentions`, `bucketCount`.

- Основные вызовы: `parse`, `Array.from`, `Math.max`, `Math.min`, `Math.round`.

### `client/src/features/results/ui/AnimatedActivityPanel.tsx`

Проектный файл: animated activity panel.

#### `AnimatedActivityPanel` — L3–L56 · public API

Рендерит React-компонент AnimatedActivityPanel и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ children, isExpanded, }`.

- Основные вызовы: `useState`, `useEffect`, `setIsRendered`, `requestAnimationFrame`, `setIsOpen`, `setTimeout`, `cancelAnimationFrame`, `clearTimeout`.

### `client/src/features/results/ui/ResultsPage.tsx`

Проектный файл: results page.

#### `ResultsPage` — L27–L173 · public API

Рендерит React-компонент ResultsPage и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ activityInsights, debugMode, entries, extractionSettings, focusedActivityId, focusedActivityKey, model, onDeleteEntry, onEditEntry, onToggleEntryAnalysis, onToggleTag, }`.

- Основные вызовы: `useI18n`, `getResultsCopy`, `useState`, `useEffect`, `setSelectedActivityId`, `requestAnimationFrame`, `scrollIntoView`, `querySelector`.

#### `generateFreshAthenaPhrase` — L175–L183 · internal helper

Создаёт fresh athena phrase из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `language`, `previousText`.

- Основные вызовы: `generateAthenaPlaceholder`.

#### `ActivityEntries` — L185–L316 · internal helper

Рендерит React-компонент ActivityEntries и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ activity, activityInsights, copy, debugMode, entries, extractionSettings, fallbackPhrase, isDemo, language, onDeleteEntry, onEditEntry, onToggleEntryAnalysis, onToggleTag, }`.

- Основные вызовы: `useState`, `get`, `useMemo`, `flatMap`, `resolveInsightText`, `setExpandedEntryId`.

#### `resolveInsightText` — L318–L353 · internal helper

Возвращает вычисленное значение resolve insight text для использования внутри данного модуля.

- Параметры: `{ activity, copy, extractionSettings, fallbackPhrase, insight, insightError, isDemo, isInsightLoading, isInsightRefreshing, }`.

#### `DemoMentionRow` — L355–L381 · internal helper

Рендерит React-компонент DemoMentionRow и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ activityLabel, index, language, mention, }`.

- Основные вызовы: `createEntrySearchSnippet`, `padStart`, `String`, `formatLongDate`.

#### `MentionSnippet` — L383–L404 · internal helper

Рендерит React-компонент MentionSnippet и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ snippet, text, }`.

- Основные вызовы: `replace`.

### `client/src/features/results/useActivityInsights.ts`

Проектный файл: use activity insights.

#### `useActivityInsights` — L20–L150 · public API

Управляет React-состоянием, derived values и side effects для activity insights.

- Параметры: `{ activities, extractionSettings, isDemo, language, }`.

- Основные вызовы: `useState`, `useEffect`, `setError`, `setInsights`, `setIsLoading`, `setIsRefreshing`, `Promise.all`, `loadActivityInsightCache`.

#### `createFingerprints` — L152–L173 · internal helper

Создаёт fingerprints из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `activities`, `language`, `model`.

- Основные вызовы: `Promise.all`, `hashValue`.

#### `hashValue` — L175–L184 · internal helper

Проверяет условие value и возвращает логический результат без изменения состояния.

- Параметры: `value`.

- Основные вызовы: `digest`, `encode`, `padStart`.

### `client/src/features/selfReports/selfReportActions.ts`

Локальные self-reports и синхронизация агрегатов: self report actions.

#### `saveEntrySelfReportAndSync` — L8–L19 · public API

Сохраняет entry self report and sync в принадлежащем модулю хранилище или read model.

- Параметры: `input`.

- Основные вызовы: `saveEntrySelfReport`, `catch`, `enqueueSelfReportAggregateSync`.

#### `deleteEntrySelfReportAndSync` — L21–L30 · public API

Удаляет или очищает entry self report and sync с необходимыми связанными действиями.

- Параметры: `entryId`.

- Основные вызовы: `deleteEntrySelfReport`, `catch`, `enqueueSelfReportAggregateSync`.

### `client/src/features/selfReports/selfReportApi.ts`

Локальные self-reports и синхронизация агрегатов: self report api.

#### `syncSelfReportDailyAggregates` — L12–L33 · public API

Оркестрирует self report daily aggregates в инфраструктуре синхронизации или фоновой очереди.

- Параметры: `localDay`, `aggregates`.

- Основные вызовы: `fetch`, `encodeURIComponent`, `csrfJsonHeaders`, `serializeSelfReportDailyAggregates`, `handleUnauthorized`, `text`.

#### `serializeSelfReportDailyAggregates` — L35–L51 · public API

Преобразует self report daily aggregates в стабильное представление для UI, сети или хранения.

- Параметры: `aggregates`.

#### Публичные типы, классы и константы

- `type SyncSelfReportDailyAggregatePayload` — L7

### `client/src/features/selfReports/selfReportQueue.ts`

Локальные self-reports и синхронизация агрегатов: self report queue.

#### `enqueueSelfReportAggregateSync` — L14–L26 · public API

Оркестрирует self report aggregate sync в инфраструктуре синхронизации или фоновой очереди.

- Параметры: `localDay`.

- Основные вызовы: `enqueueQueueJob`, `toISOString`.

#### `handleSelfReportAggregateSyncJob` — L28–L45 · public API

Исполняет сценарий self report aggregate sync job и координирует его побочные эффекты.

- Параметры: `job`, `signal`.

- Основные вызовы: `getSelfReportDailyAggregates`, `syncSelfReportDailyAggregates`, `markSelfReportsForLocalDaySynced`.

#### Публичные типы, классы и константы

- `type SelfReportDailyAggregateQueuePayload` — L9

### `client/src/features/selfReports/selfReportStorage.ts`

Локальные self-reports и синхронизация агрегатов: self report storage.

#### `getEntrySelfReport` — L52–L63 · public API

Получает entry self report из принадлежащего модулю источника данных.

- Параметры: `entryId`.

- Основные вызовы: `openAthenaLocalDb`, `transaction`, `index`, `objectStore`, `idbRequest`, `get`, `normalizeSelfReportEvent`, `readStoredSelfReportEvent`.

#### `saveEntrySelfReport` — L65–L97 · public API

Сохраняет entry self report в принадлежащем модулю хранилище или read model.

- Параметры: `{ entryId, localDay, values, }`.

- Основные вызовы: `getEntrySelfReport`, `toISOString`, `normalizeSelfReportValues`, `Array.from`, `encryptSelfReportEvent`, `openAthenaLocalDb`, `transaction`, `idbRequest`.

#### `deleteEntrySelfReport` — L99–L110 · public API

Удаляет или очищает entry self report с необходимыми связанными действиями.

- Параметры: `entryId`.

- Основные вызовы: `getEntrySelfReport`, `openAthenaLocalDb`, `transaction`, `idbRequest`, `delete`, `objectStore`, `recomputeSelfReportDailyAggregates`.

#### `replaceAllSelfReportEvents` — L112–L149 · public API

Сохраняет replace all self report events в принадлежащем модулю хранилище или read model.

- Параметры: `events`.

- Основные вызовы: `Promise.all`, `Array.from`, `openAthenaLocalDb`, `transaction`, `idbRequest`, `clear`, `objectStore`, `put`.

#### `getSelfReportDailyAggregates` — L151–L170 · public API

Получает self report daily aggregates из принадлежащего модулю источника данных.

- Параметры: `localDay`.

- Основные вызовы: `openAthenaLocalDb`, `transaction`, `index`, `objectStore`, `idbRequest`, `getAll`, `Promise.all`, `localeCompare`.

#### `markSelfReportsForLocalDaySynced` — L172–L201 · public API

Изменяет self reports for local day synced, сохраняя инварианты данного модуля.

- Параметры: `localDay`, `syncedThrough`.

- Основные вызовы: `toISOString`, `getSelfReportsForLocalDay`, `Promise.all`, `encryptSelfReportEvent`, `openAthenaLocalDb`, `transaction`, `objectStore`, `idbRequest`.

#### `recomputeSelfReportDailyAggregates` — L203–L234 · public API

Возвращает вычисленное значение recompute self report daily aggregates для использования внутри данного модуля.

- Параметры: `localDay`.

- Основные вызовы: `getSelfReportsForLocalDay`, `buildAxisAggregate`, `Boolean`, `openAthenaLocalDb`, `transaction`, `objectStore`, `idbRequest`, `delete`.

#### `getAllSelfReportEvents` — L236–L250 · public API

Получает all self report events из принадлежащего модулю источника данных.

- Основные вызовы: `openAthenaLocalDb`, `transaction`, `idbRequest`, `getAll`, `objectStore`, `Promise.all`, `readStoredSelfReportEvent`, `localeCompare`.

#### `getSelfReportsForLocalDay` — L252–L265 · internal helper

Получает self reports for local day из принадлежащего модулю источника данных.

- Параметры: `localDay`.

- Основные вызовы: `openAthenaLocalDb`, `transaction`, `index`, `objectStore`, `idbRequest`, `getAll`, `Promise.all`, `readStoredSelfReportEvent`.

#### `buildAxisAggregate` — L267–L295 · internal helper

Создаёт axis aggregate из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `localDay`, `axis`, `reports`.

- Основные вызовы: `isFinite`, `createAggregateId`, `Math.min`, `Math.max`, `toISOString`.

#### `createAggregateId` — L297–L299 · internal helper

Создаёт aggregate id из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `localDay`, `axis`.

#### `normalizeSelfReportEvent` — L301–L308 · internal helper

Приводит self report event к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `report`.

- Основные вызовы: `normalizeSelfReportValues`.

#### `normalizeSelfReportDailyAggregate` — L310–L318 · internal helper

Приводит self report daily aggregate к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `aggregate`.

#### `normalizeSelfReportValues` — L320–L328 · internal helper

Приводит self report values к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `values`.

- Основные вызовы: `clampSelfReportValue`.

#### `clampSelfReportValue` — L330–L335 · internal helper

Ограничивает self report value допустимым диапазоном или точностью.

- Параметры: `value`.

- Основные вызовы: `isFinite`, `Math.max`, `Math.min`, `Math.round`.

#### `readStoredSelfReportEvent` — L337–L344 · internal helper

Получает stored self report event из принадлежащего модулю источника данных.

- Параметры: `record`.

- Основные вызовы: `decryptVaultJson`, `createSelfReportVaultAssociatedData`.

#### `readStoredSelfReportDailyAggregate` — L346–L353 · internal helper

Получает stored self report daily aggregate из принадлежащего модулю источника данных.

- Параметры: `record`.

- Основные вызовы: `decryptVaultJson`, `createSelfReportDailyAggregateVaultAssociatedData`.

#### `encryptSelfReportEvent` — L355–L369 · internal helper

Выполняет криптографическое преобразование self report event в рамках локальной privacy boundary.

- Параметры: `report`.

- Основные вызовы: `encryptVaultJson`, `createSelfReportVaultAssociatedData`.

#### `encryptSelfReportDailyAggregate` — L371–L385 · internal helper

Выполняет криптографическое преобразование self report daily aggregate в рамках локальной privacy boundary.

- Параметры: `aggregate`.

- Основные вызовы: `encryptVaultJson`, `createSelfReportDailyAggregateVaultAssociatedData`.

#### `createSelfReportVaultAssociatedData` — L387–L389 · internal helper

Создаёт self report vault associated data из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `reportId`.

#### `createSelfReportDailyAggregateVaultAssociatedData` — L391–L393 · internal helper

Создаёт self report daily aggregate vault associated data из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `aggregateId`.

#### `idbRequest` — L395–L400 · internal helper

Возвращает вычисленное значение idb request для использования внутри данного модуля.

- Параметры: `request`.

- Основные вызовы: `resolve`, `reject`.

#### Публичные типы, классы и константы

- `type ReplaceSelfReportEventsResult` — L46

### `client/src/features/selfReports/selfReportTypes.ts`

Локальные self-reports и синхронизация агрегатов: self report types.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `const SELF_REPORT_SCHEMA_VERSION` — L1
- `const SELF_REPORT_DAILY_AGGREGATE_VERSION` — L2
- `const SELF_REPORT_AXES` — L5
- `type SelfReportAxis` — L13
- `type SelfReportAxisValue` — L15
- `type SelfReportValues` — L17
- `type SelfReportEvent` — L19
- `type SelfReportDailyAggregate` — L30
- `const DEFAULT_SELF_REPORT_VALUES` — L45

### `client/src/features/semantic/localEmbeddings.ts`

Локальные embeddings и semantic index: local embeddings.

#### `embedLocalText` — L224–L239 · public API

Возвращает вычисленное значение embed local text для использования внутри данного модуля.

- Параметры: `text`.

- Основные вызовы: `createWeightedFeatures`, `Array.from`, `hashFeature`, `normalizeVector`.

#### `cosineSimilarity` — L241–L253 · public API

Возвращает вычисленное значение cosine similarity для использования внутри данного модуля.

- Параметры: `left`, `right`.

- Основные вызовы: `Math.min`, `clamp`.

#### `tokenizeEmbeddingText` — L255–L259 · public API

Возвращает вычисленное значение tokenize embedding text для использования внутри данного модуля.

- Параметры: `text`.

- Основные вызовы: `Array.from`, `matchAll`, `normalizeToken`, `has`.

#### `stemEmbeddingToken` — L261–L274 · public API

Возвращает вычисленное значение stem embedding token для использования внутри данного модуля.

- Параметры: `token`.

- Основные вызовы: `hasCyrillic`, `endsWith`.

#### `extractEmbeddingConcepts` — L276–L288 · public API

Извлекает embedding concepts из входных данных без самостоятельного сохранения результата.

- Параметры: `text`.

- Основные вызовы: `tokenizeEmbeddingText`, `stemEmbeddingToken`, `conceptsForToken`, `add`, `Array.from`.

#### `createWeightedFeatures` — L290–L315 · internal helper

Создаёт weighted features из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `text`.

- Основные вызовы: `tokenizeEmbeddingText`, `entries`, `push`, `conceptsForToken`, `extractEmbeddingConcepts`.

#### `conceptsForToken` — L317–L331 · internal helper

Возвращает вычисленное значение concepts for token для использования внутри данного модуля.

- Параметры: `token`, `stem`.

- Основные вызовы: `startsWith`, `push`.

#### `normalizeToken` — L333–L335 · internal helper

Приводит token к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `token`.

- Основные вызовы: `replaceAll`, `toLocaleLowerCase`, `normalize`.

#### `normalizeVector` — L337–L343 · internal helper

Приводит vector к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `vector`.

- Основные вызовы: `Math.sqrt`.

#### `hashFeature` — L345–L354 · internal helper

Проверяет условие feature и возвращает логический результат без изменения состояния.

- Параметры: `feature`.

- Основные вызовы: `charCodeAt`, `Math.imul`.

#### `hasCyrillic` — L356–L358 · internal helper

Проверяет условие cyrillic и возвращает логический результат без изменения состояния.

- Параметры: `value`.

- Основные вызовы: `test`.

#### `clamp` — L360–L362 · internal helper

Ограничивает clamp допустимым диапазоном или точностью.

- Параметры: `value`, `min`, `max`.

- Основные вызовы: `Math.min`, `Math.max`.

#### Публичные типы, классы и константы

- `const LOCAL_HASHED_EMBEDDING_PROVIDER` — L1
- `type LocalEmbeddingProviderId` — L7
- `type LocalEmbeddingVector` — L10

### `client/src/features/semantic/semanticIndex.ts`

Локальные embeddings и semantic index: semantic index.

#### `createSemanticEntryIndex` — L47–L51 · public API

Создаёт semantic entry index из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `entries`.

#### `createSemanticEntryDocument` — L53–L62 · public API

Создаёт semantic entry document из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `entry`.

- Основные вызовы: `chunkEntry`, `embedLocalText`, `createEmbeddingSource`.

#### `searchSemanticEntryIndex` — L64–L116 · public API

Возвращает вычисленное значение search semantic entry index для использования внутри данного модуля.

- Параметры: `documents`, `query`, `options`.

- Основные вызовы: `tokenizeEmbeddingText`, `embedLocalText`, `Math.max`, `cosineSimilarity`, `get`, `set`, `push`, `Array.from`.

#### `createSemanticChunkId` — L118–L129 · public API

Создаёт semantic chunk id из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `entry`, `chunkIndex`, `text`.

- Основные вызовы: `stableHash`.

#### `chunkEntry` — L131–L146 · internal helper

Возвращает вычисленное значение chunk entry для использования внутри данного модуля.

- Параметры: `entry`.

- Основные вызовы: `chunkText`, `createSemanticChunkId`, `embedLocalText`, `createEmbeddingSource`, `tokenizeEmbeddingText`, `extractEmbeddingConcepts`.

#### `createEmbeddingSource` — L148–L152 · internal helper

Создаёт embedding source из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `entry`, `chunkText`.

#### `chunkText` — L154–L187 · internal helper

Возвращает вычисленное значение chunk text для использования внутри данного модуля.

- Параметры: `text`.

- Основные вызовы: `replace`, `split`, `push`, `flatMap`, `splitOversizedChunk`.

#### `splitOversizedChunk` — L189–L206 · internal helper

Возвращает вычисленное значение oversized chunk для использования внутри данного модуля.

- Параметры: `chunk`.

- Основные вызовы: `Math.min`, `lastIndexOf`, `push`.

#### `stableHash` — L208–L217 · internal helper

Возвращает вычисленное значение stable hash для использования внутри данного модуля.

- Параметры: `value`.

- Основные вызовы: `charCodeAt`, `Math.imul`, `padStart`.

#### Публичные типы, классы и константы

- `type LocalSemanticChunk` — L11
- `type LocalSemanticEntryDocument` — L24
- `type LocalSemanticSearchResult` — L31

### `client/src/features/settings/extractionSettings.ts`

Состояние и UI настроек: extraction settings.

#### `normalizeExtractionSettings` — L11–L28 · public API

Приводит extraction settings к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `settings`, `config`.

#### Публичные типы, классы и константы

- `const DEFAULT_EXTRACTION_SETTINGS` — L6

### `client/src/features/settings/pendingReextract.ts`

Состояние и UI настроек: pending reextract.

#### `reprocessLocalEntry` — L19–L102 · public API

Возвращает вычисленное значение reprocess local entry для использования внутри данного модуля.

- Параметры: `entry`, `settings`, `signal`.

- Основные вызовы: `extractSignalForText`, `isRetryableProviderErrorCode`, `getLocalEntry`, `toISOString`, `updateLocalEntry`, `syncLocalEntryToServer`, `catch`, `enqueueEntrySyncJob`.

#### `processPendingReextractEntries` — L104–L140 · public API

Исполняет сценарий pending reextract entries и координирует его побочные эффекты.

- Параметры: `settings`.

- Основные вызовы: `getAllLocalEntries`, `isSignalReprocessCandidate`, `push`, `releaseTerminalPendingReextractEntry`, `getRemainingGeminiDailyExtractions`, `enqueueEntrySignalReprocessJob`, `getSignalReprocessReason`.

#### `releaseTerminalPendingReextractEntry` — L142–L156 · internal helper

Исполняет сценарий release terminal pending reextract entry и координирует его побочные эффекты.

- Параметры: `entry`.

- Основные вызовы: `updateLocalEntry`, `catch`, `enqueueEntrySyncJob`.

### `client/src/features/settings/settingsStorage.ts`

Состояние и UI настроек: settings storage.

#### `getDebugMode` — L14–L16 · public API

Получает debug mode из принадлежащего модулю источника данных.

- Основные вызовы: `getItem`, `key`.

#### `setDebugMode` — L18–L20 · public API

Изменяет debug mode, сохраняя инварианты данного модуля.

- Параметры: `value`.

- Основные вызовы: `setItem`, `key`, `String`.

#### `getPersonaTextEnabled` — L22–L24 · public API

Получает persona text enabled из принадлежащего модулю источника данных.

- Основные вызовы: `getItem`, `key`.

#### `setPersonaTextEnabled` — L26–L28 · public API

Изменяет persona text enabled, сохраняя инварианты данного модуля.

- Параметры: `value`.

- Основные вызовы: `setItem`, `key`, `String`.

#### `getExtractionSettings` — L30–L42 · public API

Получает extraction settings из принадлежащего модулю источника данных.

- Основные вызовы: `getItem`, `key`.

#### `setExtractionSettings` — L44–L46 · public API

Изменяет extraction settings, сохраняя инварианты данного модуля.

- Параметры: `value`.

- Основные вызовы: `setItem`, `key`.

#### `key` — L48–L50 · internal helper

Возвращает вычисленное значение key для использования внутри данного модуля.

- Параметры: `value`.

- Основные вызовы: `getProfileScopedStorageKey`.

#### Публичные типы, классы и константы

- `const SETTINGS_STORAGE_KEYS` — L8

### `client/src/features/settings/ui/AccessSettings.tsx`

Состояние и UI настроек: access settings.

#### `AccessSettings` — L54–L597 · public API

Рендерит React-компонент AccessSettings и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ activeProfileId, appProtectionEnabled, autoLockPreference, credentials, profiles, onAddVaultCredential, onChangeAutoLockPreference, onCreateProfile, onDeleteProfile, onDeleteVaultCredential, onLockAthena, onRenameProfile, onSelectProfile, onRotateVaultSecret, }`.

- Основные вызовы: `useI18n`, `useState`, `getProfileCredentials`, `isAppProtectionEnabled`, `composeVaultSecret`, `setAuthorizingPassphrase`, `setNextPassphrase`, `setNextPassphraseConfirmation`.

#### `getAuthorizingSecret` — L106–L111 · nested helper в AccessSettings

Получает authorizing secret из принадлежащего модулю источника данных.

- Основные вызовы: `composeVaultSecret`.

#### `resetForm` — L113–L117 · nested helper в AccessSettings

Сбрасывает reset form в исходное согласованное состояние.

- Основные вызовы: `setAuthorizingPassphrase`, `setNextPassphrase`, `setNextPassphraseConfirmation`.

#### `validateCurrentPassphrase` — L119–L129 · nested helper в AccessSettings

Проверяет корректность current passphrase и явно отклоняет нарушение контракта.

- Основные вызовы: `setStatus`, `t`.

#### `validateNextPassphrase` — L131–L149 · nested helper в AccessSettings

Проверяет корректность next passphrase и явно отклоняет нарушение контракта.

- Основные вызовы: `setStatus`, `t`.

#### `handleEnableProtection` — L151–L186 · nested helper в AccessSettings

Исполняет сценарий enable protection и координирует его побочные эффекты.

- Параметры: `event`.

- Основные вызовы: `preventDefault`, `setStatus`, `validateNextPassphrase`, `setIsSaving`, `onAddVaultCredential`, `t`, `composeVaultSecret`, `onDeleteVaultCredential`.

#### `handleDisableProtection` — L188–L217 · nested helper в AccessSettings

Исполняет сценарий disable protection и координирует его побочные эффекты.

- Параметры: `event`.

- Основные вызовы: `preventDefault`, `setStatus`, `validateCurrentPassphrase`, `setIsSaving`, `onDeleteVaultCredential`, `getAuthorizingSecret`, `resetForm`, `setMode`.

#### `handleChangePassword` — L219–L251 · nested helper в AccessSettings

Исполняет сценарий change password и координирует его побочные эффекты.

- Параметры: `event`.

- Основные вызовы: `preventDefault`, `setStatus`, `validateCurrentPassphrase`, `validateNextPassphrase`, `setIsSaving`, `onRotateVaultSecret`, `getAuthorizingSecret`, `composeVaultSecret`.

#### `startRenamingProfile` — L253–L257 · nested helper в AccessSettings

Исполняет сценарий start renaming profile и координирует его побочные эффекты.

- Параметры: `profile`.

- Основные вызовы: `setProfileStatus`, `setRenamingProfileId`, `setProfileNameDraft`.

#### `cancelRenamingProfile` — L259–L262 · nested helper в AccessSettings

Проверяет условие cancel renaming profile и возвращает логический результат без изменения состояния.

- Основные вызовы: `setRenamingProfileId`, `setProfileNameDraft`.

#### `handleRenameProfile` — L264–L284 · nested helper в AccessSettings

Исполняет сценарий rename profile и координирует его побочные эффекты.

- Параметры: `event`.

- Основные вызовы: `preventDefault`, `setProfileStatus`, `t`, `onRenameProfile`, `cancelRenamingProfile`.

#### `handleDeleteProfile` — L286–L307 · nested helper в AccessSettings

Исполняет сценарий delete profile и координирует его побочные эффекты.

- Параметры: `profile`.

- Основные вызовы: `setProfileStatus`, `setIsProfileBusy`, `onDeleteProfile`, `t`.

### `client/src/features/settings/ui/DataSettings.tsx`

Состояние и UI настроек: data settings.

#### `DataSettings` — L81–L330 · public API

Рендерит React-компонент DataSettings и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ entries, onImportApplied }`.

- Основные вызовы: `useI18n`, `useRef`, `useState`, `setExportStatus`, `getExtractionSettings`, `buildLocalExportPackage`, `getAllLocalEntries`, `getAllSelfReportEvents`.

#### `handleExportLocalData` — L100–L144 · nested helper в DataSettings

Исполняет сценарий export local data и координирует его побочные эффекты.

- Основные вызовы: `setExportStatus`, `getExtractionSettings`, `buildLocalExportPackage`, `getAllLocalEntries`, `getAllSelfReportEvents`, `getEntrySortDirection`, `getPersonaTextEnabled`, `getQueueJobs`.

#### `handleImportFileChange` — L146–L185 · nested helper в DataSettings

Исполняет сценарий import file change и координирует его побочные эффекты.

- Параметры: `event`.

- Основные вызовы: `setIsReading`, `setPreviewState`, `createIdlePreviewState`, `text`, `parseAndValidateLocalExportJson`, `buildLocalImportPreview`, `formatImportError`.

#### `handleApplyImport` — L187–L220 · nested helper в DataSettings

Исполняет сценарий apply import и координирует его побочные эффекты.

- Основные вызовы: `window.confirm`, `t`, `setPreviewState`, `applyLocalImportReplace`, `onImportApplied`, `formatImportError`.

#### `handleClearPreview` — L222–L224 · nested helper в DataSettings

Исполняет сценарий clear preview и координирует его побочные эффекты.

- Основные вызовы: `setPreviewState`, `createIdlePreviewState`.

#### `createIdlePreviewState` — L332–L341 · internal helper

Создаёт idle preview state из переданных данных, не отдавая вызывающему коду детали сборки.

#### `ImportPreviewCard` — L343–L466 · internal helper

Рендерит React-компонент ImportPreviewCard и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ canApply, isApplying, preview, result, onApply, onClear, }`.

- Основные вызовы: `useI18n`, `t`, `formatDateTime`, `formatDateRange`, `formatCurrentLocalData`, `formatPreviewWarning`.

#### `ImportResultCard` — L468–L504 · internal helper

Рендерит React-компонент ImportResultCard и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ result }`.

- Основные вызовы: `useI18n`, `t`.

#### `PreviewStat` — L506–L519 · internal helper

Рендерит React-компонент PreviewStat и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ label, value, }`.

#### `ResultRow` — L521–L534 · internal helper

Рендерит React-компонент ResultRow и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ label, value, }`.

#### `formatDateRange` — L536–L546 · internal helper

Преобразует date range в стабильное представление для UI, сети или хранения.

- Параметры: `preview`.

#### `formatCurrentLocalData` — L548–L555 · internal helper

Преобразует current local data в стабильное представление для UI, сети или хранения.

- Параметры: `value`, `t`.

- Основные вызовы: `t`.

#### `formatPreviewWarning` — L557–L573 · internal helper

Преобразует preview warning в стабильное представление для UI, сети или хранения.

- Параметры: `warning`, `t`.

- Основные вызовы: `t`.

#### `formatDateTime` — L575–L581 · internal helper

Преобразует date time в стабильное представление для UI, сети или хранения.

- Параметры: `value`.

- Основные вызовы: `parse`, `isNaN`, `toLocaleString`.

#### `formatImportError` — L583–L589 · internal helper

Преобразует import error в стабильное представление для UI, сети или хранения.

- Параметры: `error`.

### `client/src/features/settings/ui/EntriesSettings.tsx`

Состояние и UI настроек: entries settings.

#### `EntriesSettings` — L48–L303 · public API

Рендерит React-компонент EntriesSettings и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ canReprocess, debugMode, extractionSettings, extractionStatus, providers, queueSnapshot, reprocessCandidates, reprocessMessage, selectedProvider, onChangeExtractionSettings, onClearLocalData, onClearQueueHistory, onPauseQueue, onRefreshExtractionStatus, onReprocessFallbackEntries, onRetryRecoverableQueueJobs, onStartQueue, onToggleDebugMode, }`.

- Основные вызовы: `useI18n`, `parseQueueErrorDetails`, `formatQueueErrorHint`, `formatQueueProcessingState`, `t`, `formatStatus`, `onChangeExtractionSettings`, `formatProviderLabel`.

#### `QueueStatusBadge` — L305–L315 · internal helper

Рендерит React-компонент QueueStatusBadge и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ status }`.

- Основные вызовы: `formatQueueStatusClass`.

#### `formatQueueProcessingState` — L317–L325 · internal helper

Преобразует queue processing state в стабильное представление для UI, сети или хранения.

- Параметры: `queueSnapshot`, `t`.

- Основные вызовы: `t`.

#### `formatQueueStatusClass` — L327–L345 · internal helper

Преобразует queue status class в стабильное представление для UI, сети или хранения.

- Параметры: `status`.

#### `parseQueueErrorDetails` — L347–L359 · internal helper

Разбирает queue error details и преобразует вход в типизированное представление.

- Параметры: `error`.

- Основные вызовы: `split`, `classifyQueueErrorCode`.

#### `classifyQueueErrorCode` — L361–L408 · internal helper

Возвращает вычисленное значение classify queue error code для использования внутри данного модуля.

- Параметры: `code`.

- Основные вызовы: `startsWith`.

#### `formatQueueErrorHint` — L410–L441 · internal helper

Преобразует queue error hint в стабильное представление для UI, сети или хранения.

- Параметры: `error`, `language`.

#### `formatDateTime` — L443–L449 · internal helper

Преобразует date time в стабильное представление для UI, сети или хранения.

- Параметры: `value`.

- Основные вызовы: `getTime`, `isFinite`, `toLocaleString`.

#### `formatStatus` — L451–L463 · internal helper

Преобразует status в стабильное представление для UI, сети или хранения.

- Параметры: `status`, `t`.

- Основные вызовы: `t`, `formatStatusReason`.

#### `formatStatusReason` — L465–L482 · internal helper

Преобразует status reason в стабильное представление для UI, сети или хранения.

- Параметры: `reason`, `t`.

- Основные вызовы: `t`.

#### `formatProviderLabel` — L484–L495 · internal helper

Преобразует provider label в стабильное представление для UI, сети или хранения.

- Параметры: `provider`, `t`.

- Основные вызовы: `t`.

### `client/src/features/settings/ui/InterfaceSettings.tsx`

Состояние и UI настроек: interface settings.

#### `InterfaceSettings` — L19–L44 · public API

Рендерит React-компонент InterfaceSettings и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ personaTextEnabled, onTogglePersonaText, }`.

- Основные вызовы: `useI18n`, `t`.

#### `LanguageSettings` — L46–L68 · internal helper

Рендерит React-компонент LanguageSettings и связывает его props с соответствующей UI-поверхностью.

- Основные вызовы: `useI18n`, `t`, `setLanguage`.

### `client/src/features/settings/ui/SettingsPage.tsx`

Состояние и UI настроек: settings page.

#### `Settings` — L97–L244 · public API

Рендерит React-компонент Settings и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ activeVaultProfileId, appProtectionEnabled, autoLockPreference, isOnline, debugMode, entries, extractionConfig, extractionSettings, extractionStatus, personaTextEnabled, queueSnapshot, reprocessMessage, reprocessStatus, vaultProfiles, vaultCredentials, onAddVaultCredential, onChangeAutoLockPreference, onClose, onCreateVaultProfile, onDeleteVaultProfile, onDeleteVaultCredential, onLockAthena, onRenameVaultProfile, onSelectVaultProfile, onRotateVaultSecret, onChangeExtractionSettings, onClearLocalData, onClearQueueHistory, onImportApplied, onRefreshExtractionStatus, onReprocessFallbackEntries, onRetryRecoverableQueueJobs, onPauseQueue, onStartQueue, onToggleDebugMode, onTogglePersonaText, }`.

- Основные вызовы: `useI18n`, `useState`, `isSignalReprocessCandidate`, `t`.

### `client/src/features/settings/ui/SettingsTabList.tsx`

Состояние и UI настроек: settings tab list.

#### `SettingsTabList` — L9–L32 · public API

Рендерит React-компонент SettingsTabList и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ activeTab, onChange }`.

- Основные вызовы: `useI18n`, `onChange`, `t`.

### `client/src/features/settings/ui/settingsTypes.ts`

Состояние и UI настроек: settings types.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `type SettingsTab` — L3
- `const settingsTabs` — L5
- `type RunStatus` — L12
- `type StatusMessageState` — L14

### `client/src/features/settings/ui/settingsUi.tsx`

Состояние и UI настроек: settings ui.

#### `SettingsSection` — L16–L27 · public API

Рендерит React-компонент SettingsSection и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ children, label }`.

#### `SettingsRow` — L37–L69 · public API

Рендерит React-компонент SettingsRow и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ action, children, description, title, tone = "default", }`.

#### `SettingsButton` — L76–L101 · public API

Рендерит React-компонент SettingsButton и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ children, className = "", size = "sm", variant = "default", ...props }`.

#### `SettingsSelect` — L105–L118 · public API

Рендерит React-компонент SettingsSelect и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ className = "", ...props }`.

#### `PasswordField` — L127–L147 · public API

Рендерит React-компонент PasswordField и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ autoComplete, label, onChange, value, }`.

- Основные вызовы: `onChange`.

#### `FormActions` — L155–L172 · public API

Рендерит React-компонент FormActions и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ isSaving, primaryLabel, onCancel, }`.

- Основные вызовы: `useI18n`, `t`.

#### `StatusMessage` — L174–L190 · public API

Рендерит React-компонент StatusMessage и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ status }`.

#### `QueueStat` — L192–L201 · public API

Рендерит React-компонент QueueStat и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ label, value }`.

#### `SettingsLineLever` — L211–L342 · public API

Рендерит React-компонент SettingsLineLever и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ checked, disabled = false, label, testId, onChange, }`.

- Основные вызовы: `useState`, `useRef`, `focus`, `setPointerCapture`, `Math.abs`, `getBoundingClientRect`, `setActiveX`, `Math.max`.

#### `handlePointerDown` — L228–L237 · nested helper в SettingsLineLever

Исполняет сценарий pointer down и координирует его побочные эффекты.

- Параметры: `event`.

- Основные вызовы: `focus`, `setPointerCapture`.

#### `handlePointerMove` — L239–L252 · nested helper в SettingsLineLever

Исполняет сценарий pointer move и координирует его побочные эффекты.

- Параметры: `event`.

- Основные вызовы: `Math.abs`, `getBoundingClientRect`, `setActiveX`, `Math.max`, `Math.min`.

#### `handlePointerUp` — L254–L275 · nested helper в SettingsLineLever

Исполняет сценарий pointer up и координирует его побочные эффекты.

- Параметры: `event`.

- Основные вызовы: `releasePointerCapture`, `setActiveX`, `getBoundingClientRect`, `Math.max`, `Math.min`, `onChange`.

### `client/src/features/settings/useSettingsState.ts`

Состояние и UI настроек: use settings state.

#### `useSettingsState` — L42–L219 · public API

Управляет React-состоянием, derived values и side effects для settings state.

- Параметры: `language`.

- Основные вызовы: `useState`, `getDebugMode`, `getPersonaTextEnabled`, `useCallback`, `setExtractionStatus`, `loadExtractionStatus`, `loadExtractionConfig`, `normalizeExtractionSettings`.

#### `changeExtractionSettings` — L94–L102 · nested helper в useSettingsState

Обновляет или переключает change extraction settings и связанные derived state.

- Параметры: `nextValue`.

- Основные вызовы: `normalizeExtractionSettings`, `setExtractionSettings`, `persistExtractionSettings`, `setReprocessStatus`, `setReprocessMessage`, `refreshExtractionStatus`.

#### `toggleDebugMode` — L104–L107 · nested helper в useSettingsState

Обновляет или переключает toggle debug mode и связанные derived state.

- Параметры: `nextValue`.

- Основные вызовы: `setDebugMode`, `persistDebugMode`.

#### `togglePersonaText` — L109–L112 · nested helper в useSettingsState

Обновляет или переключает toggle persona text и связанные derived state.

- Параметры: `nextValue`.

- Основные вызовы: `setPersonaTextEnabled`, `persistPersonaTextEnabled`.

#### `reprocessFallbackEntries` — L114–L194 · nested helper в useSettingsState

Выполняет локальную операцию reprocess fallback entries внутри ответственности этого файла.

- Параметры: `entries`, `callbacks`.

- Основные вызовы: `isSignalReprocessCandidate`, `getRemainingGeminiDailyExtractions`, `setReprocessStatus`, `setReprocessMessage`, `translateMessage`, `updateLocalEntry`, `enqueueEntrySignalReprocessJob`, `getSignalReprocessReason`.

#### `resetAfterLocalDataClear` — L196–L201 · nested helper в useSettingsState

Сбрасывает reset after local data clear в исходное согласованное состояние.

- Основные вызовы: `setDebugMode`, `setPersonaTextEnabled`, `setReprocessStatus`, `setReprocessMessage`.

#### Публичные типы, классы и константы

- `type ReprocessStatus` — L34

### `client/src/features/sync/entryReprocessJob.ts`

Политики и jobs фоновой синхронизации: entry reprocess job.

#### `enqueueEntrySignalReprocessJob` — L8–L38 · public API

Оркестрирует entry signal reprocess job в инфраструктуре синхронизации или фоновой очереди.

- Параметры: `{ entryId, serverId, sourceTextHash, reason, priority = 10, }`.

- Основные вызовы: `enqueueQueueJob`, `createEntryReprocessPayload`, `createEntryReprocessJobIdempotencyKey`.

### `client/src/features/sync/entryServerSync.ts`

Политики и jobs фоновой синхронизации: entry server sync.

#### `syncLocalEntryToServer` — L15–L32 · public API

Оркестрирует local entry to server в инфраструктуре синхронизации или фоновой очереди.

- Параметры: `entry`, `api`.

- Основные вызовы: `createEntry`, `buildCreatePayload`, `updateServerEntry`, `buildUpdatePayload`, `isHttpNotFound`.

#### `buildCreatePayload` — L34–L43 · internal helper

Создаёт create payload из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `entry`.

#### `buildUpdatePayload` — L45–L53 · internal helper

Создаёт update payload из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `entry`.

#### `isHttpNotFound` — L55–L61 · internal helper

Проверяет условие http not found и возвращает логический результат без изменения состояния.

- Параметры: `error`.

### `client/src/features/sync/entrySyncJob.ts`

Политики и jobs фоновой синхронизации: entry sync job.

#### `enqueueEntrySyncJob` — L36–L56 · public API

Оркестрирует entry sync job в инфраструктуре синхронизации или фоновой очереди.

- Параметры: `{ entryId, sourceTextHash, localRevision, }`.

- Основные вызовы: `createEntrySyncQueuePayload`, `enqueueQueueJob`, `createEntrySyncIdempotencyKey`.

#### `createEntrySyncQueuePayload` — L58–L70 · public API

Создаёт entry sync queue payload из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `{ entryId, sourceTextHash, localRevision, queuedAt = new Date().toISOString(), }`.

- Основные вызовы: `toISOString`, `validateEntrySyncQueuePayload`.

#### `createEntrySyncIdempotencyKey` — L72–L82 · public API

Создаёт entry sync idempotency key из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `payload`.

#### `validateEntrySyncQueuePayload` — L84–L127 · public API

Проверяет корректность entry sync queue payload и явно отклоняет нарушение контракта.

- Параметры: `payload`.

- Основные вызовы: `Array.isArray`, `queueBlocked`, `Object.keys`, `test`.

#### `handleEntrySyncJob` — L129–L166 · public API

Исполняет сценарий entry sync job и координирует его побочные эффекты.

- Параметры: `job`, `signal`.

- Основные вызовы: `throwIfAborted`, `validateEntrySyncQueuePayload`, `getLocalEntry`, `planEntrySyncJob`, `queueBlocked`, `queueConflict`, `syncLocalEntryToServer`, `persistSyncResultIfStillCurrent`.

#### `persistSyncResultIfStillCurrent` — L168–L193 · internal helper

Выполняет локальную операцию persist sync result if still current внутри ответственности этого файла.

- Параметры: `syncedSource`, `serverId`.

- Основные вызовы: `getLocalEntry`, `updateLocalEntry`.

#### `throwIfAborted` — L195–L199 · internal helper

Выполняет локальную операцию throw if aborted внутри ответственности этого файла.

- Параметры: `signal`.

- Основные вызовы: `queueCancelled`.

### `client/src/features/sync/entrySyncPolicy.ts`

Политики и jobs фоновой синхронизации: entry sync policy.

#### `planEntrySyncJob` — L36–L77 · public API

Выводит entry sync job по явным правилам без скрытых побочных эффектов.

- Параметры: `payload`, `localEntry`.

#### Публичные типы, классы и константы

- `type EntrySyncLocalEntrySnapshot` — L3
- `type EntrySyncConflictCode` — L10
- `type EntrySyncBlockCode` — L14
- `type EntrySyncPlan` — L16

### `client/src/features/sync/queue.ts`

Исполнитель durable queue: handlers, retries, recovery и lifecycle processor.

#### `createQueueJobId` — L65–L68 · internal helper

Создаёт queue job id из переданных данных, не отдавая вызывающему коду детали сборки.

- Основные вызовы: `crypto.randomUUID`, `now`, `Math.random`.

#### `nowIso` — L70–L72 · internal helper

Возвращает вычисленное значение now iso для использования внутри данного модуля.

- Основные вызовы: `toISOString`.

#### `createIdempotencyKey` — L74–L81 · internal helper

Создаёт idempotency key из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `input`.

- Основные вызовы: `now`.

#### `emitQueueSnapshot` — L83–L87 · internal helper

Выполняет локальную операцию queue snapshot внутри ответственности этого файла.

- Основные вызовы: `listener`.

#### `refreshQueueSnapshot` — L89–L102 · internal helper

Выполняет локальную операцию refresh queue snapshot внутри ответственности этого файла.

- Основные вызовы: `countQueueJobsByStatus`, `getLastQueueError`, `getLatestQueueJobSummary`, `emitQueueSnapshot`.

#### `delay` — L104–L108 · internal helper

Возвращает вычисленное значение delay для использования внутри данного модуля.

- Параметры: `ms`.

- Основные вызовы: `window.setTimeout`.

#### `clearWakeTimer` — L110–L115 · internal helper

Удаляет или очищает wake timer с необходимыми связанными действиями.

- Основные вызовы: `window.clearTimeout`.

#### `scheduleNextRunAfterWake` — L117–L137 · internal helper

Выполняет локальную операцию schedule next run after wake внутри ответственности этого файла.

- Основные вызовы: `clearWakeTimer`, `getQueueJobsByStatuses`, `getTime`, `isFinite`, `window.setTimeout`, `processQueue`, `Math.max`, `now`.

#### `getRetryDelayMs` — L139–L143 · internal helper

Получает retry delay ms из принадлежащего модулю источника данных.

- Параметры: `attempts`.

#### `getQueueSnapshot` — L145–L147 · public API

Получает queue snapshot из принадлежащего модулю источника данных.

#### `subscribeToQueue` — L149–L156 · public API

Возвращает вычисленное значение to queue для использования внутри данного модуля.

- Параметры: `listener`.

- Основные вызовы: `add`, `listener`, `delete`.

#### `registerQueueHandler` — L158–L163 · public API

Оркестрирует queue handler в инфраструктуре синхронизации или фоновой очереди.

- Параметры: `type`, `handler`.

- Основные вызовы: `set`.

#### `enqueueQueueJob` — L165–L208 · public API

Оркестрирует queue job в инфраструктуре синхронизации или фоновой очереди.

- Параметры: `input`.

- Основные вызовы: `createIdempotencyKey`, `findQueueJobByIdempotencyKey`, `refreshQueueSnapshot`, `assertQueueCanAcceptJob`, `nowIso`, `createQueueJobId`, `addQueueJob`, `processQueue`.

#### `recoverStaleJobs` — L210–L215 · public API

Выполняет локальную операцию stale jobs внутри ответственности этого файла.

- Основные вызовы: `recoverStaleRunningJobs`, `recoverSignalValidationJobs`, `compactQueueJobs`, `refreshQueueSnapshot`.

#### `startQueue` — L217–L229 · public API

Исполняет сценарий start queue и координирует его побочные эффекты.

- Основные вызовы: `clearWakeTimer`, `emitQueueSnapshot`, `processQueue`.

#### `pauseQueue` — L231–L241 · public API

Выполняет локальную операцию pause queue внутри ответственности этого файла.

- Основные вызовы: `clearWakeTimer`, `emitQueueSnapshot`.

#### `wakeQueue` — L243–L255 · public API

Выполняет локальную операцию wake queue внутри ответственности этого файла.

- Основные вызовы: `clearWakeTimer`, `emitQueueSnapshot`, `processQueue`.

#### `stopQueueForVaultLock` — L257–L273 · public API

Исполняет сценарий stop queue for vault lock и координирует его побочные эффекты.

- Основные вызовы: `clearWakeTimer`, `abort`, `emitQueueSnapshot`, `catch`.

#### `retryQueueJob` — L275–L301 · public API

Выполняет локальную операцию retry queue job внутри ответственности этого файла.

- Параметры: `jobId`.

- Основные вызовы: `getQueueJob`, `nowIso`, `updateQueueJob`, `refreshQueueSnapshot`, `processQueue`.

#### `cancelQueueJob` — L303–L327 · public API

Проверяет условие cancel queue job и возвращает логический результат без изменения состояния.

- Параметры: `jobId`.

- Основные вызовы: `getQueueJob`, `abort`, `nowIso`, `serializeQueueError`, `queueCancelled`, `updateQueueJob`, `refreshQueueSnapshot`, `processQueue`.

#### `markJobRunning` — L329–L341 · internal helper

Изменяет job running, сохраняя инварианты данного модуля.

- Параметры: `job`.

- Основные вызовы: `nowIso`, `updateQueueJob`.

#### `markJobSucceeded` — L343–L352 · internal helper

Изменяет job succeeded, сохраняя инварианты данного модуля.

- Параметры: `job`.

- Основные вызовы: `updateQueueJob`, `nowIso`.

#### `markJobFailedOrRetry` — L354–L404 · internal helper

Изменяет job failed or retry, сохраняя инварианты данного модуля.

- Параметры: `job`, `error`.

- Основные вызовы: `classifyQueueError`, `serializeQueueError`, `startsWith`, `markJobSucceeded`, `updateQueueJob`, `nowIso`, `toISOString`, `now`.

#### `processQueue` — L406–L501 · internal helper

Исполняет сценарий queue и координирует его побочные эффекты.

- Основные вызовы: `getRunnableQueueJobs`, `emitQueueSnapshot`, `scheduleNextRunAfterWake`, `get`, `updateQueueJob`, `nowIso`, `serializeQueueError`, `queueBlocked`.

#### `retryRecoverableQueueJobs` — L503–L522 · public API

Выполняет локальную операцию retry recoverable queue jobs внутри ответственности этого файла.

- Основные вызовы: `getQueueJobsByStatuses`, `updateQueueJob`, `nowIso`, `refreshQueueSnapshot`, `processQueue`.

#### `clearQueueHistory` — L524–L534 · public API

Удаляет или очищает queue history с необходимыми связанными действиями.

- Основные вызовы: `deleteQueueJobsByStatuses`, `refreshQueueSnapshot`.

### `client/src/features/sync/queueErrors.ts`

Политики и jobs фоновой синхронизации: queue errors.

#### `queueRetryable` — L34–L40 · public API

Возвращает вычисленное значение queue retryable для использования внутри данного модуля.

- Параметры: `code`, `message`, `cause`.

#### `queueBlocked` — L42–L48 · public API

Возвращает вычисленное значение queue blocked для использования внутри данного модуля.

- Параметры: `code`, `message`, `cause`.

#### `queueConflict` — L50–L56 · public API

Возвращает вычисленное значение queue conflict для использования внутри данного модуля.

- Параметры: `code`, `message`, `cause`.

#### `queueCancelled` — L58–L63 · public API

Возвращает вычисленное значение queue cancelled для использования внутри данного модуля.

- Параметры: `message`, `cause`.

#### `classifyQueueError` — L65–L258 · public API

Возвращает вычисленное значение classify queue error для использования внутри данного модуля.

- Параметры: `error`.

- Основные вызовы: `isAbortLikeError`, `errorToMessage`, `readHttpStatus`, `readErrorCode`, `toLowerCase`.

#### `serializeQueueError` — L260–L263 · public API

Преобразует queue error в стабильное представление для UI, сети или хранения.

- Параметры: `error`.

- Основные вызовы: `classifyQueueError`.

#### `errorToMessage` — L265–L274 · internal helper

Возвращает вычисленное значение error to message для использования внутри данного модуля.

- Параметры: `error`.

#### `readHttpStatus` — L276–L283 · internal helper

Получает http status из принадлежащего модулю источника данных.

- Параметры: `error`.

#### `readErrorCode` — L285–L291 · internal helper

Получает error code из принадлежащего модулю источника данных.

- Параметры: `error`.

#### `isAbortLikeError` — L293–L300 · internal helper

Проверяет условие abort like error и возвращает логический результат без изменения состояния.

- Параметры: `error`.

- Основные вызовы: `toLowerCase`.

#### Публичные типы, классы и константы

- `type QueueErrorKind` — L1
- `type ClassifiedQueueError` — L7
- `class QueueJobError` — L17

### `client/src/features/sync/queueStorage.ts`

Политики и jobs фоновой синхронизации: queue storage.

#### `promisifyRequest` — L30–L35 · internal helper

Возвращает вычисленное значение promisify request для использования внутри данного модуля.

- Параметры: `request`.

- Основные вызовы: `resolve`, `reject`.

#### `openTransaction` — L37–L43 · internal helper

Управляет состоянием transaction и соответствующей границей доступа.

- Параметры: `db`, `mode`.

- Основные вызовы: `transaction`, `objectStore`.

#### `addQueueJob` — L45–L51 · public API

Возвращает вычисленное значение queue job для использования внутри данного модуля.

- Параметры: `job`.

- Основные вызовы: `openAthenaLocalDb`, `openTransaction`, `promisifyRequest`, `add`.

#### `updateQueueJob` — L53–L59 · public API

Изменяет queue job, сохраняя инварианты данного модуля.

- Параметры: `job`.

- Основные вызовы: `openAthenaLocalDb`, `openTransaction`, `promisifyRequest`, `put`.

#### `getQueueJob` — L61–L67 · public API

Получает queue job из принадлежащего модулю источника данных.

- Параметры: `id`.

- Основные вызовы: `openAthenaLocalDb`, `openTransaction`, `promisifyRequest`, `get`.

#### `getQueueJobs` — L69–L74 · public API

Получает queue jobs из принадлежащего модулю источника данных.

- Основные вызовы: `openAthenaLocalDb`, `openTransaction`, `promisifyRequest`, `getAll`.

#### `getRunnableQueueJobs` — L76–L101 · public API

Получает runnable queue jobs из принадлежащего модулю источника данных.

- Параметры: `nowIso`.

- Основные вызовы: `toISOString`, `getQueueJobs`, `localeCompare`.

#### `recoverStaleRunningJobs` — L103–L132 · public API

Возвращает вычисленное значение stale running jobs для использования внутри данного модуля.

- Параметры: `lockTimeoutMs`.

- Основные вызовы: `getQueueJobs`, `now`, `getTime`, `isFinite`, `toISOString`, `updateQueueJob`, `push`.

#### `recoverSignalValidationJobs` — L134–L158 · public API

Возвращает вычисленное значение signal validation jobs для использования внутри данного модуля.

- Основные вызовы: `getQueueJobs`, `has`, `isSignalValidationError`, `toISOString`, `updateQueueJob`, `push`.

#### `countQueueJobsByStatus` — L160–L179 · public API

Детерминированно вычисляет queue jobs by status из входных данных.

- Основные вызовы: `getQueueJobs`.

#### `getLastQueueError` — L181–L189 · public API

Получает last queue error из принадлежащего модулю источника данных.

- Основные вызовы: `getQueueJobs`, `localeCompare`.

#### `getLatestQueueJobSummary` — L191–L211 · public API

Получает latest queue job summary из принадлежащего модулю источника данных.

- Основные вызовы: `getQueueJobs`, `localeCompare`, `readQueueJobReason`.

#### `replaceQueueJob` — L213–L215 · public API

Сохраняет replace queue job в принадлежащем модулю хранилище или read model.

- Параметры: `job`.

- Основные вызовы: `updateQueueJob`.

#### `findQueueJobByIdempotencyKey` — L217–L229 · public API

Выбирает queue job by idempotency key, удовлетворяющий ограничениям текущего сценария.

- Параметры: `idempotencyKey`.

- Основные вызовы: `getQueueJobs`, `has`.

#### `deleteQueueJob` — L231–L236 · public API

Удаляет или очищает queue job с необходимыми связанными действиями.

- Параметры: `id`.

- Основные вызовы: `openAthenaLocalDb`, `openTransaction`, `promisifyRequest`, `delete`.

#### `deleteQueueJobsByStatuses` — L238–L250 · public API

Удаляет или очищает queue jobs by statuses с необходимыми связанными действиями.

- Параметры: `statuses`.

- Основные вызовы: `getQueueJobs`, `has`, `deleteQueueJob`.

#### `compactQueueJobs` — L252–L301 · public API

Возвращает вычисленное значение compact queue jobs для использования внутри данного модуля.

- Основные вызовы: `getQueueJobs`, `now`, `getTime`, `isFinite`, `has`, `deleteQueueJob`, `localeCompare`.

#### `assertQueueCanAcceptJob` — L303–L321 · public API

Проверяет корректность queue can accept job и явно отклоняет нарушение контракта.

- Параметры: `priority`.

- Основные вызовы: `compactQueueJobs`, `getQueueJobs`, `has`.

#### `getQueueJobsByStatuses` — L323–L330 · public API

Получает queue jobs by statuses из принадлежащего модулю источника данных.

- Параметры: `statuses`.

- Основные вызовы: `getQueueJobs`, `has`.

#### `readQueueJobReason` — L332–L340 · internal helper

Получает queue job reason из принадлежащего модулю источника данных.

- Параметры: `payload`.

- Основные вызовы: `Array.isArray`.

#### `isSignalValidationError` — L342–L353 · internal helper

Проверяет условие signal validation error и возвращает логический результат без изменения состояния.

- Параметры: `error`.

- Основные вызовы: `toLowerCase`.

### `client/src/features/sync/queueTypes.ts`

Политики и jobs фоновой синхронизации: queue types.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `type QueueJobStatus` — L1
- `type QueueJobType` — L9
- `type EntryReprocessReason` — L14
- `type QueueJobSummary` — L20
- `type QueueJob` — L33
- `type QueueSnapshot` — L54
- `type QueueHandler` — L66
- `type QueueListener` — L71
- `type EntryQueuePayload` — L73
- `type EntrySyncQueuePayload` — L83

### `client/src/features/sync/reprocessPolicy.ts`

Политики и jobs фоновой синхронизации: reprocess policy.

#### `isRetryableProviderErrorCode` — L41–L43 · public API

Проверяет условие retryable provider error code и возвращает логический результат без изменения состояния.

- Параметры: `errorCode`.

- Основные вызовы: `has`.

#### `isMetricEmptySignal` — L45–L47 · public API

Проверяет условие metric empty signal и возвращает логический результат без изменения состояния.

- Параметры: `signal`.

#### `isMetricEmptySparseSignal` — L49–L51 · public API

Проверяет условие metric empty sparse signal и возвращает логический результат без изменения состояния.

- Параметры: `signal`.

- Основные вызовы: `isMetricEmptySignal`.

#### `hasCurrentSignalContract` — L53–L58 · public API

Проверяет условие current signal contract и возвращает логический результат без изменения состояния.

- Параметры: `metadata`.

#### `getSignalReprocessReason` — L60–L72 · public API

Получает signal reprocess reason из принадлежащего модулю источника данных.

- Параметры: `signal`, `metadata`, `explicitReason`.

- Основные вызовы: `normalizeEntryReprocessReason`, `isRetryableProviderErrorCode`, `isMetricEmptySparseSignal`.

#### `isSignalReprocessCandidate` — L74–L85 · public API

Проверяет условие signal reprocess candidate и возвращает логический результат без изменения состояния.

- Параметры: `signal`, `metadata`.

- Основные вызовы: `hasCurrentSignalContract`, `isFallbackReprocessCandidate`, `isSparseNoMetricsReprocessCandidate`, `isRetryableProviderErrorCode`.

#### `isFallbackReprocessCandidate` — L87–L96 · public API

Проверяет условие fallback reprocess candidate и возвращает логический результат без изменения состояния.

- Параметры: `signal`, `metadata`.

- Основные вызовы: `hasCurrentSignalContract`, `isRetryableProviderErrorCode`, `isTerminalCurrentFallbackErrorCode`.

#### `isSparseNoMetricsReprocessCandidate` — L98–L106 · public API

Проверяет условие sparse no metrics reprocess candidate и возвращает логический результат без изменения состояния.

- Параметры: `signal`, `metadata`.

- Основные вызовы: `isMetricEmptySparseSignal`, `hasCurrentSignalContract`, `isRetryableProviderErrorCode`.

#### `isTerminalCurrentFallbackErrorCode` — L108–L110 · internal helper

Проверяет условие terminal current fallback error code и возвращает логический результат без изменения состояния.

- Параметры: `errorCode`.

- Основные вызовы: `has`.

#### `createEntryReprocessPayload` — L112–L132 · public API

Создаёт entry reprocess payload из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `{ entryId, serverId, sourceTextHash, reason, }`.

- Основные вызовы: `toISOString`.

#### `createEntryReprocessJobIdempotencyKey` — L134–L144 · public API

Создаёт entry reprocess job idempotency key из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `{ entryId, sourceTextHash, reason, }`.

#### `planEntryReprocessJob` — L146–L201 · public API

Выводит entry reprocess job по явным правилам без скрытых побочных эффектов.

- Параметры: `job`, `entry`.

- Основные вызовы: `getPayloadRecord`, `readNonEmptyString`, `getSignalReprocessReason`.

#### `normalizeEntryReprocessReason` — L203–L212 · internal helper

Приводит entry reprocess reason к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `value`.

#### `getPayloadRecord` — L214–L218 · internal helper

Получает payload record из принадлежащего модулю источника данных.

- Параметры: `payload`.

- Основные вызовы: `Array.isArray`.

#### `readNonEmptyString` — L220–L222 · internal helper

Получает non empty string из принадлежащего модулю источника данных.

- Параметры: `value`.

#### Публичные типы, классы и константы

- `type EntryReprocessPlan` — L24

### `client/src/features/sync/syncQueue.ts`

Регистрирует обработчики durable queue и маршрутизирует jobs синхронизации, reprocess и self-report.

#### `registerSyncQueueHandlers` — L24–L48 · public API

Один раз связывает persisted job types с актуальными обработчиками entry sync, signal reprocess и self-report sync.

- Параметры: `settings`.

- Основные вызовы: `registerQueueHandler`, `handleEntryReprocessSignalJob`.

#### `handleEntryReprocessSignalJob` — L50–L89 · internal helper

Исполняет сценарий entry reprocess signal job и координирует его побочные эффекты.

- Параметры: `job`, `settings`, `signal`.

- Основные вызовы: `getEntryId`, `getLocalEntry`, `planEntryReprocessJob`, `reprocessLocalEntry`.

#### `getEntryId` — L91–L106 · internal helper

Получает entry id из принадлежащего модулю источника данных.

- Параметры: `job`.

- Основные вызовы: `Array.isArray`.

### `client/src/features/sync/useQueueWakeups.ts`

Политики и jobs фоновой синхронизации: use queue wakeups.

#### `useQueueWakeups` — L8–L38 · public API

Управляет React-состоянием, derived values и side effects для queue wakeups.

- Параметры: `{ enabled }`.

- Основные вызовы: `useEffect`, `wakeQueue`, `window.addEventListener`, `addEventListener`, `window.removeEventListener`, `removeEventListener`.

#### `wakeWhenOnline` — L12–L16 · nested helper в useQueueWakeups

Выполняет локальную операцию wake when online внутри ответственности этого файла.

- Основные вызовы: `wakeQueue`.

#### `wakeWhenFocused` — L18–L20 · nested helper в useQueueWakeups

Выполняет локальную операцию wake when focused внутри ответственности этого файла.

- Основные вызовы: `wakeQueue`.

#### `wakeWhenVisible` — L22–L26 · nested helper в useQueueWakeups

Выполняет локальную операцию wake when visible внутри ответственности этого файла.

- Основные вызовы: `wakeQueue`.

### `client/src/features/sync/useSyncQueue.ts`

Политики и jobs фоновой синхронизации: use sync queue.

#### `useSyncQueue` — L24–L73 · public API

Управляет React-состоянием, derived values и side effects для sync queue.

- Параметры: `{ extractionSettings }`.

- Основные вызовы: `useState`, `getQueueSnapshot`, `useQueueWakeups`, `useEffect`, `registerSyncQueueHandlers`, `wakeQueue`, `subscribeToQueue`, `setSnapshot`.

### `client/src/features/vault/appLock.ts`

React/API-адаптеры локального vault: app lock.

#### `getPrimaryVaultProfileId` — L24–L28 · public API

Получает primary vault profile id из принадлежащего модулю источника данных.

- Параметры: `credentials`.

#### `getProfileCredentials` — L30–L35 · public API

Получает profile credentials из принадлежащего модулю источника данных.

- Параметры: `credentials`, `profileId`.

- Основные вызовы: `getPrimaryVaultProfileId`.

#### `isAppProtectionEnabled` — L37–L49 · public API

Проверяет условие app protection enabled и возвращает логический результат без изменения состояния.

- Параметры: `credentials`.

- Основные вызовы: `getProfileCredentials`.

#### `getAppLockAutoLockPreference` — L51–L59 · public API

Получает app lock auto lock preference из принадлежащего модулю источника данных.

- Основные вызовы: `normalizeAutoLockPreference`, `getItem`.

#### `setAppLockAutoLockPreference` — L61–L73 · public API

Изменяет app lock auto lock preference, сохраняя инварианты данного модуля.

- Параметры: `value`.

- Основные вызовы: `setItem`, `window.dispatchEvent`.

#### `getAppLockAutoLockDelayMs` — L75–L79 · public API

Получает app lock auto lock delay ms из принадлежащего модулю источника данных.

- Параметры: `value`.

#### `normalizeAutoLockPreference` — L81–L95 · internal helper

Приводит auto lock preference к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `value`.

#### Публичные типы, классы и константы

- `type AppLockAutoLockPreference` — L3
- `const APP_LOCK_AUTO_LOCK_CHANGED_EVENT` — L10

### `client/src/features/vault/ui/VaultGate.tsx`

React/API-адаптеры локального vault: vault gate.

#### `VaultGate` — L27–L322 · public API

Рендерит React-компонент VaultGate и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ activeProfileId, error, isBusy, profiles, onCreateProfile, onSelectProfile, onUnlock, }`.

- Основные вызовы: `useI18n`, `useState`, `useRef`, `useEffect`, `contains`, `setIsProfileMenuOpen`, `setIsLanguageMenuOpen`, `addEventListener`.

#### `handlePointerDown` — L49–L59 · nested helper в VaultGate

Исполняет сценарий pointer down и координирует его побочные эффекты.

- Параметры: `event`.

- Основные вызовы: `contains`, `setIsProfileMenuOpen`, `setIsLanguageMenuOpen`.

#### `handleKeyDown` — L61–L66 · nested helper в VaultGate

Исполняет сценарий key down и координирует его побочные эффекты.

- Параметры: `event`.

- Основные вызовы: `setIsProfileMenuOpen`, `setIsLanguageMenuOpen`.

#### `handleSubmit` — L77–L96 · nested helper в VaultGate

Исполняет сценарий submit и координирует его побочные эффекты.

- Параметры: `event`.

- Основные вызовы: `preventDefault`, `setLocalError`, `t`, `onUnlock`, `composeVaultSecret`.

#### `handleLanguageSelect` — L98–L101 · nested helper в VaultGate

Исполняет сценарий language select и координирует его побочные эффекты.

- Параметры: `nextLanguage`.

- Основные вызовы: `setLanguage`, `setIsLanguageMenuOpen`.

#### `formatVaultError` — L324–L338 · internal helper

Преобразует vault error в стабильное представление для UI, сети или хранения.

- Параметры: `error`, `t`.

- Основные вызовы: `t`.

### `client/src/features/vault/useLocalVault.ts`

React/API-адаптеры локального vault: use local vault.

#### `toUserMessage` — L25–L41 · internal helper

Возвращает вычисленное значение to user message для использования внутри данного модуля.

- Параметры: `error`.

#### `useLocalVault` — L43–L202 · public API

Управляет React-состоянием, derived values и side effects для local vault.

- Основные вызовы: `useState`, `getVaultStatus`, `getVaultCredentialSummaries`, `useEffect`, `subscribeVault`, `setPhase`, `setCredentials`, `useCallback`.

#### Публичные типы, классы и константы

- `type LocalVaultPhase` — L18
- `type LocalVaultError` — L19

### `client/src/features/vault/vault.ts`

React/API-адаптеры локального vault: vault.

#### `getVaultStatus` — L72–L75 · public API

Получает vault status из принадлежащего модулю источника данных.

- Основные вызовы: `readVaultConfig`.

#### `isVaultConfigured` — L77–L79 · public API

Проверяет условие vault configured и возвращает логический результат без изменения состояния.

- Основные вызовы: `Boolean`, `readVaultConfig`.

#### `isVaultUnlocked` — L81–L83 · public API

Проверяет условие vault unlocked и возвращает логический результат без изменения состояния.

- Основные вызовы: `Boolean`.

#### `getVaultCredentialSummaries` — L85–L97 · public API

Получает vault credential summaries из принадлежащего модулю источника данных.

- Основные вызовы: `readVaultConfig`.

#### `subscribeVault` — L99–L106 · public API

Возвращает вычисленное значение vault для использования внутри данного модуля.

- Параметры: `listener`.

- Основные вызовы: `add`, `listener`, `getVaultStatus`, `delete`.

#### `setupVault` — L108–L128 · public API

Изменяет up vault, сохраняя инварианты данного модуля.

- Параметры: `passphrase`, `profileId`.

- Основные вызовы: `isVaultConfigured`, `assertUsablePassphrase`, `createVaultConfigForPassphrase`, `toISOString`, `setItem`, `getVaultConfigKey`, `emitVaultStatus`.

#### `setupVaultWithoutSecret` — L130–L144 · public API

Изменяет up vault without secret, сохраняя инварианты данного модуля.

- Параметры: `profileId`.

- Основные вызовы: `isVaultConfigured`, `createVaultConfigWithoutSecret`, `toISOString`, `setItem`, `getVaultConfigKey`, `emitVaultStatus`.

#### `unlockVault` — L146–L163 · public API

Управляет состоянием vault и соответствующей границей доступа.

- Параметры: `passphrase`.

- Основные вызовы: `readVaultConfig`, `assertUsablePassphrase`, `unlockVaultKeyFromConfig`, `emitVaultStatus`.

#### `unlockVaultWithoutSecret` — L165–L182 · public API

Управляет состоянием vault without secret и соответствующей границей доступа.

- Параметры: `profileId`.

- Основные вызовы: `readVaultConfig`, `unlockVaultKeyFromPasswordlessConfig`, `emitVaultStatus`.

#### `rotateVaultSecret` — L184–L233 · public API

Выполняет локальную операцию rotate vault secret внутри ответственности этого файла.

- Параметры: `input`.

- Основные вызовы: `readVaultConfig`, `assertUsablePassphrase`, `findCredentialForSecret`, `createVaultCredential`, `toISOString`, `setItem`, `getVaultConfigKey`, `emitVaultStatus`.

#### `addVaultCredential` — L235–L277 · public API

Выполняет локальную операцию vault credential внутри ответственности этого файла.

- Параметры: `input`.

- Основные вызовы: `readVaultConfig`, `assertUsablePassphrase`, `findCredentialForSecret`, `createVaultCredential`, `toISOString`, `setItem`, `getVaultConfigKey`, `emitVaultStatus`.

#### `deleteVaultCredential` — L279–L345 · public API

Удаляет или очищает vault credential с необходимыми связанными действиями.

- Параметры: `input`.

- Основные вызовы: `readVaultConfig`, `assertUsablePassphrase`, `findCredentialForSecret`, `createVaultPasswordlessCredential`, `toISOString`, `setItem`, `getVaultConfigKey`, `emitVaultStatus`.

#### `lockVault` — L347–L350 · public API

Управляет состоянием vault и соответствующей границей доступа.

- Основные вызовы: `emitVaultStatus`.

#### `encryptVaultJson` — L352–L357 · public API

Выполняет криптографическое преобразование vault json в рамках локальной privacy boundary.

- Параметры: `value`, `associatedData`.

- Основные вызовы: `encryptVaultJsonWithKey`, `requireVaultKey`.

#### `decryptVaultJson` — L359–L364 · public API

Выполняет криптографическое преобразование vault json в рамках локальной privacy boundary.

- Параметры: `payload`, `associatedData`.

- Основные вызовы: `decryptVaultJsonWithKey`, `requireVaultKey`.

#### `createVaultConfigForPassphrase` — L366–L390 · public API

Создаёт vault config for passphrase из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `passphrase`, `createdAt`, `dataKey`, `profileId`, `label`.

- Основные вызовы: `toISOString`, `generateDataKey`, `createVaultCredential`.

#### `createVaultConfigWithoutSecret` — L392–L412 · public API

Создаёт vault config without secret из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `profileId`, `createdAt`, `dataKey`.

- Основные вызовы: `toISOString`, `generateDataKey`, `createVaultPasswordlessCredential`.

#### `unlockVaultKeyFromConfig` — L414–L422 · public API

Управляет состоянием vault key from config и соответствующей границей доступа.

- Параметры: `config`, `passphrase`.

- Основные вызовы: `assertValidVaultConfig`, `then`, `findCredentialForSecret`.

#### `unlockVaultKeyFromPasswordlessConfig` — L424–L432 · public API

Управляет состоянием vault key from passwordless config и соответствующей границей доступа.

- Параметры: `config`, `profileId`.

- Основные вызовы: `assertValidVaultConfig`, `then`, `findPasswordlessCredential`.

#### `findCredentialForSecret` — L434–L450 · internal helper

Выбирает credential for secret, удовлетворяющий ограничениям текущего сценария.

- Параметры: `config`, `passphrase`.

- Основные вызовы: `assertValidVaultConfig`, `unlockVaultKeyFromCredential`.

#### `findPasswordlessCredential` — L452–L478 · internal helper

Выбирает passwordless credential, удовлетворяющий ограничениям текущего сценария.

- Параметры: `config`, `profileId`.

- Основные вызовы: `assertValidVaultConfig`, `normalizeProfileId`, `unlockVaultKeyFromCredential`, `getPasswordlessSecret`.

#### `unlockVaultKeyFromCredential` — L480–L502 · internal helper

Управляет состоянием vault key from credential и соответствующей границей доступа.

- Параметры: `credential`, `passphrase`.

- Основные вызовы: `deriveVaultKey`, `decryptVaultJsonWithKey`, `importRawKey`, `decodeBase64Url`.

#### `createVaultCredential` — L504–L547 · internal helper

Создаёт vault credential из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `{ createdAt, dataKey, kind = "passphrase", label, profileId, secret, }`.

- Основные вызовы: `getRandomValues`, `getCrypto`, `encodeBase64Url`, `deriveVaultKey`, `encryptVaultJsonWithKey`, `exportRawKey`, `createCredentialId`, `normalizeProfileId`.

#### `createVaultPasswordlessCredential` — L549–L568 · internal helper

Создаёт vault passwordless credential из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `{ createdAt, dataKey, profileId, }`.

- Основные вызовы: `normalizeProfileId`, `createVaultCredential`, `getPasswordlessSecret`.

#### `getPasswordlessSecret` — L570–L572 · internal helper

Получает passwordless secret из принадлежащего модулю источника данных.

- Параметры: `profileId`.

- Основные вызовы: `normalizeProfileId`.

#### `normalizeProfileId` — L574–L576 · internal helper

Приводит profile id к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `profileId`.

#### `normalizeCredentialLabel` — L578–L580 · internal helper

Приводит credential label к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `label`.

#### `createCredentialId` — L582–L585 · internal helper

Создаёт credential id из переданных данных, не отдавая вызывающему коду детали сборки.

- Основные вызовы: `getCrypto`, `randomUUID`, `now`, `Math.random`.

#### `readVaultConfig` — L587–L599 · internal helper

Получает vault config из принадлежащего модулю источника данных.

- Основные вызовы: `getVaultConfigKey`, `getItem`, `assertValidVaultConfig`.

#### `getVaultConfigKey` — L601–L603 · internal helper

Получает vault config key из принадлежащего модулю источника данных.

- Основные вызовы: `getProfileScopedStorageKey`.

#### `requireVaultKey` — L605–L611 · internal helper

Возвращает вычисленное значение require vault key для использования внутри данного модуля.

#### `assertValidVaultConfig` — L613–L637 · internal helper

Проверяет корректность valid vault config и явно отклоняет нарушение контракта.

- Параметры: `config`.

- Основные вызовы: `Array.isArray`, `assertValidVaultCredential`, `has`, `add`.

#### `assertValidVaultCredential` — L639–L664 · internal helper

Проверяет корректность valid vault credential и явно отклоняет нарушение контракта.

- Параметры: `credential`.

- Основные вызовы: `isInteger`, `assertValidVaultPayload`.

#### `emitVaultStatus` — L666–L672 · internal helper

Выполняет локальную операцию vault status внутри ответственности этого файла.

- Основные вызовы: `getVaultStatus`, `listener`.

#### Публичные типы, классы и константы

- `type VaultCredentialKind` — L41
- `type VaultCredential` — L43
- `type VaultCredentialSummary` — L54
- `type VaultConfig` — L59
- `type VaultStatus` — L65

### `client/src/features/vault/vaultApi.ts`

React/API-адаптеры локального vault: vault api.

Именованных функций нет: файл служит re-export границей.

### `client/src/features/vault/vaultCrypto.ts`

Низкоуровневые Web Crypto primitives без React и продуктовой оркестрации.

#### `encryptVaultJsonWithKey` — L25–L49 · public API

Выполняет криптографическое преобразование vault json with key в рамках локальной privacy boundary.

- Параметры: `key`, `value`, `associatedData`.

- Основные вызовы: `getRandomValues`, `getCrypto`, `encode`, `encrypt`, `toArrayBuffer`, `encodeAssociatedData`, `encodeBase64Url`.

#### `decryptVaultJsonWithKey` — L51–L69 · public API

Выполняет криптографическое преобразование vault json with key в рамках локальной privacy boundary.

- Параметры: `key`, `payload`, `associatedData`.

- Основные вызовы: `assertValidVaultPayload`, `decrypt`, `getCrypto`, `toArrayBuffer`, `decodeBase64Url`, `encodeAssociatedData`, `decode`.

#### `isVaultEncryptedPayload` — L71–L80 · public API

Проверяет условие vault encrypted payload и возвращает логический результат без изменения состояния.

- Параметры: `value`.

#### `deriveVaultKey` — L82–L113 · public API

Возвращает вычисленное значение derive vault key для использования внутри данного модуля.

- Параметры: `passphrase`, `kdf`.

- Основные вызовы: `importKey`, `getCrypto`, `toArrayBuffer`, `encode`, `deriveKey`, `decodeBase64Url`.

#### `generateDataKey` — L115–L124 · public API

Создаёт data key из переданных данных, не отдавая вызывающему коду детали сборки.

- Основные вызовы: `generateKey`, `getCrypto`.

#### `exportRawKey` — L126–L128 · public API

Возвращает вычисленное значение export raw key для использования внутри данного модуля.

- Параметры: `key`.

- Основные вызовы: `exportKey`, `getCrypto`.

#### `importRawKey` — L130–L141 · public API

Возвращает вычисленное значение import raw key для использования внутри данного модуля.

- Параметры: `rawKey`.

- Основные вызовы: `importKey`, `getCrypto`, `toArrayBuffer`.

#### `assertUsablePassphrase` — L143–L147 · public API

Проверяет корректность usable passphrase и явно отклоняет нарушение контракта.

- Параметры: `passphrase`.

#### `assertValidVaultPayload` — L149–L159 · public API

Проверяет корректность valid vault payload и явно отклоняет нарушение контракта.

- Параметры: `payload`.

- Основные вызовы: `isVaultEncryptedPayload`.

#### `encodeAssociatedData` — L161–L163 · internal helper

Возвращает вычисленное значение encode associated data для использования внутри данного модуля.

- Параметры: `value`.

- Основные вызовы: `encode`.

#### `encodeBase64Url` — L165–L176 · public API

Возвращает вычисленное значение encode base64 url для использования внутри данного модуля.

- Параметры: `bytes`.

- Основные вызовы: `fromCharCode`, `replace`, `btoa`.

#### `decodeBase64Url` — L178–L192 · public API

Возвращает вычисленное значение decode base64 url для использования внутри данного модуля.

- Параметры: `value`.

- Основные вызовы: `replace`, `padEnd`, `atob`, `charCodeAt`.

#### `toArrayBuffer` — L194–L198 · internal helper

Возвращает вычисленное значение to array buffer для использования внутри данного модуля.

- Параметры: `bytes`.

- Основные вызовы: `set`.

#### `getCrypto` — L200–L206 · public API

Получает crypto из принадлежащего модулю источника данных.

#### Публичные типы, классы и константы

- `const VAULT_KDF_ITERATIONS` — L5
- `const VAULT_SALT_BYTES` — L7
- `type VaultKdfConfig` — L11
- `type VaultEncryptedPayload` — L17

### `client/src/features/vault/vaultProfiles.ts`

React/API-адаптеры локального vault: vault profiles.

#### `composeVaultSecret` — L25–L34 · public API

Создаёт vault secret из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `{ passphrase, profileId, }`.

#### `getVaultProfiles` — L36–L49 · public API

Получает vault profiles из принадлежащего модулю источника данных.

- Основные вызовы: `getItem`, `normalizeVaultProfiles`.

#### `setVaultProfiles` — L51–L59 · public API

Изменяет vault profiles, сохраняя инварианты данного модуля.

- Параметры: `profiles`.

- Основные вызовы: `normalizeVaultProfiles`, `setItem`.

#### `getActiveVaultProfileId` — L61–L72 · public API

Получает active vault profile id из принадлежащего модулю источника данных.

- Основные вызовы: `getVaultProfiles`, `normalizeText`, `getItem`.

#### `setActiveVaultProfileId` — L74–L86 · public API

Изменяет active vault profile id, сохраняя инварианты данного модуля.

- Параметры: `profileId`.

- Основные вызовы: `normalizeText`, `getVaultProfiles`, `setItem`.

#### `createVaultProfile` — L88–L100 · public API

Создаёт vault profile из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `profile`.

- Основные вызовы: `normalizeText`, `createProfileId`, `normalizeProfileName`, `toUpperCase`, `createProfileMark`.

#### `addVaultProfile` — L102–L106 · public API

Возвращает вычисленное значение vault profile для использования внутри данного модуля.

- Параметры: `profile`.

- Основные вызовы: `getVaultProfiles`, `createVaultProfile`, `setVaultProfiles`.

#### `renameVaultProfile` — L108–L127 · public API

Возвращает вычисленное значение rename vault profile для использования внутри данного модуля.

- Параметры: `profileId`, `name`.

- Основные вызовы: `normalizeText`, `normalizeProfileName`, `getVaultProfiles`, `setVaultProfiles`, `createProfileMark`.

#### `deleteVaultProfile` — L129–L153 · public API

Удаляет или очищает vault profile с необходимыми связанными действиями.

- Параметры: `profileId`.

- Основные вызовы: `normalizeText`, `getVaultProfiles`, `getActiveVaultProfileId`, `setVaultProfiles`, `setActiveVaultProfileId`.

#### `getProfileScopedStorageKey` — L155–L159 · public API

Получает profile scoped storage key из принадлежащего модулю источника данных.

- Параметры: `key`, `profileId`.

- Основные вызовы: `getActiveVaultProfileId`.

#### `getProfileScopedDatabaseName` — L161–L168 · public API

Получает profile scoped database name из принадлежащего модулю источника данных.

- Параметры: `name`, `profileId`.

- Основные вызовы: `getActiveVaultProfileId`.

#### `isDefaultVaultProfile` — L170–L172 · public API

Проверяет условие default vault profile и возвращает логический результат без изменения состояния.

- Параметры: `profileId`.

- Основные вызовы: `normalizeText`.

#### `normalizeVaultProfiles` — L174–L193 · internal helper

Приводит vault profiles к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `value`.

- Основные вызовы: `Array.isArray`, `normalizeVaultProfile`, `Boolean`, `has`, `add`.

#### `normalizeVaultProfile` — L195–L207 · internal helper

Приводит vault profile к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `profile`.

- Основные вызовы: `normalizeText`, `toUpperCase`, `createProfileMark`.

#### `normalizeText` — L209–L211 · internal helper

Приводит text к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `value`, `maxLength`.

#### `normalizeProfileName` — L213–L215 · internal helper

Приводит profile name к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `value`.

- Основные вызовы: `normalizeText`.

#### `createProfileMark` — L217–L219 · internal helper

Создаёт profile mark из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `name`.

- Основные вызовы: `toUpperCase`.

#### `createProfileId` — L221–L224 · internal helper

Создаёт profile id из переданных данных, не отдавая вызывающему коду детали сборки.

- Основные вызовы: `crypto.randomUUID`, `now`, `Math.random`.

#### Публичные типы, классы и константы

- `type VaultProfile` — L1
- `type VaultSecretInput` — L8
- `const DEFAULT_VAULT_PROFILES` — L16

### `client/src/i18n/i18nContext.ts`

Интернационализация интерфейса: i18n context.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `type I18nContextValue` — L7
- `const I18nContext` — L13

### `client/src/i18n/I18nProvider.tsx`

Интернационализация интерфейса: i18n provider.

#### `I18nProvider` — L18–L49 · public API

Рендерит React-компонент I18nProvider и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ children }`.

- Основные вызовы: `useState`, `readStoredLanguage`, `useCallback`, `setLanguageState`, `setItem`, `getLanguageStorageKey`, `translateMessage`, `useEffect`.

#### `readStoredLanguage` — L51–L58 · internal helper

Получает stored language из принадлежащего модулю источника данных.

- Основные вызовы: `getItem`, `getLanguageStorageKey`, `isSupportedLanguage`.

#### `getLanguageStorageKey` — L60–L62 · internal helper

Получает language storage key из принадлежащего модулю источника данных.

- Основные вызовы: `getProfileScopedStorageKey`.

### `client/src/i18n/languages.ts`

Интернационализация интерфейса: languages.

#### `isSupportedLanguage` — L16–L18 · public API

Проверяет условие supported language и возвращает логический результат без изменения состояния.

- Параметры: `value`.

#### `detectBrowserLanguage` — L20–L31 · public API

Возвращает вычисленное значение browser language для использования внутри данного модуля.

- Основные вызовы: `split`, `toLowerCase`, `isSupportedLanguage`.

#### Публичные типы, классы и константы

- `const SUPPORTED_LANGUAGES` — L1
- `type Language` — L3
- `const DEFAULT_LANGUAGE` — L5
- `const LANGUAGE_LABELS` — L7
- `const LANGUAGE_STORAGE_KEY` — L14

### `client/src/i18n/messages.ts`

Интернационализация интерфейса: messages.

#### `translateMessage` — L1119–L1129 · public API

Возвращает вычисленное значение translate message для использования внутри данного модуля.

- Параметры: `language`, `key`, `values`.

- Основные вызовы: `replace`, `String`.

#### Публичные типы, классы и константы

- `const en` — L3
- `type MessageKey` — L288
- `const messages` — L1112

### `client/src/i18n/useI18n.ts`

Интернационализация интерфейса: use i18n.

#### `useI18n` — L4–L12 · public API

Управляет React-состоянием, derived values и side effects для i18n.

- Основные вызовы: `useContext`.

### `client/src/main.tsx`

Точка запуска React-клиента: подключает стили, i18n, корневой App и service worker.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.

### `client/src/platform/storage/athenaDb.ts`

Единственная точка владения IndexedDB schema, object stores и profile-scoped соединением.

#### `openAthenaLocalDb` — L17–L31 · public API

Управляет состоянием athena local db и соответствующей границей доступа.

- Основные вызовы: `getProfileScopedDatabaseName`, `open`, `initializeSchema`, `resolve`, `reject`.

#### `deleteCurrentAthenaDatabase` — L33–L37 · public API

Удаляет или очищает current athena database с необходимыми связанными действиями.

- Основные вызовы: `getProfileScopedDatabaseName`, `closeConnection`, `deleteDatabase`.

#### `deleteAthenaDatabaseForProfile` — L39–L49 · public API

Удаляет или очищает athena database for profile с необходимыми связанными действиями.

- Параметры: `profileId`.

- Основные вызовы: `getProfileScopedDatabaseName`, `closeConnection`, `deleteDatabase`.

#### `idbRequest` — L51–L56 · public API

Возвращает вычисленное значение idb request для использования внутри данного модуля.

- Параметры: `request`.

- Основные вызовы: `resolve`, `reject`.

#### `initializeSchema` — L58–L101 · internal helper

Выполняет локальную операцию initialize schema внутри ответственности этого файла.

- Параметры: `db`.

- Основные вызовы: `contains`, `createObjectStore`, `createIndex`.

#### `closeConnection` — L103–L109 · internal helper

Управляет состоянием connection и соответствующей границей доступа.

- Параметры: `databaseName`.

- Основные вызовы: `catch`, `close`.

#### `deleteDatabase` — L111–L119 · internal helper

Удаляет или очищает database с необходимыми связанными действиями.

- Параметры: `databaseName`.

- Основные вызовы: `deleteDatabase`, `resolve`, `reject`.

#### Публичные типы, классы и константы

- `const ATHENA_LOCAL_DB_NAME` — L3
- `const ACTIVITY_INSIGHT_STORE` — L6
- `const ENTRY_STORE` — L7
- `const DRAFT_STORE` — L8
- `const QUEUE_JOBS_STORE` — L9
- `const SELF_REPORT_STORE` — L10
- `const SELF_REPORT_DAILY_AGGREGATES_STORE` — L11

### `client/src/shared/contracts.ts`

Действительно общая клиентская инфраструктура и примитивы: contracts.

Именованных функций нет: файл служит re-export границей.

### `client/src/shared/http/httpClient.ts`

Общие HTTP-механизмы: CSRF, auth-required event и типизированные ошибки.

#### `jsonHeaders` — L22–L24 · public API

Возвращает вычисленное значение json headers для использования внутри данного модуля.

#### `csrfJsonHeaders` — L26–L28 · public API

Возвращает вычисленное значение csrf json headers для использования внутри данного модуля.

- Основные вызовы: `jsonHeaders`, `csrfHeaders`.

#### `csrfHeaders` — L30–L33 · public API

Возвращает вычисленное значение csrf headers для использования внутри данного модуля.

- Основные вызовы: `readBrowserCookie`.

#### `createApiHttpError` — L35–L45 · public API

Создаёт api http error из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `response`, `prefix`.

- Основные вызовы: `text`, `classifyHttpErrorCode`.

#### `handleUnauthorized` — L47–L50 · public API

Исполняет сценарий unauthorized и координирует его побочные эффекты.

- Параметры: `response`.

- Основные вызовы: `window.dispatchEvent`.

#### `readBrowserCookie` — L52–L68 · internal helper

Получает browser cookie из принадлежащего модулю источника данных.

- Параметры: `name`.

- Основные вызовы: `split`, `startsWith`, `decodeURIComponent`.

#### `classifyHttpErrorCode` — L70–L75 · internal helper

Возвращает вычисленное значение classify http error code для использования внутри данного модуля.

- Параметры: `status`.

#### Публичные типы, классы и константы

- `const SERVER_AUTH_REQUIRED_EVENT` — L6
- `class ApiHttpError` — L10

### `client/src/shared/lib/dates.ts`

Действительно общая клиентская инфраструктура и примитивы: dates.

#### `todayDateOnly` — L10–L12 · public API

Возвращает вычисленное значение today date only для использования внутри данного модуля.

- Основные вызовы: `toDateOnly`.

#### `formatLongDate` — L14–L20 · public API

Преобразует long date в стабильное представление для UI, сети или хранения.

- Параметры: `dateOnly`, `language`.

- Основные вызовы: `toLocaleDateString`, `parseDateOnly`, `getLocale`.

#### `formatShortDate` — L22–L27 · public API

Преобразует short date в стабильное представление для UI, сети или хранения.

- Параметры: `dateOnly`, `language`.

- Основные вызовы: `toLocaleDateString`, `parseDateOnly`, `getLocale`.

#### `getLocale` — L29–L31 · public API

Получает locale из принадлежащего модулю источника данных.

- Параметры: `language`.

#### `toDateOnly` — L33–L39 · internal helper

Возвращает вычисленное значение to date only для использования внутри данного модуля.

- Параметры: `date`.

- Основные вызовы: `getFullYear`, `padStart`, `String`, `getMonth`, `getDate`.

#### `parseDateOnly` — L41–L44 · internal helper

Разбирает date only и преобразует вход в типизированное представление.

- Параметры: `dateOnly`.

- Основные вызовы: `split`.

### `client/src/shared/lib/offline.ts`

Действительно общая клиентская инфраструктура и примитивы: offline.

#### `getOnlineStatus` — L3–L5 · public API

Получает online status из принадлежащего модулю источника данных.

#### `useOnlineStatus` — L7–L29 · public API

Управляет React-состоянием, derived values и side effects для online status.

- Основные вызовы: `useState`, `getOnlineStatus`, `useEffect`, `setIsOnline`, `window.addEventListener`, `window.removeEventListener`.

#### `handleOnline` — L11–L13 · nested helper в useOnlineStatus

Исполняет сценарий online и координирует его побочные эффекты.

- Основные вызовы: `setIsOnline`.

#### `handleOffline` — L15–L17 · nested helper в useOnlineStatus

Исполняет сценарий offline и координирует его побочные эффекты.

- Основные вызовы: `setIsOnline`.

### `client/src/shared/lib/serviceWorker.ts`

Действительно общая клиентская инфраструктура и примитивы: service worker.

#### `clearAthenaAppShell` — L9–L28 · public API

Удаляет или очищает athena app shell с необходимыми связанными действиями.

- Параметры: `environment`.

- Основные вызовы: `Promise.all`, `unregisterAthenaServiceWorkers`, `deleteAthenaAppShellCaches`.

#### `registerServiceWorker` — L30–L60 · public API

Оркестрирует service worker в инфраструктуре синхронизации или фоновой очереди.

- Основные вызовы: `catch`, `clearAthenaAppShell`, `then`, `register`, `console.error`, `window.addEventListener`.

#### `register` — L43–L52 · nested helper в registerServiceWorker

Оркестрирует register в инфраструктуре синхронизации или фоновой очереди.

- Основные вызовы: `catch`, `then`, `register`, `console.error`.

#### `unregisterAthenaServiceWorkers` — L62–L78 · internal helper

Выполняет локальную операцию unregister athena service workers внутри ответственности этого файла.

- Параметры: `serviceWorker`, `origin`.

- Основные вызовы: `getRegistrations`, `Promise.all`, `unregister`.

#### `deleteAthenaAppShellCaches` — L80–L94 · internal helper

Удаляет или очищает athena app shell caches с необходимыми связанными действиями.

- Параметры: `cacheStorage`.

- Основные вызовы: `keys`, `Promise.all`, `startsWith`, `delete`.

### `client/src/shared/lib/text.ts`

Действительно общая клиентская инфраструктура и примитивы: text.

#### `excerpt` — L1–L7 · public API

Возвращает вычисленное значение excerpt для использования внутри данного модуля.

- Параметры: `text`, `maxLength`.

- Основные вызовы: `replace`, `trimEnd`.

#### `extractTags` — L9–L14 · public API

Извлекает tags из входных данных без самостоятельного сохранения результата.

- Параметры: `text`.

- Основные вызовы: `match`, `toLowerCase`, `Array.from`.

## Server runtime: функции

### `server/app.ts`

Собирает Express middleware и API routers, затем раздаёт собранный frontend.

#### `createApp` — L24–L51 · public API

Строит Express application в безопасном порядке: parsing, public config/auth, optional auth+CSRF ring, protected API, error handling и static client.

- Основные вызовы: `express`, `disable`, `use`, `json`, `static`, `get`, `sendFile`.

#### HTTP routes

- `GET * (L46)`

### `server/config/constants.ts`

Конфигурация backend: constants.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `const ENTRY_STATUSES` — L1
- `const SIGNAL_QUALITIES` — L9
- `type EntryStatusValue` — L15
- `type SignalQualityValue` — L16

### `server/config/env.ts`

Конфигурация backend: env.

#### `isServerAuthRequired` — L23–L25 · public API

Проверяет условие server auth required и возвращает логический результат без изменения состояния.

- Основные вызовы: `parseBoolean`.

#### `parseBoolean` — L27–L43 · internal helper

Разбирает boolean и преобразует вход в типизированное представление.

- Параметры: `value`, `fallback`.

- Основные вызовы: `toLowerCase`.

#### Публичные типы, классы и константы

- `const PROJECT_ROOT` — L4
- `const DATA_DIR` — L8
- `const DATABASE_PATH` — L12
- `const CLIENT_DIST_DIR` — L16
- `const HOST` — L20
- `const PORT` — L21

### `server/config/load-env.ts`

Конфигурация backend: load env.

#### `loadEnvFile` — L20–L40 · internal helper

Получает env file из принадлежащего модулю источника данных.

- Основные вызовы: `existsSync`, `split`, `readFileSync`, `startsWith`, `indexOf`, `unquote`, `Object.hasOwn`.

#### `unquote` — L42–L51 · internal helper

Возвращает вычисленное значение unquote для использования внутри данного модуля.

- Параметры: `value`.

- Основные вызовы: `startsWith`, `endsWith`.

### `server/config/versions.ts`

Конфигурация backend: versions.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `const ACTIVE_SCHEMA_VERSION` — L7
- `const ACTIVE_PROMPT_VERSION` — L8
- `const ACTIVE_MODEL` — L10
- `const DEFAULT_OLLAMA_MODEL` — L11
- `const DEFAULT_GEMINI_MODEL` — L12

### `server/core/types.ts`

Доменные схемы, типы и чистые mapper-функции backend: types.

Именованных функций нет: файл служит re-export границей.
#### Публичные типы, классы и константы

- `type EntryRow` — L49
- `type EntryView` — L60
- `type SignalRow` — L73
- `type EffectiveSignalRow` — L99
- `type AnalyticsWindow` — L125
- `type ServerSelfReportDailyAggregate` — L127

### `server/db/migrate.ts`

SQLite bootstrap и миграции: migrate.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.

### `server/db/migration-runner.ts`

Планирует, проверяет и атомарно применяет SQL-миграции с integrity checks.

#### `loadMigrationPlan` — L20–L47 · public API

Получает migration plan из принадлежащего модулю источника данных.

- Параметры: `migrationsDir`.

- Основные вызовы: `readdir`, `endsWith`, `exec`, `basename`, `Number`, `validateMigrationPlan`.

#### `runMigrations` — L49–L108 · public API

Проверяет план и применяет ещё не выполненные SQL-миграции транзакционно с записью checksum/history.

- Параметры: `{ db, logger = console, migrationsDir, }`.

- Основные вызовы: `loadMigrationPlan`, `exec`, `get`, `log`, `readFile`, `run`, `toISOString`, `verifyAppliedMigrations`.

#### `runMigrationIntegrityChecks` — L110–L124 · public API

Исполняет сценарий migration integrity checks и координирует его побочные эффекты.

- Параметры: `db`.

- Основные вызовы: `get`, `all`.

#### `validateMigrationPlan` — L126–L155 · internal helper

Проверяет корректность migration plan и явно отклоняет нарушение контракта.

- Параметры: `plan`.

- Основные вызовы: `has`, `padStart`, `add`.

#### `verifyAppliedMigrations` — L157–L171 · internal helper

Проверяет корректность applied migrations и явно отклоняет нарушение контракта.

- Параметры: `db`, `plan`.

- Основные вызовы: `get`.

#### Публичные типы, классы и константы

- `type MigrationPlanItem` — L7
- `type MigrationLogger` — L14

### `server/db/sqlite.ts`

Открывает SQLite и сериализует write transactions.

#### `getDb` — L13–L26 · public API

Получает db из принадлежащего модулю источника данных.

- Основные вызовы: `mkdir`, `dirname`, `open`, `exec`.

#### `withDbWriteTransaction` — L28–L56 · public API

Возвращает вычисленное значение with db write transaction для использования внутри данного модуля.

- Параметры: `db`, `callback`.

- Основные вызовы: `exec`, `callback`, `catch`, `console.error`, `releaseLock`.

#### Публичные типы, классы и константы

- `type AthenaDb` — L7
- `type DbWriteTransaction` — L8

### `server/modules/analytics/analytics.route.ts`

Вертикальный backend-модуль analytics: analytics route.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### HTTP routes

- `GET /analytics/v2/summary (L8)`

### `server/modules/analytics/analyticsCollections.ts`

Вертикальный backend-модуль analytics: analytics collections.

#### `parseJsonArray` — L8–L21 · public API

Разбирает json array и преобразует вход в типизированное представление.

- Параметры: `value`.

- Основные вызовы: `Array.isArray`, `String`.

#### `compareContextItems` — L23–L32 · public API

Сравнивает context items для стабильного детерминированного порядка.

- Параметры: `left`, `right`.

- Основные вызовы: `localeCompare`.

#### `compareMarkerItems` — L34–L44 · public API

Сравнивает marker items для стабильного детерминированного порядка.

- Параметры: `left`, `right`.

- Основные вызовы: `markerPriority`, `localeCompare`.

#### `isSelfReportAxis` — L46–L50 · public API

Проверяет условие self report axis и возвращает логический результат без изменения состояния.

- Параметры: `axis`.

#### `uniqueSorted` — L52–L54 · public API

Возвращает вычисленное значение unique sorted для использования внутри данного модуля.

- Параметры: `values`.

- Основные вызовы: `Array.from`.

#### `present` — L56–L58 · public API

Возвращает вычисленное значение present для использования внутри данного модуля.

- Параметры: `value`.

#### `areSameStrings` — L60–L65 · public API

Возвращает вычисленное значение are same strings для использования внутри данного модуля.

- Параметры: `left`, `right`.

### `server/modules/analytics/analyticsDates.ts`

Вертикальный backend-модуль analytics: analytics dates.

#### `buildWindow` — L6–L12 · public API

Создаёт window из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `kind`, `start`, `end`.

- Основные вызовы: `daysBetween`.

#### `assertDateRange` — L14–L18 · public API

Проверяет корректность date range и явно отклоняет нарушение контракта.

- Параметры: `from`, `to`.

- Основные вызовы: `isDateOnly`.

#### `isDateInRange` — L20–L22 · public API

Проверяет условие date in range и возвращает логический результат без изменения состояния.

- Параметры: `date`, `from`, `to`.

#### `eachDateInRange` — L24–L33 · public API

Возвращает вычисленное значение each date in range для использования внутри данного модуля.

- Параметры: `from`, `to`.

- Основные вызовы: `parseDateOnly`, `push`, `formatDateOnly`, `setUTCDate`, `getUTCDate`.

#### `subtractDays` — L35–L39 · public API

Возвращает вычисленное значение subtract days для использования внутри данного модуля.

- Параметры: `dateOnly`, `days`.

- Основные вызовы: `parseDateOnly`, `setUTCDate`, `getUTCDate`, `formatDateOnly`.

#### `isDateOnly` — L41–L43 · internal helper

Проверяет условие date only и возвращает логический результат без изменения состояния.

- Параметры: `value`.

- Основные вызовы: `test`.

#### `daysBetween` — L45–L49 · internal helper

Возвращает вычисленное значение days between для использования внутри данного модуля.

- Параметры: `from`, `to`.

- Основные вызовы: `getTime`, `parseDateOnly`.

#### `parseDateOnly` — L51–L54 · internal helper

Разбирает date only и преобразует вход в типизированное представление.

- Параметры: `value`.

- Основные вызовы: `split`, `UTC`.

#### `formatDateOnly` — L56–L58 · internal helper

Преобразует date only в стабильное представление для UI, сети или хранения.

- Параметры: `date`.

- Основные вызовы: `toISOString`.

### `server/modules/analytics/analyticsStatistics.ts`

Вертикальный backend-модуль analytics: analytics statistics.

#### `calculateTrendSlope` — L3–L22 · public API

Детерминированно вычисляет trend slope из входных данных.

- Параметры: `values`.

- Основные вызовы: `flatMap`, `calculateAverage`.

#### `calculateSuddenDelta` — L24–L34 · public API

Детерминированно вычисляет sudden delta из входных данных.

- Параметры: `values`.

- Основные вызовы: `numericValues`, `calculateAverage`.

#### `pairSeries` — L36–L50 · public API

Возвращает вычисленное значение pair series для использования внутри данного модуля.

- Параметры: `leftValues`, `rightValues`.

- Основные вызовы: `flatMap`, `get`.

#### `calculatePearsonCorrelation` — L52–L72 · public API

Детерминированно вычисляет pearson correlation из входных данных.

- Параметры: `pairs`.

- Основные вызовы: `calculateAverage`, `Math.sqrt`.

#### `calculateAverage` — L74–L78 · public API

Детерминированно вычисляет average из входных данных.

- Параметры: `values`.

#### `calculateSampleStandardDeviation` — L80–L90 · public API

Детерминированно вычисляет sample standard deviation из входных данных.

- Параметры: `values`.

- Основные вызовы: `calculateAverage`, `Math.sqrt`.

#### `numericValues` — L92–L94 · public API

Возвращает вычисленное значение numeric values для использования внутри данного модуля.

- Параметры: `values`.

- Основные вызовы: `flatMap`.

#### `normalizeScore` — L96–L98 · public API

Приводит score к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `value`.

- Основные вызовы: `isFinite`.

#### `isScore` — L100–L102 · public API

Проверяет условие score и возвращает логический результат без изменения состояния.

- Параметры: `value`.

- Основные вызовы: `isFinite`.

#### `roundRatio` — L104–L106 · public API

Ограничивает ratio допустимым диапазоном или точностью.

- Параметры: `value`.

- Основные вызовы: `roundNumber`.

#### `roundNullable` — L108–L110 · public API

Ограничивает nullable допустимым диапазоном или точностью.

- Параметры: `value`.

- Основные вызовы: `roundNumber`.

#### `roundNumber` — L112–L115 · public API

Ограничивает number допустимым диапазоном или точностью.

- Параметры: `value`.

- Основные вызовы: `Number`, `toFixed`, `Object.is`.

#### Публичные типы, классы и константы

- `type DateValue` — L1

### `server/modules/analytics/analyticsV2.repository.ts`

Вертикальный backend-модуль analytics: analytics v2 repository.

#### `getLatestAnalyticsV2Date` — L80–L89 · public API

Получает latest analytics v2 date из принадлежащего модулю источника данных.

- Параметры: `db`.

- Основные вызовы: `get`.

#### `getAnalyticsV2RowsInRange` — L91–L101 · public API

Получает analytics v2 rows in range из принадлежащего модулю источника данных.

- Параметры: `db`, `{ from, to }`.

- Основные вызовы: `Promise.all`, `getEntrySignalRowsInRange`, `getSelfReportAggregateRowsInRange`.

#### `getEntrySignalRowsInRange` — L103–L111 · internal helper

Получает entry signal rows in range из принадлежащего модулю источника данных.

- Параметры: `db`, `{ from, to }`.

- Основные вызовы: `all`.

#### `getSelfReportAggregateRowsInRange` — L113–L132 · internal helper

Получает self report aggregate rows in range из принадлежащего модулю источника данных.

- Параметры: `db`, `{ from, to }`.

- Основные вызовы: `all`.

#### Публичные типы, классы и константы

- `type AnalyticsV2EntrySignalRow` — L12
- `type AnalyticsV2SelfReportAggregateRow` — L29
- `type AnalyticsV2RangeRows` — L38
- `const ANALYTICS_V2_ENTRY_SIGNAL_ROWS_IN_RANGE_SQL` — L43

### `server/modules/analytics/analyticsV2.service.ts`

Композиция Analytics V2 поверх отдельных date, statistics, collection и repository модулей.

#### `buildAnalyticsV2Overview` — L142–L168 · public API

Создаёт analytics v2 overview из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `db`.

- Основные вызовы: `getLatestAnalyticsV2Date`, `noDataResponse`, `Promise.all`, `buildAnalyticsV2Summary`, `subtractDays`.

#### `buildAnalyticsV2Summary` — L170–L245 · public API

Создаёт analytics v2 summary из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `db`, `{ from, kind, to }`.

- Основные вызовы: `assertDateRange`, `subtractDays`, `getAnalyticsV2RowsInRange`, `normalizeEntryRows`, `normalizeSelfReportRows`, `isDateInRange`, `noDataResponse`, `eachDateInRange`.

#### `noDataResponse` — L247–L252 · internal helper

Возвращает вычисленное значение no data response для использования внутри данного модуля.

#### `normalizeEntryRows` — L254–L277 · internal helper

Приводит entry rows к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `rows`.

- Основные вызовы: `parseJsonArray`, `normalizeScore`.

#### `normalizeSelfReportRows` — L279–L296 · internal helper

Приводит self report rows к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `rows`.

- Основные вызовы: `flatMap`, `isSelfReportAxis`.

#### `buildAxes` — L298–L343 · internal helper

Создаёт axes из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `{ baselineDates, baselineEntries, baselineSelfReports, currentDates, currentEntries, currentSelfReports, extractedComparisonBlocked, }`.

- Основные вызовы: `buildExtractedSeries`, `buildAxisSummary`, `buildSelfReportSeries`.

#### `buildAxisSummary` — L345–L413 · internal helper

Создаёт axis summary из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `{ baseline, comparisonBlocked, current, source, }`.

- Основные вызовы: `numericValues`, `calculateAverage`, `getBaselineQuality`, `calculateSampleStandardDeviation`, `Math.max`, `calculateTrendSlope`, `calculateSuddenDelta`, `buildAxisUncertainty`.

#### `buildExtractedSeries` — L415–L446 · internal helper

Создаёт extracted series из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `entries`, `dates`, `axis`.

- Основные вызовы: `isScore`, `get`, `push`, `set`, `calculateAverage`.

#### `buildSelfReportSeries` — L448–L481 · internal helper

Создаёт self report series из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `aggregates`, `dates`, `axis`.

- Основные вызовы: `isScore`, `get`, `set`.

#### `buildAxisUncertainty` — L483–L509 · internal helper

Создаёт axis uncertainty из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `{ baselineInvalidSampleSeen, baselineQuality, comparisonBlocked, currentInvalidSampleSeen, currentSampleDays, }`.

- Основные вызовы: `push`.

#### `buildDensity` — L511–L554 · internal helper

Создаёт density из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `entries`, `currentDates`.

- Основные вызовы: `has`, `Math.max`, `roundRatio`.

#### `buildVersions` — L556–L588 · internal helper

Создаёт versions из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `{ baselineEntries, baselineSelfReports, currentEntries, currentSelfReports, }`.

- Основные вызовы: `buildVersionSet`, `areSameStrings`, `uniqueSorted`.

#### `buildVersionSet` — L590–L606 · internal helper

Создаёт version set из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `entries`, `selfReports`.

- Основные вызовы: `uniqueSorted`, `flatMap`, `present`.

#### `buildContext` — L608–L635 · internal helper

Создаёт context из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `entries`.

- Основные вызовы: `buildCountItems`.

#### `buildCountItems` — L637–L668 · internal helper

Создаёт count items из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `entries`, `selectValues`, `compareItems`.

- Основные вызовы: `selectValues`, `get`, `add`, `set`, `Array.from`, `values`.

#### `buildAssociations` — L670–L707 · internal helper

Создаёт associations из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `currentSeries`.

- Основные вызовы: `pairSeries`, `calculatePearsonCorrelation`, `push`, `roundNullable`, `getAssociationDirection`, `getAssociationStrength`.

#### `buildQuality` — L709–L763 · internal helper

Создаёт quality из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `{ axes, currentEntries, density, versions, }`.

- Основные вызовы: `Object.values`, `add`, `getQualityGrade`, `Array.from`, `getQualityReason`.

#### `getQualityGrade` — L765–L811 · internal helper

Получает quality grade из принадлежащего модулю источника данных.

- Параметры: `{ density, relevantAxes, versions, }`.

#### `getQualityReason` — L813–L834 · internal helper

Получает quality reason из принадлежащего модулю источника данных.

- Параметры: `{ currentEntries, density, grade, relevantAxes, versions, }`.

#### `getBaselineQuality` — L836–L841 · internal helper

Получает baseline quality из принадлежащего модулю источника данных.

- Параметры: `sampleDays`.

#### `getDirection` — L843–L847 · internal helper

Получает direction из принадлежащего модулю источника данных.

- Параметры: `value`.

- Основные вызовы: `Math.abs`.

#### `getTrendDirection` — L849–L853 · internal helper

Получает trend direction из принадлежащего модулю источника данных.

- Параметры: `value`.

- Основные вызовы: `Math.abs`.

#### `getVolatilityDirection` — L855–L861 · internal helper

Получает volatility direction из принадлежащего модулю источника данных.

- Параметры: `value`.

- Основные вызовы: `Math.abs`.

#### `getAssociationDirection` — L863–L869 · internal helper

Получает association direction из принадлежащего модулю источника данных.

- Параметры: `correlation`.

- Основные вызовы: `Math.abs`.

#### `getAssociationStrength` — L871–L880 · internal helper

Получает association strength из принадлежащего модулю источника данных.

- Параметры: `correlation`.

- Основные вызовы: `Math.abs`.

### `server/modules/analytics/analyticsV2.types.ts`

Вертикальный backend-модуль analytics: analytics v2 types.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `const ANALYTICS_V2_VERSION` — L1
- `const EXTRACTED_ANALYTICS_AXES` — L3
- `const SELF_REPORT_ANALYTICS_AXES` — L4
- `const ANALYTICS_V2_AXES` — L11
- `type ExtractedAnalyticsAxis` — L16
- `type SelfReportAnalyticsAxis` — L17
- `type AnalyticsV2Axis` — L19
- `type AnalyticsV2WindowKind` — L21
- `type AnalyticsV2AxisSource` — L22
- `type AnalyticsV2BaselineQuality` — L23
- `type AnalyticsV2Direction` — L28
- `type AnalyticsV2TrendDirection` — L29
- `type AnalyticsV2VolatilityDirection` — L34
- `type AnalyticsV2QualityGrade` — L39
- `type AnalyticsV2QualityReason` — L44
- `type AnalyticsV2NoDataReason` — L50
- `type AnalyticsV2AssociationDirection` — L51
- `type AnalyticsV2AssociationStrength` — L56
- `type AnalyticsV2Window` — L62
- `type AnalyticsV2Density` — L69
- `type AnalyticsV2AxisSummary` — L81
- `type AnalyticsV2ContextItem` — L102
- `type AnalyticsV2Context` — L108
- `type AnalyticsV2Quality` — L120
- `type AnalyticsV2Versions` — L126
- `type AnalyticsV2Association` — L143
- `type AnalyticsV2Summary` — L153
- `type AnalyticsV2WindowResponse` — L165
- `type AnalyticsV2Overview` — L170

### `server/modules/auth/auth.middleware.ts`

Вертикальный backend-модуль owner auth: auth middleware.

#### `requireAuth` — L24–L47 · public API

Выполняет локальную операцию require auth внутри ответственности этого файла.

- Параметры: `req`, `res`, `next`.

- Основные вызовы: `isServerAuthRequired`, `next`, `authenticateRequest`, `json`, `status`.

#### `requireProtectedApiAuth` — L49–L65 · public API

Выполняет локальную операцию require protected api auth внутри ответственности этого файла.

- Параметры: `req`, `res`, `next`.

- Основные вызовы: `isServerAuthRequired`, `next`, `isProtectedApiPath`, `requireAuth`.

#### `requireProtectedApiCsrf` — L67–L83 · public API

Выполняет локальную операцию require protected api csrf внутри ответственности этого файла.

- Параметры: `req`, `res`, `next`.

- Основные вызовы: `isServerAuthRequired`, `next`, `isProtectedApiPath`, `has`, `requireCsrf`.

#### `requireCsrf` — L85–L109 · public API

Выполняет локальную операцию require csrf внутри ответственности этого файла.

- Параметры: `req`, `res`, `next`.

- Основные вызовы: `isServerAuthRequired`, `next`, `get`, `json`, `status`, `verifyCsrfToken`.

#### `readCookie` — L111–L115 · public API

Получает cookie из принадлежащего модулю источника данных.

- Параметры: `req`, `name`.

- Основные вызовы: `parseCookieHeader`, `get`.

#### `setAuthCookies` — L117–L140 · public API

Изменяет auth cookies, сохраняя инварианты данного модуля.

- Параметры: `res`, `input`.

- Основные вызовы: `isProduction`, `cookie`.

#### `clearAuthCookies` — L142–L157 · public API

Удаляет или очищает auth cookies с необходимыми связанными действиями.

- Параметры: `res`.

- Основные вызовы: `isProduction`, `clearCookie`.

#### `authenticateRequest` — L159–L163 · internal helper

Возвращает вычисленное значение authenticate request для использования внутри данного модуля.

- Параметры: `req`.

- Основные вызовы: `getDb`, `authenticateSessionToken`, `readCookie`.

#### `isProtectedApiPath` — L165–L169 · internal helper

Проверяет условие protected api path и возвращает логический результат без изменения состояния.

- Параметры: `pathname`.

- Основные вызовы: `startsWith`.

#### `parseCookieHeader` — L171–L189 · internal helper

Разбирает cookie header и преобразует вход в типизированное представление.

- Параметры: `header`.

- Основные вызовы: `Object.fromEntries`, `split`, `indexOf`, `decodeCookieValue`.

#### `decodeCookieValue` — L191–L197 · internal helper

Возвращает вычисленное значение decode cookie value для использования внутри данного модуля.

- Параметры: `value`.

- Основные вызовы: `decodeURIComponent`.

#### `isProduction` — L199–L201 · internal helper

Проверяет условие production и возвращает логический результат без изменения состояния.

#### Публичные типы, классы и константы

- `const SESSION_COOKIE_NAME` — L10
- `const CSRF_COOKIE_NAME` — L11

### `server/modules/auth/auth.repository.ts`

Вертикальный backend-модуль owner auth: auth repository.

#### `countAuthUsers` — L30–L36 · public API

Детерминированно вычисляет auth users из входных данных.

- Параметры: `db`.

- Основные вызовы: `get`.

#### `createAuthUser` — L38–L55 · public API

Создаёт auth user из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `db`, `input`.

- Основные вызовы: `run`, `getAuthUserById`.

#### `getAuthUserById` — L57–L71 · public API

Получает auth user by id из принадлежащего модулю источника данных.

- Параметры: `db`, `id`.

- Основные вызовы: `get`.

#### `getAuthUserByUsername` — L73–L87 · public API

Получает auth user by username из принадлежащего модулю источника данных.

- Параметры: `db`, `username`.

- Основные вызовы: `get`.

#### `createAuthSession` — L89–L122 · public API

Создаёт auth session из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `db`, `input`.

- Основные вызовы: `run`, `getAuthSessionById`.

#### `getAuthSessionById` — L124–L146 · public API

Получает auth session by id из принадлежащего модулю источника данных.

- Параметры: `db`, `id`.

- Основные вызовы: `get`.

#### `getActiveAuthSessionByTokenHash` — L148–L174 · public API

Получает active auth session by token hash из принадлежащего модулю источника данных.

- Параметры: `db`, `tokenHash`.

- Основные вызовы: `get`.

#### `touchAuthSession` — L176–L190 · public API

Изменяет auth session, сохраняя инварианты данного модуля.

- Параметры: `db`, `sessionId`, `now`.

- Основные вызовы: `run`.

#### `updateAuthSessionCsrfTokenHash` — L192–L210 · public API

Изменяет auth session csrf token hash, сохраняя инварианты данного модуля.

- Параметры: `db`, `input`.

- Основные вызовы: `run`.

#### `revokeAuthSessionByTokenHash` — L212–L229 · public API

Удаляет или очищает auth session by token hash с необходимыми связанными действиями.

- Параметры: `db`, `input`.

- Основные вызовы: `run`.

#### Публичные типы, классы и константы

- `type AuthUserRole` — L3
- `type AuthUserRow` — L5
- `type AuthSessionRow` — L14
- `type AuthSessionWithUserRow` — L25

### `server/modules/auth/auth.route.ts`

Вертикальный backend-модуль owner auth: auth route.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### HTTP routes

- `GET /auth/me (L26)`
- `POST /auth/setup (L77)`
- `POST /auth/login (L124)`
- `POST /auth/logout (L171)`

### `server/modules/auth/auth.schema.ts`

Вертикальный backend-модуль owner auth: auth schema.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `const setupOwnerSchema` — L12
- `const loginSchema` — L19
- `type SetupOwnerInput` — L21
- `type LoginInput` — L22

### `server/modules/auth/auth.service.ts`

Вертикальный backend-модуль owner auth: auth service.

#### `isFirstRunSetupRequired` — L43–L45 · public API

Проверяет условие first run setup required и возвращает логический результат без изменения состояния.

- Параметры: `db`.

- Основные вызовы: `countAuthUsers`.

#### `setupOwner` — L47–L66 · public API

Изменяет up owner, сохраняя инварианты данного модуля.

- Параметры: `db`, `input`.

- Основные вызовы: `withDbWriteTransaction`, `countAuthUsers`, `toISOString`, `hashPassword`, `createAuthUser`, `createSessionForUser`.

#### `login` — L68–L81 · public API

Возвращает вычисленное значение login для использования внутри данного модуля.

- Параметры: `db`, `input`.

- Основные вызовы: `getAuthUserByUsername`, `verifyPassword`, `withDbWriteTransaction`, `createSessionForUser`, `toISOString`.

#### `authenticateSessionToken` — L83–L115 · public API

Возвращает вычисленное значение authenticate session token для использования внутри данного модуля.

- Параметры: `db`, `sessionToken`.

- Основные вызовы: `hashToken`, `getActiveAuthSessionByTokenHash`, `toISOString`, `revokeAuthSessionByTokenHash`, `touchAuthSession`.

#### `ensureCsrfToken` — L117–L138 · public API

Возвращает вычисленное значение ensure csrf token для использования внутри данного модуля.

- Параметры: `db`, `auth`, `presentedToken`.

- Основные вызовы: `verifyTokenHash`, `generateToken`, `toISOString`, `updateAuthSessionCsrfTokenHash`, `hashToken`.

#### `logout` — L140–L152 · public API

Выполняет локальную операцию logout внутри ответственности этого файла.

- Параметры: `db`, `sessionToken`.

- Основные вызовы: `revokeAuthSessionByTokenHash`, `hashToken`, `toISOString`.

#### `verifyCsrfToken` — L154–L159 · public API

Проверяет корректность csrf token и явно отклоняет нарушение контракта.

- Параметры: `csrfToken`, `expectedHash`.

- Основные вызовы: `Boolean`, `verifyTokenHash`.

#### `hashToken` — L161–L163 · public API

Проверяет условие token и возвращает логический результат без изменения состояния.

- Параметры: `token`.

- Основные вызовы: `digest`, `update`, `crypto.createHash`.

#### `hashPassword` — L165–L167 · internal helper

Проверяет условие password и возвращает логический результат без изменения состояния.

- Параметры: `password`.

- Основные вызовы: `hash`.

#### `verifyPassword` — L169–L175 · internal helper

Проверяет корректность password и явно отклоняет нарушение контракта.

- Параметры: `hash`, `password`.

- Основные вызовы: `verify`.

#### `createSessionForUser` — L177–L211 · internal helper

Создаёт session for user из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `db`, `user`, `now`.

- Основные вызовы: `generateToken`, `toISOString`, `parse`, `createAuthSession`, `hashToken`.

#### `generateToken` — L213–L215 · internal helper

Создаёт token из переданных данных, не отдавая вызывающему коду детали сборки.

- Основные вызовы: `crypto.randomBytes`.

#### `verifyTokenHash` — L217–L222 · internal helper

Проверяет корректность token hash и явно отклоняет нарушение контракта.

- Параметры: `token`, `expectedHash`.

- Основные вызовы: `from`, `hashToken`, `crypto.timingSafeEqual`.

#### Публичные типы, классы и константы

- `type AuthUserView` — L27
- `type AuthenticatedSession` — L33
- `type CreatedAuthSession` — L38

### `server/modules/entries/entries.route.ts`

Вертикальный backend-модуль entries и signal persistence: entries route.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### HTTP routes

- `GET /entries (L21)`
- `GET /entries/:id (L30)`
- `POST /entries (L46)`
- `PATCH /entries/:id (L74)`
- `DELETE /entries/:id (L100)`
- `POST /entries/:id/signals (L116)`

### `server/modules/entries/entry.repository.ts`

Вертикальный backend-модуль entries и signal persistence: entry repository.

#### `createEntry` — L72–L101 · public API

Создаёт entry из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `db`, `entry`.

- Основные вызовы: `run`.

#### `listEntries` — L103–L148 · public API

Получает entries из принадлежащего модулю источника данных.

- Параметры: `db`.

- Основные вызовы: `all`.

#### `getEntryById` — L150–L203 · public API

Получает entry by id из принадлежащего модулю источника данных.

- Параметры: `db`, `id`.

- Основные вызовы: `get`, `mapEntryRow`.

#### `updateEntry` — L205–L231 · public API

Изменяет entry, сохраняя инварианты данного модуля.

- Параметры: `db`, `entryId`, `entry`.

- Основные вызовы: `run`.

#### `deleteEntry` — L233–L243 · public API

Удаляет или очищает entry с необходимыми связанными действиями.

- Параметры: `db`, `entryId`.

- Основные вызовы: `run`.

#### `updateEntryStatus` — L245–L259 · public API

Изменяет entry status, сохраняя инварианты данного модуля.

- Параметры: `db`, `entryId`, `status`.

- Основные вызовы: `run`, `toISOString`.

#### `markEntryFailed` — L261–L266 · public API

Изменяет entry failed, сохраняя инварианты данного модуля.

- Параметры: `db`, `entryId`.

- Основные вызовы: `updateEntryStatus`.

#### `mapEntryRow` — L268–L324 · internal helper

Преобразует или объединяет entry row по правилам домена.

- Параметры: `row`.

- Основные вызовы: `createDefaultSignalContext`, `parseStringArray`, `parseArray`, `parseRecord`, `createEmptyMetricConfidence`.

#### `parseStringArray` — L326–L329 · internal helper

Разбирает string array и преобразует вход в типизированное представление.

- Параметры: `value`.

- Основные вызовы: `Array.isArray`.

#### `parseArray` — L331–L338 · internal helper

Разбирает array и преобразует вход в типизированное представление.

- Параметры: `value`.

- Основные вызовы: `Array.isArray`.

#### `parseRecord` — L340–L352 · internal helper

Разбирает record и преобразует вход в типизированное представление.

- Параметры: `value`, `fallback`.

- Основные вызовы: `Array.isArray`.

### `server/modules/entries/entry.schema.ts`

Вертикальный backend-модуль entries и signal persistence: entry schema.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `const createEntrySchema` — L5
- `const updateEntrySchema` — L14

### `server/modules/entries/entry.service.ts`

Вертикальный backend-модуль entries и signal persistence: entry service.

#### `createEntry` — L60–L117 · public API

Создаёт entry из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `db`, `input`.

- Основные вызовы: `toISOString`, `normalizeClientSignal`, `normalizeSignalMetadata`, `getFinalStatus`, `withDbWriteTransaction`, `getEntryByIdRepository`, `createEntryRepository`, `insertSignalRow`.

#### `listEntries` — L119–L121 · public API

Получает entries из принадлежащего модулю источника данных.

- Параметры: `db`.

- Основные вызовы: `listEntriesRepository`.

#### `getEntryById` — L123–L128 · public API

Получает entry by id из принадлежащего модулю источника данных.

- Параметры: `db`, `id`.

- Основные вызовы: `getEntryByIdRepository`.

#### `appendEntrySignal` — L130–L174 · public API

Возвращает вычисленное значение append entry signal для использования внутри данного модуля.

- Параметры: `db`, `entryIdOrClientId`, `input`.

- Основные вызовы: `getEntryByIdRepository`, `toISOString`, `normalizeClientSignal`, `normalizeSignalMetadata`, `getFinalStatus`, `withDbWriteTransaction`, `insertSignalRow`, `run`.

#### `updateEntry` — L176–L219 · public API

Изменяет entry, сохраняя инварианты данного модуля.

- Параметры: `db`, `entryIdOrClientId`, `input`.

- Основные вызовы: `getEntryByIdRepository`, `toISOString`, `normalizeClientSignal`, `normalizeSignalMetadata`, `getFinalStatus`, `withDbWriteTransaction`, `updateEntryRepository`, `insertSignalRow`.

#### `deleteEntry` — L221–L232 · public API

Удаляет или очищает entry с необходимыми связанными действиями.

- Параметры: `db`, `entryIdOrClientId`.

- Основные вызовы: `getEntryByIdRepository`, `withDbWriteTransaction`, `deleteEntryRepository`.

#### `normalizeClientSignal` — L234–L246 · internal helper

Приводит client signal к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `signal`.

- Основные вызовы: `isClientFallbackSignal`, `createFallbackSignal`, `sanitizeSignalCandidate`.

#### `normalizeSignalMetadata` — L248–L256 · internal helper

Приводит signal metadata к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `metadata`.

#### `getFinalStatus` — L258–L260 · internal helper

Получает final status из принадлежащего модулю источника данных.

- Параметры: `signal`.

### `server/modules/entries/signal.repository.ts`

Вертикальный backend-модуль entries и signal persistence: signal repository.

#### `hasSignalForEntryHash` — L34–L51 · public API

Проверяет условие signal for entry hash и возвращает логический результат без изменения состояния.

- Параметры: `db`, `entryId`, `sourceTextHash`.

- Основные вызовы: `get`, `Boolean`.

#### `getSignalStatusForEntryHash` — L53–L73 · public API

Получает signal status for entry hash из принадлежащего модулю источника данных.

- Параметры: `db`, `entryId`, `sourceTextHash`.

- Основные вызовы: `get`.

#### `insertSignalAndFinalizeEntry` — L75–L113 · public API

Сохраняет insert signal and finalize entry в принадлежащем модулю хранилище или read model.

- Параметры: `db`, `{ entryId, sourceTextHash, signal, finalStatus, schemaVersion, promptVersion, provider = "ollama", model, errorCode = null, createdAt, }`.

- Основные вызовы: `withDbWriteTransaction`, `insertSignalRow`, `run`.

#### `insertSignalRow` — L115–L181 · public API

Сохраняет insert signal row в принадлежащем модулю хранилище или read model.

- Параметры: `db`, `{ entryId, sourceTextHash, signal, schemaVersion, promptVersion, provider = "ollama", model, errorCode = null, createdAt, }`.

- Основные вызовы: `run`.

### `server/modules/exports/export.service.ts`

Вертикальный backend-модуль metadata export: export service.

#### `buildBackendMetadataExport` — L7–L47 · public API

Создаёт backend metadata export из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `db`.

- Основные вызовы: `Promise.all`, `all`, `get`, `toISOString`.

### `server/modules/exports/exports.route.ts`

Вертикальный backend-модуль metadata export: exports route.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### HTTP routes

- `GET /exports/backend-metadata (L8)`

### `server/modules/extraction/extraction.schema.ts`

Вертикальный backend-модуль extraction и signal contracts: extraction schema.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `const extractionProviderSchema` — L8
- `const extractionRequestSchema` — L10
- `const signalMetadataPayloadSchema` — L18
- `const appendSignalSchema` — L27

### `server/modules/extraction/extraction.service.ts`

Вертикальный backend-модуль extraction и signal contracts: extraction service.

#### `getExtractionOptions` — L192–L226 · public API

Получает extraction options из принадлежащего модулю источника данных.

- Основные вызовы: `normalizeProvider`, `defaultModelForProvider`, `unique`, `Boolean`.

#### `getExtractionStatus` — L228–L265 · public API

Получает extraction status из принадлежащего модулю источника данных.

- Параметры: `{ provider, model }`.

- Основные вызовы: `normalizeProvider`, `normalizeModel`, `availableStatus`, `unavailableStatus`, `getOllamaBaseUrl`, `requestJson`, `trimTrailingSlash`, `Array.isArray`.

#### `extractSignal` — L267–L315 · public API

Извлекает signal из входных данных без самостоятельного сохранения результата.

- Параметры: `{ text, provider, model, entry_date, captured_at, }`.

- Основные вызовы: `normalizeProvider`, `normalizeModel`, `analyzeSignalContext`, `createFallbackResult`, `requestGeminiExtraction`, `requestOllamaExtraction`, `sanitizeSignalCandidate`, `createSignalMetadata`.

#### `normalizeProvider` — L317–L324 · internal helper

Приводит provider к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `provider`.

- Основные вызовы: `isExtractionProvider`.

#### `normalizeModel` — L326–L329 · internal helper

Приводит model к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `provider`, `model`.

- Основные вызовы: `defaultModelForProvider`.

#### `defaultModelForProvider` — L331–L335 · internal helper

Возвращает вычисленное значение default model for provider для использования внутри данного модуля.

- Параметры: `provider`.

#### `requestOllamaExtraction` — L337–L363 · internal helper

Выполняет внешний запрос для ollama extraction и нормализует результат или ошибку.

- Параметры: `rawText`, `model`.

- Основные вызовы: `getOllamaBaseUrl`, `isLocalOllamaUrl`, `requestJson`, `trimTrailingSlash`, `Number`, `buildExtractionMessages`, `getRecordValue`, `extractJson`.

#### `requestGeminiExtraction` — L365–L410 · internal helper

Выполняет внешний запрос для gemini extraction и нормализует результат или ошибку.

- Параметры: `rawText`, `model`.

- Основные вызовы: `requestJson`, `encodeURIComponent`, `Number`, `buildSystemInstruction`, `buildUserExtractionPrompt`, `readGeminiText`, `extractJson`.

#### `requestJson` — L412–L439 · internal helper

Выполняет внешний запрос для json и нормализует результат или ошибку.

- Параметры: `url`, `{ method = "GET", headers = {}, body, timeoutMs }`.

- Основные вызовы: `setTimeout`, `abort`, `fetch`, `text`, `json`, `clearTimeout`.

#### `buildExtractionMessages` — L441–L452 · internal helper

Создаёт extraction messages из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `rawText`.

- Основные вызовы: `buildSystemInstruction`, `buildUserExtractionPrompt`.

#### `buildSystemInstruction` — L454–L485 · internal helper

Создаёт system instruction из переданных данных, не отдавая вызывающему коду детали сборки.

#### `buildUserExtractionPrompt` — L487–L608 · internal helper

Создаёт user extraction prompt из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `rawText`.

#### `createSignalMetadata` — L610–L623 · internal helper

Создаёт signal metadata из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `provider`, `model`, `errorCode`.

- Основные вызовы: `toISOString`.

#### `createFallbackResult` — L625–L638 · internal helper

Создаёт fallback result из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `provider`, `model`, `errorCode`, `context`.

- Основные вызовы: `analyzeSignalContext`, `createFallbackSignal`, `createSignalMetadata`.

#### `classifyProviderError` — L640–L661 · internal helper

Возвращает вычисленное значение classify provider error для использования внутри данного модуля.

- Параметры: `error`, `provider`.

- Основные вызовы: `String`.

#### `availableStatus` — L663–L673 · internal helper

Возвращает вычисленное значение available status для использования внутри данного модуля.

- Параметры: `provider`, `model`.

#### `unavailableStatus` — L675–L686 · internal helper

Возвращает вычисленное значение unavailable status для использования внутри данного модуля.

- Параметры: `provider`, `model`, `reason`.

#### `extractJson` — L688–L697 · internal helper

Извлекает json из входных данных без самостоятельного сохранения результата.

- Параметры: `text`.

- Основные вызовы: `indexOf`, `lastIndexOf`.

#### `getOllamaBaseUrl` — L699–L701 · internal helper

Получает ollama base url из принадлежащего модулю источника данных.

#### `trimTrailingSlash` — L703–L705 · internal helper

Возвращает вычисленное значение trim trailing slash для использования внутри данного модуля.

- Параметры: `value`.

- Основные вызовы: `replace`, `String`.

#### `isLocalOllamaUrl` — L707–L714 · internal helper

Проверяет условие local ollama url и возвращает логический результат без изменения состояния.

- Параметры: `value`.

#### `unique` — L716–L718 · internal helper

Возвращает вычисленное значение unique для использования внутри данного модуля.

- Параметры: `values`.

- Основные вызовы: `Array.from`.

#### `isExtractionProvider` — L720–L722 · internal helper

Проверяет условие extraction provider и возвращает логический результат без изменения состояния.

- Параметры: `value`.

- Основные вызовы: `Object.values`.

#### `isRecord` — L724–L726 · internal helper

Проверяет условие record и возвращает логический результат без изменения состояния.

- Параметры: `value`.

#### `getRecordValue` — L728–L730 · internal helper

Получает record value из принадлежащего модулю источника данных.

- Параметры: `value`, `key`.

- Основные вызовы: `isRecord`.

#### `readGeminiText` — L732–L745 · internal helper

Получает gemini text из принадлежащего модулю источника данных.

- Параметры: `data`.

- Основные вызовы: `getRecordValue`, `Array.isArray`.

#### Публичные типы, классы и константы

- `const EXTRACTION_PROVIDERS` — L64

### `server/modules/extraction/extractions.route.ts`

Вертикальный backend-модуль extraction и signal contracts: extractions route.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### HTTP routes

- `GET /extractions/config (L15)`
- `GET /extractions/status (L19)`
- `POST /extractions (L31)`

### `server/modules/extraction/markers.ts`

Вертикальный backend-модуль extraction и signal contracts: markers.

#### `markerLabel` — L56–L58 · public API

Изменяет er label, сохраняя инварианты данного модуля.

- Параметры: `marker`.

#### `markerPriority` — L60–L62 · public API

Изменяет er priority, сохраняя инварианты данного модуля.

- Параметры: `marker`.

#### Публичные типы, классы и константы

- `const MARKERS` — L1
- `type Marker` — L22
- `const MARKER_LABELS` — L24

### `server/modules/extraction/sanitization.service.ts`

Вертикальный backend-модуль extraction и signal contracts: sanitization service.

#### `sanitizeSignalCandidate` — L23–L54 · public API

Приводит sanitize signal candidate к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `candidate`.

- Основные вызовы: `safeParse`, `mapSignalCandidate`, `alignActivityContexts`.

#### `createFallbackSignal` — L56–L90 · public API

Создаёт fallback signal из переданных данных, не отдавая вызывающему коду детали сборки.

- Основные вызовы: `createDefaultSignalContext`, `createEmptyMetricConfidence`, `safeParse`, `toISOString`.

#### `isClientFallbackSignal` — L92–L94 · public API

Проверяет условие client fallback signal и возвращает логический результат без изменения состояния.

- Параметры: `value`.

- Основные вызовы: `safeParse`.

#### `alignActivityContexts` — L96–L113 · internal helper

Возвращает вычисленное значение align activity contexts для использования внутри данного модуля.

- Параметры: `activities`, `contexts`.

- Основные вызовы: `normalizeActivityKey`, `flatMap`, `get`, `has`, `add`.

#### `normalizeActivityKey` — L115–L121 · internal helper

Приводит activity key к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `value`.

- Основные вызовы: `replace`, `toLocaleLowerCase`, `normalize`.

### `server/modules/extraction/signal.schema.ts`

Вертикальный backend-модуль extraction и signal contracts: signal schema.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `const markerSchema` — L17
- `const signalAxisSchema` — L18
- `const signalLevelSchema` — L19
- `const confidenceLevelSchema` — L20
- `const entryIntentSchema` — L21
- `const structureDensitySchema` — L30
- `const temporalBucketSchema` — L31
- `const temporalContextSourceSchema` — L38
- `const activityContextSchema` — L44
- `const stateInferenceSchema` — L121
- `const extractedSignalCandidateSchema` — L124
- `const sanitizedSignalSchema` — L143
- `const fallbackSignalSchema` — L154
- `const clientFallbackSignalSchema` — L182
- `const clientSignalPayloadSchema` — L201
- `const overridePayloadSchema` — L206

### `server/modules/insights/insight.repository.ts`

Вертикальный backend-модуль insight snapshots: insight repository.

#### `countInsightEvidenceDays` — L37–L70 · public API

Детерминированно вычисляет insight evidence days из входных данных.

- Параметры: `db`, `{ from, to }`.

- Основные вызовы: `get`.

#### `getSnapshot` — L72–L96 · public API

Получает snapshot из принадлежащего модулю источника данных.

- Параметры: `db`, `{ layer, periodStart, periodEnd }`.

- Основные вызовы: `get`.

#### `getLatestVisibleSnapshot` — L98–L122 · public API

Получает latest visible snapshot из принадлежащего модулю источника данных.

- Параметры: `db`, `{ layer, today }`.

- Основные вызовы: `get`.

#### `listVisibleSnapshots` — L124–L151 · public API

Получает visible snapshots из принадлежащего модулю источника данных.

- Параметры: `db`.

- Основные вызовы: `all`.

#### `softDeleteSnapshot` — L153–L168 · public API

Возвращает вычисленное значение soft delete snapshot для использования внутри данного модуля.

- Параметры: `db`, `id`.

- Основные вызовы: `run`, `toISOString`.

#### `upsertSnapshot` — L170–L243 · public API

Сохраняет upsert snapshot в принадлежащем модулю хранилище или read model.

- Параметры: `db`, `{ layer, periodStart, periodEnd, text, topic, generatedAt, expiresAt, schemaVersion, promptVersion, }`.

- Основные вызовы: `getSnapshot`, `run`.

### `server/modules/insights/insight.service.ts`

Вертикальный backend-модуль insight snapshots: insight service.

#### `getCurrentInsightSnapshots` — L56–L99 · public API

Получает current insight snapshots из принадлежащего модулю источника данных.

- Параметры: `db`, `{ today }`.

- Основные вызовы: `isDateOnly`, `formatDateOnly`, `addDays`, `countInsightEvidenceDays`, `createOrRefreshSnapshot`, `push`, `toPublicSnapshot`, `getLatestVisibleSnapshot`.

#### `listInsightSnapshots` — L101–L106 · public API

Получает insight snapshots из принадлежащего модулю источника данных.

- Параметры: `db`.

- Основные вызовы: `listVisibleSnapshots`.

#### `deleteInsightSnapshot` — L108–L115 · public API

Удаляет или очищает insight snapshot с необходимыми связанными действиями.

- Параметры: `db`, `id`.

- Основные вызовы: `isInteger`, `Number`, `withDbWriteTransaction`, `softDeleteSnapshot`.

#### `createOrRefreshSnapshot` — L117–L160 · internal helper

Создаёт or refresh snapshot из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `db`, `{ layer, periodStart, periodEnd, retainDays, today, }`.

- Основные вызовы: `buildAnalyticsV2Summary`, `buildInsightV3Input`, `composeInsightV3Text`, `insightV3Topic`, `toISOString`, `addDays`, `withDbWriteTransaction`, `upsertSnapshot`.

#### `toPublicSnapshot` — L162–L173 · internal helper

Возвращает вычисленное значение to public snapshot для использования внутри данного модуля.

- Параметры: `snapshot`.

#### `isDateOnly` — L175–L177 · internal helper

Проверяет условие date only и возвращает логический результат без изменения состояния.

- Параметры: `value`.

- Основные вызовы: `test`.

#### `addDays` — L179–L185 · internal helper

Возвращает вычисленное значение days для использования внутри данного модуля.

- Параметры: `dateOnly`, `days`.

- Основные вызовы: `split`, `UTC`, `setUTCDate`, `getUTCDate`, `formatDateOnly`.

#### `formatDateOnly` — L187–L189 · internal helper

Преобразует date only в стабильное представление для UI, сети или хранения.

- Параметры: `date`.

- Основные вызовы: `toISOString`.

### `server/modules/insights/insightInput.ts`

Вертикальный backend-модуль insight snapshots: insight input.

#### `buildInsightV2Input` — L81–L116 · public API

Создаёт insight v2 input из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `summary`, `layer`.

- Основные вызовы: `selectPrimaryAxis`, `selectSelfReportAgreement`, `selectTrackedLayer`.

#### `composeInsightV2Text` — L118–L127 · public API

Создаёт insight v2 text из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `input`.

- Основные вызовы: `composeObservation`, `composeUncertainty`, `composeSuggestion`, `assertNonClinicalText`.

#### `insightV2Topic` — L129–L131 · public API

Возвращает вычисленное значение insight v2 topic для использования внутри данного модуля.

- Параметры: `input`.

#### `selectPrimaryAxis` — L133–L158 · internal helper

Выбирает primary axis, удовлетворяющий ограничениям текущего сценария.

- Параметры: `axes`.

- Основные вызовы: `at`, `Object.entries`, `scoreAxis`, `localeCompare`.

#### `scoreAxis` — L160–L179 · internal helper

Детерминированно вычисляет axis из входных данных.

- Параметры: `axis`.

- Основные вызовы: `Math.abs`.

#### `selectSelfReportAgreement` — L181–L205 · internal helper

Выбирает self report agreement, удовлетворяющий ограничениям текущего сценария.

- Параметры: `associations`.

- Основные вызовы: `at`, `Math.abs`, `localeCompare`.

#### `selectTrackedLayer` — L207–L223 · internal helper

Выбирает tracked layer, удовлетворяющий ограничениям текущего сценария.

- Параметры: `summary`, `primaryAxis`.

#### `composeObservation` — L225–L247 · internal helper

Создаёт observation из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `input`.

- Основные вызовы: `composeAxisObservation`, `describeContext`.

#### `composeAxisObservation` — L249–L280 · internal helper

Создаёт axis observation из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `input`, `axis`.

- Основные вызовы: `axisLabel`, `layerLabel`, `describeDirection`, `describeTrend`, `describeContext`, `describeSelfReportAgreement`, `push`.

#### `composeUncertainty` — L282–L323 · internal helper

Создаёт uncertainty из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `input`.

- Основные вызовы: `add`, `has`.

#### `composeSuggestion` — L325–L349 · internal helper

Создаёт suggestion из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `input`.

#### `describeDirection` — L351–L357 · internal helper

Возвращает вычисленное значение describe direction для использования внутри данного модуля.

- Параметры: `axis`.

#### `describeTrend` — L359–L364 · internal helper

Возвращает вычисленное значение describe trend для использования внутри данного модуля.

- Параметры: `axis`.

#### `describeContext` — L366–L374 · internal helper

Возвращает вычисленное значение describe context для использования внутри данного модуля.

- Параметры: `input`.

- Основные вызовы: `topicSubject`, `markerLabel`.

#### `describeSelfReportAgreement` — L376–L386 · internal helper

Возвращает вычисленное значение describe self report agreement для использования внутри данного модуля.

- Параметры: `agreement`.

- Основные вызовы: `axisLabel`.

#### `assertNonClinicalText` — L388–L399 · internal helper

Проверяет корректность non clinical text и явно отклоняет нарушение контракта.

- Параметры: `text`.

- Основные вызовы: `toLowerCase`.

#### `axisLabel` — L401–L403 · internal helper

Возвращает вычисленное значение axis label для использования внутри данного модуля.

- Параметры: `axis`.

#### `layerLabel` — L405–L410 · internal helper

Возвращает вычисленное значение layer label для использования внутри данного модуля.

- Параметры: `layer`.

#### `topicSubject` — L412–L436 · internal helper

Возвращает вычисленное значение topic subject для использования внутри данного модуля.

- Параметры: `topic`.

- Основные вызовы: `toLowerCase`.

#### Публичные типы, классы и константы

- `type InsightV2Input` — L11

### `server/modules/insights/insights.route.ts`

Вертикальный backend-модуль insight snapshots: insights route.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### HTTP routes

- `GET /insights/current (L12)`
- `GET /insights (L24)`
- `DELETE /insights/:id (L34)`

### `server/modules/insights/insightV3.ts`

Вертикальный backend-модуль insight snapshots: insight v3.

#### `buildInsightV3Input` — L72–L92 · public API

Создаёт insight v3 input из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `summary`, `layer`.

- Основные вызовы: `buildInsightV2Input`, `buildEvidence`, `buildObservations`, `collectUncertainty`.

#### `composeInsightV3Text` — L94–L109 · public API

Создаёт insight v3 text из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `input`.

- Основные вызовы: `composeInsightV2Text`, `composeSupportText`, `composeInterpretationText`, `replace`, `assertNonClinicalText`.

#### `insightV3Topic` — L111–L113 · public API

Возвращает вычисленное значение insight v3 topic для использования внутри данного модуля.

- Параметры: `input`.

- Основные вызовы: `insightV2Topic`.

#### `buildEvidence` — L115–L167 · internal helper

Создаёт evidence из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `summary`, `input`.

- Основные вызовы: `push`, `axisLabel`, `describeAxisEvidence`, `selectContextEvidence`, `roundNumber`, `collectUncertainty`.

#### `buildObservations` — L169–L220 · internal helper

Создаёт observations из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `input`, `evidence`.

- Основные вызовы: `push`, `axisLabel`.

#### `selectContextEvidence` — L222–L247 · internal helper

Выбирает context evidence, удовлетворяющий ограничениям текущего сценария.

- Параметры: `input`.

- Основные вызовы: `flatMap`.

#### `composeSupportText` — L249–L266 · internal helper

Создаёт support text из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `input`.

#### `composeInterpretationText` — L268–L283 · internal helper

Создаёт interpretation text из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `input`.

#### `collectUncertainty` — L285–L304 · internal helper

Извлекает uncertainty из входных данных без самостоятельного сохранения результата.

- Параметры: `summary`, `input`.

- Основные вызовы: `add`, `Array.from`.

#### `describeAxisEvidence` — L306–L315 · internal helper

Возвращает вычисленное значение describe axis evidence для использования внутри данного модуля.

- Параметры: `axis`.

- Основные вызовы: `roundNumber`, `signed`, `axisLabel`.

#### `axisLabel` — L317–L319 · internal helper

Возвращает вычисленное значение axis label для использования внутри данного модуля.

- Параметры: `axis`.

#### `signed` — L321–L323 · internal helper

Возвращает вычисленное значение signed для использования внутри данного модуля.

- Параметры: `value`.

- Основные вызовы: `roundNumber`, `String`.

#### `roundNumber` — L325–L327 · internal helper

Ограничивает number допустимым диапазоном или точностью.

- Параметры: `value`.

- Основные вызовы: `Math.round`.

#### `assertNonClinicalText` — L329–L340 · internal helper

Проверяет корректность non clinical text и явно отклоняет нарушение контракта.

- Параметры: `text`.

- Основные вызовы: `toLowerCase`.

#### Публичные типы, классы и константы

- `type InsightV3EvidenceKind` — L13
- `type InsightV3EvidenceItem` — L20
- `type InsightV3Observation` — L27
- `type InsightV3Input` — L38

### `server/modules/results/activityInsights.provider.ts`

Проектный файл: activity insights provider.

#### `requestActivityInsightsFromGemini` — L33–L145 · public API

Выполняет внешний запрос для activity insights from gemini и нормализует результат или ошибку.

- Параметры: `{ activities, language, model, quotaKey, }`.

- Основные вызовы: `selectGeminiModel`, `reserveDailyProviderCall`, `createProviderActivities`, `setTimeout`, `abort`, `Number`, `fetch`, `encodeURIComponent`.

#### `selectGeminiModel` — L147–L153 · internal helper

Выбирает gemini model, удовлетворяющий ограничениям текущего сценария.

- Параметры: `model`.

- Основные вызовы: `has`.

#### `reserveDailyProviderCall` — L155–L170 · internal helper

Выполняет локальную операцию reserve daily provider call внутри ответственности этого файла.

- Параметры: `quotaKey`.

- Основные вызовы: `localDateKey`, `delete`, `get`, `set`.

#### `localDateKey` — L172–L178 · internal helper

Возвращает вычисленное значение local date key для использования внутри данного модуля.

- Основные вызовы: `getFullYear`, `padStart`, `String`, `getMonth`, `getDate`.

#### `createProviderActivities` — L180–L195 · internal helper

Создаёт provider activities из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `activities`.

#### `validateAndSanitizeInsights` — L197–L236 · internal helper

Проверяет корректность and sanitize insights и явно отклоняет нарушение контракта.

- Параметры: `insights`, `activities`.

- Основные вызовы: `has`, `add`, `sanitizeInsightText`, `get`, `test`.

#### `sanitizeInsightText` — L238–L244 · internal helper

Приводит sanitize insight text к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `value`.

- Основные вызовы: `replace`.

#### `buildSystemInstruction` — L246–L267 · internal helper

Создаёт system instruction из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `language`.

#### `buildUserPrompt` — L269–L275 · internal helper

Создаёт user prompt из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `activities`.

#### `buildProviderResponseJsonSchema` — L277–L304 · internal helper

Создаёт provider response json schema из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `activities`.

#### `classifyGeminiHttpError` — L306–L322 · internal helper

Возвращает вычисленное значение classify gemini http error для использования внутри данного модуля.

- Параметры: `status`.

#### `extractJson` — L324–L331 · internal helper

Извлекает json из входных данных без самостоятельного сохранения результата.

- Параметры: `text`.

- Основные вызовы: `indexOf`, `lastIndexOf`.

#### `readGeminiText` — L333–L345 · internal helper

Получает gemini text из принадлежащего модулю источника данных.

- Параметры: `data`.

- Основные вызовы: `getRecordValue`, `Array.isArray`.

#### `getRecordValue` — L347–L349 · internal helper

Получает record value из принадлежащего модулю источника данных.

- Параметры: `value`, `key`.

- Основные вызовы: `isRecord`.

#### `isRecord` — L351–L353 · internal helper

Проверяет условие record и возвращает логический результат без изменения состояния.

- Параметры: `value`.

#### Публичные типы, классы и константы

- `class ActivityInsightsProviderError` — L23

### `server/modules/results/activityInsights.schema.ts`

Проектный файл: activity insights schema.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `const activityInsightInputSchema` — L24
- `const activityInsightsRequestSchema` — L49
- `const activityInsightsProviderResponseSchema` — L87

### `server/modules/results/activityInsights.service.ts`

Проектный файл: activity insights service.

#### `generateActivityInsights` — L22–L62 · public API

Создаёт activity insights из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `request`, `quotaKey`.

- Основные вызовы: `hasInsufficientEvidence`, `set`, `createInsufficientInsight`, `push`, `requestActivityInsightsFromGemini`, `get`.

#### `hasInsufficientEvidence` — L64–L66 · internal helper

Проверяет условие insufficient evidence и возвращает логический результат без изменения состояния.

- Параметры: `activity`.

#### `createInsufficientInsight` — L68–L78 · internal helper

Создаёт insufficient insight из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `activityId`, `language`.

### `server/modules/results/results.route.ts`

Проектный файл: results route.

#### `activityInsightQuotaKey` — L44–L52 · internal helper

Возвращает вычисленное значение activity insight quota key для использования внутри данного модуля.

- Параметры: `req`, `res`.

#### HTTP routes

- `POST /results/activity-insights (L15)`

### `server/modules/selfReports/selfReport.repository.ts`

Вертикальный backend-модуль self-report aggregates: self report repository.

#### `replaceSelfReportDailyAggregates` — L11–L52 · public API

Сохраняет replace self report daily aggregates в принадлежащем модулю хранилище или read model.

- Параметры: `db`, `localDay`, `aggregates`.

- Основные вызовы: `run`.

#### `listSelfReportDailyAggregates` — L54–L79 · public API

Получает self report daily aggregates из принадлежащего модулю источника данных.

- Параметры: `db`, `localDay`.

- Основные вызовы: `all`.

#### `getSelfReportDailyAggregate` — L81–L106 · public API

Получает self report daily aggregate из принадлежащего модулю источника данных.

- Параметры: `db`, `localDay`, `axis`.

- Основные вызовы: `get`.

### `server/modules/selfReports/selfReport.schema.ts`

Вертикальный backend-модуль self-report aggregates: self report schema.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `const selfReportAxisSchema` — L3
- `const selfReportDailyAggregateSchema` — L11
- `const syncSelfReportDailyAggregatesSchema` — L31

### `server/modules/selfReports/selfReport.service.ts`

Вертикальный backend-модуль self-report aggregates: self report service.

#### `syncSelfReportDailyAggregates` — L9–L27 · public API

Оркестрирует self report daily aggregates в инфраструктуре синхронизации или фоновой очереди.

- Параметры: `db`, `localDay`, `aggregates`.

- Основные вызовы: `withDbWriteTransaction`, `replaceSelfReportDailyAggregates`, `listSelfReportDailyAggregates`.

#### `listSyncedSelfReportDailyAggregates` — L29–L34 · public API

Получает synced self report daily aggregates из принадлежащего модулю источника данных.

- Параметры: `db`, `localDay`.

- Основные вызовы: `listSelfReportDailyAggregates`.

### `server/modules/selfReports/selfReports.route.ts`

Вертикальный backend-модуль self-report aggregates: self reports route.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### HTTP routes

- `PUT /self-reports/daily-aggregates/:localDay (L15)`
- `GET /self-reports/daily-aggregates/:localDay (L49)`

### `server/platform/http/config.route.ts`

Общая backend platform infrastructure: config route.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### HTTP routes

- `GET /config (L10)`

### `server/platform/http/error.middleware.ts`

Общая backend platform infrastructure: error middleware.

#### `jsonErrorHandler` — L3–L18 · public API

Возвращает вычисленное значение json error handler для использования внутри данного модуля.

- Параметры: `error`, `_req`, `res`, `next`.

- Основные вызовы: `isEntityTooLargeError`, `json`, `status`, `next`.

#### `apiErrorHandler` — L20–L33 · public API

Возвращает вычисленное значение api error handler для использования внутри данного модуля.

- Параметры: `error`, `_req`, `res`, `_next`.

- Основные вызовы: `console.error`, `json`, `status`.

#### `isEntityTooLargeError` — L35–L42 · internal helper

Проверяет условие entity too large error и возвращает логический результат без изменения состояния.

- Параметры: `error`.

### `server/platform/http/http.ts`

Общая backend platform infrastructure: http.

#### `asyncHandler` — L8–L18 · public API

Возвращает вычисленное значение async handler для использования внутри данного модуля.

- Параметры: `handler`.

- Основные вызовы: `catch`, `handler`.

#### `sendValidationError` — L20–L29 · public API

Выполняет внешний запрос для validation error и нормализует результат или ошибку.

- Параметры: `res`, `message`, `error`.

- Основные вызовы: `json`, `status`, `flatten`.

#### `isCodedError` — L31–L33 · public API

Проверяет условие coded error и возвращает логический результат без изменения состояния.

- Параметры: `error`.

#### Публичные типы, классы и константы

- `type CodedError` — L4

### `server/server.ts`

Исполняемая точка запуска Express-сервера.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.

## Shared contracts: функции

### `shared/contracts/activityInsights.ts`

Общий runtime/type контракт клиента и сервера: activity insights.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `const ACTIVITY_INSIGHT_LANGUAGES` — L3
- `const ACTIVITY_INSIGHT_KINDS` — L4
- `const ACTIVITY_INSIGHT_STAGES` — L5
- `const ACTIVITY_INSIGHT_RHYTHMS` — L12
- `const ACTIVITY_INSIGHT_BURNOUT_RELATIONS` — L19
- `const ACTIVITY_INSIGHT_EVENTS` — L25
- `const ACTIVITY_INSIGHT_STATUSES` — L26
- `type ActivityInsightLanguage` — L28
- `type ActivityInsightKind` — L30
- `type ActivityInsightStage` — L31
- `type ActivityInsightRhythm` — L32
- `type ActivityInsightBurnoutRelation` — L33
- `type ActivityInsightEvent` — L35
- `type ActivityInsightContext` — L37
- `type ActivityInsightInput` — L39
- `type ActivityInsightsRequest` — L53
- `type ActivityInsightStatus` — L59
- `type ActivityInsightConfidence` — L60
- `type ActivityInsight` — L62
- `type ActivityInsightsResponse` — L69

### `shared/contracts/entries.ts`

Общий runtime/type контракт клиента и сервера: entries.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `type EntryStatus` — L3
- `type ServerEntry` — L5

### `shared/contracts/extraction.ts`

Общий runtime/type контракт клиента и сервера: extraction.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `type ExtractionSettings` — L3
- `type ExtractionProviderOption` — L8
- `type ExtractionConfig` — L16
- `type ExtractionStatus` — L21

### `shared/contracts/index.ts`

Публичный barrel общих client/server контрактов.

Именованных функций нет: файл служит re-export границей.

### `shared/contracts/insights.ts`

Общий runtime/type контракт клиента и сервера: insights.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `type InsightLayer` — L1
- `type InsightSnapshot` — L3

### `shared/contracts/selfReports.ts`

Общий runtime/type контракт клиента и сервера: self reports.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `type SelfReportAxis` — L1
- `type SelfReportDailyAggregate` — L8

### `shared/contracts/signal.ts`

Общий runtime/type контракт клиента и сервера: signal.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `type ExtractionProvider` — L1
- `type SignalQuality` — L3
- `const CONFIDENCE_LEVELS` — L4
- `const SIGNAL_LEVELS` — L5
- `type SignalLevel` — L6
- `type ConfidenceLevel` — L7
- `type EntryIntent` — L8
- `type StructureDensity` — L16
- `type TemporalBucket` — L17
- `type TemporalContextSource` — L23
- `const SIGNAL_AXES` — L24
- `const METRIC_NAMES` — L43
- `type SignalAxis` — L44
- `type MetricName` — L45
- `const ACTIVITY_CONTEXT_KINDS` — L47
- `const ACTIVITY_CONTEXT_EVENTS` — L52
- `const ACTIVITY_CONTEXT_OUTCOMES` — L64
- `const ACTIVITY_CONTEXT_BLOCKERS` — L71
- `const ACTIVITY_CONTEXT_STRATEGIES` — L83
- `const ACTIVITY_CONTEXT_NEXT_STEPS` — L92
- `const ACTIVITY_CONTEXT_AGENCIES` — L97
- `const ACTIVITY_CONTEXT_EFFECTS` — L104
- `type ActivityContextKind` — L112
- `type ActivityContextEvent` — L113
- `type ActivityContextOutcome` — L114
- `type ActivityContextBlocker` — L115
- `type ActivityContextStrategy` — L116
- `type ActivityContextNextStep` — L117
- `type ActivityContextAgency` — L118
- `type ActivityContextEffect` — L119
- `type ActivityContext` — L121
- `type StateInferenceValue` — L134
- `type StateInference` — L140
- `type MetricConfidence` — L142
- `type EntryIntentSignal` — L144
- `type StructureSignal` — L150
- `type TemporalContext` — L158
- `type Signal` — L164
- `type SignalMetadata` — L181
- `type ExtractionResult` — L190

### `shared/contracts/signalAnalysis.ts`

Детерминированно выводит intent, структуру и временной контекст из одной записи и её metadata.

#### `createDefaultSignalContext` — L29–L49 · public API

Создаёт default signal context из переданных данных, не отдавая вызывающему коду детали сборки.

#### `analyzeSignalContext` — L51–L62 · public API

Детерминированно выводит intent, структуру и temporal context одной записи без истории и модельных догадок.

- Параметры: `rawText`, `input`.

- Основные вызовы: `inferEntryIntent`, `inferStructureSignal`, `inferTemporalContext`.

#### `inferEntryIntent` — L64–L82 · internal helper

Выводит entry intent по явным правилам без скрытых побочных эффектов.

- Параметры: `text`.

- Основные вызовы: `createDefaultSignalContext`, `candidate`.

#### `candidate` — L84–L102 · internal helper

Проверяет условие candidate и возвращает логический результат без изменения состояния.

- Параметры: `intent`, `pattern`, `text`.

- Основные вызовы: `test`.

#### `inferStructureSignal` — L104–L143 · internal helper

Выводит structure signal по явным правилам без скрытых побочных эффектов.

- Параметры: `text`.

- Основные вызовы: `match`, `split`, `test`, `bucketCount`, `push`.

#### `inferTemporalContext` — L145–L166 · internal helper

Выводит temporal context по явным правилам без скрытых побочных эффектов.

- Параметры: `input`.

- Основные вызовы: `normalizeIso`, `normalizeDate`, `bucketHour`, `getHours`, `createDefaultSignalContext`.

#### `normalizeIso` — L168–L172 · internal helper

Приводит iso к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `value`.

- Основные вызовы: `getTime`, `isFinite`, `toISOString`.

#### `normalizeDate` — L174–L177 · internal helper

Приводит date к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `value`.

- Основные вызовы: `test`.

#### `bucketHour` — L179–L184 · internal helper

Возвращает вычисленное значение bucket hour для использования внутри данного модуля.

- Параметры: `hour`.

#### `bucketCount` — L186–L193 · internal helper

Возвращает вычисленное значение bucket count для использования внутри данного модуля.

- Параметры: `count`.

#### Публичные типы, классы и константы

- `type SignalContextInput` — L8
- `type SignalContextFields` — L13

### `shared/contracts/signalVersions.ts`

Общий runtime/type контракт клиента и сервера: signal versions.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `const ACTIVE_SIGNAL_SCHEMA_VERSION` — L5
- `const ACTIVE_EXTRACTION_PROMPT_VERSION` — L6

### `shared/signal/signalMapper.ts`

Единый pure Signal mapper для клиентского и серверного runtime.

#### `mapSignalCandidate` — L74–L111 · public API

Преобразует или объединяет signal candidate по правилам домена.

- Параметры: `candidate`.

- Основные вызовы: `mapMetric`, `Object.keys`, `getQualityReason`.

#### `createEmptyMetricConfidence` — L113–L115 · public API

Создаёт empty metric confidence из переданных данных, не отдавая вызывающему коду детали сборки.

#### `mapMetric` — L117–L160 · internal helper

Преобразует или объединяет metric по правилам домена.

- Параметры: `metric`, `stateInference`.

- Основные вызовы: `scoreLevel`, `confidenceWeight`, `clampScore`, `Math.round`, `highestConfidence`.

#### `scoreLevel` — L162–L167 · internal helper

Детерминированно вычисляет level из входных данных.

- Параметры: `level`, `direction`.

#### `confidenceWeight` — L169–L173 · internal helper

Возвращает вычисленное значение confidence weight для использования внутри данного модуля.

- Параметры: `confidence`.

#### `highestConfidence` — L175–L179 · internal helper

Возвращает вычисленное значение highest confidence для использования внутри данного модуля.

- Параметры: `confidences`.

#### `clampScore` — L181–L183 · internal helper

Ограничивает score допустимым диапазоном или точностью.

- Параметры: `score`.

- Основные вызовы: `Math.max`, `Math.min`.

#### `getQualityReason` — L185–L210 · internal helper

Получает quality reason из принадлежащего модулю источника данных.

- Параметры: `stateInference`, `hasMetric`, `hasTextSignal`.

- Основные вызовы: `Object.entries`, `localeCompare`.

## Tests: функции

### `test/activity-insights.test.js`

Node test для соответствующего сценария: activity insights test.

#### `activity` — L7–L34 · internal helper

Возвращает вычисленное значение activity для использования внутри данного модуля.

- Параметры: `overrides`.

### `test/analytics-v2.test.js`

Node test для соответствующего сценария: analytics v2 test.

#### `addEntry` — L19–L27 · internal helper

Возвращает вычисленное значение entry для использования внутри данного модуля.

- Параметры: `db`, `id`, `date`, `signal`, `tags`.

- Основные вызовы: `createEntry`, `digest`, `update`, `crypto.createHash`.

#### `addLevelEntry` — L29–L43 · internal helper

Возвращает вычисленное значение level entry для использования внутри данного модуля.

- Параметры: `db`, `id`, `date`, `levels`, `tags`.

- Основные вызовы: `addEntry`, `validSignal`, `state`.

#### `addSelfReportAggregate` — L45–L76 · internal helper

Выполняет локальную операцию self report aggregate внутри ответственности этого файла.

- Параметры: `db`, `date`, `axis`, `mean`, `count`.

- Основные вызовы: `run`.

#### `eachDateInRange` — L322–L333 · internal helper

Возвращает вычисленное значение each date in range для использования внутри данного модуля.

- Параметры: `from`, `to`.

- Основные вызовы: `parseDateOnly`, `push`, `toISOString`, `setUTCDate`, `getUTCDate`.

#### `parseDateOnly` — L335–L338 · internal helper

Разбирает date only и преобразует вход в типизированное представление.

- Параметры: `value`.

- Основные вызовы: `split`, `UTC`.

### `test/auth-api.test.js`

Node test для соответствующего сценария: auth api test.

#### `setupOwner` — L164–L179 · internal helper

Изменяет up owner, сохраняя инварианты данного модуля.

- Основные вызовы: `request`, `json`, `equal`, `createCookieHeader`.

#### `validEntryPayload` — L181–L190 · internal helper

Возвращает вычисленное значение valid entry payload для использования внутри данного модуля.

- Параметры: `overrides`.

- Основные вызовы: `repeat`, `validSignal`.

#### `request` — L192–L212 · internal helper

Выполняет внешний запрос для request и нормализует результат или ошибку.

- Параметры: `method`, `pathname`, `options`.

- Основные вызовы: `fetch`.

#### `applyMigrations` — L214–L222 · internal helper

Преобразует или объединяет migrations по правилам домена.

- Параметры: `database`.

- Основные вызовы: `readdir`, `endsWith`, `exec`, `readFile`.

#### `getServerBaseUrl` — L224–L239 · internal helper

Получает server base url из принадлежащего модулю источника данных.

- Параметры: `httpServer`.

- Основные вызовы: `resolve`, `once`, `address`, `equal`, `ok`.

#### `createCookieHeader` — L241–L245 · internal helper

Создаёт cookie header из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `response`.

- Основные вызовы: `getSetCookies`, `split`.

#### `getSetCookies` — L247–L255 · internal helper

Получает set cookies из принадлежащего модулю источника данных.

- Параметры: `response`.

- Основные вызовы: `getSetCookie`, `get`, `split`.

### `test/auth.test.js`

Node test для соответствующего сценария: auth test.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.

### `test/backend-metadata-export.test.js`

Node test для соответствующего сценария: backend metadata export test.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.

### `test/e2e/editor-smoke.spec.ts`

Playwright end-to-end проверка: editor smoke spec.

#### `localDateOnly` — L4–L11 · internal helper

Возвращает вычисленное значение local date only для использования внутри данного модуля.

- Основные вызовы: `getFullYear`, `padStart`, `String`, `getMonth`, `getDate`.

### `test/entry-debug-tooltip.test.js`

Node test для соответствующего сценария: entry debug tooltip test.

#### `rowValue` — L47–L48 · internal helper

Возвращает вычисленное значение row value для использования внутри данного модуля.

- Параметры: `label`.

### `test/entry-flow.test.js`

Node test для соответствующего сценария: entry flow test.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.

### `test/entry-search.test.js`

Node test для соответствующего сценария: entry search test.

#### `entry` — L23–L61 · internal helper

Возвращает вычисленное значение entry для использования внутри данного модуля.

- Параметры: `overrides`.

- Основные вызовы: `repeat`.

### `test/entry-server-sync.test.js`

Node test для соответствующего сценария: entry server sync test.

#### `updateServerEntry` — L12–L19 · class/object method

Изменяет server entry, сохраняя инварианты данного модуля.

- Параметры: `entryId`, `payload`.

- Основные вызовы: `push`.

#### `createEntry` — L20–L32 · class/object method

Создаёт entry из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `payload`.

- Основные вызовы: `push`, `serverEntry`.

#### `updateServerEntry` — L51–L53 · class/object method

Изменяет server entry, сохраняя инварианты данного модуля.

#### `createEntry` — L54–L56 · class/object method

Создаёт entry из переданных данных, не отдавая вызывающему коду детали сборки.

#### `localEntry` — L62–L84 · internal helper

Возвращает вычисленное значение local entry для использования внутри данного модуля.

- Параметры: `overrides`.

- Основные вызовы: `repeat`, `validSignal`.

#### `serverEntry` — L86–L106 · internal helper

Возвращает вычисленное значение server entry для использования внутри данного модуля.

- Параметры: `overrides`.

- Основные вызовы: `repeat`, `validSignal`.

### `test/entry-sync-backend.test.js`

Node test для соответствующего сценария: entry sync backend test.

#### `entryInput` — L14–L30 · internal helper

Возвращает вычисленное значение entry input для использования внутри данного модуля.

- Параметры: `overrides`.

- Основные вызовы: `repeat`, `validSignal`.

### `test/entry-sync-job.test.js`

Node test для соответствующего сценария: entry sync job test.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.

### `test/entry-sync-policy.test.js`

Node test для соответствующего сценария: entry sync policy test.

#### `payload` — L6–L14 · internal helper

Возвращает вычисленное значение payload для использования внутри данного модуля.

- Параметры: `overrides`.

- Основные вызовы: `repeat`.

#### `localEntry` — L16–L24 · internal helper

Возвращает вычисленное значение local entry для использования внутри данного модуля.

- Параметры: `overrides`.

- Основные вызовы: `repeat`.

### `test/gemini-quota.test.js`

Node test для соответствующего сценария: gemini quota test.

#### `createLocalStorageMock` — L15–L28 · internal helper

Создаёт local storage mock из переданных данных, не отдавая вызывающему коду детали сборки.

- Основные вызовы: `clear`, `get`, `Array.from`, `keys`, `delete`, `set`, `String`.

### `test/helpers/createTestDb.js`

Тестовая инфраструктура: create test db.

#### `createTestDb` — L5–L20 · public API

Создаёт test db из переданных данных, не отдавая вызывающему коду детали сборки.

- Основные вызовы: `open`, `exec`, `runMigrations`.

#### `log` — L15 · class/object method

Выполняет локальную операцию log внутри ответственности этого файла.

### `test/import-apply.test.js`

Node test для соответствующего сценария: import apply test.

#### `createPackage` — L14–L82 · internal helper

Создаёт package из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `overrides`.

- Основные вызовы: `validSignal`.

### `test/import-validation.test.js`

Node test для соответствующего сценария: import validation test.

#### `createPackage` — L13–L106 · internal helper

Создаёт package из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `overrides`.

- Основные вызовы: `validSignal`, `fallbackSignal`.

### `test/insights.test.js`

Node test для соответствующего сценария: insights test.

#### `validSignal` — L19–L25 · internal helper

Возвращает вычисленное значение valid signal для использования внутри данного модуля.

- Параметры: `topic`.

- Основные вызовы: `baseValidSignal`.

#### `sparseSignal` — L27–L33 · internal helper

Возвращает вычисленное значение sparse signal для использования внутри данного модуля.

- Основные вызовы: `baseSparseSignal`.

#### `addEntry` — L35–L43 · internal helper

Возвращает вычисленное значение entry для использования внутри данного модуля.

- Параметры: `db`, `id`, `date`, `signal`.

- Основные вызовы: `createEntry`, `digest`, `update`, `crypto.createHash`.

#### `addLevelEntry` — L45–L61 · internal helper

Возвращает вычисленное значение level entry для использования внутри данного модуля.

- Параметры: `db`, `id`, `date`, `levels`, `topic`.

- Основные вызовы: `addEntry`, `baseValidSignal`, `state`.

#### `addSelfReportAggregate` — L63–L94 · internal helper

Выполняет локальную операцию self report aggregate внутри ответственности этого файла.

- Параметры: `db`, `date`, `axis`, `mean`, `count`.

- Основные вызовы: `run`.

#### `eachDateInRange` — L363–L374 · internal helper

Возвращает вычисленное значение each date in range для использования внутри данного модуля.

- Параметры: `from`, `to`.

- Основные вызовы: `parseDateOnly`, `push`, `toISOString`, `setUTCDate`, `getUTCDate`.

#### `parseDateOnly` — L376–L379 · internal helper

Разбирает date only и преобразует вход в типизированное представление.

- Параметры: `value`.

- Основные вызовы: `split`, `UTC`.

### `test/migrations.test.js`

Node test для соответствующего сценария: migrations test.

#### `log` — L30 · class/object method

Выполняет локальную операцию log внутри ответственности этого файла.

#### `log` — L53 · class/object method

Выполняет локальную операцию log внутри ответственности этого файла.

#### `log` — L114 · class/object method

Выполняет локальную операцию log внутри ответственности этого файла.

#### `createTempDb` — L130–L139 · internal helper

Создаёт temp db из переданных данных, не отдавая вызывающему коду детали сборки.

- Основные вызовы: `open`, `exec`.

#### `createTempMigrations` — L141–L153 · internal helper

Создаёт temp migrations из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `files`.

- Основные вызовы: `mkdtemp`, `tmpdir`, `Promise.all`, `Object.entries`, `writeFile`.

### `test/privacy-boundary.test.js`

Node test для соответствующего сценария: privacy boundary test.

#### `validPayload` — L7–L16 · internal helper

Возвращает вычисленное значение valid payload для использования внутри данного модуля.

- Параметры: `overrides`.

- Основные вызовы: `repeat`, `validSignal`.

### `test/privacy-export.test.js`

Node test для соответствующего сценария: privacy export test.

#### `createEntry` — L12–L44 · internal helper

Создаёт entry из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `overrides`.

#### `createSelfReportEvent` — L46–L64 · internal helper

Создаёт self report event из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `overrides`.

#### `createQueueJob` — L66–L96 · internal helper

Создаёт queue job из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `overrides`.

### `test/queue-errors.test.js`

Node test для соответствующего сценария: queue errors test.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.

### `test/reprocess-policy.test.js`

Node test для соответствующего сценария: reprocess policy test.

#### `metadata` — L17–L26 · internal helper

Возвращает вычисленное значение metadata для использования внутри данного модуля.

- Параметры: `overrides`.

#### `localEntry` — L28–L44 · internal helper

Возвращает вычисленное значение local entry для использования внутри данного модуля.

- Параметры: `overrides`.

- Основные вызовы: `repeat`, `validSignal`, `metadata`.

#### `queueJob` — L46–L68 · internal helper

Возвращает вычисленное значение queue job для использования внутри данного модуля.

- Параметры: `payload`, `overrides`.

### `test/results-model.test.js`

Node test для соответствующего сценария: results model test.

#### `entry` — L7–L44 · internal helper

Возвращает вычисленное значение entry для использования внутри данного модуля.

- Параметры: `{ id, entryDate, activity = null, context = null, tags = [], text, }`.

- Основные вызовы: `padEnd`, `validSignal`.

### `test/sanitization.test.js`

Node test для соответствующего сценария: sanitization test.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.

### `test/self-reports.test.js`

Node test для соответствующего сценария: self reports test.

#### `aggregate` — L8–L23 · internal helper

Возвращает вычисленное значение aggregate для использования внутри данного модуля.

- Параметры: `overrides`.

### `test/signal-context.test.js`

Node test для соответствующего сценария: signal context test.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.

### `test/signal-fixtures.js`

Node test для соответствующего сценария: signal fixtures.

#### `state` — L1–L3 · public API

Возвращает вычисленное значение state для использования внутри данного модуля.

- Параметры: `level`, `confidence`, `basis`.

#### `metricConfidence` — L5–L11 · public API

Возвращает вычисленное значение metric confidence для использования внутри данного модуля.

- Параметры: `value`.

#### `signalContext` — L13–L34 · public API

Возвращает вычисленное значение signal context для использования внутри данного модуля.

- Параметры: `overrides`.

#### `validSignal` — L36–L56 · public API

Возвращает вычисленное значение valid signal для использования внутри данного модуля.

- Параметры: `overrides`.

- Основные вызовы: `state`, `metricConfidence`, `signalContext`.

#### `sparseSignal` — L58–L74 · public API

Возвращает вычисленное значение sparse signal для использования внутри данного модуля.

- Параметры: `overrides`.

- Основные вызовы: `metricConfidence`, `signalContext`.

#### `fallbackSignal` — L76–L92 · public API

Возвращает вычисленное значение fallback signal для использования внутри данного модуля.

- Параметры: `overrides`.

- Основные вызовы: `metricConfidence`, `signalContext`.

### `test/signal-pipeline.test.js`

Node test для соответствующего сценария: signal pipeline test.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.

### `test/startup-resilience.test.js`

Node test для соответствующего сценария: startup resilience test.

#### `registration` — L10–L16 · internal helper

Возвращает вычисленное значение registration для использования внутри данного модуля.

- Параметры: `scope`.

- Основные вызовы: `push`.

#### `unregister` — L12–L15 · class/object method

Возвращает вычисленное значение unregister для использования внутри данного модуля.

- Основные вызовы: `push`.

#### `delete` — L20–L23 · class/object method

Удаляет или очищает delete с необходимыми связанными действиями.

- Параметры: `cacheName`.

- Основные вызовы: `push`.

#### `keys` — L24–L30 · class/object method

Возвращает вычисленное значение keys для использования внутри данного модуля.

#### `getRegistrations` — L34–L40 · class/object method

Получает registrations из принадлежащего модулю источника данных.

- Основные вызовы: `registration`.

### `test/vault-crypto.test.js`

Node test для соответствующего сценария: vault crypto test.

#### `clear` — L24–L26 · class/object method

Удаляет или очищает clear с необходимыми связанными действиями.

- Основные вызовы: `clear`.

#### `getItem` — L27–L29 · class/object method

Получает item из принадлежащего модулю источника данных.

- Параметры: `key`.

- Основные вызовы: `get`.

#### `key` — L30–L32 · class/object method

Возвращает вычисленное значение key для использования внутри данного модуля.

- Параметры: `index`.

- Основные вызовы: `Array.from`, `keys`.

#### `removeItem` — L33–L35 · class/object method

Удаляет или очищает item с необходимыми связанными действиями.

- Параметры: `key`.

- Основные вызовы: `delete`.

#### `setItem` — L36–L38 · class/object method

Изменяет item, сохраняя инварианты данного модуля.

- Параметры: `key`, `value`.

- Основные вызовы: `set`, `String`.

### `test/vault-profiles.test.js`

Node test для соответствующего сценария: vault profiles test.

#### `clear` — L16–L18 · class/object method

Удаляет или очищает clear с необходимыми связанными действиями.

- Основные вызовы: `clear`.

#### `getItem` — L19–L21 · class/object method

Получает item из принадлежащего модулю источника данных.

- Параметры: `key`.

- Основные вызовы: `get`.

#### `key` — L22–L24 · class/object method

Возвращает вычисленное значение key для использования внутри данного модуля.

- Параметры: `index`.

- Основные вызовы: `Array.from`, `keys`.

#### `removeItem` — L25–L27 · class/object method

Удаляет или очищает item с необходимыми связанными действиями.

- Параметры: `key`.

- Основные вызовы: `delete`.

#### `setItem` — L28–L30 · class/object method

Изменяет item, сохраняя инварианты данного модуля.

- Параметры: `key`, `value`.

- Основные вызовы: `set`, `String`.

#### `createProfile` — L79–L86 · internal helper

Создаёт profile из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `id`, `name`, `mark`.

## Client support files: функции

### `client/eslint.config.js`

Проектный файл: eslint config.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.

### `client/postcss.config.js`

Проектный файл: postcss config.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.

### `client/public/sw.js`

Статический browser asset: sw.

#### `cacheAppShell` — L63–L84 · internal helper

Выполняет локальную операцию cache app shell внутри ответственности этого файла.

- Основные вызовы: `open`, `Promise.allSettled`, `add`, `fetch`, `put`, `clone`, `text`, `extractSameOriginAssetUrls`.

#### `extractSameOriginAssetUrls` — L86–L105 · internal helper

Извлекает same origin asset urls из входных данных без самостоятельного сохранения результата.

- Параметры: `indexHtml`.

- Основные вызовы: `matchAll`, `startsWith`, `add`.

#### `cacheStaticAssets` — L107–L150 · internal helper

Выполняет локальную операцию cache static assets внутри ответственности этого файла.

- Параметры: `cache`, `initialAssetUrls`.

- Основные вызовы: `shift`, `has`, `add`, `fetch`, `put`, `clone`, `get`, `extractSameOriginAssetUrls`.

#### `cacheFirst` — L152–L167 · internal helper

Возвращает вычисленное значение cache first для использования внутри данного модуля.

- Параметры: `request`.

- Основные вызовы: `match`, `fetch`, `open`, `put`, `clone`.

#### `networkFirst` — L169–L186 · internal helper

Возвращает вычисленное значение network first для использования внутри данного модуля.

- Параметры: `request`.

- Основные вызовы: `open`, `fetch`, `put`, `clone`, `match`, `error`.

### `client/tailwind.config.js`

Проектный файл: tailwind config.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.

### `client/vite.config.ts`

Проектный файл: vite config.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.

## Maintenance scripts: функции

### `scripts/generate-code-map.mjs`

Проектный файл: generate code map.

#### `normalizePath` — L142–L144 · internal helper

Приводит path к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `value`.

- Основные вызовы: `replaceAll`.

#### `listProjectFiles` — L146–L157 · internal helper

Получает project files из принадлежащего модулю источника данных.

- Основные вызовы: `execFileSync`, `split`, `has`, `existsSync`, `localeCompare`.

#### `isExported` — L159–L167 · internal helper

Проверяет условие exported и возвращает логический результат без изменения состояния.

- Параметры: `node`.

- Основные вызовы: `Boolean`.

#### `lineOf` — L169–L171 · internal helper

Возвращает вычисленное значение line of для использования внутри данного модуля.

- Параметры: `sourceFile`, `node`.

- Основные вызовы: `getLineAndCharacterOfPosition`, `getStart`.

#### `endLineOf` — L173–L175 · internal helper

Возвращает вычисленное значение end line of для использования внутри данного модуля.

- Параметры: `sourceFile`, `node`.

- Основные вызовы: `getLineAndCharacterOfPosition`, `getEnd`.

#### `analyzeCode` — L177–L386 · internal helper

Возвращает вычисленное значение analyze code для использования внутри данного модуля.

- Параметры: `file`.

- Основные вызовы: `readFileSync`, `endsWith`, `createSourceFile`, `isFunctionDeclaration`, `isMethodDeclaration`, `getText`, `isArrowFunction`, `isFunctionExpression`.

#### `enclosingFunctionName` — L199–L218 · nested helper в analyzeCode

Возвращает вычисленное значение enclosing function name для использования внутри данного модуля.

- Параметры: `node`.

- Основные вызовы: `isFunctionDeclaration`, `isMethodDeclaration`, `getText`, `isArrowFunction`, `isFunctionExpression`, `isVariableDeclaration`, `isIdentifier`.

#### `functionScope` — L220–L224 · nested helper в analyzeCode

Возвращает вычисленное значение function scope для использования внутри данного модуля.

- Параметры: `node`, `exported`.

- Основные вызовы: `isMethodDeclaration`, `enclosingFunctionName`.

#### `directCalls` — L226–L253 · nested helper в analyzeCode

Возвращает вычисленное значение direct calls для использования внутри данного модуля.

- Параметры: `node`.

- Основные вызовы: `isCallExpression`, `isIdentifier`, `isPropertyAccessExpression`, `has`, `push`, `forEachChild`, `visitCalls`.

#### `visitCalls` — L234–L249 · nested helper в directCalls

Выполняет локальную операцию visit calls внутри ответственности этого файла.

- Параметры: `current`.

- Основные вызовы: `isCallExpression`, `isIdentifier`, `isPropertyAccessExpression`, `has`, `push`, `forEachChild`.

#### `addFunction` — L255–L284 · nested helper в analyzeCode

Выполняет локальную операцию function внутри ответственности этого файла.

- Параметры: `name`, `node`, `exported`, `parameters`.

- Основные вызовы: `isVariableDeclaration`, `Boolean`, `isArrowFunction`, `isBlock`, `isReturnStatement`, `forEachChild`, `findReturn`, `push`.

#### `findReturn` — L263–L270 · nested helper в addFunction

Выбирает return, удовлетворяющий ограничениям текущего сценария.

- Параметры: `current`.

- Основные вызовы: `isReturnStatement`, `forEachChild`.

#### `visit` — L331–L381 · nested helper в analyzeCode

Выполняет локальную операцию visit внутри ответственности этого файла.

- Параметры: `node`.

- Основные вызовы: `isFunctionDeclaration`, `addFunction`, `isExported`, `getText`, `isMethodDeclaration`, `isVariableDeclaration`, `isIdentifier`, `isArrowFunction`.

#### `humanizeStem` — L388–L394 · internal helper

Возвращает вычисленное значение humanize stem для использования внутри данного модуля.

- Параметры: `file`.

- Основные вызовы: `basename`, `extname`, `toLocaleLowerCase`, `replaceAll`.

#### `humanizeIdentifier` — L396–L403 · internal helper

Возвращает вычисленное значение humanize identifier для использования внутри данного модуля.

- Параметры: `name`.

- Основные вызовы: `toLocaleLowerCase`, `replaceAll`, `replace`.

#### `describeFunction` — L405–L449 · internal helper

Возвращает вычисленное значение describe function для использования внутри данного модуля.

- Параметры: `file`, `fn`.

- Основные вызовы: `humanizeIdentifier`, `test`.

#### `purposeFor` — L451–L472 · internal helper

Возвращает вычисленное значение purpose for для использования внутри данного модуля.

- Параметры: `file`.

- Основные вызовы: `startsWith`, `matchingPrefix`, `humanizeStem`, `endsWith`, `test`.

#### `matchingPrefix` — L474–L478 · internal helper

Возвращает вычисленное значение matching prefix для использования внутри данного модуля.

- Параметры: `file`.

- Основные вызовы: `Object.keys`, `startsWith`.

#### `sectionFor` — L480–L490 · internal helper

Возвращает вычисленное значение section for для использования внутри данного модуля.

- Параметры: `file`.

- Основные вызовы: `startsWith`.

#### `escapeTableCell` — L492–L494 · internal helper

Возвращает вычисленное значение escape table cell для использования внутри данного модуля.

- Параметры: `value`.

- Основные вызовы: `replaceAll`.

#### `renderFileMapRow` — L496–L498 · internal helper

Возвращает вычисленное значение render file map row для использования внутри данного модуля.

- Параметры: `file`.

- Основные вызовы: `escapeTableCell`, `purposeFor`.

#### `renderFunction` — L500–L524 · internal helper

Возвращает вычисленное значение render function для использования внутри данного модуля.

- Параметры: `file`, `fn`.

- Основные вызовы: `describeFunction`, `push`.

#### `renderFunctionFile` — L526–L559 · internal helper

Возвращает вычисленное значение render function file для использования внутри данного модуля.

- Параметры: `file`, `analysis`.

- Основные вызовы: `purposeFor`, `push`, `renderFunction`.

## Root and deployment files: функции

### `playwright.config.ts`

Проектный файл: playwright config.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
