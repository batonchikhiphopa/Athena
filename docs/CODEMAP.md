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
| `client/src/app/AthenaWorkspace.tsx` | Компонует видимые поверхности Athena и связывает состояние приложения с UI-обработчиками. |
| `client/src/app/useAppAutoLock.ts` | Клиентская оркестрация приложения и lifecycle hook: use app auto lock. |
| `client/src/app/useAthenaApp.ts` | Главный composition hook клиента; собирает editor, entries, insights, settings, queue и lifecycle в один фасад. |
| `client/src/app/useAthenaLifecycle.ts` | Клиентская оркестрация приложения и lifecycle hook: use athena lifecycle. |
| `client/src/app/useAthenaNavigation.ts` | Клиентская оркестрация приложения и lifecycle hook: use athena navigation. |
| `client/src/app/useVaultLockPreparation.ts` | Клиентская оркестрация приложения и lifecycle hook: use vault lock preparation. |
| `client/src/assets/logo-bg.jpg` | Статический визуальный asset; функций не содержит. |
| `client/src/components/desktop.ini` | Пользовательский UI-компонент: desktop. |
| `client/src/components/Editor.tsx` | Пользовательский UI-компонент: editor. |
| `client/src/components/editor/EditorActionButtons.tsx` | UI-компонент редактора: editor action buttons. |
| `client/src/components/editor/EditorTagChips.tsx` | UI-компонент редактора: editor tag chips. |
| `client/src/components/editor/EditorTagMenu.tsx` | UI-компонент редактора: editor tag menu. |
| `client/src/components/editor/LineLever.tsx` | UI-компонент редактора: line lever. |
| `client/src/components/editor/SelfReportMenu.tsx` | UI-компонент редактора: self report menu. |
| `client/src/components/EntriesPage.tsx` | Пользовательский UI-компонент: entries page. |
| `client/src/components/entryDebugBlocks.ts` | Пользовательский UI-компонент: entry debug blocks. |
| `client/src/components/EntryDebugTooltip.tsx` | Пользовательский UI-компонент: entry debug tooltip. |
| `client/src/components/floating/FloatingLayerContext.ts` | Инфраструктура плавающих панелей и их геометрии: floating layer context. |
| `client/src/components/floating/FloatingLayerProvider.tsx` | Инфраструктура плавающих панелей и их геометрии: floating layer provider. |
| `client/src/components/floating/FloatingPanel.tsx` | Инфраструктура плавающих панелей и их геометрии: floating panel. |
| `client/src/components/floating/index.ts` | Инфраструктура плавающих панелей и их геометрии: index. |
| `client/src/components/floating/useFloatingLayer.ts` | Инфраструктура плавающих панелей и их геометрии: use floating layer. |
| `client/src/components/floating/useFloatingTextOcclusion.ts` | Инфраструктура плавающих панелей и их геометрии: use floating text occlusion. |
| `client/src/components/icon.tsx` | Пользовательский UI-компонент: icon. |
| `client/src/components/InsightStrip.tsx` | Пользовательский UI-компонент: insight strip. |
| `client/src/components/LanguageSelect.tsx` | Пользовательский UI-компонент: language select. |
| `client/src/components/Nav.tsx` | Пользовательский UI-компонент: nav. |
| `client/src/components/Observations.tsx` | Пользовательский UI-компонент: observations. |
| `client/src/components/ServerAuthGate.tsx` | Пользовательский UI-компонент: server auth gate. |
| `client/src/components/Settings.tsx` | Пользовательский UI-компонент: settings. |
| `client/src/components/TooltipButton.tsx` | Пользовательский UI-компонент: tooltip button. |
| `client/src/components/useEntryDebugTooltip.ts` | Пользовательский UI-компонент: use entry debug tooltip. |
| `client/src/components/VaultGate.tsx` | Пользовательский UI-компонент: vault gate. |
| `client/src/features/auth/authApi.ts` | Клиентская feature server-auth: auth api. |
| `client/src/features/auth/useServerAuth.ts` | Клиентская feature server-auth: use server auth. |
| `client/src/features/editor/editorInsight.ts` | Клиентская feature редактора: editor insight. |
| `client/src/features/editor/editorPlaceholder.ts` | Клиентская feature редактора: editor placeholder. |
| `client/src/features/editor/editorTagUtils.ts` | Клиентская feature редактора: editor tag utils. |
| `client/src/features/editor/useEditorDraft.ts` | Владеет жизненным циклом черновика и записи: автосохранение, локальная запись, удаление пустых записей и постановка sync/extraction jobs. |
| `client/src/features/editor/useEditorTagControls.ts` | Клиентская feature редактора: use editor tag controls. |
| `client/src/features/emotion/localEmotion.ts` | Локальный эксперимент извлечения emotion evidence: local emotion. |
| `client/src/features/entries/entriesApi.ts` | Клиентская feature архива записей: entries api. |
| `client/src/features/entries/entryFilters.ts` | Клиентская feature архива записей: entry filters. |
| `client/src/features/entries/entrySearch.ts` | Чистый поисковый движок архива: разбор запроса, индексирование, lexical/semantic scoring и построение snippets. |
| `client/src/features/entries/entryState.ts` | Клиентская feature архива записей: entry state. |
| `client/src/features/entries/useEntries.ts` | Клиентская feature архива записей: use entries. |
| `client/src/features/entries/useEntrySearch.ts` | Клиентская feature архива записей: use entry search. |
| `client/src/features/exportImport/exportPackage.ts` | Локальный export/import: export package. |
| `client/src/features/exportImport/exportTypes.ts` | Локальный export/import: export types. |
| `client/src/features/exportImport/importApply.ts` | Локальный export/import: import apply. |
| `client/src/features/exportImport/importPackage.ts` | Строгая недоверенная граница импорта: разбирает JSON, запрещает лишние поля и строит безопасный preview. |
| `client/src/features/extraction/extractionApi.ts` | Клиентский адаптер extraction API: extraction api. |
| `client/src/features/insights/insightsApi.ts` | Клиентская feature observations/insights: insights api. |
| `client/src/features/insights/useInsights.ts` | Клиентская feature observations/insights: use insights. |
| `client/src/features/rag/evidencePack.ts` | Локальная evidence-pack и ограниченная интерпретация: evidence pack. |
| `client/src/features/rag/localInterpretation.ts` | Локальная evidence-pack и ограниченная интерпретация: local interpretation. |
| `client/src/features/selfReports/selfReportActions.ts` | Локальные self-reports и синхронизация агрегатов: self report actions. |
| `client/src/features/selfReports/selfReportApi.ts` | Локальные self-reports и синхронизация агрегатов: self report api. |
| `client/src/features/selfReports/selfReportQueue.ts` | Локальные self-reports и синхронизация агрегатов: self report queue. |
| `client/src/features/selfReports/selfReportStorage.ts` | Локальные self-reports и синхронизация агрегатов: self report storage. |
| `client/src/features/selfReports/selfReportTypes.ts` | Локальные self-reports и синхронизация агрегатов: self report types. |
| `client/src/features/semantic/localEmbeddings.ts` | Локальные embeddings и semantic index: local embeddings. |
| `client/src/features/semantic/semanticIndex.ts` | Локальные embeddings и semantic index: semantic index. |
| `client/src/features/settings/components/AccessSettings.tsx` | Состояние и UI настроек: access settings. |
| `client/src/features/settings/components/DataSettings.tsx` | Состояние и UI настроек: data settings. |
| `client/src/features/settings/components/EntriesSettings.tsx` | Состояние и UI настроек: entries settings. |
| `client/src/features/settings/components/InterfaceSettings.tsx` | Состояние и UI настроек: interface settings. |
| `client/src/features/settings/components/SettingsPage.tsx` | Состояние и UI настроек: settings page. |
| `client/src/features/settings/components/SettingsTabList.tsx` | Состояние и UI настроек: settings tab list. |
| `client/src/features/settings/components/settingsTypes.ts` | Состояние и UI настроек: settings types. |
| `client/src/features/settings/components/settingsUi.tsx` | Состояние и UI настроек: settings ui. |
| `client/src/features/settings/extractionSettings.ts` | Состояние и UI настроек: extraction settings. |
| `client/src/features/settings/pendingReextract.ts` | Состояние и UI настроек: pending reextract. |
| `client/src/features/settings/useSettingsState.ts` | Состояние и UI настроек: use settings state. |
| `client/src/features/sync/entryReprocessJob.ts` | Политики и jobs фоновой синхронизации: entry reprocess job. |
| `client/src/features/sync/entryServerSync.ts` | Политики и jobs фоновой синхронизации: entry server sync. |
| `client/src/features/sync/entrySyncJob.ts` | Политики и jobs фоновой синхронизации: entry sync job. |
| `client/src/features/sync/entrySyncPolicy.ts` | Политики и jobs фоновой синхронизации: entry sync policy. |
| `client/src/features/sync/queue.ts` | Политики и jobs фоновой синхронизации: queue. |
| `client/src/features/sync/queueTypes.ts` | Политики и jobs фоновой синхронизации: queue types. |
| `client/src/features/sync/reprocessPolicy.ts` | Политики и jobs фоновой синхронизации: reprocess policy. |
| `client/src/features/sync/syncQueue.ts` | Регистрирует обработчики durable queue и маршрутизирует jobs синхронизации, reprocess и self-report. |
| `client/src/features/sync/useQueueWakeups.ts` | Политики и jobs фоновой синхронизации: use queue wakeups. |
| `client/src/features/sync/useSyncQueue.ts` | Политики и jobs фоновой синхронизации: use sync queue. |
| `client/src/features/vault/useLocalVault.ts` | React/API-адаптеры локального vault: use local vault. |
| `client/src/features/vault/vaultApi.ts` | React/API-адаптеры локального vault: vault api. |
| `client/src/i18n/i18nContext.ts` | Интернационализация интерфейса: i18n context. |
| `client/src/i18n/I18nProvider.tsx` | Интернационализация интерфейса: i18n provider. |
| `client/src/i18n/languages.ts` | Интернационализация интерфейса: languages. |
| `client/src/i18n/messages.ts` | Интернационализация интерфейса: messages. |
| `client/src/i18n/useI18n.ts` | Интернационализация интерфейса: use i18n. |
| `client/src/index.css` | Стили соответствующей клиентской поверхности. |
| `client/src/lib/api.ts` | Низкоуровневый HTTP-клиент всех backend API с CSRF, cookie auth и классификацией ошибок. |
| `client/src/lib/appLock.ts` | Низкоуровневая клиентская библиотека: app lock. |
| `client/src/lib/athenaInsightPhraseLibraries.ts` | Низкоуровневая клиентская библиотека: athena insight phrase libraries. |
| `client/src/lib/athenaInsightPhrasesDe.ts` | Низкоуровневая клиентская библиотека: athena insight phrases de. |
| `client/src/lib/athenaInsightPhrasesEn.ts` | Низкоуровневая клиентская библиотека: athena insight phrases en. |
| `client/src/lib/athenaInsightPhrasesRu.ts` | Низкоуровневая клиентская библиотека: athena insight phrases ru. |
| `client/src/lib/athenaInsightPhrasesTypes.ts` | Низкоуровневая клиентская библиотека: athena insight phrases types. |
| `client/src/lib/athenaInsightPhrasesUk.ts` | Низкоуровневая клиентская библиотека: athena insight phrases uk. |
| `client/src/lib/athenaPhraseLibraries.ts` | Низкоуровневая клиентская библиотека: athena phrase libraries. |
| `client/src/lib/athenaPhrasesDe.ts` | Низкоуровневая клиентская библиотека: athena phrases de. |
| `client/src/lib/athenaPhrasesEn.ts` | Низкоуровневая клиентская библиотека: athena phrases en. |
| `client/src/lib/athenaPhrasesRu.ts` | Низкоуровневая клиентская библиотека: athena phrases ru. |
| `client/src/lib/athenaPhrasesTypes.ts` | Низкоуровневая клиентская библиотека: athena phrases types. |
| `client/src/lib/athenaPhrasesUk.ts` | Низкоуровневая клиентская библиотека: athena phrases uk. |
| `client/src/lib/athenaPlaceholder.ts` | Низкоуровневая клиентская библиотека: athena placeholder. |
| `client/src/lib/dates.ts` | Низкоуровневая клиентская библиотека: dates. |
| `client/src/lib/extraction.ts` | Низкоуровневая клиентская библиотека: extraction. |
| `client/src/lib/insightPhrases.ts` | Низкоуровневая клиентская библиотека: insight phrases. |
| `client/src/lib/insightText.ts` | Низкоуровневая клиентская библиотека: insight text. |
| `client/src/lib/offline.ts` | Низкоуровневая клиентская библиотека: offline. |
| `client/src/lib/phrasePicker.ts` | Низкоуровневая клиентская библиотека: phrase picker. |
| `client/src/lib/plainInsightPhraseLibraries.ts` | Низкоуровневая клиентская библиотека: plain insight phrase libraries. |
| `client/src/lib/queue.ts` | Исполнитель durable queue: регистрация handlers, retries/backoff, блокировка, recovery и публикация snapshots состояния. |
| `client/src/lib/queueErrors.ts` | Низкоуровневая клиентская библиотека: queue errors. |
| `client/src/lib/queueStorage.ts` | IndexedDB-репозиторий durable queue и операции обслуживания очереди. |
| `client/src/lib/queueTypes.ts` | Низкоуровневая клиентская библиотека: queue types. |
| `client/src/lib/serviceWorker.ts` | Низкоуровневая клиентская библиотека: service worker. |
| `client/src/lib/signals.ts` | Клиентская нормализация Signal и детерминированное отображение evidence в метрики. |
| `client/src/lib/signalVersions.ts` | Низкоуровневая клиентская библиотека: signal versions. |
| `client/src/lib/storage.ts` | Главный browser persistence gateway: IndexedDB entries/drafts, profile-scoped localStorage, шифрование и локальные миграции. |
| `client/src/lib/text.ts` | Низкоуровневая клиентская библиотека: text. |
| `client/src/lib/vault.ts` | Криптографическое ядро локального vault: credentials, data key, PBKDF2, AES-GCM, lock/unlock и шифрование JSON. |
| `client/src/lib/vaultMigration.ts` | Низкоуровневая клиентская библиотека: vault migration. |
| `client/src/lib/vaultProfiles.ts` | Низкоуровневая клиентская библиотека: vault profiles. |
| `client/src/main.tsx` | Точка запуска React-клиента: подключает стили, i18n, корневой App и service worker. |
| `client/src/types.ts` | Проектный файл: types. |

### Server runtime

| Файл | Ответственность |
| --- | --- |
| `server/api/analytics.route.ts` | Express router HTTP API: analytics route. |
| `server/api/auth.route.ts` | Express router HTTP API: auth route. |
| `server/api/config.route.ts` | Express router HTTP API: config route. |
| `server/api/entries.route.ts` | Express router HTTP API: entries route. |
| `server/api/exports.route.ts` | Express router HTTP API: exports route. |
| `server/api/extractions.route.ts` | Express router HTTP API: extractions route. |
| `server/api/http.ts` | Express router HTTP API: http. |
| `server/api/insights.route.ts` | Express router HTTP API: insights route. |
| `server/api/self-reports.route.ts` | Express router HTTP API: self reports route. |
| `server/app.ts` | Собирает Express middleware и API routers, затем раздаёт собранный frontend. |
| `server/config/constants.ts` | Конфигурация backend: constants. |
| `server/config/env.ts` | Конфигурация backend: env. |
| `server/config/load-env.ts` | Конфигурация backend: load env. |
| `server/config/versions.ts` | Конфигурация backend: versions. |
| `server/core/analytics-v2.schema.ts` | Доменные схемы, типы и чистые mapper-функции backend: analytics v2 schema. |
| `server/core/auth.schema.ts` | Доменные схемы, типы и чистые mapper-функции backend: auth schema. |
| `server/core/entry.schema.ts` | Доменные схемы, типы и чистые mapper-функции backend: entry schema. |
| `server/core/extraction.schema.ts` | Доменные схемы, типы и чистые mapper-функции backend: extraction schema. |
| `server/core/markers.ts` | Доменные схемы, типы и чистые mapper-функции backend: markers. |
| `server/core/self-report.schema.ts` | Доменные схемы, типы и чистые mapper-функции backend: self report schema. |
| `server/core/signal.mapper.ts` | Доменные схемы, типы и чистые mapper-функции backend: signal mapper. |
| `server/core/signal.schema.ts` | Доменные схемы, типы и чистые mapper-функции backend: signal schema. |
| `server/core/types.ts` | Доменные схемы, типы и чистые mapper-функции backend: types. |
| `server/db/migrate.ts` | SQLite bootstrap и миграции: migrate. |
| `server/db/migration-runner.ts` | Планирует, проверяет и атомарно применяет SQL-миграции с integrity checks. |
| `server/db/sqlite.ts` | Открывает SQLite и сериализует write transactions. |
| `server/middleware/auth.middleware.ts` | Express middleware: auth middleware. |
| `server/middleware/error.middleware.ts` | Express middleware: error middleware. |
| `server/repositories/analytics-v2.repository.ts` | SQL repository без продуктовой оркестрации: analytics v2 repository. |
| `server/repositories/analytics.repository.ts` | SQL repository без продуктовой оркестрации: analytics repository. |
| `server/repositories/auth.repository.ts` | SQL repository без продуктовой оркестрации: auth repository. |
| `server/repositories/entry.repository.ts` | SQL repository без продуктовой оркестрации: entry repository. |
| `server/repositories/insight.repository.ts` | SQL repository без продуктовой оркестрации: insight repository. |
| `server/repositories/self-report.repository.ts` | SQL repository без продуктовой оркестрации: self report repository. |
| `server/repositories/signal.repository.ts` | SQL repository без продуктовой оркестрации: signal repository. |
| `server/server.ts` | Исполняемая точка запуска Express-сервера. |
| `server/services/analytics-v2.service.ts` | Детерминированный Analytics V2 pipeline: окна, baseline, оси, density, context, associations, quality и uncertainty. |
| `server/services/analytics.service.ts` | Backend service с бизнес-оркестрацией: analytics service. |
| `server/services/auth.service.ts` | Backend service с бизнес-оркестрацией: auth service. |
| `server/services/entry.service.ts` | Backend service с бизнес-оркестрацией: entry service. |
| `server/services/export.service.ts` | Backend service с бизнес-оркестрацией: export service. |
| `server/services/extraction.service.ts` | Оркестрирует Ollama/Gemini/off extraction, prompt, provider status, timeout/error mapping и fallback. |
| `server/services/insight-input.service.ts` | Backend service с бизнес-оркестрацией: insight input service. |
| `server/services/insight-v3.service.ts` | Backend service с бизнес-оркестрацией: insight v3 service. |
| `server/services/insight.service.ts` | Оркестрирует day/week/month snapshots: sufficiency gates, Analytics V2, Insight V3, persistence и retention. |
| `server/services/observation.service.ts` | Backend service с бизнес-оркестрацией: observation service. |
| `server/services/sanitization.service.ts` | Backend service с бизнес-оркестрацией: sanitization service. |
| `server/services/self-report.service.ts` | Backend service с бизнес-оркестрацией: self report service. |

### Shared contracts

| Файл | Ответственность |
| --- | --- |
| `shared/contracts/entries.ts` | Общий runtime/type контракт клиента и сервера: entries. |
| `shared/contracts/extraction.ts` | Общий runtime/type контракт клиента и сервера: extraction. |
| `shared/contracts/index.ts` | Публичный barrel общих client/server контрактов. |
| `shared/contracts/insights.ts` | Общий runtime/type контракт клиента и сервера: insights. |
| `shared/contracts/selfReports.ts` | Общий runtime/type контракт клиента и сервера: self reports. |
| `shared/contracts/signal.ts` | Общий runtime/type контракт клиента и сервера: signal. |
| `shared/contracts/signalAnalysis.ts` | Детерминированно выводит intent, структуру и временной контекст из одной записи и её metadata. |
| `shared/README.md` | Ручная документация по теме, обозначенной именем файла. |

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

### Tests

| Файл | Ответственность |
| --- | --- |
| `test/analytics-v2.test.js` | Node test для соответствующего сценария: analytics v2 test. |
| `test/analytics.test.js` | Node test для соответствующего сценария: analytics test. |
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
| `test/local-emotion.test.js` | Node test для соответствующего сценария: local emotion test. |
| `test/migrations.test.js` | Node test для соответствующего сценария: migrations test. |
| `test/privacy-boundary.test.js` | Node test для соответствующего сценария: privacy boundary test. |
| `test/privacy-export.test.js` | Node test для соответствующего сценария: privacy export test. |
| `test/queue-errors.test.js` | Node test для соответствующего сценария: queue errors test. |
| `test/reprocess-policy.test.js` | Node test для соответствующего сценария: reprocess policy test. |
| `test/sanitization.test.js` | Node test для соответствующего сценария: sanitization test. |
| `test/self-reports.test.js` | Node test для соответствующего сценария: self reports test. |
| `test/signal-context.test.js` | Node test для соответствующего сценария: signal context test. |
| `test/signal-fixtures.js` | Node test для соответствующего сценария: signal fixtures. |
| `test/signal-pipeline.test.js` | Node test для соответствующего сценария: signal pipeline test. |
| `test/vault-crypto.test.js` | Node test для соответствующего сценария: vault crypto test. |
| `test/vault-migration.test.js` | Node test для соответствующего сценария: vault migration test. |
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

#### `App` — L23–L185 · public API

Собирает внешний access flow приложения: server auth, выбор vault-профиля, локальную разблокировку и переход в AthenaWorkspace.

- Основные вызовы: `useI18n`, `useServerAuth`, `useLocalVault`, `useState`, `getVaultProfiles`, `getActiveVaultProfileId`, `isAppProtectionEnabled`, `useAppAutoLockPreference`.

#### `activateVaultProfile` — L44–L50 · nested helper в App

Выполняет локальную операцию activate vault profile внутри ответственности этого файла.

- Параметры: `profileId`.

- Основные вызовы: `setActiveVaultProfileId`, `setVaultProfileId`, `reload`.

#### `createAndActivateVaultProfile` — L52–L63 · nested helper в App

Создаёт and activate vault profile из переданных данных, не отдавая вызывающему коду детали сборки.

- Основные вызовы: `addVaultProfile`, `String`, `setVaultProfilesState`, `setActiveVaultProfileId`, `setVaultProfileId`, `reload`.

#### `renameAndRefreshVaultProfile` — L65–L67 · nested helper в App

Выполняет локальную операцию rename and refresh vault profile внутри ответственности этого файла.

- Параметры: `profileId`, `name`.

- Основные вызовы: `setVaultProfilesState`, `renameVaultProfile`.

#### `deleteAndRefreshVaultProfile` — L69–L97 · nested helper в App

Удаляет или очищает and refresh vault profile с необходимыми связанными действиями.

- Параметры: `profileId`.

- Основные вызовы: `window.confirm`, `t`, `deleteAthenaProfileData`, `deleteVaultProfile`, `getActiveVaultProfileId`, `setVaultProfilesState`, `setVaultProfileId`, `reload`.

### `client/src/app/AthenaWorkspace.tsx`

Компонует видимые поверхности Athena и связывает состояние приложения с UI-обработчиками.

#### `AthenaWorkspace` — L80–L316 · public API

Рендерит основную рабочую область и связывает editor, archive, observations, settings и floating panels с фасадом useAthenaApp.

- Параметры: `{ activeVaultProfileId, appProtectionEnabled, autoLockPreference, vaultProfiles, vaultCredentials, onAddVaultCredential, onChangeAutoLockPreference, onCreateVaultProfile, onDeleteVaultProfile, onDeleteVaultCredential, onLockVault, onRenameVaultProfile, onSelectVaultProfile, onRotateVaultSecret, }`.

- Основные вызовы: `useAthenaApp`, `useI18n`, `useState`, `useCallback`, `prepareForVaultLock`, `onLockVault`, `useAthenaAutoLock`, `setIsObservationsOpen`.

#### `handleOpenObservations` — L124–L127 · nested helper в AthenaWorkspace

Исполняет сценарий open observations и координирует его побочные эффекты.

- Основные вызовы: `setIsObservationsOpen`, `refreshObservationHistory`.

#### `handleRefreshObservations` — L129–L131 · nested helper в AthenaWorkspace

Исполняет сценарий refresh observations и координирует его побочные эффекты.

- Основные вызовы: `refreshObservationHistory`.

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

#### `useAthenaApp` — L15–L170 · public API

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

#### `useAthenaLifecycle` — L14–L54 · public API

Управляет React-состоянием, derived values и side effects для athena lifecycle.

- Параметры: `{ initializeDraft, initializeExtractionSettings, refreshEntries, refreshInsights, refreshObservationHistory, setPage, }`.

- Основные вызовы: `useCallback`, `initializeExtractionSettings`, `initializeDraft`, `setPage`, `processPendingReextractEntries`, `refreshEntries`, `refreshInsights`, `refreshObservationHistory`.

### `client/src/app/useAthenaNavigation.ts`

Клиентская оркестрация приложения и lifecycle hook: use athena navigation.

#### `useAthenaNavigation` — L22–L66 · public API

Управляет React-состоянием, derived values и side effects для athena navigation.

- Параметры: `{ editor, entries, insights, draftText, }`.

- Основные вызовы: `useState`, `newBlankPage`, `clearEditorInsight`, `setPage`, `editEntry`, `clearAutosaveTimer`, `persistEditorText`, `activeEntryId`.

#### `newBlankPage` — L30–L34 · nested helper в useAthenaNavigation

Выполняет локальную операцию new blank page внутри ответственности этого файла.

- Основные вызовы: `newBlankPage`, `clearEditorInsight`, `setPage`.

#### `editEntry` — L36–L40 · nested helper в useAthenaNavigation

Выполняет локальную операцию edit entry внутри ответственности этого файла.

- Параметры: `entry`.

- Основные вызовы: `editEntry`, `clearEditorInsight`, `setPage`.

#### `navigate` — L42–L55 · nested helper в useAthenaNavigation

Выполняет локальную операцию navigate внутри ответственности этого файла.

- Параметры: `nextPage`.

- Основные вызовы: `clearAutosaveTimer`, `persistEditorText`, `setPage`, `activeEntryId`, `selectEntry`.

### `client/src/app/useVaultLockPreparation.ts`

Клиентская оркестрация приложения и lifecycle hook: use vault lock preparation.

#### `useVaultLockPreparation` — L4–L18 · public API

Управляет React-состоянием, derived values и side effects для vault lock preparation.

- Параметры: `{ clearAutosaveTimer, draftText, persistEditorText, }`.

- Основные вызовы: `useCallback`, `stopQueueForVaultLock`, `clearAutosaveTimer`, `persistEditorText`.

### `client/src/components/Editor.tsx`

Пользовательский UI-компонент: editor.

#### `Editor` — L42–L268 · public API

Рендерит React-компонент Editor и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ analysisEnabled, availableTags, editingEntryId, entryDate, editorInsight, personaTextEnabled, tags, text, onChangeTags, onChangeText, onNewBlankPage, onToggleAnalysisEnabled, }`.

- Основные вызовы: `useI18n`, `useState`, `useRef`, `useMemo`, `buildAthenaPlaceholder`, `useEditorTagControls`, `useFloatingTextOcclusion`, `useCallback`.

#### `loadOrAttachSelfReport` — L113–L141 · nested helper в Editor

Получает or attach self report из принадлежащего модулю источника данных.

- Основные вызовы: `setSelfReportValues`, `catch`, `persistSelfReport`, `getEntrySelfReport`.

### `client/src/components/editor/EditorActionButtons.tsx`

UI-компонент редактора: editor action buttons.

#### `EditorActionButtons` — L18–L171 · public API

Рендерит React-компонент EditorActionButtons и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ analysisEnabled, selfReportCloseSignal, selfReportValues, onInsertTag, onSelfReportCommit, onNewBlankPage, onToggleAnalysisEnabled, }`.

- Основные вызовы: `useI18n`, `useState`, `useRef`, `useEffect`, `window.clearTimeout`, `setIsSelfReportMenuOpen`, `setIsHeartPulsing`, `setHeartPulseKey`.

#### `handleSelfReportClick` — L41–L54 · nested helper в EditorActionButtons

Исполняет сценарий self report click и координирует его побочные эффекты.

- Основные вызовы: `window.clearTimeout`, `setIsSelfReportMenuOpen`, `setIsHeartPulsing`, `setHeartPulseKey`, `window.setTimeout`.

### `client/src/components/editor/EditorTagChips.tsx`

UI-компонент редактора: editor tag chips.

#### `EditorTagChips` — L14–L85 · public API

Рендерит React-компонент EditorTagChips и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ editingTagIndex, editingTagValue, tags, onCancelEdit, onChangeEditingValue, onCommitEdit, onRemoveTag, onStartEditingTag, }`.

- Основные вызовы: `useI18n`, `onChangeEditingValue`, `preventDefault`, `onCommitEdit`, `onCancelEdit`, `onStartEditingTag`, `t`, `onRemoveTag`.

### `client/src/components/editor/EditorTagMenu.tsx`

UI-компонент редактора: editor tag menu.

#### `EditorTagMenu` — L15–L68 · public API

Рендерит React-компонент EditorTagMenu и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ isOpen, menuPosition, selectedIndex, suggestions, onCommitSuggestion, }`.

- Основные вызовы: `useI18n`, `onCommitSuggestion`, `t`.

### `client/src/components/editor/LineLever.tsx`

UI-компонент редактора: line lever.

#### `LineLever` — L10–L33 · public API

Рендерит React-компонент LineLever и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ label, testId, value, onChange }`.

- Основные вызовы: `onChange`, `Number`.

### `client/src/components/editor/SelfReportMenu.tsx`

UI-компонент редактора: self report menu.

#### `SelfReportMenu` — L58–L172 · public API

Рендерит React-компонент SelfReportMenu и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ externalCloseSignal, isOpen, values: savedValues, onCommit, onClose, }`.

- Основные вызовы: `useI18n`, `useRef`, `useState`, `useEffect`, `setValues`, `setHasInteracted`, `useCallback`, `onCommit`.

#### `handlePointerDown` — L91–L101 · nested helper в SelfReportMenu

Исполняет сценарий pointer down и координирует его побочные эффекты.

- Параметры: `event`.

- Основные вызовы: `closest`, `closePanel`.

#### `setAxisValue` — L116–L122 · nested helper в SelfReportMenu

Изменяет axis value, сохраняя инварианты данного модуля.

- Параметры: `axis`, `value`.

- Основные вызовы: `setHasInteracted`, `setValues`.

#### `getSelfReportDefaultPosition` — L174–L198 · internal helper

Получает self report default position из принадлежащего модулю источника данных.

- Основные вызовы: `parseFloat`, `window.getComputedStyle`, `isFinite`, `Math.min`, `Math.max`.

### `client/src/components/EntriesPage.tsx`

Пользовательский UI-компонент: entries page.

#### `EntriesPage` — L47–L162 · public API

Рендерит React-компонент EntriesPage и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ debugMode, entries, selectedEntryId, searchQuery, includedTags, excludedTags, hasActiveFilters, isSearching, onClearFilters, onDeleteEntry, onEditEntry, onOpenObservations, onSearchQueryChange, onSelectEntry, onToggleEntryAnalysis, onToggleExcludedTag, onToggleTag, }`.

- Основные вызовы: `useI18n`, `useRef`, `useState`, `useEntryColumnCount`, `useMemo`, `distributeEntriesByColumn`, `useEffect`, `setExpandedEntryId`.

#### `handleSelectEntry` — L85–L88 · nested helper в EntriesPage

Исполняет сценарий select entry и координирует его побочные эффекты.

- Параметры: `entryId`.

- Основные вызовы: `setExpandedEntryId`, `onSelectEntry`.

#### `EntriesUtilityPanel` — L164–L262 · internal helper

Рендерит React-компонент EntriesUtilityPanel и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ searchQuery, includedTags, excludedTags, hasActiveFilters, isSearching, onClearFilters, onOpenObservations, onSearchQueryChange, onToggleExcludedTag, onToggleTag, }`.

- Основные вызовы: `useI18n`, `t`, `onSearchQueryChange`.

#### `ActiveTagFilters` — L264–L318 · internal helper

Рендерит React-компонент ActiveTagFilters и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ includedTags, excludedTags, onToggleTag, onToggleExcludedTag, }`.

- Основные вызовы: `useI18n`, `t`, `tagTestIdValue`, `onToggleTag`, `onToggleExcludedTag`.

#### `EntryTile` — L320–L561 · internal helper

Рендерит React-компонент EntryTile и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ debugMode, entry, isExpanded, isSelected, language, searchQuery, onDeleteEntry, onEditEntry, onSelectEntry, onToggleEntryAnalysis, onToggleTag, }`.

- Основные вызовы: `useI18n`, `useEntryDebugTooltip`, `createPortal`, `preventDefault`, `onSelectEntry`, `t`, `stopPropagation`, `onToggleEntryAnalysis`.

#### `handleKeyDown` — L387–L393 · nested helper в EntryTile

Исполняет сценарий key down и координирует его побочные эффекты.

- Параметры: `event`.

- Основные вызовы: `preventDefault`, `onSelectEntry`.

#### `EntryText` — L563–L577 · internal helper

Рендерит React-компонент EntryText и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ text, query }`.

- Основные вызовы: `findSearchHighlightRange`.

#### `findSearchHighlightRange` — L579–L593 · internal helper

Выбирает search highlight range, удовлетворяющий ограничениям текущего сценария.

- Параметры: `text`, `query`.

- Основные вызовы: `parseEntrySearchQuery`, `findCaseInsensitiveRange`.

#### `findCaseInsensitiveRange` — L595–L609 · internal helper

Выбирает case insensitive range, удовлетворяющий ограничениям текущего сценария.

- Параметры: `text`, `term`.

- Основные вызовы: `toLocaleLowerCase`, `indexOf`.

#### `EditIcon` — L611–L628 · internal helper

Рендерит React-компонент EditIcon и связывает его props с соответствующей UI-поверхностью.

#### `CloseIcon` — L630–L641 · internal helper

Рендерит React-компонент CloseIcon и связывает его props с соответствующей UI-поверхностью.

#### `tagTestIdValue` — L643–L645 · internal helper

Возвращает вычисленное значение tag test id value для использования внутри данного модуля.

- Параметры: `tag`.

- Основные вызовы: `replace`, `normalizeTag`.

#### `useEntryColumnCount` — L647–L680 · internal helper

Управляет React-состоянием, derived values и side effects для entry column count.

- Параметры: `containerRef`, `itemCount`.

- Основные вызовы: `useState`, `useEffect`, `getEntryColumnCount`, `setColumnCount`, `updateColumnCount`, `window.addEventListener`, `window.removeEventListener`, `observe`.

#### `updateColumnCount` — L657–L664 · nested helper в useEntryColumnCount

Изменяет column count, сохраняя инварианты данного модуля.

- Основные вызовы: `getEntryColumnCount`, `setColumnCount`.

#### `getEntryColumnCount` — L682–L698 · internal helper

Получает entry column count из принадлежащего модулю источника данных.

- Параметры: `containerWidth`, `itemCount`.

- Основные вызовы: `parseFloat`, `getComputedStyle`, `Math.max`, `Math.floor`, `Math.min`.

#### `distributeEntriesByColumn` — L700–L711 · internal helper

Возвращает вычисленное значение distribute entries by column для использования внутри данного модуля.

- Параметры: `entries`, `columnCount`.

- Основные вызовы: `Array.from`, `Math.max`, `Math.min`, `push`.

### `client/src/components/entryDebugBlocks.ts`

Пользовательский UI-компонент: entry debug blocks.

#### `getEntryDebugBlocks` — L14–L115 · public API

Получает entry debug blocks из принадлежащего модулю источника данных.

- Параметры: `entry`.

- Основные вызовы: `formatNullable`, `Object.entries`, `formatBasis`, `formatNullReasons`, `Object.keys`, `formatEmotionSignals`.

#### `formatDebugValue` — L117–L120 · public API

Преобразует debug value в стабильное представление для UI, сети или хранения.

- Параметры: `value`.

- Основные вызовы: `String`.

#### `formatEntryDebugText` — L122–L133 · public API

Преобразует entry debug text в стабильное представление для UI, сети или хранения.

- Параметры: `blocks`.

- Основные вызовы: `flatMap`, `formatDebugValue`.

#### `formatNullable` — L135–L137 · internal helper

Преобразует nullable в стабильное представление для UI, сети или хранения.

- Параметры: `value`.

#### `formatBasis` — L139–L141 · internal helper

Преобразует basis в стабильное представление для UI, сети или хранения.

- Параметры: `basis`.

#### `formatNullReasons` — L143–L153 · internal helper

Преобразует null reasons в стабильное представление для UI, сети или хранения.

- Параметры: `signals`.

#### `formatEmotionSignals` — L155–L174 · internal helper

Преобразует emotion signals в стабильное представление для UI, сети или хранения.

- Параметры: `signals`.

- Основные вызовы: `getRecord`, `push`, `Object.entries`, `String`.

#### `getRecord` — L176–L180 · internal helper

Получает record из принадлежащего модулю источника данных.

- Параметры: `value`.

- Основные вызовы: `Array.isArray`.

#### Публичные типы, классы и константы

- `type DebugBlock` — L4
- `type DebugRow` — L9

### `client/src/components/EntryDebugTooltip.tsx`

Пользовательский UI-компонент: entry debug tooltip.

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

#### `Icon` — L76–L93 · public API

Рендерит React-компонент Icon и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ name, className, }`.

#### `EyeOpenIcon` — L95–L112 · public API

Рендерит React-компонент EyeOpenIcon и связывает его props с соответствующей UI-поверхностью.

#### `EyeClosedIcon` — L114–L150 · public API

Рендерит React-компонент EyeClosedIcon и связывает его props с соответствующей UI-поверхностью.

#### `HeartIcon` — L152–L163 · public API

Рендерит React-компонент HeartIcon и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ className = "h-4 w-4" }`.

#### `UserCircleIcon` — L165–L194 · public API

Рендерит React-компонент UserCircleIcon и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ className = "h-5 w-5", }`.

#### `GlobeIcon` — L196–L226 · public API

Рендерит React-компонент GlobeIcon и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ className = "h-5 w-5" }`.

### `client/src/components/InsightStrip.tsx`

Пользовательский UI-компонент: insight strip.

#### `InsightStrip` — L9–L29 · public API

Рендерит React-компонент InsightStrip и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ insights }`.

- Основные вызовы: `useI18n`, `t`, `getLayerLabelKey`.

#### `getLayerLabelKey` — L31–L35 · internal helper

Получает layer label key из принадлежащего модулю источника данных.

- Параметры: `layer`.

### `client/src/components/LanguageSelect.tsx`

Пользовательский UI-компонент: language select.

#### `LanguageSelect` — L13–L39 · public API

Рендерит React-компонент LanguageSelect и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ className = "", selectClassName = "", }`.

- Основные вызовы: `useI18n`, `t`, `setLanguage`.

### `client/src/components/Nav.tsx`

Пользовательский UI-компонент: nav.

#### `Nav` — L27–L106 · public API

Рендерит React-компонент Nav и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ canLockAthena, currentPage, isSettingsOpen, onLockAthena, onNavigate, onOpenSettings, }`.

- Основные вызовы: `useI18n`, `t`, `onNavigate`.

### `client/src/components/Observations.tsx`

Пользовательский UI-компонент: observations.

#### `Observations` — L17–L133 · public API

Рендерит React-компонент Observations и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ insights, personaTextEnabled, onClose, onDeleteInsight, onRefresh, }`.

- Основные вызовы: `useI18n`, `groupInsightsByDate`, `t`, `formatLongDate`, `getLayerLabelKey`, `formatPeriod`, `formatInsightText`, `formatGeneratedAt`.

#### `groupInsightsByDate` — L135–L148 · internal helper

Возвращает вычисленное значение insights by date для использования внутри данного модуля.

- Параметры: `insights`.

- Основные вызовы: `set`, `get`, `Array.from`.

#### `compareInsights` — L150–L158 · internal helper

Сравнивает insights для стабильного детерминированного порядка.

- Параметры: `left`, `right`.

- Основные вызовы: `localeCompare`, `layerWeight`.

#### `layerWeight` — L160–L164 · internal helper

Возвращает вычисленное значение layer weight для использования внутри данного модуля.

- Параметры: `layer`.

#### `formatPeriod` — L166–L175 · internal helper

Преобразует period в стабильное представление для UI, сети или хранения.

- Параметры: `insight`, `language`.

- Основные вызовы: `formatLongDate`.

#### `formatGeneratedAt` — L177–L184 · internal helper

Преобразует generated at в стабильное представление для UI, сети или хранения.

- Параметры: `value`, `language`.

- Основные вызовы: `toLocaleString`, `getLocale`.

#### `getLayerLabelKey` — L186–L190 · internal helper

Получает layer label key из принадлежащего модулю источника данных.

- Параметры: `layer`.

### `client/src/components/ServerAuthGate.tsx`

Пользовательский UI-компонент: server auth gate.

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

### `client/src/components/Settings.tsx`

Пользовательский UI-компонент: settings.

Именованных функций нет: файл служит re-export границей.

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

### `client/src/components/useEntryDebugTooltip.ts`

Пользовательский UI-компонент: use entry debug tooltip.

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

### `client/src/components/VaultGate.tsx`

Пользовательский UI-компонент: vault gate.

#### `VaultGate` — L24–L319 · public API

Рендерит React-компонент VaultGate и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ activeProfileId, error, isBusy, profiles, onCreateProfile, onSelectProfile, onUnlock, }`.

- Основные вызовы: `useI18n`, `useState`, `useRef`, `useEffect`, `contains`, `setIsProfileMenuOpen`, `setIsLanguageMenuOpen`, `addEventListener`.

#### `handlePointerDown` — L46–L56 · nested helper в VaultGate

Исполняет сценарий pointer down и координирует его побочные эффекты.

- Параметры: `event`.

- Основные вызовы: `contains`, `setIsProfileMenuOpen`, `setIsLanguageMenuOpen`.

#### `handleKeyDown` — L58–L63 · nested helper в VaultGate

Исполняет сценарий key down и координирует его побочные эффекты.

- Параметры: `event`.

- Основные вызовы: `setIsProfileMenuOpen`, `setIsLanguageMenuOpen`.

#### `handleSubmit` — L74–L93 · nested helper в VaultGate

Исполняет сценарий submit и координирует его побочные эффекты.

- Параметры: `event`.

- Основные вызовы: `preventDefault`, `setLocalError`, `t`, `onUnlock`, `composeVaultSecret`.

#### `handleLanguageSelect` — L95–L98 · nested helper в VaultGate

Исполняет сценарий language select и координирует его побочные эффекты.

- Параметры: `nextLanguage`.

- Основные вызовы: `setLanguage`, `setIsLanguageMenuOpen`.

#### `formatVaultError` — L321–L335 · internal helper

Преобразует vault error в стабильное представление для UI, сети или хранения.

- Параметры: `error`, `t`.

- Основные вызовы: `t`.

### `client/src/features/auth/authApi.ts`

Клиентская feature server-auth: auth api.

Именованных функций нет: файл служит re-export границей.

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

### `client/src/features/editor/useEditorDraft.ts`

Владеет жизненным циклом черновика и записи: автосохранение, локальная запись, удаление пустых записей и постановка sync/extraction jobs.

#### `normalizeDraftTags` — L40–L48 · internal helper

Приводит draft tags к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `tags`.

- Основные вызовы: `Array.from`, `toLocaleLowerCase`, `replace`.

#### `tagsAreEqual` — L50–L55 · internal helper

Сравнивает два набора тегов после одинаковой нормализации, чтобы autosave не реагировал на эквивалентные значения.

- Параметры: `left`, `right`.

- Основные вызовы: `normalizeDraftTags`.

#### `useEditorDraft` — L57–L423 · public API

Управляет черновиком и активной записью, защищает autosave от гонок, пишет локально и ставит textless sync/extraction jobs.

- Параметры: `{ clearSelectedEntry, refreshEntries, selectEntry, }`.

- Основные вызовы: `useState`, `useRef`, `useEffect`, `useCallback`, `normalizeDraftTags`, `tagsAreEqual`, `setDraftStatus`, `getLocalEntry`.

#### `changeText` — L298–L302 · nested helper в useEditorDraft

Обновляет текст текущего draft и помечает editor state ожидающим autosave.

- Параметры: `value`.

- Основные вызовы: `setDraftText`, `setDraftStatus`, `setSaveStatus`.

#### `changeTags` — L304–L310 · nested helper в useEditorDraft

Нормализует новый набор тегов draft и помечает его ожидающим сохранения.

- Параметры: `nextTags`.

- Основные вызовы: `normalizeDraftTags`, `setDraftTags`, `setDraftStatus`, `setSaveStatus`.

#### `toggleAnalysisEnabled` — L312–L316 · nested helper в useEditorDraft

Переключает пользовательское разрешение на анализ активной записи и инициирует сохранение нового состояния.

- Основные вызовы: `setDraftAnalysisEnabled`, `setDraftStatus`, `setSaveStatus`.

#### `newBlankPage` — L318–L324 · nested helper в useEditorDraft

Завершает pending autosave текущей страницы, затем очищает editor для новой записи.

- Основные вызовы: `clearAutosaveTimer`, `persistEditorText`, `resetDraftState`, `clearSelectedEntry`.

#### `editEntry` — L326–L348 · nested helper в useEditorDraft

Сохраняет текущий draft и загружает выбранную локальную запись в editor без потери её metadata.

- Параметры: `entry`.

- Основные вызовы: `clearAutosaveTimer`, `persistEditorText`, `normalizeDraftTags`, `setEditingEntryId`, `setDraftText`, `setDraftTags`, `setDraftAnalysisEnabled`, `selectEntry`.

#### `clearIfEditingEntry` — L350–L363 · nested helper в useEditorDraft

Сбрасывает editor только когда удалённая запись сейчас открыта для редактирования.

- Параметры: `entryId`.

- Основные вызовы: `setEditingEntryId`, `setDraftText`, `setDraftTags`, `setDraftAnalysisEnabled`.

#### `resetAfterLocalDataClear` — L365–L377 · nested helper в useEditorDraft

Очищает все editor refs и React state после удаления локальных данных профиля.

- Основные вызовы: `setDraftText`, `setDraftTags`, `setDraftAnalysisEnabled`, `setEditingEntryId`, `setSaveStatus`.

#### `activeEntryId` — L379–L381 · nested helper в useEditorDraft

Возвращает id записи, которой сейчас принадлежит editor draft.

#### `clearAutosaveTimer` — L383–L388 · nested helper в useEditorDraft

Отменяет pending autosave timeout и очищает ссылку на него.

- Основные вызовы: `window.clearTimeout`.

#### `resetDraftState` — L390–L401 · nested helper в useEditorDraft

Возвращает editor draft, refs и статусы сохранения в исходное пустое состояние.

- Основные вызовы: `setEditingEntryId`, `setDraftText`, `setDraftTags`, `setDraftAnalysisEnabled`.

#### `enqueuePendingEntrySyncJob` — L425–L445 · internal helper

Оркестрирует pending entry sync job в инфраструктуре синхронизации или фоновой очереди.

- Параметры: `{ analysisEnabled, entryId, sourceTextHash, localRevision, }`.

- Основные вызовы: `catch`, `enqueueEntrySyncJob`.

#### `enqueuePendingSignalJob` — L447–L468 · internal helper

Оркестрирует pending signal job в инфраструктуре синхронизации или фоновой очереди.

- Параметры: `{ analysisEnabled, entryId, serverId, sourceTextHash, }`.

- Основные вызовы: `catch`, `enqueueEntrySignalReprocessJob`.

#### Публичные типы, классы и константы

- `type DraftStatus` — L25
- `type SaveStatus` — L26

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

### `client/src/features/emotion/localEmotion.ts`

Локальный эксперимент извлечения emotion evidence: local emotion.

#### `extractLocalEmotionSignals` — L66–L122 · public API

Извлекает local emotion signals из входных данных без самостоятельного сохранения результата.

- Параметры: `text`.

- Основные вызовы: `emotionFailure`, `withRawTextNetworkGuard`, `loadEmotionPipeline`, `nowMs`, `classifier`, `normalizeEmotionClassifierOutput`, `String`.

#### `normalizeEmotionClassifierOutput` — L124–L162 · public API

Приводит emotion classifier output к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `output`, `timings`.

- Основные вызовы: `Array.isArray`, `normalizeEmotionLabel`, `roundScore`, `Math.max`, `Math.round`.

#### `mergeLocalEmotionSignals` — L164–L179 · public API

Преобразует или объединяет local emotion signals по правилам домена.

- Параметры: `extraction`, `emotion`.

- Основные вызовы: `mapSignalCandidate`.

#### `requestContainsRawText` — L181–L195 · public API

Выполняет внешний запрос для contains raw text и нормализует результат или ошибку.

- Параметры: `input`, `init`, `rawText`.

- Основные вызовы: `stringifyRequestPart`, `encodeURIComponent`.

#### `loadEmotionPipeline` — L197–L234 · internal helper

Получает emotion pipeline из принадлежащего модулю источника данных.

- Основные вызовы: `nowMs`, `pipeline`, `getEmotionRuntimeDevice`.

#### `withRawTextNetworkGuard` — L236–L257 · internal helper

Возвращает вычисленное значение with raw text network guard для использования внутри данного модуля.

- Параметры: `rawText`, `callback`.

- Основные вызовы: `bind`, `requestContainsRawText`, `originalFetch`, `callback`.

#### `emotionFailure` — L259–L270 · internal helper

Возвращает вычисленное значение emotion failure для использования внутри данного модуля.

- Параметры: `reason`, `message`.

#### `normalizeEmotionLabel` — L272–L279 · internal helper

Приводит emotion label к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `label`.

- Основные вызовы: `replace`, `toLocaleLowerCase`.

#### `roundScore` — L281–L283 · internal helper

Ограничивает score допустимым диапазоном или точностью.

- Параметры: `score`.

- Основные вызовы: `Math.round`, `Math.max`, `Math.min`.

#### `stringifyRequestPart` — L285–L294 · internal helper

Преобразует stringify request part в стабильное представление для UI, сети или хранения.

- Параметры: `value`.

- Основные вызовы: `String`.

#### `nowMs` — L296–L298 · internal helper

Возвращает вычисленное значение now ms для использования внутри данного модуля.

- Основные вызовы: `now`.

#### `getEmotionRuntimeDevice` — L300–L302 · internal helper

Получает emotion runtime device из принадлежащего модулю источника данных.

#### Публичные типы, классы и константы

- `const CEDR_EMOTION_CANDIDATE_MODEL` — L4
- `const ONNX_EMOTION_SPIKE_MODEL` — L6
- `type LocalEmotionSignals` — L14
- `type LocalEmotionResult` — L35

### `client/src/features/entries/entriesApi.ts`

Клиентская feature архива записей: entries api.

Именованных функций нет: файл служит re-export границей.

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

#### `mergeEntryState` — L10–L50 · public API

Преобразует или объединяет entry state по правилам домена.

- Параметры: `localEntry`, `serverEntry`.

- Основные вызовы: `normalizeSignal`, `normalizeMetadata`.

#### `mergeServerEntryIntoView` — L52–L68 · public API

Преобразует или объединяет server entry into view по правилам домена.

- Параметры: `entry`, `serverEntry`.

- Основные вызовы: `normalizeSignal`, `normalizeMetadata`.

#### `sortEntries` — L70–L77 · public API

Сравнивает entries для стабильного детерминированного порядка.

- Параметры: `entriesToSort`, `direction`.

- Основные вызовы: `compareEntries`.

#### `normalizeMetadata` — L79–L88 · internal helper

Приводит metadata к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `metadata`.

#### `compareEntries` — L90–L104 · internal helper

Сравнивает entries для стабильного детерминированного порядка.

- Параметры: `left`, `right`, `direction`.

- Основные вызовы: `localeCompare`.

### `client/src/features/entries/useEntries.ts`

Клиентская feature архива записей: use entries.

#### `useEntries` — L20–L205 · public API

Управляет React-состоянием, derived values и side effects для entries.

- Основные вызовы: `useState`, `useRef`, `getEntrySortDirection`, `useEntrySearch`, `useEffect`, `useCallback`, `loadServerEntry`, `setEntries`.

#### `changeEntrySortDirection` — L161–L164 · nested helper в useEntries

Обновляет или переключает change entry sort direction и связанные derived state.

- Параметры: `nextValue`.

- Основные вызовы: `setEntrySortDirection`, `persistEntrySortDirection`.

#### `resetEntries` — L166–L171 · nested helper в useEntries

Сбрасывает reset entries в исходное согласованное состояние.

- Основные вызовы: `setEntries`, `setSelectedEntryId`, `clearFilters`.

#### `selectEntry` — L173–L179 · nested helper в useEntries

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

#### `buildLocalExportPackage` — L41–L64 · public API

Создаёт local export package из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `input`.

- Основные вызовы: `toISOString`, `createExportSource`, `toLocalExportSettings`, `sanitizeQueueJobsForExport`, `assertValidLocalExportPackage`.

#### `createExportSource` — L66–L79 · public API

Создаёт export source из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `input`.

#### `toLocalExportEntry` — L81–L95 · public API

Возвращает вычисленное значение to local export entry для использования внутри данного модуля.

- Параметры: `entry`.

- Основные вызовы: `Array.from`.

#### `toLocalExportSelfReportEvent` — L97–L109 · public API

Возвращает вычисленное значение to local export self report event для использования внутри данного модуля.

- Параметры: `event`.

- Основные вызовы: `toLocalExportSelfReportValues`.

#### `toLocalExportSelfReportValues` — L111–L121 · public API

Возвращает вычисленное значение to local export self report values для использования внутри данного модуля.

- Параметры: `values`.

- Основные вызовы: `normalizeSelfReportValue`.

#### `toLocalExportSettings` — L123–L160 · public API

Возвращает вычисленное значение to local export settings для использования внутри данного модуля.

- Параметры: `settings`.

#### `sanitizeQueueJobsForExport` — L162–L184 · public API

Приводит sanitize queue jobs for export к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `jobs`.

- Основные вызовы: `isExportableQueueStatus`, `extractSafeQueueReason`.

#### `assertValidLocalExportPackage` — L186–L259 · public API

Проверяет корректность valid local export package и явно отклоняет нарушение контракта.

- Параметры: `packageData`.

- Основные вызовы: `assertCondition`, `assertIsoDate`, `assertExportSource`, `assertNonEmptyString`, `has`, `add`, `assertLocalDay`, `Array.isArray`.

#### `isExportableQueueStatus` — L261–L265 · internal helper

Проверяет условие exportable queue status и возвращает логический результат без изменения состояния.

- Параметры: `status`.

#### `extractSafeQueueReason` — L267–L277 · internal helper

Извлекает safe queue reason из входных данных без самостоятельного сохранения результата.

- Параметры: `job`.

- Основные вызовы: `Array.isArray`, `has`.

#### `normalizeSelfReportValue` — L279–L284 · internal helper

Приводит self report value к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `value`.

- Основные вызовы: `isFinite`, `Math.max`, `Math.min`, `Math.round`.

#### `assertExportSource` — L286–L308 · internal helper

Проверяет корректность export source и явно отклоняет нарушение контракта.

- Параметры: `source`.

- Основные вызовы: `assertCondition`.

#### `assertSelfReportValue` — L310–L315 · internal helper

Проверяет корректность self report value и явно отклоняет нарушение контракта.

- Параметры: `value`.

- Основные вызовы: `assertCondition`, `isInteger`.

#### `assertLocalDay` — L317–L321 · internal helper

Проверяет корректность local day и явно отклоняет нарушение контракта.

- Параметры: `value`, `message`.

- Основные вызовы: `assertCondition`, `test`, `isNaN`, `getTime`.

#### `assertIsoDate` — L323–L326 · internal helper

Проверяет корректность iso date и явно отклоняет нарушение контракта.

- Параметры: `value`, `message`.

- Основные вызовы: `assertCondition`, `isNaN`, `getTime`.

#### `assertNonEmptyString` — L328–L330 · internal helper

Проверяет корректность non empty string и явно отклоняет нарушение контракта.

- Параметры: `value`, `message`.

- Основные вызовы: `assertCondition`.

#### `assertCondition` — L332–L336 · internal helper

Проверяет корректность condition и явно отклоняет нарушение контракта.

- Параметры: `condition`, `message`.

### `client/src/features/exportImport/exportTypes.ts`

Локальный export/import: export types.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `const ATHENA_EXPORT_APP_ID` — L5
- `const LOCAL_EXPORT_VERSION` — L6
- `const BACKEND_METADATA_EXPORT_VERSION` — L7
- `const EXPORT_SIGNAL_SCHEMA_VERSION` — L9
- `const EXPORT_PROMPT_VERSION` — L10
- `const EXPORT_SELF_REPORT_SCHEMA_VERSION` — L11
- `const EXPORT_SELF_REPORT_DAILY_AGGREGATE_VERSION` — L12
- `const EXPORTABLE_QUEUE_STATUSES` — L15
- `type ExportableQueueStatus` — L22
- `type LocalExportSourceV1` — L24
- `type LocalExportEntryV1` — L32
- `type LocalExportSelfReportValuesV1` — L46
- `type LocalExportSelfReportEventV1` — L54
- `type LocalExportSettingsV1` — L64
- `type QueueExportSummaryV1` — L73
- `type AthenaLocalExportV1` — L81
- `type BuildLocalExportPackageInput` — L96
- `type AthenaBackendMetadataExportV1` — L106

### `client/src/features/exportImport/importApply.ts`

Локальный export/import: import apply.

#### `applyLocalImportReplace` — L43–L69 · public API

Преобразует или объединяет local import replace по правилам домена.

- Параметры: `packageData`, `storage`.

- Основные вызовы: `validateLocalExportPackage`, `Promise.all`, `replaceEntries`, `replaceSelfReportEvents`.

#### `toImportedLocalEntry` — L71–L89 · public API

Возвращает вычисленное значение to imported local entry для использования внутри данного модуля.

- Параметры: `entry`.

- Основные вызовы: `createTextHash`, `createFallbackSignal`, `createImportFallbackMetadata`.

#### `toImportedSelfReportEvent` — L91–L104 · public API

Возвращает вычисленное значение to imported self report event для использования внутри данного модуля.

- Параметры: `event`.

- Основные вызовы: `toSelfReportValues`.

#### `toSelfReportValues` — L106–L116 · public API

Возвращает вычисленное значение to self report values для использования внутри данного модуля.

- Параметры: `values`.

- Основные вызовы: `normalizeSelfReportValue`.

#### `normalizeSelfReportValue` — L118–L123 · internal helper

Приводит self report value к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `value`.

- Основные вызовы: `isFinite`, `Math.max`, `Math.min`, `Math.round`.

#### `createFallbackSignal` — L125–L152 · internal helper

Создаёт fallback signal из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `entryDate`.

#### `createImportFallbackMetadata` — L154–L163 · internal helper

Создаёт import fallback metadata из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `createdAt`.

#### Публичные типы, классы и константы

- `type LocalImportApplyMode` — L19
- `type LocalImportApplyResult` — L21
- `type LocalImportApplyStorage` — L31

### `client/src/features/exportImport/importPackage.ts`

Строгая недоверенная граница импорта: разбирает JSON, запрещает лишние поля и строит безопасный preview.

#### `parseAndValidateLocalExportJson` — L164–L180 · public API

Разбирает and validate local export json и преобразует вход в типизированное представление.

- Параметры: `jsonText`.

- Основные вызовы: `validateLocalExportPackage`.

#### `validateLocalExportPackage` — L182–L214 · public API

Строго проверяет полную структуру import package, версии, даты, допустимые ключи и отсутствие запрещённых данных.

- Параметры: `value`.

- Основные вызовы: `assertNoForbiddenKeys`, `assertPlainObject`, `assertAllowedKeys`, `assertEquals`, `readIsoDate`, `validateSource`, `validateEntries`, `validateSelfReports`.

#### `buildLocalImportPreview` — L216–L292 · public API

Создаёт local import preview из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `packageData`, `currentData`.

- Основные вызовы: `validateLocalExportPackage`, `Array.from`, `has`, `localeCompare`, `push`, `at`.

#### `validateSource` — L294–L325 · internal helper

Проверяет корректность source и явно отклоняет нарушение контракта.

- Параметры: `value`.

- Основные вызовы: `assertPlainObject`, `assertAllowedKeys`, `readNullableString`, `readExact`.

#### `validateEntries` — L327–L383 · internal helper

Проверяет корректность entries и явно отклоняет нарушение контракта.

- Параметры: `value`.

- Основные вызовы: `assertCondition`, `Array.isArray`, `assertPlainObject`, `assertAllowedKeys`, `readNonEmptyString`, `has`, `add`, `readNullableString`.

#### `validateSelfReports` — L385–L440 · internal helper

Проверяет корректность self reports и явно отклоняет нарушение контракта.

- Параметры: `value`.

- Основные вызовы: `assertPlainObject`, `assertAllowedKeys`, `assertCondition`, `Array.isArray`, `readNonEmptyString`, `has`, `add`, `readLocalDay`.

#### `validateSelfReportValues` — L442–L453 · internal helper

Проверяет корректность self report values и явно отклоняет нарушение контракта.

- Параметры: `value`.

- Основные вызовы: `assertPlainObject`, `assertAllowedKeys`, `readNullableSelfReportValue`.

#### `validateSettings` — L455–L513 · internal helper

Проверяет корректность settings и явно отклоняет нарушение контракта.

- Параметры: `value`.

- Основные вызовы: `assertPlainObject`, `assertAllowedKeys`, `assertCondition`, `readNonEmptyString`, `readBoolean`.

#### `validateQueue` — L515–L529 · internal helper

Проверяет корректность queue и явно отклоняет нарушение контракта.

- Параметры: `value`.

- Основные вызовы: `assertPlainObject`, `assertAllowedKeys`, `assertCondition`, `Array.isArray`, `validateQueueExportSummary`.

#### `validateQueueExportSummary` — L531–L565 · internal helper

Проверяет корректность queue export summary и явно отклоняет нарушение контракта.

- Параметры: `value`, `index`.

- Основные вызовы: `assertPlainObject`, `assertAllowedKeys`, `readNonEmptyString`, `assertCondition`, `has`, `readNullableString`.

#### `assertNoForbiddenKeys` — L567–L582 · internal helper

Проверяет корректность no forbidden keys и явно отклоняет нарушение контракта.

- Параметры: `value`, `path`.

- Основные вызовы: `Array.isArray`, `assertNoForbiddenKeys`, `isPlainObject`, `Object.entries`, `assertCondition`, `has`.

#### `assertAllowedKeys` — L584–L594 · internal helper

Проверяет корректность allowed keys и явно отклоняет нарушение контракта.

- Параметры: `value`, `allowedKeys`, `context`.

- Основные вызовы: `Object.keys`, `assertCondition`, `has`.

#### `assertPlainObject` — L596–L602 · internal helper

Проверяет корректность plain object и явно отклоняет нарушение контракта.

- Параметры: `value`, `message`.

- Основные вызовы: `assertCondition`, `isPlainObject`.

#### `isPlainObject` — L604–L606 · internal helper

Проверяет условие plain object и возвращает логический результат без изменения состояния.

- Параметры: `value`.

- Основные вызовы: `Array.isArray`.

#### `readExact` — L608–L616 · internal helper

Получает exact из принадлежащего модулю источника данных.

- Параметры: `object`, `key`, `expected`, `message`.

- Основные вызовы: `assertEquals`.

#### `readString` — L618–L626 · internal helper

Получает string из принадлежащего модулю источника данных.

- Параметры: `object`, `key`, `message`.

- Основные вызовы: `assertCondition`.

#### `readNonEmptyString` — L628–L636 · internal helper

Получает non empty string из принадлежащего модулю источника данных.

- Параметры: `object`, `key`, `message`.

- Основные вызовы: `readString`, `assertCondition`.

#### `readNullableString` — L638–L649 · internal helper

Получает nullable string из принадлежащего модулю источника данных.

- Параметры: `object`, `key`, `message`.

- Основные вызовы: `assertCondition`.

#### `readBoolean` — L651–L659 · internal helper

Получает boolean из принадлежащего модулю источника данных.

- Параметры: `object`, `key`, `message`.

- Основные вызовы: `assertCondition`.

#### `readNullableNonNegativeInteger` — L661–L676 · internal helper

Получает nullable non negative integer из принадлежащего модулю источника данных.

- Параметры: `object`, `key`, `message`.

- Основные вызовы: `assertCondition`, `isInteger`.

#### `readStringArray` — L678–L704 · internal helper

Получает string array из принадлежащего модулю источника данных.

- Параметры: `object`, `key`, `message`.

- Основные вызовы: `assertCondition`, `Array.isArray`, `has`, `add`, `push`.

#### `readLocalDay` — L706–L714 · internal helper

Получает local day из принадлежащего модулю источника данных.

- Параметры: `object`, `key`, `message`.

- Основные вызовы: `readString`, `assertCondition`, `isValidLocalDay`.

#### `readIsoDate` — L716–L724 · internal helper

Получает iso date из принадлежащего модулю источника данных.

- Параметры: `object`, `key`, `message`.

- Основные вызовы: `readString`, `assertIsoDate`.

#### `readNullableSelfReportValue` — L726–L743 · internal helper

Получает nullable self report value из принадлежащего модулю источника данных.

- Параметры: `object`, `key`.

- Основные вызовы: `assertCondition`, `isInteger`.

#### `readNullableJsonValue` — L745–L757 · internal helper

Получает nullable json value из принадлежащего модулю источника данных.

- Параметры: `object`, `key`, `message`.

- Основные вызовы: `assertJsonValue`.

#### `assertJsonValue` — L759–L784 · internal helper

Проверяет корректность json value и явно отклоняет нарушение контракта.

- Параметры: `value`, `message`.

- Основные вызовы: `assertCondition`, `isFinite`, `Array.isArray`, `assertJsonValue`, `isPlainObject`, `Object.values`.

#### `isValidLocalDay` — L786–L801 · internal helper

Проверяет условие valid local day и возвращает логический результат без изменения состояния.

- Параметры: `value`.

- Основные вызовы: `match`, `Number`, `UTC`, `getUTCFullYear`, `getUTCMonth`, `getUTCDate`.

#### `assertIsoDate` — L803–L808 · internal helper

Проверяет корректность iso date и явно отклоняет нарушение контракта.

- Параметры: `value`, `message`.

- Основные вызовы: `parse`, `assertCondition`, `isNaN`, `toISOString`.

#### `assertEquals` — L810–L816 · internal helper

Проверяет корректность equals и явно отклоняет нарушение контракта.

- Параметры: `actual`, `expected`, `message`.

- Основные вызовы: `assertCondition`.

#### `assertCondition` — L818–L822 · internal helper

Проверяет корректность condition и явно отклоняет нарушение контракта.

- Параметры: `condition`, `message`.

#### Публичные типы, классы и константы

- `type LocalImportCurrentDataSummary` — L143
- `type LocalImportPreview` — L148

### `client/src/features/extraction/extractionApi.ts`

Клиентский адаптер extraction API: extraction api.

Именованных функций нет: файл служит re-export границей.

### `client/src/features/insights/insightsApi.ts`

Клиентская feature observations/insights: insights api.

Именованных функций нет: файл служит re-export границей.

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

Именованных функций нет: файл служит re-export границей.

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

#### `getEntrySelfReport` — L61–L72 · public API

Получает entry self report из принадлежащего модулю источника данных.

- Параметры: `entryId`.

- Основные вызовы: `openAthenaLocalDb`, `transaction`, `index`, `objectStore`, `idbRequest`, `get`, `normalizeSelfReportEvent`, `readStoredSelfReportEvent`.

#### `saveEntrySelfReport` — L74–L106 · public API

Сохраняет entry self report в принадлежащем модулю хранилище или read model.

- Параметры: `{ entryId, localDay, values, }`.

- Основные вызовы: `getEntrySelfReport`, `toISOString`, `normalizeSelfReportValues`, `Array.from`, `encryptSelfReportEvent`, `openAthenaLocalDb`, `transaction`, `idbRequest`.

#### `deleteEntrySelfReport` — L108–L119 · public API

Удаляет или очищает entry self report с необходимыми связанными действиями.

- Параметры: `entryId`.

- Основные вызовы: `getEntrySelfReport`, `openAthenaLocalDb`, `transaction`, `idbRequest`, `delete`, `objectStore`, `recomputeSelfReportDailyAggregates`.

#### `replaceAllSelfReportEvents` — L121–L158 · public API

Сохраняет replace all self report events в принадлежащем модулю хранилище или read model.

- Параметры: `events`.

- Основные вызовы: `Promise.all`, `Array.from`, `openAthenaLocalDb`, `transaction`, `idbRequest`, `clear`, `objectStore`, `put`.

#### `getSelfReportDailyAggregates` — L160–L179 · public API

Получает self report daily aggregates из принадлежащего модулю источника данных.

- Параметры: `localDay`.

- Основные вызовы: `openAthenaLocalDb`, `transaction`, `index`, `objectStore`, `idbRequest`, `getAll`, `Promise.all`, `localeCompare`.

#### `markSelfReportsForLocalDaySynced` — L181–L210 · public API

Изменяет self reports for local day synced, сохраняя инварианты данного модуля.

- Параметры: `localDay`, `syncedThrough`.

- Основные вызовы: `toISOString`, `getSelfReportsForLocalDay`, `Promise.all`, `encryptSelfReportEvent`, `openAthenaLocalDb`, `transaction`, `objectStore`, `idbRequest`.

#### `recomputeSelfReportDailyAggregates` — L212–L243 · public API

Возвращает вычисленное значение recompute self report daily aggregates для использования внутри данного модуля.

- Параметры: `localDay`.

- Основные вызовы: `getSelfReportsForLocalDay`, `buildAxisAggregate`, `Boolean`, `openAthenaLocalDb`, `transaction`, `objectStore`, `idbRequest`, `delete`.

#### `getAllSelfReportEvents` — L245–L259 · public API

Получает all self report events из принадлежащего модулю источника данных.

- Основные вызовы: `openAthenaLocalDb`, `transaction`, `idbRequest`, `getAll`, `objectStore`, `Promise.all`, `readStoredSelfReportEvent`, `localeCompare`.

#### `getSelfReportsForLocalDay` — L261–L274 · internal helper

Получает self reports for local day из принадлежащего модулю источника данных.

- Параметры: `localDay`.

- Основные вызовы: `openAthenaLocalDb`, `transaction`, `index`, `objectStore`, `idbRequest`, `getAll`, `Promise.all`, `readStoredSelfReportEvent`.

#### `migrateSelfReportsToVault` — L276–L281 · public API

Переводит self reports to vault из legacy-формы в текущую без потери поддерживаемых данных.

- Основные вызовы: `openAthenaLocalDb`, `migrateSelfReportEventsToVault`, `migrateSelfReportDailyAggregatesToVault`.

#### `buildAxisAggregate` — L283–L311 · internal helper

Создаёт axis aggregate из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `localDay`, `axis`, `reports`.

- Основные вызовы: `isFinite`, `createAggregateId`, `Math.min`, `Math.max`, `toISOString`.

#### `createAggregateId` — L313–L315 · internal helper

Создаёт aggregate id из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `localDay`, `axis`.

#### `normalizeSelfReportEvent` — L317–L324 · internal helper

Приводит self report event к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `report`.

- Основные вызовы: `normalizeSelfReportValues`.

#### `normalizeSelfReportDailyAggregate` — L326–L334 · internal helper

Приводит self report daily aggregate к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `aggregate`.

#### `normalizeSelfReportValues` — L336–L344 · internal helper

Приводит self report values к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `values`.

- Основные вызовы: `clampSelfReportValue`.

#### `clampSelfReportValue` — L346–L351 · internal helper

Ограничивает self report value допустимым диапазоном или точностью.

- Параметры: `value`.

- Основные вызовы: `isFinite`, `Math.max`, `Math.min`, `Math.round`.

#### `migrateSelfReportEventsToVault` — L353–L368 · internal helper

Переводит self report events to vault из legacy-формы в текущую без потери поддерживаемых данных.

- Параметры: `db`.

- Основные вызовы: `transaction`, `idbRequest`, `getAll`, `objectStore`, `isEncryptedSelfReportEventRecord`, `encryptSelfReportEvent`, `put`.

#### `migrateSelfReportDailyAggregatesToVault` — L370–L393 · internal helper

Переводит self report daily aggregates to vault из legacy-формы в текущую без потери поддерживаемых данных.

- Параметры: `db`.

- Основные вызовы: `transaction`, `idbRequest`, `getAll`, `objectStore`, `isEncryptedSelfReportDailyAggregateRecord`, `encryptSelfReportDailyAggregate`, `put`.

#### `readStoredSelfReportEvent` — L395–L404 · internal helper

Получает stored self report event из принадлежащего модулю источника данных.

- Параметры: `record`.

- Основные вызовы: `isEncryptedSelfReportEventRecord`, `decryptVaultJson`, `createSelfReportVaultAssociatedData`.

#### `readStoredSelfReportDailyAggregate` — L406–L415 · internal helper

Получает stored self report daily aggregate из принадлежащего модулю источника данных.

- Параметры: `record`.

- Основные вызовы: `isEncryptedSelfReportDailyAggregateRecord`, `decryptVaultJson`, `createSelfReportDailyAggregateVaultAssociatedData`.

#### `encryptSelfReportEvent` — L417–L431 · internal helper

Выполняет криптографическое преобразование self report event в рамках локальной privacy boundary.

- Параметры: `report`.

- Основные вызовы: `encryptVaultJson`, `createSelfReportVaultAssociatedData`.

#### `encryptSelfReportDailyAggregate` — L433–L447 · internal helper

Выполняет криптографическое преобразование self report daily aggregate в рамках локальной privacy boundary.

- Параметры: `aggregate`.

- Основные вызовы: `encryptVaultJson`, `createSelfReportDailyAggregateVaultAssociatedData`.

#### `isEncryptedSelfReportEventRecord` — L449–L458 · internal helper

Проверяет условие encrypted self report event record и возвращает логический результат без изменения состояния.

- Параметры: `record`.

- Основные вызовы: `isVaultEncryptedPayload`.

#### `isEncryptedSelfReportDailyAggregateRecord` — L460–L469 · internal helper

Проверяет условие encrypted self report daily aggregate record и возвращает логический результат без изменения состояния.

- Параметры: `record`.

- Основные вызовы: `isVaultEncryptedPayload`.

#### `createSelfReportVaultAssociatedData` — L471–L473 · internal helper

Создаёт self report vault associated data из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `reportId`.

#### `createSelfReportDailyAggregateVaultAssociatedData` — L475–L477 · internal helper

Создаёт self report daily aggregate vault associated data из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `aggregateId`.

#### `idbRequest` — L479–L484 · internal helper

Возвращает вычисленное значение idb request для использования внутри данного модуля.

- Параметры: `request`.

- Основные вызовы: `resolve`, `reject`.

#### Публичные типы, классы и константы

- `type ReplaceSelfReportEventsResult` — L55

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

### `client/src/features/settings/components/AccessSettings.tsx`

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

### `client/src/features/settings/components/DataSettings.tsx`

Состояние и UI настроек: data settings.

#### `DataSettings` — L78–L328 · public API

Рендерит React-компонент DataSettings и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ entries, onImportApplied }`.

- Основные вызовы: `useI18n`, `useRef`, `useState`, `setExportStatus`, `getExtractionSettings`, `buildLocalExportPackage`, `getAllLocalEntries`, `getAllSelfReportEvents`.

#### `handleExportLocalData` — L97–L142 · nested helper в DataSettings

Исполняет сценарий export local data и координирует его побочные эффекты.

- Основные вызовы: `setExportStatus`, `getExtractionSettings`, `buildLocalExportPackage`, `getAllLocalEntries`, `getAllSelfReportEvents`, `getEntrySortDirection`, `getPersonaTextEnabled`, `getLocalEmotionSpikeEnabled`.

#### `handleImportFileChange` — L144–L183 · nested helper в DataSettings

Исполняет сценарий import file change и координирует его побочные эффекты.

- Параметры: `event`.

- Основные вызовы: `setIsReading`, `setPreviewState`, `createIdlePreviewState`, `text`, `parseAndValidateLocalExportJson`, `buildLocalImportPreview`, `formatImportError`.

#### `handleApplyImport` — L185–L218 · nested helper в DataSettings

Исполняет сценарий apply import и координирует его побочные эффекты.

- Основные вызовы: `window.confirm`, `t`, `setPreviewState`, `applyLocalImportReplace`, `onImportApplied`, `formatImportError`.

#### `handleClearPreview` — L220–L222 · nested helper в DataSettings

Исполняет сценарий clear preview и координирует его побочные эффекты.

- Основные вызовы: `setPreviewState`, `createIdlePreviewState`.

#### `createIdlePreviewState` — L330–L339 · internal helper

Создаёт idle preview state из переданных данных, не отдавая вызывающему коду детали сборки.

#### `ImportPreviewCard` — L341–L464 · internal helper

Рендерит React-компонент ImportPreviewCard и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ canApply, isApplying, preview, result, onApply, onClear, }`.

- Основные вызовы: `useI18n`, `t`, `formatDateTime`, `formatDateRange`, `formatCurrentLocalData`, `formatPreviewWarning`.

#### `ImportResultCard` — L466–L502 · internal helper

Рендерит React-компонент ImportResultCard и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ result }`.

- Основные вызовы: `useI18n`, `t`.

#### `PreviewStat` — L504–L517 · internal helper

Рендерит React-компонент PreviewStat и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ label, value, }`.

#### `ResultRow` — L519–L532 · internal helper

Рендерит React-компонент ResultRow и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ label, value, }`.

#### `formatDateRange` — L534–L544 · internal helper

Преобразует date range в стабильное представление для UI, сети или хранения.

- Параметры: `preview`.

#### `formatCurrentLocalData` — L546–L553 · internal helper

Преобразует current local data в стабильное представление для UI, сети или хранения.

- Параметры: `value`, `t`.

- Основные вызовы: `t`.

#### `formatPreviewWarning` — L555–L571 · internal helper

Преобразует preview warning в стабильное представление для UI, сети или хранения.

- Параметры: `warning`, `t`.

- Основные вызовы: `t`.

#### `formatDateTime` — L573–L579 · internal helper

Преобразует date time в стабильное представление для UI, сети или хранения.

- Параметры: `value`.

- Основные вызовы: `parse`, `isNaN`, `toLocaleString`.

#### `formatImportError` — L581–L587 · internal helper

Преобразует import error в стабильное представление для UI, сети или хранения.

- Параметры: `error`.

### `client/src/features/settings/components/EntriesSettings.tsx`

Состояние и UI настроек: entries settings.

#### `EntriesSettings` — L54–L350 · public API

Рендерит React-компонент EntriesSettings и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ canReprocess, debugMode, extractionSettings, extractionStatus, localEmotionSpikeEnabled, localEmotionSpikeResult, localEmotionSpikeStatus, providers, queueSnapshot, reprocessCandidates, reprocessMessage, selectedProvider, onChangeExtractionSettings, onClearLocalData, onClearQueueHistory, onPauseQueue, onRefreshExtractionStatus, onReprocessFallbackEntries, onRetryRecoverableQueueJobs, onRunLocalEmotionSpikeDemo, onStartQueue, onToggleDebugMode, onToggleLocalEmotionSpike, }`.

- Основные вызовы: `useI18n`, `parseQueueErrorDetails`, `formatQueueErrorHint`, `formatQueueProcessingState`, `t`, `formatRunStatus`, `formatEmotionSpikeResult`, `formatStatus`.

#### `QueueStatusBadge` — L352–L362 · internal helper

Рендерит React-компонент QueueStatusBadge и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ status }`.

- Основные вызовы: `formatQueueStatusClass`.

#### `formatQueueProcessingState` — L364–L372 · internal helper

Преобразует queue processing state в стабильное представление для UI, сети или хранения.

- Параметры: `queueSnapshot`, `t`.

- Основные вызовы: `t`.

#### `formatQueueStatusClass` — L374–L392 · internal helper

Преобразует queue status class в стабильное представление для UI, сети или хранения.

- Параметры: `status`.

#### `parseQueueErrorDetails` — L394–L406 · internal helper

Разбирает queue error details и преобразует вход в типизированное представление.

- Параметры: `error`.

- Основные вызовы: `split`, `classifyQueueErrorCode`.

#### `classifyQueueErrorCode` — L408–L455 · internal helper

Возвращает вычисленное значение classify queue error code для использования внутри данного модуля.

- Параметры: `code`.

- Основные вызовы: `startsWith`.

#### `formatQueueErrorHint` — L457–L488 · internal helper

Преобразует queue error hint в стабильное представление для UI, сети или хранения.

- Параметры: `error`, `language`.

#### `formatDateTime` — L490–L496 · internal helper

Преобразует date time в стабильное представление для UI, сети или хранения.

- Параметры: `value`.

- Основные вызовы: `getTime`, `isFinite`, `toLocaleString`.

#### `formatStatus` — L498–L510 · internal helper

Преобразует status в стабильное представление для UI, сети или хранения.

- Параметры: `status`, `t`.

- Основные вызовы: `t`, `formatStatusReason`.

#### `formatStatusReason` — L512–L529 · internal helper

Преобразует status reason в стабильное представление для UI, сети или хранения.

- Параметры: `reason`, `t`.

- Основные вызовы: `t`.

#### `formatProviderLabel` — L531–L542 · internal helper

Преобразует provider label в стабильное представление для UI, сети или хранения.

- Параметры: `provider`, `t`.

- Основные вызовы: `t`.

#### `formatRunStatus` — L544–L556 · internal helper

Преобразует run status в стабильное представление для UI, сети или хранения.

- Параметры: `status`, `t`.

- Основные вызовы: `t`.

#### `formatEmotionSpikeResult` — L558–L576 · internal helper

Преобразует emotion spike result в стабильное представление для UI, сети или хранения.

- Параметры: `result`.

- Основные вызовы: `Object.entries`.

### `client/src/features/settings/components/InterfaceSettings.tsx`

Состояние и UI настроек: interface settings.

#### `InterfaceSettings` — L19–L44 · public API

Рендерит React-компонент InterfaceSettings и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ personaTextEnabled, onTogglePersonaText, }`.

- Основные вызовы: `useI18n`, `t`.

#### `LanguageSettings` — L46–L68 · internal helper

Рендерит React-компонент LanguageSettings и связывает его props с соответствующей UI-поверхностью.

- Основные вызовы: `useI18n`, `t`, `setLanguage`.

### `client/src/features/settings/components/SettingsPage.tsx`

Состояние и UI настроек: settings page.

#### `Settings` — L103–L260 · public API

Рендерит React-компонент Settings и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ activeVaultProfileId, appProtectionEnabled, autoLockPreference, isOnline, debugMode, entries, extractionConfig, extractionSettings, extractionStatus, localEmotionSpikeEnabled, localEmotionSpikeResult, localEmotionSpikeStatus, personaTextEnabled, queueSnapshot, reprocessMessage, reprocessStatus, vaultProfiles, vaultCredentials, onAddVaultCredential, onChangeAutoLockPreference, onClose, onCreateVaultProfile, onDeleteVaultProfile, onDeleteVaultCredential, onLockAthena, onRenameVaultProfile, onSelectVaultProfile, onRotateVaultSecret, onChangeExtractionSettings, onClearLocalData, onClearQueueHistory, onImportApplied, onRefreshExtractionStatus, onReprocessFallbackEntries, onRetryRecoverableQueueJobs, onRunLocalEmotionSpikeDemo, onPauseQueue, onStartQueue, onToggleDebugMode, onToggleLocalEmotionSpike, onTogglePersonaText, }`.

- Основные вызовы: `useI18n`, `useState`, `isSignalReprocessCandidate`, `t`.

### `client/src/features/settings/components/SettingsTabList.tsx`

Состояние и UI настроек: settings tab list.

#### `SettingsTabList` — L9–L32 · public API

Рендерит React-компонент SettingsTabList и связывает его props с соответствующей UI-поверхностью.

- Параметры: `{ activeTab, onChange }`.

- Основные вызовы: `useI18n`, `onChange`, `t`.

### `client/src/features/settings/components/settingsTypes.ts`

Состояние и UI настроек: settings types.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `type SettingsTab` — L3
- `const settingsTabs` — L5
- `type RunStatus` — L12
- `type StatusMessageState` — L14

### `client/src/features/settings/components/settingsUi.tsx`

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

### `client/src/features/settings/extractionSettings.ts`

Состояние и UI настроек: extraction settings.

#### `normalizeExtractionSettings` — L8–L25 · public API

Приводит extraction settings к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `settings`, `config`.

#### Публичные типы, классы и константы

- `const DEFAULT_EXTRACTION_SETTINGS` — L3

### `client/src/features/settings/pendingReextract.ts`

Состояние и UI настроек: pending reextract.

#### `reprocessLocalEntry` — L18–L101 · public API

Возвращает вычисленное значение reprocess local entry для использования внутри данного модуля.

- Параметры: `entry`, `settings`, `signal`.

- Основные вызовы: `extractSignalForText`, `isRetryableProviderErrorCode`, `getLocalEntry`, `toISOString`, `updateLocalEntry`, `syncLocalEntryToServer`, `catch`, `enqueueEntrySyncJob`.

#### `processPendingReextractEntries` — L103–L139 · public API

Исполняет сценарий pending reextract entries и координирует его побочные эффекты.

- Параметры: `settings`.

- Основные вызовы: `getAllLocalEntries`, `isSignalReprocessCandidate`, `push`, `releaseTerminalPendingReextractEntry`, `getRemainingGeminiDailyExtractions`, `enqueueEntrySignalReprocessJob`, `getSignalReprocessReason`.

#### `releaseTerminalPendingReextractEntry` — L141–L155 · internal helper

Исполняет сценарий release terminal pending reextract entry и координирует его побочные эффекты.

- Параметры: `entry`.

- Основные вызовы: `updateLocalEntry`, `catch`, `enqueueEntrySyncJob`.

### `client/src/features/settings/useSettingsState.ts`

Состояние и UI настроек: use settings state.

#### `useSettingsState` — L43–L279 · public API

Управляет React-состоянием, derived values и side effects для settings state.

- Параметры: `language`.

- Основные вызовы: `useState`, `getDebugMode`, `getLocalEmotionSpikeEnabled`, `getPersonaTextEnabled`, `useEffect`, `setLocalEmotionSpikeEnabled`, `persistLocalEmotionSpikeEnabled`, `setLocalEmotionSpikeResult`.

#### `changeExtractionSettings` — L112–L120 · nested helper в useSettingsState

Обновляет или переключает change extraction settings и связанные derived state.

- Параметры: `nextValue`.

- Основные вызовы: `normalizeExtractionSettings`, `setExtractionSettings`, `persistExtractionSettings`, `setReprocessStatus`, `setReprocessMessage`, `refreshExtractionStatus`.

#### `toggleDebugMode` — L122–L125 · nested helper в useSettingsState

Обновляет или переключает toggle debug mode и связанные derived state.

- Параметры: `nextValue`.

- Основные вызовы: `setDebugMode`, `persistDebugMode`.

#### `toggleLocalEmotionSpike` — L127–L137 · nested helper в useSettingsState

Обновляет или переключает toggle local emotion spike и связанные derived state.

- Параметры: `nextValue`.

- Основные вызовы: `setLocalEmotionSpikeEnabled`, `persistLocalEmotionSpikeEnabled`, `setLocalEmotionSpikeResult`, `setLocalEmotionSpikeStatus`.

#### `togglePersonaText` — L139–L142 · nested helper в useSettingsState

Обновляет или переключает toggle persona text и связанные derived state.

- Параметры: `nextValue`.

- Основные вызовы: `setPersonaTextEnabled`, `persistPersonaTextEnabled`.

#### `runLocalEmotionSpikeDemo` — L144–L164 · nested helper в useSettingsState

Исполняет сценарий local emotion spike demo и координирует его побочные эффекты.

- Основные вызовы: `setLocalEmotionSpikeEnabled`, `persistLocalEmotionSpikeEnabled`, `setLocalEmotionSpikeResult`, `setLocalEmotionSpikeStatus`, `extractLocalEmotionSignals`, `translateMessage`.

#### `reprocessFallbackEntries` — L166–L246 · nested helper в useSettingsState

Выполняет локальную операцию reprocess fallback entries внутри ответственности этого файла.

- Параметры: `entries`, `callbacks`.

- Основные вызовы: `isSignalReprocessCandidate`, `getRemainingGeminiDailyExtractions`, `setReprocessStatus`, `setReprocessMessage`, `translateMessage`, `updateLocalEntry`, `enqueueEntrySignalReprocessJob`, `getSignalReprocessReason`.

#### `resetAfterLocalDataClear` — L248–L256 · nested helper в useSettingsState

Сбрасывает reset after local data clear в исходное согласованное состояние.

- Основные вызовы: `setDebugMode`, `setLocalEmotionSpikeEnabled`, `setLocalEmotionSpikeResult`, `setLocalEmotionSpikeStatus`, `setPersonaTextEnabled`, `setReprocessStatus`, `setReprocessMessage`.

#### Публичные типы, классы и константы

- `type ReprocessStatus` — L35

### `client/src/features/sync/entryReprocessJob.ts`

Политики и jobs фоновой синхронизации: entry reprocess job.

#### `enqueueEntrySignalReprocessJob` — L8–L38 · public API

Оркестрирует entry signal reprocess job в инфраструктуре синхронизации или фоновой очереди.

- Параметры: `{ entryId, serverId, sourceTextHash, reason, priority = 10, }`.

- Основные вызовы: `enqueueQueueJob`, `createEntryReprocessPayload`, `createEntryReprocessJobIdempotencyKey`.

### `client/src/features/sync/entryServerSync.ts`

Политики и jobs фоновой синхронизации: entry server sync.

#### `syncLocalEntryToServer` — L14–L31 · public API

Оркестрирует local entry to server в инфраструктуре синхронизации или фоновой очереди.

- Параметры: `entry`, `api`.

- Основные вызовы: `createEntry`, `buildCreatePayload`, `updateServerEntry`, `buildUpdatePayload`, `isHttpNotFound`.

#### `buildCreatePayload` — L33–L42 · internal helper

Создаёт create payload из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `entry`.

#### `buildUpdatePayload` — L44–L52 · internal helper

Создаёт update payload из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `entry`.

#### `isHttpNotFound` — L54–L60 · internal helper

Проверяет условие http not found и возвращает логический результат без изменения состояния.

- Параметры: `error`.

### `client/src/features/sync/entrySyncJob.ts`

Политики и jobs фоновой синхронизации: entry sync job.

#### `enqueueEntrySyncJob` — L33–L53 · public API

Оркестрирует entry sync job в инфраструктуре синхронизации или фоновой очереди.

- Параметры: `{ entryId, sourceTextHash, localRevision, }`.

- Основные вызовы: `createEntrySyncQueuePayload`, `enqueueQueueJob`, `createEntrySyncIdempotencyKey`.

#### `createEntrySyncQueuePayload` — L55–L67 · public API

Создаёт entry sync queue payload из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `{ entryId, sourceTextHash, localRevision, queuedAt = new Date().toISOString(), }`.

- Основные вызовы: `toISOString`, `validateEntrySyncQueuePayload`.

#### `createEntrySyncIdempotencyKey` — L69–L79 · public API

Создаёт entry sync idempotency key из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `payload`.

#### `validateEntrySyncQueuePayload` — L81–L124 · public API

Проверяет корректность entry sync queue payload и явно отклоняет нарушение контракта.

- Параметры: `payload`.

- Основные вызовы: `Array.isArray`, `queueBlocked`, `Object.keys`, `test`.

#### `handleEntrySyncJob` — L126–L163 · public API

Исполняет сценарий entry sync job и координирует его побочные эффекты.

- Параметры: `job`, `signal`.

- Основные вызовы: `throwIfAborted`, `validateEntrySyncQueuePayload`, `getLocalEntry`, `planEntrySyncJob`, `queueBlocked`, `queueConflict`, `syncLocalEntryToServer`, `persistSyncResultIfStillCurrent`.

#### `persistSyncResultIfStillCurrent` — L165–L190 · internal helper

Выполняет локальную операцию persist sync result if still current внутри ответственности этого файла.

- Параметры: `syncedSource`, `serverId`.

- Основные вызовы: `getLocalEntry`, `updateLocalEntry`.

#### `throwIfAborted` — L192–L196 · internal helper

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

Политики и jobs фоновой синхронизации: queue.

Именованных функций нет: файл служит re-export границей.

### `client/src/features/sync/queueTypes.ts`

Политики и jobs фоновой синхронизации: queue types.

Именованных функций нет: файл служит re-export границей.

### `client/src/features/sync/reprocessPolicy.ts`

Политики и jobs фоновой синхронизации: reprocess policy.

#### `isRetryableProviderErrorCode` — L39–L41 · public API

Проверяет условие retryable provider error code и возвращает логический результат без изменения состояния.

- Параметры: `errorCode`.

- Основные вызовы: `has`.

#### `isMetricEmptySignal` — L43–L45 · public API

Проверяет условие metric empty signal и возвращает логический результат без изменения состояния.

- Параметры: `signal`.

#### `isMetricEmptySparseSignal` — L47–L49 · public API

Проверяет условие metric empty sparse signal и возвращает логический результат без изменения состояния.

- Параметры: `signal`.

- Основные вызовы: `isMetricEmptySignal`.

#### `hasCurrentSignalContract` — L51–L56 · public API

Проверяет условие current signal contract и возвращает логический результат без изменения состояния.

- Параметры: `metadata`.

#### `getSignalReprocessReason` — L58–L70 · public API

Получает signal reprocess reason из принадлежащего модулю источника данных.

- Параметры: `signal`, `metadata`, `explicitReason`.

- Основные вызовы: `normalizeEntryReprocessReason`, `isRetryableProviderErrorCode`, `isMetricEmptySparseSignal`.

#### `isSignalReprocessCandidate` — L72–L82 · public API

Проверяет условие signal reprocess candidate и возвращает логический результат без изменения состояния.

- Параметры: `signal`, `metadata`.

- Основные вызовы: `isFallbackReprocessCandidate`, `isSparseNoMetricsReprocessCandidate`, `isRetryableProviderErrorCode`, `hasCurrentSignalContract`.

#### `isFallbackReprocessCandidate` — L84–L93 · public API

Проверяет условие fallback reprocess candidate и возвращает логический результат без изменения состояния.

- Параметры: `signal`, `metadata`.

- Основные вызовы: `hasCurrentSignalContract`, `isRetryableProviderErrorCode`, `isTerminalCurrentFallbackErrorCode`.

#### `isSparseNoMetricsReprocessCandidate` — L95–L103 · public API

Проверяет условие sparse no metrics reprocess candidate и возвращает логический результат без изменения состояния.

- Параметры: `signal`, `metadata`.

- Основные вызовы: `isMetricEmptySparseSignal`, `hasCurrentSignalContract`, `isRetryableProviderErrorCode`.

#### `isTerminalCurrentFallbackErrorCode` — L105–L107 · internal helper

Проверяет условие terminal current fallback error code и возвращает логический результат без изменения состояния.

- Параметры: `errorCode`.

- Основные вызовы: `has`.

#### `createEntryReprocessPayload` — L109–L129 · public API

Создаёт entry reprocess payload из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `{ entryId, serverId, sourceTextHash, reason, }`.

- Основные вызовы: `toISOString`.

#### `createEntryReprocessJobIdempotencyKey` — L131–L141 · public API

Создаёт entry reprocess job idempotency key из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `{ entryId, sourceTextHash, reason, }`.

#### `planEntryReprocessJob` — L143–L189 · public API

Выводит entry reprocess job по явным правилам без скрытых побочных эффектов.

- Параметры: `job`, `entry`.

- Основные вызовы: `getPayloadRecord`, `readNonEmptyString`, `getSignalReprocessReason`.

#### `normalizeEntryReprocessReason` — L191–L200 · internal helper

Приводит entry reprocess reason к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `value`.

#### `getPayloadRecord` — L202–L206 · internal helper

Получает payload record из принадлежащего модулю источника данных.

- Параметры: `payload`.

- Основные вызовы: `Array.isArray`.

#### `readNonEmptyString` — L208–L210 · internal helper

Получает non empty string из принадлежащего модулю источника данных.

- Параметры: `value`.

#### Публичные типы, классы и константы

- `type EntryReprocessPlan` — L23

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

### `client/src/features/vault/useLocalVault.ts`

React/API-адаптеры локального vault: use local vault.

#### `toUserMessage` — L26–L42 · internal helper

Возвращает вычисленное значение to user message для использования внутри данного модуля.

- Параметры: `error`.

#### `useLocalVault` — L44–L207 · public API

Управляет React-состоянием, derived values и side effects для local vault.

- Основные вызовы: `useState`, `getVaultStatus`, `getVaultCredentialSummaries`, `useEffect`, `subscribeVault`, `setPhase`, `setCredentials`, `useCallback`.

#### Публичные типы, классы и константы

- `type LocalVaultPhase` — L19
- `type LocalVaultError` — L20

### `client/src/features/vault/vaultApi.ts`

React/API-адаптеры локального vault: vault api.

Именованных функций нет: файл служит re-export границей.

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

#### `translateMessage` — L1143–L1153 · public API

Возвращает вычисленное значение translate message для использования внутри данного модуля.

- Параметры: `language`, `key`, `values`.

- Основные вызовы: `replace`, `String`.

#### Публичные типы, классы и константы

- `const en` — L3
- `type MessageKey` — L294
- `const messages` — L1136

### `client/src/i18n/useI18n.ts`

Интернационализация интерфейса: use i18n.

#### `useI18n` — L4–L12 · public API

Управляет React-состоянием, derived values и side effects для i18n.

- Основные вызовы: `useContext`.

### `client/src/lib/api.ts`

Низкоуровневый HTTP-клиент всех backend API с CSRF, cookie auth и классификацией ошибок.

#### `loadServerAuthStatus` — L101–L111 · public API

Получает server auth status из принадлежащего модулю источника данных.

- Основные вызовы: `fetch`, `json`.

#### `setupServerOwner` — L113–L127 · public API

Изменяет up server owner, сохраняя инварианты данного модуля.

- Параметры: `payload`.

- Основные вызовы: `fetch`, `jsonHeaders`, `text`, `json`.

#### `loginServerOwner` — L129–L143 · public API

Возвращает вычисленное значение login server owner для использования внутри данного модуля.

- Параметры: `payload`.

- Основные вызовы: `fetch`, `jsonHeaders`, `text`, `json`.

#### `logoutServerOwner` — L145–L156 · public API

Выполняет локальную операцию logout server owner внутри ответственности этого файла.

- Основные вызовы: `fetch`, `csrfHeaders`, `text`.

#### `loadServerEntries` — L158–L176 · public API

Получает server entries из принадлежащего модулю источника данных.

- Основные вызовы: `fetch`, `handleUnauthorized`, `json`.

#### `loadServerEntry` — L178–L196 · public API

Получает server entry из принадлежащего модулю источника данных.

- Параметры: `entryId`.

- Основные вызовы: `fetch`, `encodeURIComponent`, `handleUnauthorized`, `json`.

#### `createEntry` — L198–L214 · public API

Создаёт entry из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `payload`.

- Основные вызовы: `fetch`, `csrfJsonHeaders`, `handleUnauthorized`, `createApiHttpError`, `json`.

#### `updateServerEntry` — L216–L235 · public API

Изменяет server entry, сохраняя инварианты данного модуля.

- Параметры: `entryId`, `payload`.

- Основные вызовы: `fetch`, `encodeURIComponent`, `csrfJsonHeaders`, `handleUnauthorized`, `createApiHttpError`, `json`.

#### `deleteServerEntry` — L237–L250 · public API

Удаляет или очищает server entry с необходимыми связанными действиями.

- Параметры: `entryId`.

- Основные вызовы: `fetch`, `encodeURIComponent`, `csrfHeaders`, `handleUnauthorized`, `text`.

#### `loadExtractionConfig` — L252–L264 · public API

Получает extraction config из принадлежащего модулю источника данных.

- Основные вызовы: `fetch`, `handleUnauthorized`, `json`.

#### `loadExtractionStatus` — L266–L283 · public API

Получает extraction status из принадлежащего модулю источника данных.

- Параметры: `settings`.

- Основные вызовы: `fetch`, `handleUnauthorized`, `json`.

#### `extractSignal` — L285–L314 · public API

Извлекает signal из входных данных без самостоятельного сохранения результата.

- Параметры: `payload`.

- Основные вызовы: `fetch`, `csrfJsonHeaders`, `handleUnauthorized`, `text`, `json`.

#### `appendEntrySignal` — L316–L336 · public API

Возвращает вычисленное значение append entry signal для использования внутри данного модуля.

- Параметры: `entryId`, `payload`.

- Основные вызовы: `fetch`, `encodeURIComponent`, `csrfJsonHeaders`, `handleUnauthorized`, `text`, `json`.

#### `loadCurrentInsights` — L338–L357 · public API

Получает current insights из принадлежащего модулю источника данных.

- Параметры: `today`.

- Основные вызовы: `fetch`, `handleUnauthorized`, `json`.

#### `loadInsightHistory` — L359–L377 · public API

Получает insight history из принадлежащего модулю источника данных.

- Основные вызовы: `fetch`, `handleUnauthorized`, `json`.

#### `deleteInsightSnapshot` — L379–L392 · public API

Удаляет или очищает insight snapshot с необходимыми связанными действиями.

- Параметры: `insightId`.

- Основные вызовы: `fetch`, `encodeURIComponent`, `csrfHeaders`, `handleUnauthorized`, `text`.

#### `syncSelfReportDailyAggregates` — L394–L416 · public API

Оркестрирует self report daily aggregates в инфраструктуре синхронизации или фоновой очереди.

- Параметры: `localDay`, `aggregates`.

- Основные вызовы: `fetch`, `encodeURIComponent`, `csrfJsonHeaders`, `serializeSelfReportDailyAggregates`, `handleUnauthorized`, `text`.

#### `serializeSelfReportDailyAggregates` — L418–L434 · public API

Преобразует self report daily aggregates в стабильное представление для UI, сети или хранения.

- Параметры: `aggregates`.

#### `jsonHeaders` — L436–L440 · internal helper

Возвращает вычисленное значение json headers для использования внутри данного модуля.

#### `csrfJsonHeaders` — L442–L447 · internal helper

Возвращает вычисленное значение csrf json headers для использования внутри данного модуля.

- Основные вызовы: `jsonHeaders`, `csrfHeaders`.

#### `csrfHeaders` — L449–L453 · internal helper

Возвращает вычисленное значение csrf headers для использования внутри данного модуля.

- Основные вызовы: `readBrowserCookie`.

#### `readBrowserCookie` — L455–L475 · internal helper

Получает browser cookie из принадлежащего модулю источника данных.

- Параметры: `name`.

- Основные вызовы: `split`, `startsWith`, `decodeURIComponent`.

#### `createApiHttpError` — L477–L488 · internal helper

Преобразует неуспешный HTTP response в типизированную ошибку с кодом, status и безопасным сообщением.

- Параметры: `response`, `prefix`.

- Основные вызовы: `text`, `classifyHttpErrorCode`.

#### `classifyHttpErrorCode` — L490–L496 · internal helper

Возвращает вычисленное значение classify http error code для использования внутри данного модуля.

- Параметры: `status`.

#### `handleUnauthorized` — L498–L504 · internal helper

Исполняет сценарий unauthorized и координирует его побочные эффекты.

- Параметры: `response`.

- Основные вызовы: `window.dispatchEvent`.

#### Публичные типы, классы и константы

- `type ServerAuthUser` — L17
- `type ServerAuthStatus` — L23
- `type SyncSelfReportDailyAggregatePayload` — L80
- `const SERVER_AUTH_REQUIRED_EVENT` — L85
- `class ApiHttpError` — L89

### `client/src/lib/appLock.ts`

Низкоуровневая клиентская библиотека: app lock.

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

### `client/src/lib/athenaInsightPhraseLibraries.ts`

Низкоуровневая клиентская библиотека: athena insight phrase libraries.

#### `getAthenaInsightTopics` — L20–L24 · public API

Получает athena insight topics из принадлежащего модулю источника данных.

- Параметры: `language`.

#### Публичные типы, классы и константы

- `const ATHENA_INSIGHT_LANGUAGES` — L7
- `type AthenaInsightLanguage` — L9
- `const DEFAULT_ATHENA_INSIGHT_LANGUAGE` — L11

### `client/src/lib/athenaInsightPhrasesDe.ts`

Низкоуровневая клиентская библиотека: athena insight phrases de.

#### `createTopic` — L31–L37 · internal helper

Создаёт topic из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `seed`.

#### Публичные типы, классы и константы

- `const ATHENA_INSIGHT_TOPICS_DE` — L39

### `client/src/lib/athenaInsightPhrasesEn.ts`

Низкоуровневая клиентская библиотека: athena insight phrases en.

#### `createTopic` — L31–L37 · internal helper

Создаёт topic из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `seed`.

#### Публичные типы, классы и константы

- `const ATHENA_INSIGHT_TOPICS_EN` — L39

### `client/src/lib/athenaInsightPhrasesRu.ts`

Низкоуровневая клиентская библиотека: athena insight phrases ru.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `const ATHENA_INSIGHT_TOPICS_RU` — L3

### `client/src/lib/athenaInsightPhrasesTypes.ts`

Низкоуровневая клиентская библиотека: athena insight phrases types.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `type AthenaInsightTopic` — L1

### `client/src/lib/athenaInsightPhrasesUk.ts`

Низкоуровневая клиентская библиотека: athena insight phrases uk.

#### `createTopic` — L31–L37 · internal helper

Создаёт topic из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `seed`.

#### Публичные типы, классы и константы

- `const ATHENA_INSIGHT_TOPICS_UK` — L39

### `client/src/lib/athenaPhraseLibraries.ts`

Низкоуровневая клиентская библиотека: athena phrase libraries.

#### `getAthenaPhraseLibrary` — L20–L24 · public API

Получает athena phrase library из принадлежащего модулю источника данных.

- Параметры: `language`.

#### Публичные типы, классы и константы

- `const ATHENA_PHRASE_LANGUAGES` — L7
- `type AthenaPhraseLanguage` — L9
- `const DEFAULT_ATHENA_PHRASE_LANGUAGE` — L11

### `client/src/lib/athenaPhrasesDe.ts`

Низкоуровневая клиентская библиотека: athena phrases de.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `const ATHENA_LIBRARY_DE` — L3

### `client/src/lib/athenaPhrasesEn.ts`

Низкоуровневая клиентская библиотека: athena phrases en.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `const ATHENA_LIBRARY_EN` — L3

### `client/src/lib/athenaPhrasesRu.ts`

Низкоуровневая клиентская библиотека: athena phrases ru.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `const ATHENA_LIBRARY_RU` — L3

### `client/src/lib/athenaPhrasesTypes.ts`

Низкоуровневая клиентская библиотека: athena phrases types.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `type AthenaPhraseTime` — L1
- `type AthenaPhraseTone` — L3
- `type AthenaPhrase` — L5
- `type AthenaPhraseLibrary` — L12

### `client/src/lib/athenaPhrasesUk.ts`

Низкоуровневая клиентская библиотека: athena phrases uk.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `const ATHENA_LIBRARY_UK` — L3

### `client/src/lib/athenaPlaceholder.ts`

Низкоуровневая клиентская библиотека: athena placeholder.

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

### `client/src/lib/dates.ts`

Низкоуровневая клиентская библиотека: dates.

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

### `client/src/lib/extraction.ts`

Низкоуровневая клиентская библиотека: extraction.

#### `extractSignalForText` — L16–L99 · public API

Извлекает signal for text из входных данных без самостоятельного сохранения результата.

- Параметры: `rawText`, `settings`, `context`, `signal`.

- Основные вызовы: `releaseGeminiDailyExtraction`, `loadLocalEmotionModuleIfAllowed`, `extractLocalEmotionSignals`, `reserveGeminiDailyExtraction`, `mergeEmotionIfAvailable`, `withSignalContext`, `createFallbackSignal`, `createFallbackMetadata`.

#### `releaseGeminiReservation` — L27–L32 · nested helper в extractSignalForText

Исполняет сценарий release gemini reservation и координирует его побочные эффекты.

- Основные вызовы: `releaseGeminiDailyExtraction`.

#### `withSignalContext` — L101–L113 · internal helper

Возвращает вычисленное значение with signal context для использования внутри данного модуля.

- Параметры: `extraction`, `rawText`, `context`.

- Основные вызовы: `analyzeSignalContext`.

#### `hasExtractionError` — L115–L119 · internal helper

Проверяет условие extraction error и возвращает логический результат без изменения состояния.

- Параметры: `extraction`.

- Основные вызовы: `Boolean`.

#### `mergeEmotionIfAvailable` — L121–L131 · internal helper

Преобразует или объединяет emotion if available по правилам домена.

- Параметры: `extraction`, `emotionResult`, `mergeLocalEmotionSignals`.

- Основные вызовы: `mergeLocalEmotionSignals`.

#### `loadLocalEmotionModuleIfAllowed` — L133–L138 · internal helper

Получает local emotion module if allowed из принадлежащего модулю источника данных.

- Основные вызовы: `getLocalEmotionSpikeEnabled`, `getCurrentInterfaceLanguage`.

#### `getCurrentInterfaceLanguage` — L140–L148 · internal helper

Получает current interface language из принадлежащего модулю источника данных.

- Основные вызовы: `getItem`.

### `client/src/lib/insightPhrases.ts`

Низкоуровневая клиентская библиотека: insight phrases.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `type PlainInsightTopic` — L1
- `const PLAIN_INSIGHT_TOPICS` — L9

### `client/src/lib/insightText.ts`

Низкоуровневая клиентская библиотека: insight text.

#### `formatInsightText` — L23–L72 · public API

Преобразует insight text в стабильное представление для UI, сети или хранения.

- Параметры: `insight`, `{ language = DEFAULT_ATHENA_INSIGHT_LANGUAGE, personaTextEnabled, }`.

- Основные вызовы: `getInsightTopic`, `getAthenaInsightTopics`, `getPlainInsightTopics`, `findTopicProfile`, `getAthenaInsightTone`, `getPlainInsightTone`, `normalizeTopic`, `pickInsightLine`.

#### `findTopicProfile` — L74–L82 · internal helper

Выбирает topic profile, удовлетворяющий ограничениям текущего сценария.

- Параметры: `topic`, `topics`.

- Основные вызовы: `normalizeTopic`.

#### `getInsightTopic` — L84–L89 · internal helper

Получает insight topic из принадлежащего модулю источника данных.

- Параметры: `insight`.

- Основные вызовы: `match`.

#### `fallbackTemplate` — L91–L189 · internal helper

Возвращает вычисленное значение fallback template для использования внутри данного модуля.

- Параметры: `layer`, `personaTextEnabled`, `language`.

#### `fallbackAdvice` — L191–L224 · internal helper

Возвращает вычисленное значение fallback advice для использования внутри данного модуля.

- Параметры: `personaTextEnabled`, `language`.

#### `getAthenaInsightTone` — L226–L230 · internal helper

Получает athena insight tone из принадлежащего модулю источника данных.

- Параметры: `language`.

#### `getPlainInsightTone` — L232–L236 · internal helper

Получает plain insight tone из принадлежащего модулю источника данных.

- Параметры: `language`.

#### `renderTemplate` — L238–L240 · internal helper

Возвращает вычисленное значение render template для использования внутри данного модуля.

- Параметры: `template`, `subject`.

- Основные вызовы: `replaceAll`.

#### `joinSentences` — L242–L247 · internal helper

Возвращает вычисленное значение join sentences для использования внутри данного модуля.

- Параметры: `first`, `second`.

#### `pickInsightLine` — L249–L283 · internal helper

Выбирает insight line, удовлетворяющий ограничениям текущего сценария.

- Параметры: `items`, `seed`, `scope`.

- Основные вызовы: `getLocalStorage`, `deterministicPick`, `getChoiceKey`, `readIndex`, `getItem`, `getBagKey`, `readBag`, `hashSeed`.

#### `getChoiceKey` — L285–L302 · internal helper

Получает choice key из принадлежащего модулю источника данных.

- Параметры: `scope`, `itemCount`.

- Основные вызовы: `getProfileScopedStorageKey`.

#### `getBagKey` — L304–L319 · internal helper

Получает bag key из принадлежащего модулю источника данных.

- Параметры: `scope`, `itemCount`.

- Основные вызовы: `getProfileScopedStorageKey`.

#### `readIndex` — L321–L328 · internal helper

Получает index из принадлежащего модулю источника данных.

- Параметры: `raw`, `itemCount`.

- Основные вызовы: `Number`, `isInteger`.

#### `readBag` — L330–L352 · internal helper

Получает bag из принадлежащего модулю источника данных.

- Параметры: `raw`, `itemCount`.

- Основные вызовы: `Array.from`, `freshBag`, `Array.isArray`, `isInteger`.

#### `freshBag` — L331–L332 · nested helper в readBag

Возвращает вычисленное значение fresh bag для использования внутри данного модуля.

- Основные вызовы: `Array.from`.

#### `getLocalStorage` — L354–L360 · internal helper

Получает local storage из принадлежащего модулю источника данных.

#### `deterministicPick` — L362–L366 · internal helper

Возвращает вычисленное значение deterministic pick для использования внутри данного модуля.

- Параметры: `items`, `seed`.

- Основные вызовы: `hashSeed`.

#### `hashSeed` — L368–L375 · internal helper

Проверяет условие seed и возвращает логический результат без изменения состояния.

- Параметры: `seed`.

- Основные вызовы: `charCodeAt`.

#### `normalizeTopic` — L377–L379 · internal helper

Приводит topic к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `topic`.

- Основные вызовы: `toLowerCase`.

### `client/src/lib/offline.ts`

Низкоуровневая клиентская библиотека: offline.

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

### `client/src/lib/phrasePicker.ts`

Низкоуровневая клиентская библиотека: phrase picker.

#### `getBagKey` — L8–L10 · internal helper

Получает bag key из принадлежащего модулю источника данных.

- Параметры: `group`.

- Основные вызовы: `getProfileScopedStorageKey`.

#### `pickPhrase` — L12–L39 · public API

Выбирает phrase, удовлетворяющий ограничениям текущего сценария.

- Параметры: `group`, `phrases`.

- Основные вызовы: `getItem`, `getBagKey`, `Math.floor`, `Math.random`, `splice`, `setItem`.

### `client/src/lib/plainInsightPhraseLibraries.ts`

Низкоуровневая клиентская библиотека: plain insight phrase libraries.

#### `getPlainInsightTopics` — L149–L151 · public API

Получает plain insight topics из принадлежащего модулю источника данных.

- Параметры: `language`.

#### `topic` — L153–L155 · internal helper

Возвращает вычисленное значение topic для использования внутри данного модуля.

- Параметры: `id`, `aliases`, `subject`.

#### `buildTopics` — L157–L167 · internal helper

Создаёт topics из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `definitions`, `templates`, `advice`.

### `client/src/lib/queue.ts`

Исполнитель durable queue: регистрация handlers, retries/backoff, блокировка, recovery и публикация snapshots состояния.

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

Запускает доступные durable jobs, применяет handlers и переводит jobs в succeeded/retry/blocked/conflict/cancelled состояния.

- Основные вызовы: `getRunnableQueueJobs`, `emitQueueSnapshot`, `scheduleNextRunAfterWake`, `get`, `updateQueueJob`, `nowIso`, `serializeQueueError`, `queueBlocked`.

#### `retryRecoverableQueueJobs` — L503–L522 · public API

Выполняет локальную операцию retry recoverable queue jobs внутри ответственности этого файла.

- Основные вызовы: `getQueueJobsByStatuses`, `updateQueueJob`, `nowIso`, `refreshQueueSnapshot`, `processQueue`.

#### `clearQueueHistory` — L524–L534 · public API

Удаляет или очищает queue history с необходимыми связанными действиями.

- Основные вызовы: `deleteQueueJobsByStatuses`, `refreshQueueSnapshot`.

### `client/src/lib/queueErrors.ts`

Низкоуровневая клиентская библиотека: queue errors.

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

### `client/src/lib/queueStorage.ts`

IndexedDB-репозиторий durable queue и операции обслуживания очереди.

#### `promisifyRequest` — L28–L33 · internal helper

Возвращает вычисленное значение promisify request для использования внутри данного модуля.

- Параметры: `request`.

- Основные вызовы: `resolve`, `reject`.

#### `openTransaction` — L35–L41 · internal helper

Управляет состоянием transaction и соответствующей границей доступа.

- Параметры: `db`, `mode`.

- Основные вызовы: `transaction`, `objectStore`.

#### `addQueueJob` — L43–L49 · public API

Возвращает вычисленное значение queue job для использования внутри данного модуля.

- Параметры: `job`.

- Основные вызовы: `openAthenaLocalDb`, `openTransaction`, `promisifyRequest`, `add`.

#### `updateQueueJob` — L51–L57 · public API

Изменяет queue job, сохраняя инварианты данного модуля.

- Параметры: `job`.

- Основные вызовы: `openAthenaLocalDb`, `openTransaction`, `promisifyRequest`, `put`.

#### `getQueueJob` — L59–L65 · public API

Получает queue job из принадлежащего модулю источника данных.

- Параметры: `id`.

- Основные вызовы: `openAthenaLocalDb`, `openTransaction`, `promisifyRequest`, `get`.

#### `getQueueJobs` — L67–L72 · public API

Получает queue jobs из принадлежащего модулю источника данных.

- Основные вызовы: `openAthenaLocalDb`, `openTransaction`, `promisifyRequest`, `getAll`.

#### `getRunnableQueueJobs` — L74–L99 · public API

Получает runnable queue jobs из принадлежащего модулю источника данных.

- Параметры: `nowIso`.

- Основные вызовы: `toISOString`, `getQueueJobs`, `localeCompare`.

#### `recoverStaleRunningJobs` — L101–L130 · public API

Возвращает вычисленное значение stale running jobs для использования внутри данного модуля.

- Параметры: `lockTimeoutMs`.

- Основные вызовы: `getQueueJobs`, `now`, `getTime`, `isFinite`, `toISOString`, `updateQueueJob`, `push`.

#### `recoverSignalValidationJobs` — L132–L156 · public API

Возвращает вычисленное значение signal validation jobs для использования внутри данного модуля.

- Основные вызовы: `getQueueJobs`, `has`, `isSignalValidationError`, `toISOString`, `updateQueueJob`, `push`.

#### `countQueueJobsByStatus` — L158–L177 · public API

Детерминированно вычисляет queue jobs by status из входных данных.

- Основные вызовы: `getQueueJobs`.

#### `getLastQueueError` — L179–L187 · public API

Получает last queue error из принадлежащего модулю источника данных.

- Основные вызовы: `getQueueJobs`, `localeCompare`.

#### `getLatestQueueJobSummary` — L189–L209 · public API

Получает latest queue job summary из принадлежащего модулю источника данных.

- Основные вызовы: `getQueueJobs`, `localeCompare`, `readQueueJobReason`.

#### `replaceQueueJob` — L211–L213 · public API

Сохраняет replace queue job в принадлежащем модулю хранилище или read model.

- Параметры: `job`.

- Основные вызовы: `updateQueueJob`.

#### `findQueueJobByIdempotencyKey` — L215–L227 · public API

Выбирает queue job by idempotency key, удовлетворяющий ограничениям текущего сценария.

- Параметры: `idempotencyKey`.

- Основные вызовы: `getQueueJobs`, `has`.

#### `deleteQueueJob` — L229–L234 · public API

Удаляет или очищает queue job с необходимыми связанными действиями.

- Параметры: `id`.

- Основные вызовы: `openAthenaLocalDb`, `openTransaction`, `promisifyRequest`, `delete`.

#### `deleteQueueJobsByStatuses` — L236–L248 · public API

Удаляет или очищает queue jobs by statuses с необходимыми связанными действиями.

- Параметры: `statuses`.

- Основные вызовы: `getQueueJobs`, `has`, `deleteQueueJob`.

#### `compactQueueJobs` — L250–L299 · public API

Возвращает вычисленное значение compact queue jobs для использования внутри данного модуля.

- Основные вызовы: `getQueueJobs`, `now`, `getTime`, `isFinite`, `has`, `deleteQueueJob`, `localeCompare`.

#### `assertQueueCanAcceptJob` — L301–L319 · public API

Проверяет корректность queue can accept job и явно отклоняет нарушение контракта.

- Параметры: `priority`.

- Основные вызовы: `compactQueueJobs`, `getQueueJobs`, `has`.

#### `getQueueJobsByStatuses` — L321–L328 · public API

Получает queue jobs by statuses из принадлежащего модулю источника данных.

- Параметры: `statuses`.

- Основные вызовы: `getQueueJobs`, `has`.

#### `readQueueJobReason` — L330–L338 · internal helper

Получает queue job reason из принадлежащего модулю источника данных.

- Параметры: `payload`.

- Основные вызовы: `Array.isArray`.

#### `isSignalValidationError` — L340–L351 · internal helper

Проверяет условие signal validation error и возвращает логический результат без изменения состояния.

- Параметры: `error`.

- Основные вызовы: `toLowerCase`.

### `client/src/lib/queueTypes.ts`

Низкоуровневая клиентская библиотека: queue types.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `type QueueJobStatus` — L1
- `type QueueJobType` — L9
- `type EntryReprocessReason` — L19
- `type QueueJobSummary` — L25
- `type QueueJob` — L38
- `type QueueSnapshot` — L59
- `type QueueHandler` — L71
- `type QueueListener` — L76
- `type EntryQueuePayload` — L78
- `type EntrySyncQueuePayload` — L89

### `client/src/lib/serviceWorker.ts`

Низкоуровневая клиентская библиотека: service worker.

#### `registerServiceWorker` — L1–L17 · public API

Оркестрирует service worker в инфраструктуре синхронизации или фоновой очереди.

- Основные вызовы: `window.addEventListener`, `catch`, `then`, `register`, `console.error`.

### `client/src/lib/signals.ts`

Клиентская нормализация Signal и детерминированное отображение evidence в метрики.

#### `createFallbackSignal` — L102–L121 · public API

Создаёт fallback signal из переданных данных, не отдавая вызывающему коду детали сборки.

- Основные вызовы: `createDefaultSignalContext`, `createEmptyMetricConfidence`.

#### `createFallbackMetadata` — L123–L136 · public API

Создаёт fallback metadata из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `provider`, `model`, `errorCode`.

- Основные вызовы: `toISOString`.

#### `createEmptyMetricConfidence` — L138–L144 · public API

Создаёт empty metric confidence из переданных данных, не отдавая вызывающему коду детали сборки.

#### `normalizeSignal` — L146–L178 · public API

Приводит неизвестный или legacy Signal payload к текущей безопасной форме Signal v4.

- Параметры: `value`.

- Основные вызовы: `isRecord`, `createFallbackSignal`, `isNormalizedSignal`, `normalizeStringArray`, `normalizeStateInference`, `normalizeMetricConfidence`, `normalizeEntryIntent`, `normalizeStructureSignal`.

#### `mapSignalCandidate` — L180–L220 · public API

Детерминированно пересчитывает метрики, confidence и quality из структурированного evidence вместо доверия готовым model scores.

- Параметры: `candidate`.

- Основные вызовы: `extractEmotionLabels`, `mapMetric`, `Object.keys`, `normalizeEntryIntent`, `normalizeStructureSignal`, `normalizeTemporalContext`, `getQualityReason`.

#### `mapMetric` — L222–L271 · internal helper

Преобразует или объединяет metric по правилам домена.

- Параметры: `metric`, `stateInference`, `emotionLabels`.

- Основные вызовы: `scoreLevel`, `confidenceWeight`, `clampScore`, `Math.round`, `highestConfidence`, `getEmotionMetricAdjustment`, `adjustConfidence`.

#### `scoreLevel` — L273–L277 · internal helper

Детерминированно вычисляет level из входных данных.

- Параметры: `level`, `direction`.

#### `confidenceWeight` — L279–L283 · internal helper

Возвращает вычисленное значение confidence weight для использования внутри данного модуля.

- Параметры: `confidence`.

#### `highestConfidence` — L285–L291 · internal helper

Возвращает вычисленное значение highest confidence для использования внутри данного модуля.

- Параметры: `confidences`.

#### `adjustConfidence` — L293–L302 · internal helper

Возвращает вычисленное значение adjust confidence для использования внутри данного модуля.

- Параметры: `confidence`, `emotionAdjustment`.

#### `clampScore` — L304–L306 · internal helper

Ограничивает score допустимым диапазоном или точностью.

- Параметры: `score`.

- Основные вызовы: `Math.max`, `Math.min`.

#### `getQualityReason` — L308–L336 · internal helper

Получает quality reason из принадлежащего модулю источника данных.

- Параметры: `stateInference`, `hasMetric`, `hasTextSignal`, `hasEmotionSignal`, `metrics`.

- Основные вызовы: `Object.entries`, `localeCompare`, `withEmotionReason`.

#### `withEmotionReason` — L338–L353 · internal helper

Возвращает вычисленное значение with emotion reason для использования внутри данного модуля.

- Параметры: `reason`, `metrics`.

#### `extractEmotionLabels` — L355–L370 · internal helper

Извлекает emotion labels из входных данных без самостоятельного сохранения результата.

- Параметры: `signals`.

- Основные вызовы: `isRecord`, `Object.entries`, `isFinite`, `normalizeEmotionLabel`, `Math.max`, `Math.min`.

#### `getEmotionMetricAdjustment` — L372–L381 · internal helper

Получает emotion metric adjustment из принадлежащего модулю источника данных.

- Параметры: `metric`, `labels`.

- Основные вызовы: `getEmotionAdjustmentCandidates`.

#### `getEmotionAdjustmentCandidates` — L383–L415 · internal helper

Получает emotion adjustment candidates из принадлежащего модулю источника данных.

- Параметры: `metric`, `labels`.

- Основные вызовы: `emotionCandidate`.

#### `emotionCandidate` — L417–L429 · internal helper

Возвращает вычисленное значение emotion candidate для использования внутри данного модуля.

- Параметры: `metric`, `label`, `labels`, `direction`.

#### `normalizeEmotionLabel` — L431–L438 · internal helper

Приводит emotion label к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `label`.

- Основные вызовы: `replace`, `toLocaleLowerCase`.

#### `normalizeStateInference` — L440–L450 · internal helper

Приводит state inference к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `value`.

- Основные вызовы: `isRecord`, `Object.entries`, `normalizeStateInferenceValue`, `has`.

#### `normalizeStateInferenceValue` — L452–L464 · internal helper

Приводит state inference value к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `value`.

- Основные вызовы: `isRecord`, `has`, `String`, `normalizeStringArray`.

#### `normalizeMetricConfidence` — L466–L474 · internal helper

Приводит metric confidence к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `value`.

- Основные вызовы: `isRecord`, `createEmptyMetricConfidence`, `normalizeConfidence`.

#### `normalizeEntryIntent` — L476–L496 · internal helper

Приводит entry intent к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `value`.

- Основные вызовы: `createDefaultSignalContext`, `isRecord`, `normalizeConfidence`, `normalizeStringArray`.

#### `normalizeStructureSignal` — L498–L517 · internal helper

Приводит structure signal к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `value`.

- Основные вызовы: `createDefaultSignalContext`, `isRecord`, `normalizeConfidence`, `normalizeStringArray`.

#### `normalizeTemporalContext` — L519–L548 · internal helper

Приводит temporal context к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `value`.

- Основные вызовы: `createDefaultSignalContext`, `isRecord`, `test`.

#### `normalizeConfidence` — L550–L552 · internal helper

Приводит confidence к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `value`.

- Основные вызовы: `has`, `String`.

#### `normalizeStringArray` — L554–L561 · internal helper

Приводит string array к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `value`.

- Основные вызовы: `Array.isArray`.

#### `normalizeScore` — L563–L570 · internal helper

Приводит score к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `value`.

- Основные вызовы: `isInteger`.

#### `isNormalizedSignal` — L572–L592 · internal helper

Проверяет условие normalized signal и возвращает логический результат без изменения состояния.

- Параметры: `value`.

- Основные вызовы: `isBoundedStringArray`, `isNormalizedStateInference`, `isRecord`, `isNormalizedMetricConfidence`, `isNormalizedEntryIntent`, `isNormalizedStructureSignal`, `isNormalizedTemporalContext`, `isNormalizedScore`.

#### `isBoundedStringArray` — L594–L600 · internal helper

Проверяет условие bounded string array и возвращает логический результат без изменения состояния.

- Параметры: `value`, `maxLength`.

- Основные вызовы: `Array.isArray`.

#### `isNormalizedStateInference` — L602–L609 · internal helper

Проверяет условие normalized state inference и возвращает логический результат без изменения состояния.

- Параметры: `value`.

- Основные вызовы: `isRecord`, `Object.entries`, `has`, `isNormalizedStateInferenceValue`.

#### `isNormalizedStateInferenceValue` — L611–L620 · internal helper

Проверяет условие normalized state inference value и возвращает логический результат без изменения состояния.

- Параметры: `value`.

- Основные вызовы: `isRecord`, `has`, `String`, `isBoundedStringArray`.

#### `isNormalizedMetricConfidence` — L622–L631 · internal helper

Проверяет условие normalized metric confidence и возвращает логический результат без изменения состояния.

- Параметры: `value`.

- Основные вызовы: `isRecord`, `has`, `String`.

#### `isNormalizedEntryIntent` — L633–L646 · internal helper

Проверяет условие normalized entry intent и возвращает логический результат без изменения состояния.

- Параметры: `value`.

- Основные вызовы: `isRecord`, `has`, `String`, `isBoundedStringArray`.

#### `isNormalizedStructureSignal` — L648–L662 · internal helper

Проверяет условие normalized structure signal и возвращает логический результат без изменения состояния.

- Параметры: `value`.

- Основные вызовы: `isRecord`, `has`, `String`, `isBoundedStringArray`.

#### `isNormalizedTemporalContext` — L664–L681 · internal helper

Проверяет условие normalized temporal context и возвращает логический результат без изменения состояния.

- Параметры: `value`.

- Основные вызовы: `isRecord`, `test`.

#### `isNormalizedScore` — L683–L691 · internal helper

Проверяет условие normalized score и возвращает логический результат без изменения состояния.

- Параметры: `value`.

- Основные вызовы: `isInteger`.

#### `isRecord` — L693–L695 · internal helper

Проверяет условие record и возвращает логический результат без изменения состояния.

- Параметры: `value`.

- Основные вызовы: `Array.isArray`.

#### Публичные типы, классы и константы

- `const SIGNAL_AXES` — L18

### `client/src/lib/signalVersions.ts`

Низкоуровневая клиентская библиотека: signal versions.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `const CLIENT_ACTIVE_SCHEMA_VERSION` — L1
- `const CLIENT_ACTIVE_PROMPT_VERSION` — L2

### `client/src/lib/storage.ts`

Главный browser persistence gateway: IndexedDB entries/drafts, profile-scoped localStorage, шифрование и локальные миграции.

#### `getDebugMode` — L90–L92 · public API

Получает debug mode из принадлежащего модулю источника данных.

- Основные вызовы: `getItem`, `getStorageKey`.

#### `setDebugMode` — L94–L96 · public API

Изменяет debug mode, сохраняя инварианты данного модуля.

- Параметры: `value`.

- Основные вызовы: `setItem`, `getStorageKey`, `String`.

#### `getPersonaTextEnabled` — L98–L100 · public API

Получает persona text enabled из принадлежащего модулю источника данных.

- Основные вызовы: `getItem`, `getStorageKey`.

#### `setPersonaTextEnabled` — L102–L104 · public API

Изменяет persona text enabled, сохраняя инварианты данного модуля.

- Параметры: `value`.

- Основные вызовы: `setItem`, `getStorageKey`, `String`.

#### `getExtractionSettings` — L106–L123 · public API

Получает extraction settings из принадлежащего модулю источника данных.

- Основные вызовы: `getItem`, `getStorageKey`.

#### `setExtractionSettings` — L125–L130 · public API

Изменяет extraction settings, сохраняя инварианты данного модуля.

- Параметры: `value`.

- Основные вызовы: `setItem`, `getStorageKey`.

#### `getEntrySortDirection` — L132–L136 · public API

Получает entry sort direction из принадлежащего модулю источника данных.

- Основные вызовы: `getItem`, `getStorageKey`.

#### `setEntrySortDirection` — L138–L140 · public API

Изменяет entry sort direction, сохраняя инварианты данного модуля.

- Параметры: `value`.

- Основные вызовы: `setItem`, `getStorageKey`.

#### `getLocalEmotionSpikeEnabled` — L142–L147 · public API

Получает local emotion spike enabled из принадлежащего модулю источника данных.

- Основные вызовы: `getItem`, `getStorageKey`.

#### `setLocalEmotionSpikeEnabled` — L149–L154 · public API

Изменяет local emotion spike enabled, сохраняя инварианты данного модуля.

- Параметры: `value`.

- Основные вызовы: `setItem`, `getStorageKey`, `String`.

#### `getGeminiDailyExtractionUsage` — L156–L182 · public API

Получает gemini daily extraction usage из принадлежащего модулю источника данных.

- Основные вызовы: `localDateKey`, `getItem`, `getStorageKey`, `isFinite`, `Math.max`, `Math.floor`, `Math.min`.

#### `getRemainingGeminiDailyExtractions` — L184–L188 · public API

Получает remaining gemini daily extractions из принадлежащего модулю источника данных.

- Основные вызовы: `getGeminiDailyExtractionUsage`, `Math.max`.

#### `reserveGeminiDailyExtraction` — L190–L204 · public API

Возвращает вычисленное значение reserve gemini daily extraction для использования внутри данного модуля.

- Основные вызовы: `getGeminiDailyExtractionUsage`, `setItem`, `getStorageKey`.

#### `releaseGeminiDailyExtraction` — L206–L218 · public API

Исполняет сценарий release gemini daily extraction и координирует его побочные эффекты.

- Основные вызовы: `getGeminiDailyExtractionUsage`, `setItem`, `getStorageKey`.

#### `getSeenEditorInsightIds` — L220–L238 · public API

Получает seen editor insight ids из принадлежащего модулю источника данных.

- Основные вызовы: `getItem`, `getStorageKey`, `Array.isArray`, `isInteger`.

#### `markEditorInsightSeen` — L240–L248 · public API

Изменяет editor insight seen, сохраняя инварианты данного модуля.

- Параметры: `id`.

- Основные вызовы: `getSeenEditorInsightIds`, `add`, `setItem`, `getStorageKey`, `Array.from`.

#### `getAllLocalEntries` — L250–L260 · public API

Получает all local entries из принадлежащего модулю источника данных.

- Основные вызовы: `openAthenaLocalDb`, `transaction`, `idbRequest`, `getAll`, `objectStore`, `Promise.all`.

#### `getLocalEntry` — L262–L271 · public API

Получает local entry из принадлежащего модулю источника данных.

- Параметры: `id`.

- Основные вызовы: `openAthenaLocalDb`, `transaction`, `idbRequest`, `get`, `objectStore`, `normalizeLocalEntry`, `readStoredLocalEntry`.

#### `saveLocalEntry` — L273–L279 · public API

Шифрует запись при активном vault и атомарно сохраняет её в локальный entries store.

- Параметры: `entry`.

- Основные вызовы: `encryptLocalEntry`, `openAthenaLocalDb`, `transaction`, `idbRequest`, `put`, `objectStore`.

#### `updateLocalEntry` — L281–L294 · public API

Изменяет local entry, сохраняя инварианты данного модуля.

- Параметры: `id`, `patch`.

- Основные вызовы: `getLocalEntry`, `toISOString`, `saveLocalEntry`.

#### `deleteLocalEntry` — L296–L301 · public API

Удаляет или очищает local entry с необходимыми связанными действиями.

- Параметры: `id`.

- Основные вызовы: `openAthenaLocalDb`, `transaction`, `idbRequest`, `delete`, `objectStore`.

#### `replaceAllLocalEntries` — L303–L314 · public API

Сохраняет replace all local entries в принадлежащем модулю хранилище или read model.

- Параметры: `entries`.

- Основные вызовы: `Promise.all`, `openAthenaLocalDb`, `transaction`, `objectStore`, `idbRequest`, `clear`, `put`.

#### `saveLocalDraft` — L316–L328 · public API

Сохраняет local draft в принадлежащем модулю хранилище или read model.

- Параметры: `text`.

- Основные вызовы: `toISOString`, `encryptLocalDraft`, `openAthenaLocalDb`, `transaction`, `idbRequest`, `put`, `objectStore`.

#### `clearLocalDraft` — L330–L332 · public API

Удаляет или очищает local draft с необходимыми связанными действиями.

- Основные вызовы: `saveLocalDraft`.

#### `migrateLegacyDraftToIndexedDb` — L334–L340 · public API

Переводит legacy draft to indexed db из legacy-формы в текущую без потери поддерживаемых данных.

- Основные вызовы: `getItem`, `removeItem`.

#### `migrateLocalStorageToVault` — L342–L346 · public API

Переводит local storage to vault из legacy-формы в текущую без потери поддерживаемых данных.

- Основные вызовы: `openAthenaLocalDb`, `migrateEntriesToVault`, `migrateDraftsToVault`.

#### `deleteAthenaLocalData` — L348–L376 · public API

Удаляет или очищает athena local data с необходимыми связанными действиями.

- Основные вызовы: `catch`, `close`, `removeItem`, `getStorageKey`, `deleteDatabase`, `getAthenaLocalDbName`, `resolve`, `reject`.

#### `deleteAthenaProfileData` — L378–L381 · public API

Удаляет или очищает athena profile data с необходимыми связанными действиями.

- Параметры: `profileId`.

- Основные вызовы: `deleteAthenaLocalDatabase`, `deleteProfileLocalStorage`.

#### `createClientEntryId` — L383–L386 · public API

Создаёт client entry id из переданных данных, не отдавая вызывающему коду детали сборки.

- Основные вызовы: `crypto.randomUUID`, `now`, `Math.random`.

#### `createTextHash` — L388–L395 · public API

Создаёт text hash из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `text`.

- Основные вызовы: `encode`, `digest`, `Array.from`, `padStart`.

#### `openAthenaLocalDb` — L397–L462 · public API

Открывает profile-scoped IndexedDB и создаёт stores/indexes текущей локальной схемы при upgrade.

- Основные вызовы: `getAthenaLocalDbName`, `open`, `contains`, `createObjectStore`, `createIndex`, `resolve`, `reject`.

#### `deleteAthenaLocalDatabase` — L464–L487 · internal helper

Удаляет или очищает athena local database с необходимыми связанными действиями.

- Параметры: `profileId`.

- Основные вызовы: `getProfileScopedDatabaseName`, `catch`, `close`, `deleteDatabase`, `resolve`, `reject`.

#### `deleteProfileLocalStorage` — L489–L504 · internal helper

Удаляет или очищает profile local storage с необходимыми связанными действиями.

- Параметры: `profileId`.

- Основные вызовы: `isDefaultVaultProfile`, `deleteDefaultProfileLocalStorage`, `getLocalStorageKeys`, `endsWith`, `removeItem`.

#### `deleteDefaultProfileLocalStorage` — L506–L528 · internal helper

Удаляет или очищает default profile local storage с необходимыми связанными действиями.

- Параметры: `profileId`.

- Основные вызовы: `removeItem`, `getProfileScopedStorageKey`, `getVaultProfiles`, `getLocalStorageKeys`, `startsWith`, `endsWith`.

#### `getLocalStorageKeys` — L530–L534 · internal helper

Получает local storage keys из принадлежащего модулю источника данных.

- Основные вызовы: `Array.from`, `key`, `Boolean`.

#### `idbRequest` — L536–L541 · internal helper

Возвращает вычисленное значение idb request для использования внутри данного модуля.

- Параметры: `request`.

- Основные вызовы: `resolve`, `reject`.

#### `compareLocalEntries` — L543–L548 · internal helper

Сравнивает local entries для стабильного детерминированного порядка.

- Параметры: `left`, `right`.

- Основные вызовы: `localeCompare`.

#### `normalizeLocalEntry` — L550–L555 · internal helper

Приводит local entry к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `entry`.

- Основные вызовы: `normalizeSignal`.

#### `migrateEntriesToVault` — L557–L572 · internal helper

Переводит entries to vault из legacy-формы в текущую без потери поддерживаемых данных.

- Параметры: `db`.

- Основные вызовы: `transaction`, `idbRequest`, `getAll`, `objectStore`, `isEncryptedLocalEntryRecord`, `encryptLocalEntry`, `put`.

#### `migrateDraftsToVault` — L574–L589 · internal helper

Переводит drafts to vault из legacy-формы в текущую без потери поддерживаемых данных.

- Параметры: `db`.

- Основные вызовы: `transaction`, `idbRequest`, `getAll`, `objectStore`, `isEncryptedDraftRecord`, `encryptLocalDraft`, `put`.

#### `readStoredLocalEntry` — L591–L600 · internal helper

Получает stored local entry из принадлежащего модулю источника данных.

- Параметры: `record`.

- Основные вызовы: `isEncryptedLocalEntryRecord`, `decryptVaultJson`, `createEntryVaultAssociatedData`.

#### `encryptLocalEntry` — L602–L615 · internal helper

Выполняет криптографическое преобразование local entry в рамках локальной privacy boundary.

- Параметры: `entry`.

- Основные вызовы: `encryptVaultJson`, `createEntryVaultAssociatedData`.

#### `encryptLocalDraft` — L617–L629 · internal helper

Выполняет криптографическое преобразование local draft в рамках локальной privacy boundary.

- Параметры: `draft`.

- Основные вызовы: `encryptVaultJson`, `createDraftVaultAssociatedData`.

#### `isEncryptedLocalEntryRecord` — L631–L640 · internal helper

Проверяет условие encrypted local entry record и возвращает логический результат без изменения состояния.

- Параметры: `record`.

- Основные вызовы: `isVaultEncryptedPayload`.

#### `isEncryptedDraftRecord` — L642–L651 · internal helper

Проверяет условие encrypted draft record и возвращает логический результат без изменения состояния.

- Параметры: `record`.

- Основные вызовы: `isVaultEncryptedPayload`.

#### `createEntryVaultAssociatedData` — L653–L655 · internal helper

Создаёт entry vault associated data из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `entryId`.

#### `createDraftVaultAssociatedData` — L657–L659 · internal helper

Создаёт draft vault associated data из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `draftId`.

#### `localDateKey` — L661–L668 · internal helper

Возвращает вычисленное значение local date key для использования внутри данного модуля.

- Основные вызовы: `getFullYear`, `padStart`, `String`, `getMonth`, `getDate`.

#### `getStorageKey` — L670–L672 · internal helper

Получает storage key из принадлежащего модулю источника данных.

- Параметры: `key`.

- Основные вызовы: `getProfileScopedStorageKey`.

#### `getAthenaLocalDbName` — L674–L676 · internal helper

Получает athena local db name из принадлежащего модулю источника данных.

- Основные вызовы: `getProfileScopedDatabaseName`.

#### Публичные типы, классы и константы

- `const QUEUE_JOBS_STORE` — L22
- `const SELF_REPORT_STORE` — L23
- `const SELF_REPORT_DAILY_AGGREGATES_STORE` — L24
- `const GEMINI_DAILY_EXTRACTION_LIMIT` — L55

### `client/src/lib/text.ts`

Низкоуровневая клиентская библиотека: text.

#### `excerpt` — L1–L7 · public API

Возвращает вычисленное значение excerpt для использования внутри данного модуля.

- Параметры: `text`, `maxLength`.

- Основные вызовы: `replace`, `trimEnd`.

#### `extractTags` — L9–L14 · public API

Извлекает tags из входных данных без самостоятельного сохранения результата.

- Параметры: `text`.

- Основные вызовы: `match`, `toLowerCase`, `Array.from`.

### `client/src/lib/vault.ts`

Криптографическое ядро локального vault: credentials, data key, PBKDF2, AES-GCM, lock/unlock и шифрование JSON.

#### `getVaultStatus` — L74–L77 · public API

Получает vault status из принадлежащего модулю источника данных.

- Основные вызовы: `readVaultConfig`.

#### `isVaultConfigured` — L79–L81 · public API

Проверяет условие vault configured и возвращает логический результат без изменения состояния.

- Основные вызовы: `Boolean`, `readVaultConfig`.

#### `isVaultUnlocked` — L83–L85 · public API

Проверяет условие vault unlocked и возвращает логический результат без изменения состояния.

- Основные вызовы: `Boolean`.

#### `getVaultCredentialSummaries` — L87–L99 · public API

Получает vault credential summaries из принадлежащего модулю источника данных.

- Основные вызовы: `readVaultConfig`.

#### `subscribeVault` — L101–L108 · public API

Возвращает вычисленное значение vault для использования внутри данного модуля.

- Параметры: `listener`.

- Основные вызовы: `add`, `listener`, `getVaultStatus`, `delete`.

#### `setupVault` — L110–L130 · public API

Создаёт новый vault, data key и первое credential envelope, затем оставляет data key разблокированным в памяти.

- Параметры: `passphrase`, `profileId`.

- Основные вызовы: `isVaultConfigured`, `assertUsablePassphrase`, `createVaultConfigForPassphrase`, `toISOString`, `setItem`, `getVaultConfigKey`, `emitVaultStatus`.

#### `setupVaultWithoutSecret` — L132–L146 · public API

Изменяет up vault without secret, сохраняя инварианты данного модуля.

- Параметры: `profileId`.

- Основные вызовы: `isVaultConfigured`, `createVaultConfigWithoutSecret`, `toISOString`, `setItem`, `getVaultConfigKey`, `emitVaultStatus`.

#### `unlockVault` — L148–L165 · public API

Управляет состоянием vault и соответствующей границей доступа.

- Параметры: `passphrase`.

- Основные вызовы: `readVaultConfig`, `assertUsablePassphrase`, `unlockVaultKeyFromConfig`, `emitVaultStatus`.

#### `unlockVaultWithoutSecret` — L167–L184 · public API

Управляет состоянием vault without secret и соответствующей границей доступа.

- Параметры: `profileId`.

- Основные вызовы: `readVaultConfig`, `unlockVaultKeyFromPasswordlessConfig`, `emitVaultStatus`.

#### `rotateVaultSecret` — L186–L235 · public API

Выполняет локальную операцию rotate vault secret внутри ответственности этого файла.

- Параметры: `input`.

- Основные вызовы: `readVaultConfig`, `assertUsablePassphrase`, `findCredentialForSecret`, `createVaultCredential`, `toISOString`, `setItem`, `getVaultConfigKey`, `emitVaultStatus`.

#### `addVaultCredential` — L237–L279 · public API

Выполняет локальную операцию vault credential внутри ответственности этого файла.

- Параметры: `input`.

- Основные вызовы: `readVaultConfig`, `assertUsablePassphrase`, `findCredentialForSecret`, `createVaultCredential`, `toISOString`, `setItem`, `getVaultConfigKey`, `emitVaultStatus`.

#### `deleteVaultCredential` — L281–L347 · public API

Удаляет или очищает vault credential с необходимыми связанными действиями.

- Параметры: `input`.

- Основные вызовы: `readVaultConfig`, `assertUsablePassphrase`, `findCredentialForSecret`, `createVaultPasswordlessCredential`, `toISOString`, `setItem`, `getVaultConfigKey`, `emitVaultStatus`.

#### `lockVault` — L349–L352 · public API

Управляет состоянием vault и соответствующей границей доступа.

- Основные вызовы: `emitVaultStatus`.

#### `encryptVaultJson` — L354–L359 · public API

Шифрует JSON текущим in-memory data key и привязывает ciphertext к associated data.

- Параметры: `value`, `associatedData`.

- Основные вызовы: `encryptVaultJsonWithKey`, `requireVaultKey`.

#### `decryptVaultJson` — L361–L366 · public API

Выполняет криптографическое преобразование vault json в рамках локальной privacy boundary.

- Параметры: `payload`, `associatedData`.

- Основные вызовы: `decryptVaultJsonWithKey`, `requireVaultKey`.

#### `createVaultConfigForPassphrase` — L368–L392 · public API

Создаёт vault config for passphrase из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `passphrase`, `createdAt`, `dataKey`, `profileId`, `label`.

- Основные вызовы: `toISOString`, `generateDataKey`, `createVaultCredential`.

#### `createVaultConfigWithoutSecret` — L394–L414 · public API

Создаёт vault config without secret из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `profileId`, `createdAt`, `dataKey`.

- Основные вызовы: `toISOString`, `generateDataKey`, `createVaultPasswordlessCredential`.

#### `unlockVaultKeyFromConfig` — L416–L425 · public API

Управляет состоянием vault key from config и соответствующей границей доступа.

- Параметры: `config`, `passphrase`.

- Основные вызовы: `normalizeStoredVaultConfig`, `assertValidVaultConfig`, `then`, `findCredentialForSecret`.

#### `unlockVaultKeyFromPasswordlessConfig` — L427–L436 · public API

Управляет состоянием vault key from passwordless config и соответствующей границей доступа.

- Параметры: `config`, `profileId`.

- Основные вызовы: `normalizeStoredVaultConfig`, `assertValidVaultConfig`, `then`, `findPasswordlessCredential`.

#### `findCredentialForSecret` — L438–L454 · internal helper

Выбирает credential for secret, удовлетворяющий ограничениям текущего сценария.

- Параметры: `config`, `passphrase`.

- Основные вызовы: `assertValidVaultConfig`, `unlockVaultKeyFromCredential`.

#### `findPasswordlessCredential` — L456–L482 · internal helper

Выбирает passwordless credential, удовлетворяющий ограничениям текущего сценария.

- Параметры: `config`, `profileId`.

- Основные вызовы: `assertValidVaultConfig`, `normalizeProfileId`, `unlockVaultKeyFromCredential`, `getPasswordlessSecret`.

#### `unlockVaultKeyFromCredential` — L484–L506 · internal helper

Управляет состоянием vault key from credential и соответствующей границей доступа.

- Параметры: `credential`, `passphrase`.

- Основные вызовы: `deriveVaultKey`, `decryptVaultJsonWithKey`, `importRawKey`, `decodeBase64Url`.

#### `createVaultCredential` — L508–L551 · internal helper

Создаёт vault credential из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `{ createdAt, dataKey, kind = "passphrase", label, profileId, secret, }`.

- Основные вызовы: `getRandomValues`, `getCrypto`, `encodeBase64Url`, `deriveVaultKey`, `encryptVaultJsonWithKey`, `exportRawKey`, `createCredentialId`, `normalizeProfileId`.

#### `createVaultPasswordlessCredential` — L553–L572 · internal helper

Создаёт vault passwordless credential из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `{ createdAt, dataKey, profileId, }`.

- Основные вызовы: `normalizeProfileId`, `createVaultCredential`, `getPasswordlessSecret`.

#### `getPasswordlessSecret` — L574–L576 · internal helper

Получает passwordless secret из принадлежащего модулю источника данных.

- Параметры: `profileId`.

- Основные вызовы: `normalizeProfileId`.

#### `normalizeProfileId` — L578–L580 · internal helper

Приводит profile id к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `profileId`.

#### `normalizeCredentialLabel` — L582–L584 · internal helper

Приводит credential label к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `label`.

#### `createCredentialId` — L586–L589 · internal helper

Создаёт credential id из переданных данных, не отдавая вызывающему коду детали сборки.

- Основные вызовы: `getCrypto`, `randomUUID`, `now`, `Math.random`.

#### `encryptVaultJsonWithKey` — L591–L615 · public API

Выполняет криптографическое преобразование vault json with key в рамках локальной privacy boundary.

- Параметры: `key`, `value`, `associatedData`.

- Основные вызовы: `getRandomValues`, `getCrypto`, `encode`, `encrypt`, `toArrayBuffer`, `encodeAssociatedData`, `encodeBase64Url`.

#### `decryptVaultJsonWithKey` — L617–L635 · public API

Выполняет криптографическое преобразование vault json with key в рамках локальной privacy boundary.

- Параметры: `key`, `payload`, `associatedData`.

- Основные вызовы: `assertValidVaultPayload`, `decrypt`, `getCrypto`, `toArrayBuffer`, `decodeBase64Url`, `encodeAssociatedData`, `decode`.

#### `isVaultEncryptedPayload` — L637–L646 · public API

Проверяет условие vault encrypted payload и возвращает логический результат без изменения состояния.

- Параметры: `value`.

#### `readVaultConfig` — L648–L666 · internal helper

Получает vault config из принадлежащего модулю источника данных.

- Основные вызовы: `getVaultConfigKey`, `getItem`, `normalizeStoredVaultConfig`, `assertValidVaultConfig`, `setItem`.

#### `getVaultConfigKey` — L668–L670 · internal helper

Получает vault config key из принадлежащего модулю источника данных.

- Основные вызовы: `getProfileScopedStorageKey`.

#### `normalizeStoredVaultConfig` — L672–L701 · internal helper

Приводит stored vault config к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `config`.

#### `requireVaultKey` — L703–L709 · internal helper

Возвращает вычисленное значение require vault key для использования внутри данного модуля.

#### `deriveVaultKey` — L711–L742 · internal helper

Возвращает вычисленное значение derive vault key для использования внутри данного модуля.

- Параметры: `passphrase`, `kdf`.

- Основные вызовы: `importKey`, `getCrypto`, `toArrayBuffer`, `encode`, `deriveKey`, `decodeBase64Url`.

#### `generateDataKey` — L744–L753 · internal helper

Создаёт data key из переданных данных, не отдавая вызывающему коду детали сборки.

- Основные вызовы: `generateKey`, `getCrypto`.

#### `exportRawKey` — L755–L757 · internal helper

Возвращает вычисленное значение export raw key для использования внутри данного модуля.

- Параметры: `key`.

- Основные вызовы: `exportKey`, `getCrypto`.

#### `importRawKey` — L759–L770 · internal helper

Возвращает вычисленное значение import raw key для использования внутри данного модуля.

- Параметры: `rawKey`.

- Основные вызовы: `importKey`, `getCrypto`, `toArrayBuffer`.

#### `assertUsablePassphrase` — L772–L776 · internal helper

Проверяет корректность usable passphrase и явно отклоняет нарушение контракта.

- Параметры: `passphrase`.

#### `assertValidVaultConfig` — L778–L802 · internal helper

Проверяет корректность valid vault config и явно отклоняет нарушение контракта.

- Параметры: `config`.

- Основные вызовы: `Array.isArray`, `assertValidVaultCredential`, `has`, `add`.

#### `assertValidVaultCredential` — L804–L829 · internal helper

Проверяет корректность valid vault credential и явно отклоняет нарушение контракта.

- Параметры: `credential`.

- Основные вызовы: `isInteger`, `assertValidVaultPayload`.

#### `assertValidVaultPayload` — L831–L841 · internal helper

Проверяет корректность valid vault payload и явно отклоняет нарушение контракта.

- Параметры: `payload`.

- Основные вызовы: `isVaultEncryptedPayload`.

#### `emitVaultStatus` — L843–L849 · internal helper

Выполняет локальную операцию vault status внутри ответственности этого файла.

- Основные вызовы: `getVaultStatus`, `listener`.

#### `encodeAssociatedData` — L851–L853 · internal helper

Возвращает вычисленное значение encode associated data для использования внутри данного модуля.

- Параметры: `value`.

- Основные вызовы: `encode`.

#### `encodeBase64Url` — L855–L866 · internal helper

Возвращает вычисленное значение encode base64 url для использования внутри данного модуля.

- Параметры: `bytes`.

- Основные вызовы: `fromCharCode`, `replace`, `btoa`.

#### `decodeBase64Url` — L868–L882 · internal helper

Возвращает вычисленное значение decode base64 url для использования внутри данного модуля.

- Параметры: `value`.

- Основные вызовы: `replace`, `padEnd`, `atob`, `charCodeAt`.

#### `toArrayBuffer` — L884–L888 · internal helper

Возвращает вычисленное значение to array buffer для использования внутри данного модуля.

- Параметры: `bytes`.

- Основные вызовы: `set`.

#### `getCrypto` — L890–L896 · internal helper

Получает crypto из принадлежащего модулю источника данных.

#### Публичные типы, классы и константы

- `type VaultEncryptedPayload` — L27
- `type VaultCredentialKind` — L35
- `type VaultCredential` — L45
- `type VaultCredentialSummary` — L56
- `type VaultConfig` — L61
- `type VaultStatus` — L67

### `client/src/lib/vaultMigration.ts`

Низкоуровневая клиентская библиотека: vault migration.

#### `migrateLocalDataToVault` — L4–L7 · public API

Переводит local data to vault из legacy-формы в текущую без потери поддерживаемых данных.

- Основные вызовы: `migrateLocalStorageToVault`, `migrateSelfReportsToVault`.

### `client/src/lib/vaultProfiles.ts`

Низкоуровневая клиентская библиотека: vault profiles.

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

### `client/src/main.tsx`

Точка запуска React-клиента: подключает стили, i18n, корневой App и service worker.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.

### `client/src/types.ts`

Проектный файл: types.

Именованных функций нет: файл служит re-export границей.
#### Публичные типы, классы и константы

- `type Page` — L39
- `type EntrySortDirection` — L40
- `type LocalEntry` — L42
- `type EntryView` — L57

## Server runtime: функции

### `server/api/analytics.route.ts`

Express router HTTP API: analytics route.

#### `subtractDays` — L49–L55 · internal helper

Возвращает вычисленное значение subtract days для использования внутри данного модуля.

- Параметры: `dateOnly`, `days`.

- Основные вызовы: `split`, `UTC`, `setUTCDate`, `getUTCDate`, `toISOString`.

#### HTTP routes

- `GET /analytics/summary (L13)`
- `GET /analytics/v2/summary (L38)`

### `server/api/auth.route.ts`

Express router HTTP API: auth route.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### HTTP routes

- `GET /auth/me (L26)`
- `POST /auth/setup (L77)`
- `POST /auth/login (L124)`
- `POST /auth/logout (L171)`

### `server/api/config.route.ts`

Express router HTTP API: config route.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### HTTP routes

- `GET /config (L10)`

### `server/api/entries.route.ts`

Express router HTTP API: entries route.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### HTTP routes

- `GET /entries (L17)`
- `GET /entries/:id (L26)`
- `POST /entries (L42)`
- `PATCH /entries/:id (L70)`
- `DELETE /entries/:id (L96)`
- `POST /entries/:id/signals (L112)`

### `server/api/exports.route.ts`

Express router HTTP API: exports route.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### HTTP routes

- `GET /exports/backend-metadata (L8)`

### `server/api/extractions.route.ts`

Express router HTTP API: extractions route.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### HTTP routes

- `GET /extractions/config (L12)`
- `GET /extractions/status (L16)`
- `POST /extractions (L28)`

### `server/api/http.ts`

Express router HTTP API: http.

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

### `server/api/insights.route.ts`

Express router HTTP API: insights route.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### HTTP routes

- `GET /insights/current (L12)`
- `GET /insights (L24)`
- `DELETE /insights/:id (L34)`

### `server/api/self-reports.route.ts`

Express router HTTP API: self reports route.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### HTTP routes

- `PUT /self-reports/daily-aggregates/:localDay (L12)`
- `GET /self-reports/daily-aggregates/:localDay (L46)`

### `server/app.ts`

Собирает Express middleware и API routers, затем раздаёт собранный frontend.

#### `createApp` — L23–L49 · public API

Строит Express application в безопасном порядке: parsing, public config/auth, optional auth+CSRF ring, protected API, error handling и static client.

- Основные вызовы: `express`, `disable`, `use`, `json`, `static`, `get`, `sendFile`.

#### HTTP routes

- `GET * (L44)`

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

- `const ACTIVE_SCHEMA_VERSION` — L3
- `const ACTIVE_PROMPT_VERSION` — L4
- `const ACTIVE_MODEL` — L6
- `const DEFAULT_OLLAMA_MODEL` — L7
- `const DEFAULT_GEMINI_MODEL` — L8

### `server/core/analytics-v2.schema.ts`

Доменные схемы, типы и чистые mapper-функции backend: analytics v2 schema.

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

### `server/core/auth.schema.ts`

Доменные схемы, типы и чистые mapper-функции backend: auth schema.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `const setupOwnerSchema` — L12
- `const loginSchema` — L19
- `type SetupOwnerInput` — L21
- `type LoginInput` — L22

### `server/core/entry.schema.ts`

Доменные схемы, типы и чистые mapper-функции backend: entry schema.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `const createEntrySchema` — L5
- `const updateEntrySchema` — L14

### `server/core/extraction.schema.ts`

Доменные схемы, типы и чистые mapper-функции backend: extraction schema.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `const extractionProviderSchema` — L4
- `const extractionRequestSchema` — L6
- `const signalMetadataPayloadSchema` — L14
- `const appendSignalSchema` — L23

### `server/core/markers.ts`

Доменные схемы, типы и чистые mapper-функции backend: markers.

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

### `server/core/self-report.schema.ts`

Доменные схемы, типы и чистые mapper-функции backend: self report schema.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `const selfReportAxisSchema` — L3
- `const selfReportDailyAggregateSchema` — L11
- `const syncSelfReportDailyAggregatesSchema` — L31

### `server/core/signal.mapper.ts`

Доменные схемы, типы и чистые mapper-функции backend: signal mapper.

#### `mapSignalCandidate` — L85–L127 · public API

Преобразует или объединяет signal candidate по правилам домена.

- Параметры: `candidate`.

- Основные вызовы: `createDefaultSignalContext`, `extractEmotionLabels`, `mapMetric`, `Object.keys`, `getQualityReason`.

#### `createEmptyMetricConfidence` — L129–L131 · public API

Создаёт empty metric confidence из переданных данных, не отдавая вызывающему коду детали сборки.

#### `mapMetric` — L133–L182 · internal helper

Преобразует или объединяет metric по правилам домена.

- Параметры: `metric`, `stateInference`, `emotionLabels`.

- Основные вызовы: `scoreLevel`, `confidenceWeight`, `clampScore`, `Math.round`, `highestConfidence`, `getEmotionMetricAdjustment`, `adjustConfidence`.

#### `scoreLevel` — L184–L189 · internal helper

Детерминированно вычисляет level из входных данных.

- Параметры: `level`, `direction`.

#### `confidenceWeight` — L191–L195 · internal helper

Возвращает вычисленное значение confidence weight для использования внутри данного модуля.

- Параметры: `confidence`.

#### `highestConfidence` — L197–L201 · internal helper

Возвращает вычисленное значение highest confidence для использования внутри данного модуля.

- Параметры: `confidences`.

#### `adjustConfidence` — L203–L212 · internal helper

Возвращает вычисленное значение adjust confidence для использования внутри данного модуля.

- Параметры: `confidence`, `emotionAdjustment`.

#### `clampScore` — L214–L216 · internal helper

Ограничивает score допустимым диапазоном или точностью.

- Параметры: `score`.

- Основные вызовы: `Math.max`, `Math.min`.

#### `getQualityReason` — L218–L246 · internal helper

Получает quality reason из принадлежащего модулю источника данных.

- Параметры: `stateInference`, `hasMetric`, `hasTextSignal`, `hasEmotionSignal`, `metrics`.

- Основные вызовы: `Object.entries`, `localeCompare`, `withEmotionReason`.

#### `withEmotionReason` — L248–L263 · internal helper

Возвращает вычисленное значение with emotion reason для использования внутри данного модуля.

- Параметры: `reason`, `metrics`.

#### `extractEmotionLabels` — L265–L280 · internal helper

Извлекает emotion labels из входных данных без самостоятельного сохранения результата.

- Параметры: `signals`.

- Основные вызовы: `isRecord`, `Object.entries`, `isFinite`, `normalizeEmotionLabel`, `Math.max`, `Math.min`.

#### `getEmotionMetricAdjustment` — L282–L291 · internal helper

Получает emotion metric adjustment из принадлежащего модулю источника данных.

- Параметры: `metric`, `labels`.

- Основные вызовы: `getEmotionAdjustmentCandidates`.

#### `getEmotionAdjustmentCandidates` — L293–L325 · internal helper

Получает emotion adjustment candidates из принадлежащего модулю источника данных.

- Параметры: `metric`, `labels`.

- Основные вызовы: `emotionCandidate`.

#### `emotionCandidate` — L327–L339 · internal helper

Возвращает вычисленное значение emotion candidate для использования внутри данного модуля.

- Параметры: `metric`, `label`, `labels`, `direction`.

#### `normalizeEmotionLabel` — L341–L348 · internal helper

Приводит emotion label к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `label`.

- Основные вызовы: `replace`, `toLocaleLowerCase`.

#### `isRecord` — L350–L352 · internal helper

Проверяет условие record и возвращает логический результат без изменения состояния.

- Параметры: `value`.

- Основные вызовы: `Array.isArray`.

### `server/core/signal.schema.ts`

Доменные схемы, типы и чистые mapper-функции backend: signal schema.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
#### Публичные типы, классы и константы

- `const SIGNAL_AXES` — L4
- `const markerSchema` — L24
- `const signalAxisSchema` — L25
- `const signalLevelSchema` — L26
- `const confidenceLevelSchema` — L27
- `const entryIntentSchema` — L28
- `const structureDensitySchema` — L37
- `const temporalBucketSchema` — L38
- `const temporalContextSourceSchema` — L45
- `const stateInferenceSchema` — L113
- `const emotionSignalsSchema` — L116
- `const extractedSignalCandidateSchema` — L119
- `const sanitizedSignalSchema` — L152
- `const fallbackSignalSchema` — L163
- `const clientFallbackSignalSchema` — L191
- `const clientSignalPayloadSchema` — L210
- `const overridePayloadSchema` — L215

### `server/core/types.ts`

Доменные схемы, типы и чистые mapper-функции backend: types.

Именованных функций нет: файл служит re-export границей.
#### Публичные типы, классы и константы

- `type EntryRow` — L40
- `type EntryView` — L51
- `type SignalRow` — L64
- `type EffectiveSignalRow` — L90
- `type AnalyticsWindow` — L116
- `type ServerSelfReportDailyAggregate` — L118

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

### `server/middleware/auth.middleware.ts`

Express middleware: auth middleware.

#### `requireAuth` — L23–L46 · public API

Выполняет локальную операцию require auth внутри ответственности этого файла.

- Параметры: `req`, `res`, `next`.

- Основные вызовы: `isServerAuthRequired`, `next`, `authenticateRequest`, `json`, `status`.

#### `requireProtectedApiAuth` — L48–L64 · public API

Выполняет локальную операцию require protected api auth внутри ответственности этого файла.

- Параметры: `req`, `res`, `next`.

- Основные вызовы: `isServerAuthRequired`, `next`, `isProtectedApiPath`, `requireAuth`.

#### `requireProtectedApiCsrf` — L66–L82 · public API

Выполняет локальную операцию require protected api csrf внутри ответственности этого файла.

- Параметры: `req`, `res`, `next`.

- Основные вызовы: `isServerAuthRequired`, `next`, `isProtectedApiPath`, `has`, `requireCsrf`.

#### `requireCsrf` — L84–L108 · public API

Выполняет локальную операцию require csrf внутри ответственности этого файла.

- Параметры: `req`, `res`, `next`.

- Основные вызовы: `isServerAuthRequired`, `next`, `get`, `json`, `status`, `verifyCsrfToken`.

#### `readCookie` — L110–L114 · public API

Получает cookie из принадлежащего модулю источника данных.

- Параметры: `req`, `name`.

- Основные вызовы: `parseCookieHeader`, `get`.

#### `setAuthCookies` — L116–L139 · public API

Изменяет auth cookies, сохраняя инварианты данного модуля.

- Параметры: `res`, `input`.

- Основные вызовы: `isProduction`, `cookie`.

#### `clearAuthCookies` — L141–L156 · public API

Удаляет или очищает auth cookies с необходимыми связанными действиями.

- Параметры: `res`.

- Основные вызовы: `isProduction`, `clearCookie`.

#### `authenticateRequest` — L158–L162 · internal helper

Возвращает вычисленное значение authenticate request для использования внутри данного модуля.

- Параметры: `req`.

- Основные вызовы: `getDb`, `authenticateSessionToken`, `readCookie`.

#### `isProtectedApiPath` — L164–L168 · internal helper

Проверяет условие protected api path и возвращает логический результат без изменения состояния.

- Параметры: `pathname`.

- Основные вызовы: `startsWith`.

#### `parseCookieHeader` — L170–L188 · internal helper

Разбирает cookie header и преобразует вход в типизированное представление.

- Параметры: `header`.

- Основные вызовы: `Object.fromEntries`, `split`, `indexOf`, `decodeCookieValue`.

#### `decodeCookieValue` — L190–L196 · internal helper

Возвращает вычисленное значение decode cookie value для использования внутри данного модуля.

- Параметры: `value`.

- Основные вызовы: `decodeURIComponent`.

#### `isProduction` — L198–L200 · internal helper

Проверяет условие production и возвращает логический результат без изменения состояния.

#### Публичные типы, классы и константы

- `const SESSION_COOKIE_NAME` — L10
- `const CSRF_COOKIE_NAME` — L11

### `server/middleware/error.middleware.ts`

Express middleware: error middleware.

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

### `server/repositories/analytics-v2.repository.ts`

SQL repository без продуктовой оркестрации: analytics v2 repository.

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

### `server/repositories/analytics.repository.ts`

SQL repository без продуктовой оркестрации: analytics repository.

#### `getEntriesWithSignalsInRange` — L25–L70 · public API

Получает entries with signals in range из принадлежащего модулю источника данных.

- Параметры: `db`, `{ from, to }`.

- Основные вызовы: `all`.

#### Публичные типы, классы и константы

- `type EntryWithSignalRangeRow` — L8

### `server/repositories/auth.repository.ts`

SQL repository без продуктовой оркестрации: auth repository.

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

### `server/repositories/entry.repository.ts`

SQL repository без продуктовой оркестрации: entry repository.

#### `createEntry` — L71–L100 · public API

Создаёт entry из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `db`, `entry`.

- Основные вызовы: `run`.

#### `listEntries` — L102–L147 · public API

Получает entries из принадлежащего модулю источника данных.

- Параметры: `db`.

- Основные вызовы: `all`.

#### `getEntryById` — L149–L202 · public API

Получает entry by id из принадлежащего модулю источника данных.

- Параметры: `db`, `id`.

- Основные вызовы: `get`, `mapEntryRow`.

#### `updateEntry` — L204–L230 · public API

Изменяет entry, сохраняя инварианты данного модуля.

- Параметры: `db`, `entryId`, `entry`.

- Основные вызовы: `run`.

#### `deleteEntry` — L232–L242 · public API

Удаляет или очищает entry с необходимыми связанными действиями.

- Параметры: `db`, `entryId`.

- Основные вызовы: `run`.

#### `updateEntryStatus` — L244–L258 · public API

Изменяет entry status, сохраняя инварианты данного модуля.

- Параметры: `db`, `entryId`, `status`.

- Основные вызовы: `run`, `toISOString`.

#### `markEntryFailed` — L260–L265 · public API

Изменяет entry failed, сохраняя инварианты данного модуля.

- Параметры: `db`, `entryId`.

- Основные вызовы: `updateEntryStatus`.

#### `mapEntryRow` — L267–L326 · internal helper

Преобразует или объединяет entry row по правилам домена.

- Параметры: `row`.

- Основные вызовы: `createDefaultSignalContext`, `parseStringArray`, `parseRecord`, `createEmptyMetricConfidence`.

#### `parseStringArray` — L328–L331 · internal helper

Разбирает string array и преобразует вход в типизированное представление.

- Параметры: `value`.

- Основные вызовы: `Array.isArray`.

#### `parseRecord` — L333–L345 · internal helper

Разбирает record и преобразует вход в типизированное представление.

- Параметры: `value`, `fallback`.

- Основные вызовы: `Array.isArray`.

### `server/repositories/insight.repository.ts`

SQL repository без продуктовой оркестрации: insight repository.

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

### `server/repositories/self-report.repository.ts`

SQL repository без продуктовой оркестрации: self report repository.

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

### `server/repositories/signal.repository.ts`

SQL repository без продуктовой оркестрации: signal repository.

#### `hasSignalForEntryHash` — L30–L47 · public API

Проверяет условие signal for entry hash и возвращает логический результат без изменения состояния.

- Параметры: `db`, `entryId`, `sourceTextHash`.

- Основные вызовы: `get`, `Boolean`.

#### `getSignalStatusForEntryHash` — L49–L69 · public API

Получает signal status for entry hash из принадлежащего модулю источника данных.

- Параметры: `db`, `entryId`, `sourceTextHash`.

- Основные вызовы: `get`.

#### `insertSignalAndFinalizeEntry` — L71–L109 · public API

Сохраняет insert signal and finalize entry в принадлежащем модулю хранилище или read model.

- Параметры: `db`, `{ entryId, sourceTextHash, signal, finalStatus, schemaVersion, promptVersion, provider = "ollama", model, errorCode = null, createdAt, }`.

- Основные вызовы: `withDbWriteTransaction`, `insertSignalRow`, `run`.

#### `insertSignalRow` — L111–L177 · public API

Сохраняет insert signal row в принадлежащем модулю хранилище или read model.

- Параметры: `db`, `{ entryId, sourceTextHash, signal, schemaVersion, promptVersion, provider = "ollama", model, errorCode = null, createdAt, }`.

- Основные вызовы: `run`.

### `server/server.ts`

Исполняемая точка запуска Express-сервера.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.

### `server/services/analytics-v2.service.ts`

Детерминированный Analytics V2 pipeline: окна, baseline, оси, density, context, associations, quality и uncertainty.

#### `buildAnalyticsV2Overview` — L117–L143 · public API

Строит согласованные week/month summaries относительно одной последней даты данных.

- Параметры: `db`.

- Основные вызовы: `getLatestAnalyticsV2Date`, `noDataResponse`, `Promise.all`, `buildAnalyticsV2Summary`, `subtractDays`.

#### `buildAnalyticsV2Summary` — L145–L220 · public API

Собирает одну Analytics V2 summary: baseline, current axes, density, versions, context, associations, quality и uncertainty.

- Параметры: `db`, `{ from, kind, to }`.

- Основные вызовы: `assertDateRange`, `subtractDays`, `getAnalyticsV2RowsInRange`, `normalizeEntryRows`, `normalizeSelfReportRows`, `isDateInRange`, `noDataResponse`, `eachDateInRange`.

#### `noDataResponse` — L222–L227 · internal helper

Возвращает вычисленное значение no data response для использования внутри данного модуля.

#### `normalizeEntryRows` — L229–L252 · internal helper

Приводит entry rows к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `rows`.

- Основные вызовы: `parseJsonArray`, `normalizeScore`.

#### `normalizeSelfReportRows` — L254–L271 · internal helper

Приводит self report rows к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `rows`.

- Основные вызовы: `flatMap`, `isSelfReportAxis`.

#### `buildAxes` — L273–L318 · internal helper

Создаёт axes из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `{ baselineDates, baselineEntries, baselineSelfReports, currentDates, currentEntries, currentSelfReports, extractedComparisonBlocked, }`.

- Основные вызовы: `buildExtractedSeries`, `buildAxisSummary`, `buildSelfReportSeries`.

#### `buildAxisSummary` — L320–L388 · internal helper

Создаёт axis summary из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `{ baseline, comparisonBlocked, current, source, }`.

- Основные вызовы: `numericValues`, `calculateAverage`, `getBaselineQuality`, `calculateSampleStandardDeviation`, `Math.max`, `calculateTrendSlope`, `calculateSuddenDelta`, `buildAxisUncertainty`.

#### `buildExtractedSeries` — L390–L421 · internal helper

Создаёт extracted series из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `entries`, `dates`, `axis`.

- Основные вызовы: `isScore`, `get`, `push`, `set`, `calculateAverage`.

#### `buildSelfReportSeries` — L423–L456 · internal helper

Создаёт self report series из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `aggregates`, `dates`, `axis`.

- Основные вызовы: `isScore`, `get`, `set`.

#### `buildAxisUncertainty` — L458–L484 · internal helper

Создаёт axis uncertainty из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `{ baselineInvalidSampleSeen, baselineQuality, comparisonBlocked, currentInvalidSampleSeen, currentSampleDays, }`.

- Основные вызовы: `push`.

#### `buildDensity` — L486–L529 · internal helper

Создаёт density из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `entries`, `currentDates`.

- Основные вызовы: `has`, `Math.max`, `roundRatio`.

#### `buildVersions` — L531–L563 · internal helper

Создаёт versions из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `{ baselineEntries, baselineSelfReports, currentEntries, currentSelfReports, }`.

- Основные вызовы: `buildVersionSet`, `areSameStrings`, `uniqueSorted`.

#### `buildVersionSet` — L565–L581 · internal helper

Создаёт version set из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `entries`, `selfReports`.

- Основные вызовы: `uniqueSorted`, `flatMap`, `present`.

#### `buildContext` — L583–L610 · internal helper

Создаёт context из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `entries`.

- Основные вызовы: `buildCountItems`.

#### `buildCountItems` — L612–L643 · internal helper

Создаёт count items из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `entries`, `selectValues`, `compareItems`.

- Основные вызовы: `selectValues`, `get`, `add`, `set`, `Array.from`, `values`.

#### `buildAssociations` — L645–L682 · internal helper

Создаёт associations из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `currentSeries`.

- Основные вызовы: `pairSeries`, `calculatePearsonCorrelation`, `push`, `roundNullable`, `getAssociationDirection`, `getAssociationStrength`.

#### `buildQuality` — L684–L738 · internal helper

Создаёт quality из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `{ axes, currentEntries, density, versions, }`.

- Основные вызовы: `Object.values`, `add`, `getQualityGrade`, `Array.from`, `getQualityReason`.

#### `getQualityGrade` — L740–L786 · internal helper

Получает quality grade из принадлежащего модулю источника данных.

- Параметры: `{ density, relevantAxes, versions, }`.

#### `getQualityReason` — L788–L809 · internal helper

Получает quality reason из принадлежащего модулю источника данных.

- Параметры: `{ currentEntries, density, grade, relevantAxes, versions, }`.

#### `getBaselineQuality` — L811–L816 · internal helper

Получает baseline quality из принадлежащего модулю источника данных.

- Параметры: `sampleDays`.

#### `getDirection` — L818–L822 · internal helper

Получает direction из принадлежащего модулю источника данных.

- Параметры: `value`.

- Основные вызовы: `Math.abs`.

#### `getTrendDirection` — L824–L828 · internal helper

Получает trend direction из принадлежащего модулю источника данных.

- Параметры: `value`.

- Основные вызовы: `Math.abs`.

#### `getVolatilityDirection` — L830–L836 · internal helper

Получает volatility direction из принадлежащего модулю источника данных.

- Параметры: `value`.

- Основные вызовы: `Math.abs`.

#### `getAssociationDirection` — L838–L844 · internal helper

Получает association direction из принадлежащего модулю источника данных.

- Параметры: `correlation`.

- Основные вызовы: `Math.abs`.

#### `getAssociationStrength` — L846–L855 · internal helper

Получает association strength из принадлежащего модулю источника данных.

- Параметры: `correlation`.

- Основные вызовы: `Math.abs`.

#### `calculateTrendSlope` — L857–L880 · internal helper

Детерминированно вычисляет trend slope из входных данных.

- Параметры: `values`.

- Основные вызовы: `flatMap`, `calculateAverage`.

#### `calculateSuddenDelta` — L882–L896 · internal helper

Детерминированно вычисляет sudden delta из входных данных.

- Параметры: `values`.

- Основные вызовы: `numericValues`, `calculateAverage`.

#### `pairSeries` — L898–L914 · internal helper

Возвращает вычисленное значение pair series для использования внутри данного модуля.

- Параметры: `leftValues`, `rightValues`.

- Основные вызовы: `flatMap`, `get`.

#### `calculatePearsonCorrelation` — L916–L939 · internal helper

Детерминированно вычисляет pearson correlation из входных данных.

- Параметры: `pairs`.

- Основные вызовы: `calculateAverage`, `Math.sqrt`.

#### `calculateAverage` — L941–L945 · internal helper

Детерминированно вычисляет average из входных данных.

- Параметры: `values`.

#### `calculateSampleStandardDeviation` — L947–L958 · internal helper

Детерминированно вычисляет sample standard deviation из входных данных.

- Параметры: `values`.

- Основные вызовы: `calculateAverage`, `Math.sqrt`.

#### `numericValues` — L960–L962 · internal helper

Возвращает вычисленное значение numeric values для использования внутри данного модуля.

- Параметры: `values`.

- Основные вызовы: `flatMap`.

#### `normalizeScore` — L964–L966 · internal helper

Приводит score к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `value`.

- Основные вызовы: `isFinite`.

#### `isScore` — L968–L970 · internal helper

Проверяет условие score и возвращает логический результат без изменения состояния.

- Параметры: `value`.

- Основные вызовы: `isFinite`.

#### `parseJsonArray` — L972–L984 · internal helper

Разбирает json array и преобразует вход в типизированное представление.

- Параметры: `value`.

- Основные вызовы: `Array.isArray`, `String`.

#### `compareContextItems` — L986–L995 · internal helper

Сравнивает context items для стабильного детерминированного порядка.

- Параметры: `left`, `right`.

- Основные вызовы: `localeCompare`.

#### `compareMarkerItems` — L997–L1007 · internal helper

Сравнивает marker items для стабильного детерминированного порядка.

- Параметры: `left`, `right`.

- Основные вызовы: `markerPriority`, `localeCompare`.

#### `buildWindow` — L1009–L1020 · internal helper

Создаёт window из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `kind`, `start`, `end`.

- Основные вызовы: `daysBetween`.

#### `assertDateRange` — L1022–L1026 · internal helper

Проверяет корректность date range и явно отклоняет нарушение контракта.

- Параметры: `from`, `to`.

- Основные вызовы: `isDateOnly`.

#### `isDateOnly` — L1028–L1030 · internal helper

Проверяет условие date only и возвращает логический результат без изменения состояния.

- Параметры: `value`.

- Основные вызовы: `test`.

#### `isDateInRange` — L1032–L1034 · internal helper

Проверяет условие date in range и возвращает логический результат без изменения состояния.

- Параметры: `date`, `from`, `to`.

#### `eachDateInRange` — L1036–L1047 · internal helper

Возвращает вычисленное значение each date in range для использования внутри данного модуля.

- Параметры: `from`, `to`.

- Основные вызовы: `parseDateOnly`, `push`, `formatDateOnly`, `setUTCDate`, `getUTCDate`.

#### `subtractDays` — L1049–L1054 · internal helper

Возвращает вычисленное значение subtract days для использования внутри данного модуля.

- Параметры: `dateOnly`, `days`.

- Основные вызовы: `parseDateOnly`, `setUTCDate`, `getUTCDate`, `formatDateOnly`.

#### `daysBetween` — L1056–L1058 · internal helper

Возвращает вычисленное значение days between для использования внутри данного модуля.

- Параметры: `from`, `to`.

- Основные вызовы: `getTime`, `parseDateOnly`.

#### `parseDateOnly` — L1060–L1063 · internal helper

Разбирает date only и преобразует вход в типизированное представление.

- Параметры: `value`.

- Основные вызовы: `split`, `UTC`.

#### `formatDateOnly` — L1065–L1067 · internal helper

Преобразует date only в стабильное представление для UI, сети или хранения.

- Параметры: `date`.

- Основные вызовы: `toISOString`.

#### `roundRatio` — L1069–L1071 · internal helper

Ограничивает ratio допустимым диапазоном или точностью.

- Параметры: `value`.

- Основные вызовы: `roundNumber`.

#### `roundNullable` — L1073–L1075 · internal helper

Ограничивает nullable допустимым диапазоном или точностью.

- Параметры: `value`.

- Основные вызовы: `roundNumber`.

#### `roundNumber` — L1077–L1080 · internal helper

Ограничивает number допустимым диапазоном или точностью.

- Параметры: `value`.

- Основные вызовы: `Number`, `toFixed`, `Object.is`.

#### `isSelfReportAxis` — L1082–L1084 · internal helper

Проверяет условие self report axis и возвращает логический результат без изменения состояния.

- Параметры: `axis`.

#### `uniqueSorted` — L1086–L1088 · internal helper

Возвращает вычисленное значение unique sorted для использования внутри данного модуля.

- Параметры: `values`.

- Основные вызовы: `Array.from`.

#### `present` — L1090–L1092 · internal helper

Возвращает вычисленное значение present для использования внутри данного модуля.

- Параметры: `value`.

#### `areSameStrings` — L1094–L1098 · internal helper

Возвращает вычисленное значение are same strings для использования внутри данного модуля.

- Параметры: `left`, `right`.

### `server/services/analytics.service.ts`

Backend service с бизнес-оркестрацией: analytics service.

#### `normalizeRows` — L79–L81 · public API

Приводит rows к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `rows`.

#### `normalizeRow` — L83–L106 · public API

Приводит row к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `row`.

- Основные вызовы: `normalizeScore`, `parseJsonArray`, `Boolean`.

#### `splitSignals` — L108–L121 · public API

Возвращает вычисленное значение signals для использования внутри данного модуля.

- Параметры: `normalized`.

- Основные вызовы: `has`.

#### `calculateDensity` — L123–L130 · public API

Детерминированно вычисляет density из входных данных.

- Параметры: `{ finalized, valid, }`.

#### `calculateAverage` — L132–L142 · public API

Детерминированно вычисляет average из входных данных.

- Параметры: `values`.

- Основные вызовы: `isFinite`.

#### `calculateTopicCounts` — L144–L146 · public API

Детерминированно вычисляет topic counts из входных данных.

- Параметры: `meaningful`.

- Основные вызовы: `countUniqueValues`.

#### `calculateMarkerDistribution` — L148–L152 · public API

Детерминированно вычисляет marker distribution из входных данных.

- Параметры: `meaningful`.

- Основные вызовы: `sortMarkerCountObject`, `countUniqueValuesUnsorted`.

#### `calculateDailyStates` — L156–L180 · public API

Детерминированно вычисляет daily states из входных данных.

- Параметры: `finalized`.

- Основные вызовы: `groupByDate`, `Array.from`, `entries`, `splitSignals`, `calculateDensity`, `calculateMetricSamples`, `calculateAverage`, `calculateTopicCounts`.

#### `calculateMonthlyRecurrence` — L182–L187 · public API

Детерминированно вычисляет monthly recurrence из входных данных.

- Параметры: `meaningful`.

- Основные вызовы: `calculateRecurrence`, `calculateMarkerRecurrence`.

#### `calculateEntryGaps` — L189–L233 · public API

Детерминированно вычисляет entry gaps из входных данных.

- Параметры: `finalized`, `{ from, to }`.

- Основные вызовы: `Array.from`, `eachDateInRange`, `has`, `push`, `buildGapRange`, `Math.max`.

#### `collectVersions` — L235–L253 · public API

Извлекает versions из входных данных без самостоятельного сохранения результата.

- Параметры: `finalized`.

- Основные вызовы: `add`, `Array.from`, `calculateVersionBoundaries`.

#### `buildInterpretationInput` — L255–L265 · public API

Создаёт interpretation input из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `summary`.

#### `buildSummary` — L267–L323 · public API

Создаёт summary из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `db`, `{ from, to, window }`.

- Основные вызовы: `getEntriesWithSignalsInRange`, `normalizeRows`, `splitSignals`, `calculateDensity`, `calculateMetricSamples`, `calculateAverage`, `calculateTopicCounts`, `calculateMarkerDistribution`.

#### `buildSummaryObject` — L325–L415 · internal helper

Создаёт summary object из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `{ window, from, to, normalized, finalized, valid, sparse, fallback, failed, meaningful, density, metricSamples, avgLoad, avgFatigue, avgFocus, topics, markers, gaps, versions, recurrence, context, }`.

- Основные вызовы: `calculateDailyStates`, `getInsufficientMetricData`.

#### `buildContext` — L417–L432 · internal helper

Создаёт context из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `{ topics, markers, recurrence, }`.

- Основные вызовы: `topCountItems`.

#### `topCountItems` — L434–L438 · internal helper

Возвращает вычисленное значение top count items для использования внутри данного модуля.

- Параметры: `counts`.

- Основные вызовы: `Object.entries`.

#### `normalizeScore` — L440–L442 · internal helper

Приводит score к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `value`.

- Основные вызовы: `isFinite`.

#### `parseJsonArray` — L444–L456 · internal helper

Разбирает json array и преобразует вход в типизированное представление.

- Параметры: `value`.

- Основные вызовы: `Array.isArray`, `String`.

#### `countUniqueValues` — L458–L463 · internal helper

Детерминированно вычисляет unique values из входных данных.

- Параметры: `items`, `key`.

- Основные вызовы: `sortCountObject`, `countUniqueValuesUnsorted`.

#### `countUniqueValuesUnsorted` — L465–L480 · internal helper

Детерминированно вычисляет unique values unsorted из входных данных.

- Параметры: `items`, `key`.

#### `sortCountObject` — L482–L489 · internal helper

Сравнивает count object для стабильного детерминированного порядка.

- Параметры: `counts`.

- Основные вызовы: `Object.fromEntries`, `Object.entries`, `localeCompare`.

#### `sortMarkerCountObject` — L491–L500 · internal helper

Сравнивает marker count object для стабильного детерминированного порядка.

- Параметры: `counts`.

- Основные вызовы: `Object.fromEntries`, `Object.entries`, `markerPriority`, `localeCompare`.

#### `calculateRecurrence` — L502–L537 · internal helper

Детерминированно вычисляет recurrence из входных данных.

- Параметры: `items`, `key`.

- Основные вызовы: `get`, `add`, `set`, `Array.from`, `values`, `localeCompare`.

#### `calculateMarkerRecurrence` — L539–L547 · internal helper

Детерминированно вычисляет marker recurrence из входных данных.

- Параметры: `items`.

- Основные вызовы: `calculateRecurrence`, `markerPriority`, `localeCompare`.

#### `calculateMetricSamples` — L549–L555 · internal helper

Детерминированно вычисляет metric samples из входных данных.

- Параметры: `valid`.

- Основные вызовы: `countNumericValues`.

#### `countNumericValues` — L557–L559 · internal helper

Детерминированно вычисляет numeric values из входных данных.

- Параметры: `values`.

- Основные вызовы: `isFinite`.

#### `getInsufficientMetricData` — L561–L565 · internal helper

Получает insufficient metric data из принадлежащего модулю источника данных.

- Параметры: `metricSamples`.

- Основные вызовы: `Object.entries`.

#### `groupByDate` — L567–L581 · internal helper

Возвращает вычисленное значение by date для использования внутри данного модуля.

- Параметры: `items`.

- Основные вызовы: `has`, `set`, `push`, `get`, `Array.from`, `entries`, `localeCompare`.

#### `calculateVersionBoundaries` — L583–L606 · internal helper

Детерминированно вычисляет version boundaries из входных данных.

- Параметры: `finalized`.

- Основные вызовы: `localeCompare`, `versionKey`, `push`.

#### `versionKey` — L608–L614 · internal helper

Возвращает вычисленное значение version key для использования внутри данного модуля.

- Параметры: `item`.

#### `buildGapRange` — L616–L622 · internal helper

Создаёт gap range из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `from`, `to`.

- Основные вызовы: `daysBetween`.

#### `eachDateInRange` — L624–L635 · internal helper

Возвращает вычисленное значение each date in range для использования внутри данного модуля.

- Параметры: `from`, `to`.

- Основные вызовы: `parseDateOnly`, `push`, `formatDateOnly`, `setUTCDate`, `getUTCDate`.

#### `daysBetween` — L637–L639 · internal helper

Возвращает вычисленное значение days between для использования внутри данного модуля.

- Параметры: `from`, `to`.

- Основные вызовы: `getTime`, `parseDateOnly`.

#### `parseDateOnly` — L641–L644 · internal helper

Разбирает date only и преобразует вход в типизированное представление.

- Параметры: `value`.

- Основные вызовы: `split`, `UTC`.

#### `formatDateOnly` — L646–L648 · internal helper

Преобразует date only в стабильное представление для UI, сети или хранения.

- Параметры: `date`.

- Основные вызовы: `toISOString`.

#### Публичные типы, классы и константы

- `const calculateMarkerCounts` — L154

### `server/services/auth.service.ts`

Backend service с бизнес-оркестрацией: auth service.

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

### `server/services/entry.service.ts`

Backend service с бизнес-оркестрацией: entry service.

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

### `server/services/export.service.ts`

Backend service с бизнес-оркестрацией: export service.

#### `buildBackendMetadataExport` — L7–L47 · public API

Создаёт backend metadata export из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `db`.

- Основные вызовы: `Promise.all`, `all`, `get`, `toISOString`.

### `server/services/extraction.service.ts`

Оркестрирует Ollama/Gemini/off extraction, prompt, provider status, timeout/error mapping и fallback.

#### `getExtractionOptions` — L144–L178 · public API

Получает extraction options из принадлежащего модулю источника данных.

- Основные вызовы: `normalizeProvider`, `defaultModelForProvider`, `unique`, `Boolean`.

#### `getExtractionStatus` — L180–L217 · public API

Получает extraction status из принадлежащего модулю источника данных.

- Параметры: `{ provider, model }`.

- Основные вызовы: `normalizeProvider`, `normalizeModel`, `availableStatus`, `unavailableStatus`, `getOllamaBaseUrl`, `requestJson`, `trimTrailingSlash`, `Array.isArray`.

#### `extractSignal` — L219–L267 · public API

Выбирает provider/model, выполняет один transient extraction request и всегда возвращает sanitized Signal либо явный fallback.

- Параметры: `{ text, provider, model, entry_date, captured_at, }`.

- Основные вызовы: `normalizeProvider`, `normalizeModel`, `analyzeSignalContext`, `createFallbackResult`, `requestGeminiExtraction`, `requestOllamaExtraction`, `sanitizeSignalCandidate`, `createSignalMetadata`.

#### `normalizeProvider` — L269–L276 · internal helper

Приводит provider к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `provider`.

- Основные вызовы: `isExtractionProvider`.

#### `normalizeModel` — L278–L281 · internal helper

Приводит model к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `provider`, `model`.

- Основные вызовы: `defaultModelForProvider`.

#### `defaultModelForProvider` — L283–L287 · internal helper

Возвращает вычисленное значение default model for provider для использования внутри данного модуля.

- Параметры: `provider`.

#### `requestOllamaExtraction` — L289–L315 · internal helper

Выполняет внешний запрос для ollama extraction и нормализует результат или ошибку.

- Параметры: `rawText`, `model`.

- Основные вызовы: `getOllamaBaseUrl`, `isLocalOllamaUrl`, `requestJson`, `trimTrailingSlash`, `Number`, `buildExtractionMessages`, `getRecordValue`, `extractJson`.

#### `requestGeminiExtraction` — L317–L362 · internal helper

Выполняет внешний запрос для gemini extraction и нормализует результат или ошибку.

- Параметры: `rawText`, `model`.

- Основные вызовы: `requestJson`, `encodeURIComponent`, `Number`, `buildSystemInstruction`, `buildUserExtractionPrompt`, `readGeminiText`, `extractJson`.

#### `requestJson` — L364–L391 · internal helper

Выполняет внешний запрос для json и нормализует результат или ошибку.

- Параметры: `url`, `{ method = "GET", headers = {}, body, timeoutMs }`.

- Основные вызовы: `setTimeout`, `abort`, `fetch`, `text`, `json`, `clearTimeout`.

#### `buildExtractionMessages` — L393–L404 · internal helper

Создаёт extraction messages из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `rawText`.

- Основные вызовы: `buildSystemInstruction`, `buildUserExtractionPrompt`.

#### `buildSystemInstruction` — L406–L430 · internal helper

Создаёт system instruction из переданных данных, не отдавая вызывающему коду детали сборки.

#### `buildUserExtractionPrompt` — L432–L515 · internal helper

Создаёт user extraction prompt из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `rawText`.

#### `createSignalMetadata` — L517–L530 · internal helper

Создаёт signal metadata из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `provider`, `model`, `errorCode`.

- Основные вызовы: `toISOString`.

#### `createFallbackResult` — L532–L545 · internal helper

Создаёт fallback result из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `provider`, `model`, `errorCode`, `context`.

- Основные вызовы: `analyzeSignalContext`, `createFallbackSignal`, `createSignalMetadata`.

#### `classifyProviderError` — L547–L568 · internal helper

Возвращает вычисленное значение classify provider error для использования внутри данного модуля.

- Параметры: `error`, `provider`.

- Основные вызовы: `String`.

#### `availableStatus` — L570–L580 · internal helper

Возвращает вычисленное значение available status для использования внутри данного модуля.

- Параметры: `provider`, `model`.

#### `unavailableStatus` — L582–L593 · internal helper

Возвращает вычисленное значение unavailable status для использования внутри данного модуля.

- Параметры: `provider`, `model`, `reason`.

#### `extractJson` — L595–L604 · internal helper

Извлекает json из входных данных без самостоятельного сохранения результата.

- Параметры: `text`.

- Основные вызовы: `indexOf`, `lastIndexOf`.

#### `getOllamaBaseUrl` — L606–L608 · internal helper

Получает ollama base url из принадлежащего модулю источника данных.

#### `trimTrailingSlash` — L610–L612 · internal helper

Возвращает вычисленное значение trim trailing slash для использования внутри данного модуля.

- Параметры: `value`.

- Основные вызовы: `replace`, `String`.

#### `isLocalOllamaUrl` — L614–L621 · internal helper

Проверяет условие local ollama url и возвращает логический результат без изменения состояния.

- Параметры: `value`.

#### `unique` — L623–L625 · internal helper

Возвращает вычисленное значение unique для использования внутри данного модуля.

- Параметры: `values`.

- Основные вызовы: `Array.from`.

#### `isExtractionProvider` — L627–L629 · internal helper

Проверяет условие extraction provider и возвращает логический результат без изменения состояния.

- Параметры: `value`.

- Основные вызовы: `Object.values`.

#### `isRecord` — L631–L633 · internal helper

Проверяет условие record и возвращает логический результат без изменения состояния.

- Параметры: `value`.

#### `getRecordValue` — L635–L637 · internal helper

Получает record value из принадлежащего модулю источника данных.

- Параметры: `value`, `key`.

- Основные вызовы: `isRecord`.

#### `readGeminiText` — L639–L652 · internal helper

Получает gemini text из принадлежащего модулю источника данных.

- Параметры: `data`.

- Основные вызовы: `getRecordValue`, `Array.isArray`.

#### Публичные типы, классы и константы

- `const EXTRACTION_PROVIDERS` — L48

### `server/services/insight-input.service.ts`

Backend service с бизнес-оркестрацией: insight input service.

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

### `server/services/insight-v3.service.ts`

Backend service с бизнес-оркестрацией: insight v3 service.

#### `buildInsightV3Input` — L72–L92 · public API

Преобразует Analytics V2 summary в ограниченный evidence pack для пользовательского observation.

- Параметры: `summary`, `layer`.

- Основные вызовы: `buildInsightV2Input`, `buildEvidence`, `buildObservations`, `collectUncertainty`.

#### `composeInsightV3Text` — L94–L109 · public API

Формирует не-клинический observation text только из выбранных evidence и uncertainty.

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

### `server/services/insight.service.ts`

Оркестрирует day/week/month snapshots: sufficiency gates, Analytics V2, Insight V3, persistence и retention.

#### `getCurrentInsightSnapshots` — L56–L99 · public API

Проверяет достаточность day/week/month evidence и создаёт или обновляет только допустимые текущие snapshots.

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

### `server/services/observation.service.ts`

Backend service с бизнес-оркестрацией: observation service.

#### `generateObservation` — L44–L113 · public API

Создаёт observation из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `input`.

- Основные вызовы: `describeMarkerObservation`, `push`, `unshift`.

#### `describeMarkerObservation` — L115–L132 · internal helper

Возвращает вычисленное значение describe marker observation для использования внутри данного модуля.

- Параметры: `{ topMarkers, recurrence, }`.

- Основные вызовы: `markerLabel`.

#### Публичные типы, классы и константы

- `const OBSERVATION_PROMPT_CONTRACT` — L36

### `server/services/sanitization.service.ts`

Backend service с бизнес-оркестрацией: sanitization service.

#### `sanitizeSignalCandidate` — L20–L45 · public API

Приводит sanitize signal candidate к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `candidate`.

- Основные вызовы: `safeParse`, `mapSignalCandidate`.

#### `createFallbackSignal` — L47–L81 · public API

Создаёт fallback signal из переданных данных, не отдавая вызывающему коду детали сборки.

- Основные вызовы: `createDefaultSignalContext`, `createEmptyMetricConfidence`, `safeParse`, `toISOString`.

#### `isClientFallbackSignal` — L83–L85 · public API

Проверяет условие client fallback signal и возвращает логический результат без изменения состояния.

- Параметры: `value`.

- Основные вызовы: `safeParse`.

### `server/services/self-report.service.ts`

Backend service с бизнес-оркестрацией: self report service.

#### `syncSelfReportDailyAggregates` — L9–L27 · public API

Оркестрирует self report daily aggregates в инфраструктуре синхронизации или фоновой очереди.

- Параметры: `db`, `localDay`, `aggregates`.

- Основные вызовы: `withDbWriteTransaction`, `replaceSelfReportDailyAggregates`, `listSelfReportDailyAggregates`.

#### `listSyncedSelfReportDailyAggregates` — L29–L34 · public API

Получает synced self report daily aggregates из принадлежащего модулю источника данных.

- Параметры: `db`, `localDay`.

- Основные вызовы: `listSelfReportDailyAggregates`.

## Shared contracts: функции

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
- `type SignalLevel` — L4
- `type ConfidenceLevel` — L5
- `type EntryIntent` — L6
- `type StructureDensity` — L14
- `type TemporalBucket` — L15
- `type TemporalContextSource` — L21
- `type SignalAxis` — L22
- `type MetricName` — L40
- `type StateInferenceValue` — L42
- `type StateInference` — L48
- `type MetricConfidence` — L50
- `type EntryIntentSignal` — L52
- `type StructureSignal` — L58
- `type TemporalContext` — L66
- `type Signal` — L72
- `type SignalMetadata` — L89
- `type ExtractionResult` — L98

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

## Tests: функции

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

### `test/analytics.test.js`

Node test для соответствующего сценария: analytics test.

#### `sparseSignal` — L21–L26 · internal helper

Возвращает вычисленное значение sparse signal для использования внутри данного модуля.

- Параметры: `overrides`.

- Основные вызовы: `baseSparseSignal`.

#### `validSignal` — L28–L37 · internal helper

Возвращает вычисленное значение valid signal для использования внутри данного модуля.

- Параметры: `overrides`.

- Основные вызовы: `baseValidSignal`, `state`.

#### `addEntry` — L39–L47 · internal helper

Возвращает вычисленное значение entry для использования внутри данного модуля.

- Параметры: `db`, `id`, `date`, `signal`.

- Основные вызовы: `createEntry`, `digest`, `update`, `crypto.createHash`.

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

#### `entry` — L23–L62 · internal helper

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

#### `createPackage` — L13–L106 · internal helper

Создаёт package из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `overrides`.

### `test/import-validation.test.js`

Node test для соответствующего сценария: import validation test.

#### `createPackage` — L12–L104 · internal helper

Создаёт package из переданных данных, не отдавая вызывающему коду детали сборки.

- Параметры: `overrides`.

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

### `test/local-emotion.test.js`

Node test для соответствующего сценария: local emotion test.

#### `extraction` — L12–L23 · internal helper

Извлекает ion из входных данных без самостоятельного сохранения результата.

- Параметры: `signal`.

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

### `test/vault-migration.test.js`

Node test для соответствующего сценария: vault migration test.

#### `clear` — L9–L11 · class/object method

Удаляет или очищает clear с необходимыми связанными действиями.

- Основные вызовы: `clear`.

#### `getItem` — L12–L14 · class/object method

Получает item из принадлежащего модулю источника данных.

- Параметры: `key`.

- Основные вызовы: `get`.

#### `key` — L15–L17 · class/object method

Возвращает вычисленное значение key для использования внутри данного модуля.

- Параметры: `index`.

- Основные вызовы: `Array.from`, `keys`.

#### `removeItem` — L18–L20 · class/object method

Удаляет или очищает item с необходимыми связанными действиями.

- Параметры: `key`.

- Основные вызовы: `delete`.

#### `setItem` — L21–L23 · class/object method

Изменяет item, сохраняя инварианты данного модуля.

- Параметры: `key`, `value`.

- Основные вызовы: `set`, `String`.

#### `putRecord` — L81–L90 · internal helper

Возвращает вычисленное значение put record для использования внутри данного модуля.

- Параметры: `db`, `storeName`, `value`.

- Основные вызовы: `transaction`, `put`, `objectStore`, `reject`, `resolve`.

#### `getRecord` — L92–L100 · internal helper

Получает record из принадлежащего модулю источника данных.

- Параметры: `db`, `storeName`, `key`.

- Основные вызовы: `transaction`, `get`, `objectStore`, `resolve`, `reject`.

#### `deleteDatabase` — L102–L110 · internal helper

Удаляет или очищает database с необходимыми связанными действиями.

- Параметры: `name`.

- Основные вызовы: `deleteDatabase`, `resolve`, `reject`.

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

#### `normalizePath` — L124–L126 · internal helper

Приводит path к безопасной канонической форме и отбрасывает неподдерживаемые значения.

- Параметры: `value`.

- Основные вызовы: `replaceAll`.

#### `listProjectFiles` — L128–L138 · internal helper

Получает project files из принадлежащего модулю источника данных.

- Основные вызовы: `execFileSync`, `split`, `has`, `localeCompare`.

#### `isExported` — L140–L148 · internal helper

Проверяет условие exported и возвращает логический результат без изменения состояния.

- Параметры: `node`.

- Основные вызовы: `Boolean`.

#### `lineOf` — L150–L152 · internal helper

Возвращает вычисленное значение line of для использования внутри данного модуля.

- Параметры: `sourceFile`, `node`.

- Основные вызовы: `getLineAndCharacterOfPosition`, `getStart`.

#### `endLineOf` — L154–L156 · internal helper

Возвращает вычисленное значение end line of для использования внутри данного модуля.

- Параметры: `sourceFile`, `node`.

- Основные вызовы: `getLineAndCharacterOfPosition`, `getEnd`.

#### `analyzeCode` — L158–L367 · internal helper

Возвращает вычисленное значение analyze code для использования внутри данного модуля.

- Параметры: `file`.

- Основные вызовы: `readFileSync`, `endsWith`, `createSourceFile`, `isFunctionDeclaration`, `isMethodDeclaration`, `getText`, `isArrowFunction`, `isFunctionExpression`.

#### `enclosingFunctionName` — L180–L199 · nested helper в analyzeCode

Возвращает вычисленное значение enclosing function name для использования внутри данного модуля.

- Параметры: `node`.

- Основные вызовы: `isFunctionDeclaration`, `isMethodDeclaration`, `getText`, `isArrowFunction`, `isFunctionExpression`, `isVariableDeclaration`, `isIdentifier`.

#### `functionScope` — L201–L205 · nested helper в analyzeCode

Возвращает вычисленное значение function scope для использования внутри данного модуля.

- Параметры: `node`, `exported`.

- Основные вызовы: `isMethodDeclaration`, `enclosingFunctionName`.

#### `directCalls` — L207–L234 · nested helper в analyzeCode

Возвращает вычисленное значение direct calls для использования внутри данного модуля.

- Параметры: `node`.

- Основные вызовы: `isCallExpression`, `isIdentifier`, `isPropertyAccessExpression`, `has`, `push`, `forEachChild`, `visitCalls`.

#### `visitCalls` — L215–L230 · nested helper в directCalls

Выполняет локальную операцию visit calls внутри ответственности этого файла.

- Параметры: `current`.

- Основные вызовы: `isCallExpression`, `isIdentifier`, `isPropertyAccessExpression`, `has`, `push`, `forEachChild`.

#### `addFunction` — L236–L265 · nested helper в analyzeCode

Выполняет локальную операцию function внутри ответственности этого файла.

- Параметры: `name`, `node`, `exported`, `parameters`.

- Основные вызовы: `isVariableDeclaration`, `Boolean`, `isArrowFunction`, `isBlock`, `isReturnStatement`, `forEachChild`, `findReturn`, `push`.

#### `findReturn` — L244–L251 · nested helper в addFunction

Выбирает return, удовлетворяющий ограничениям текущего сценария.

- Параметры: `current`.

- Основные вызовы: `isReturnStatement`, `forEachChild`.

#### `visit` — L312–L362 · nested helper в analyzeCode

Выполняет локальную операцию visit внутри ответственности этого файла.

- Параметры: `node`.

- Основные вызовы: `isFunctionDeclaration`, `addFunction`, `isExported`, `getText`, `isMethodDeclaration`, `isVariableDeclaration`, `isIdentifier`, `isArrowFunction`.

#### `humanizeStem` — L369–L375 · internal helper

Возвращает вычисленное значение humanize stem для использования внутри данного модуля.

- Параметры: `file`.

- Основные вызовы: `basename`, `extname`, `toLocaleLowerCase`, `replaceAll`.

#### `humanizeIdentifier` — L377–L384 · internal helper

Возвращает вычисленное значение humanize identifier для использования внутри данного модуля.

- Параметры: `name`.

- Основные вызовы: `toLocaleLowerCase`, `replaceAll`, `replace`.

#### `describeFunction` — L386–L430 · internal helper

Возвращает вычисленное значение describe function для использования внутри данного модуля.

- Параметры: `file`, `fn`.

- Основные вызовы: `humanizeIdentifier`, `test`.

#### `purposeFor` — L432–L453 · internal helper

Возвращает вычисленное значение purpose for для использования внутри данного модуля.

- Параметры: `file`.

- Основные вызовы: `startsWith`, `matchingPrefix`, `humanizeStem`, `endsWith`, `test`.

#### `matchingPrefix` — L455–L459 · internal helper

Возвращает вычисленное значение matching prefix для использования внутри данного модуля.

- Параметры: `file`.

- Основные вызовы: `Object.keys`, `startsWith`.

#### `sectionFor` — L461–L471 · internal helper

Возвращает вычисленное значение section for для использования внутри данного модуля.

- Параметры: `file`.

- Основные вызовы: `startsWith`.

#### `escapeTableCell` — L473–L475 · internal helper

Возвращает вычисленное значение escape table cell для использования внутри данного модуля.

- Параметры: `value`.

- Основные вызовы: `replaceAll`.

#### `renderFileMapRow` — L477–L479 · internal helper

Возвращает вычисленное значение render file map row для использования внутри данного модуля.

- Параметры: `file`.

- Основные вызовы: `escapeTableCell`, `purposeFor`.

#### `renderFunction` — L481–L505 · internal helper

Возвращает вычисленное значение render function для использования внутри данного модуля.

- Параметры: `file`, `fn`.

- Основные вызовы: `describeFunction`, `push`.

#### `renderFunctionFile` — L507–L540 · internal helper

Возвращает вычисленное значение render function file для использования внутри данного модуля.

- Параметры: `file`, `analysis`.

- Основные вызовы: `purposeFor`, `push`, `renderFunction`.

## Root and deployment files: функции

### `playwright.config.ts`

Проектный файл: playwright config.

Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.
