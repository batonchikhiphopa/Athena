import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

const projectRoot = path.resolve(import.meta.dirname, "..");
const outputPath = path.join(projectRoot, "docs", "CODEMAP.md");

const PURPOSES = {
  "client/src/platform/storage/athenaDb.ts": "Единственная точка владения IndexedDB schema, object stores и profile-scoped соединением.",
  "client/src/features/entries/localEntryRepository.ts": "Локальный зашифрованный repository записей и их browser-only текста.",
  "client/src/features/editor/draftRepository.ts": "Локальный зашифрованный repository текущего editor draft.",
  "client/src/features/sync/queue.ts": "Исполнитель durable queue: handlers, retries, recovery и lifecycle processor.",
  "client/src/features/vault/vaultCrypto.ts": "Низкоуровневые Web Crypto primitives без React и продуктовой оркестрации.",
  "client/src/shared/http/httpClient.ts": "Общие HTTP-механизмы: CSRF, auth-required event и типизированные ошибки.",
  "server/modules/analytics/analyticsV2.service.ts": "Композиция Analytics V2 поверх отдельных date, statistics, collection и repository модулей.",
  "shared/signal/signalMapper.ts": "Единый pure Signal mapper для клиентского и серверного runtime.",
  "client/src/main.tsx": "Точка запуска React-клиента: подключает стили, i18n, корневой App и service worker.",
  "client/src/App.tsx": "Верхняя граница клиентского приложения: серверная авторизация, локальный vault, профили и допуск в рабочую область.",
  "client/src/app/AthenaWorkspace.tsx": "Компонует видимые поверхности Athena и связывает состояние приложения с UI-обработчиками.",
  "client/src/app/useAthenaApp.ts": "Главный composition hook клиента; собирает editor, entries, insights, settings, queue и lifecycle в один фасад.",
  "client/src/features/editor/useEditorDraft.ts": "Владеет жизненным циклом черновика и записи: автосохранение, локальная запись, удаление пустых записей и постановка sync/extraction jobs.",
  "client/src/features/entries/entrySearch.ts": "Чистый поисковый движок архива: разбор запроса, индексирование, lexical/semantic scoring и построение snippets.",
  "client/src/features/exportImport/importPackage.ts": "Строгая недоверенная граница импорта: разбирает JSON, запрещает лишние поля и строит безопасный preview.",
  "client/src/features/sync/syncQueue.ts": "Регистрирует обработчики durable queue и маршрутизирует jobs синхронизации, reprocess и self-report.",
  "client/src/lib/api.ts": "Низкоуровневый HTTP-клиент всех backend API с CSRF, cookie auth и классификацией ошибок.",
  "client/src/lib/queue.ts": "Исполнитель durable queue: регистрация handlers, retries/backoff, блокировка, recovery и публикация snapshots состояния.",
  "client/src/lib/queueStorage.ts": "IndexedDB-репозиторий durable queue и операции обслуживания очереди.",
  "client/src/lib/signals.ts": "Клиентская нормализация Signal и детерминированное отображение evidence в метрики.",
  "client/src/lib/storage.ts": "Главный browser persistence gateway: IndexedDB entries/drafts, profile-scoped localStorage, шифрование и локальные миграции.",
  "client/src/lib/vault.ts": "Криптографическое ядро локального vault: credentials, data key, PBKDF2, AES-GCM, lock/unlock и шифрование JSON.",
  "server/server.ts": "Исполняемая точка запуска Express-сервера.",
  "server/app.ts": "Собирает Express middleware и API routers, затем раздаёт собранный frontend.",
  "server/services/extraction.service.ts": "Оркестрирует Ollama/Gemini/off extraction, prompt, provider status, timeout/error mapping и fallback.",
  "server/services/analytics-v2.service.ts": "Детерминированный Analytics V2 pipeline: окна, baseline, оси, density, context, associations, quality и uncertainty.",
  "server/services/insight.service.ts": "Оркестрирует day/week/month snapshots: sufficiency gates, Analytics V2, Insight V3, persistence и retention.",
  "server/db/sqlite.ts": "Открывает SQLite и сериализует write transactions.",
  "server/db/migration-runner.ts": "Планирует, проверяет и атомарно применяет SQL-миграции с integrity checks.",
  "shared/contracts/index.ts": "Публичный barrel общих client/server контрактов.",
  "shared/contracts/signalAnalysis.ts": "Детерминированно выводит intent, структуру и временной контекст из одной записи и её metadata.",
  "migrations/001_init.sql": "Создаёт entries, immutable signals, overrides, insights и effective_signals view.",
  "migrations/002_refresh_effective_signals.sql": "Пересобирает read model effective_signals.",
  "migrations/003_insight_snapshots.sql": "Вводит версионированные day/week/month insight snapshots.",
  "migrations/004_signal_provider_metadata.sql": "Добавляет provider/error metadata к signals.",
  "migrations/005_soft_delete_insight_snapshots.sql": "Добавляет мягкое удаление insight snapshots.",
  "migrations/006_insight_snapshot_topic.sql": "Добавляет topic к insight snapshots.",
  "migrations/007_perf_indexes.sql": "Добавляет индексы для основных read paths.",
  "migrations/008_signal_v3_contract.sql": "Расширяет signals полями Signal v3 и обновляет effective_signals.",
  "migrations/009_self_report_daily_aggregates.sql": "Создаёт textless daily aggregates добровольных self-reports.",
  "migrations/010_auth.sql": "Создаёт owner users и server sessions.",
  "migrations/011_signal_v4_context.sql": "Добавляет deterministic context Signal v4 и обновляет effective_signals.",
};

const FUNCTION_PURPOSES = {
  "client/src/App.tsx#App": "Собирает внешний access flow приложения: server auth, выбор vault-профиля, локальную разблокировку и переход в AthenaWorkspace.",
  "client/src/app/AthenaWorkspace.tsx#AthenaWorkspace": "Рендерит основную рабочую область и связывает editor, archive, observations, settings и floating panels с фасадом useAthenaApp.",
  "client/src/app/useAthenaApp.ts#useAthenaApp": "Создаёт единый фасад состояния и handlers для AthenaWorkspace, соединяя независимые feature hooks без переноса их логики в UI.",
  "client/src/features/editor/useEditorDraft.ts#useEditorDraft": "Управляет черновиком и активной записью, защищает autosave от гонок, пишет локально и ставит textless sync/extraction jobs.",
  "client/src/features/editor/useEditorDraft.ts#tagsAreEqual": "Сравнивает два набора тегов после одинаковой нормализации, чтобы autosave не реагировал на эквивалентные значения.",
  "client/src/features/editor/useEditorDraft.ts#changeText": "Обновляет текст текущего draft и помечает editor state ожидающим autosave.",
  "client/src/features/editor/useEditorDraft.ts#changeTags": "Нормализует новый набор тегов draft и помечает его ожидающим сохранения.",
  "client/src/features/editor/useEditorDraft.ts#toggleAnalysisEnabled": "Переключает пользовательское разрешение на анализ активной записи и инициирует сохранение нового состояния.",
  "client/src/features/editor/useEditorDraft.ts#newBlankPage": "Завершает pending autosave текущей страницы, затем очищает editor для новой записи.",
  "client/src/features/editor/useEditorDraft.ts#editEntry": "Сохраняет текущий draft и загружает выбранную локальную запись в editor без потери её metadata.",
  "client/src/features/editor/useEditorDraft.ts#clearIfEditingEntry": "Сбрасывает editor только когда удалённая запись сейчас открыта для редактирования.",
  "client/src/features/editor/useEditorDraft.ts#resetAfterLocalDataClear": "Очищает все editor refs и React state после удаления локальных данных профиля.",
  "client/src/features/editor/useEditorDraft.ts#activeEntryId": "Возвращает id записи, которой сейчас принадлежит editor draft.",
  "client/src/features/editor/useEditorDraft.ts#clearAutosaveTimer": "Отменяет pending autosave timeout и очищает ссылку на него.",
  "client/src/features/editor/useEditorDraft.ts#resetDraftState": "Возвращает editor draft, refs и статусы сохранения в исходное пустое состояние.",
  "client/src/features/entries/entrySearch.ts#createEntrySearchIndex": "Предварительно нормализует локальные записи для повторных поисковых запросов без передачи текста на backend.",
  "client/src/features/entries/entrySearch.ts#searchIndexedEntriesHybrid": "Объединяет lexical и локальные semantic matches, затем возвращает детерминированно отсортированные результаты.",
  "client/src/features/exportImport/importPackage.ts#validateLocalExportPackage": "Строго проверяет полную структуру import package, версии, даты, допустимые ключи и отсутствие запрещённых данных.",
  "client/src/features/sync/syncQueue.ts#registerSyncQueueHandlers": "Один раз связывает persisted job types с актуальными обработчиками entry sync, signal reprocess и self-report sync.",
  "client/src/lib/api.ts#createApiHttpError": "Преобразует неуспешный HTTP response в типизированную ошибку с кодом, status и безопасным сообщением.",
  "client/src/lib/queue.ts#processQueue": "Запускает доступные durable jobs, применяет handlers и переводит jobs в succeeded/retry/blocked/conflict/cancelled состояния.",
  "client/src/lib/signals.ts#normalizeSignal": "Приводит неизвестный или legacy Signal payload к текущей безопасной форме Signal v4.",
  "client/src/lib/signals.ts#mapSignalCandidate": "Детерминированно пересчитывает метрики, confidence и quality из структурированного evidence вместо доверия готовым model scores.",
  "client/src/lib/storage.ts#openAthenaLocalDb": "Открывает profile-scoped IndexedDB и создаёт stores/indexes текущей локальной схемы при upgrade.",
  "client/src/lib/storage.ts#saveLocalEntry": "Шифрует запись при активном vault и атомарно сохраняет её в локальный entries store.",
  "client/src/lib/vault.ts#setupVault": "Создаёт новый vault, data key и первое credential envelope, затем оставляет data key разблокированным в памяти.",
  "client/src/lib/vault.ts#encryptVaultJson": "Шифрует JSON текущим in-memory data key и привязывает ciphertext к associated data.",
  "server/app.ts#createApp": "Строит Express application в безопасном порядке: parsing, public config/auth, optional auth+CSRF ring, protected API, error handling и static client.",
  "server/db/migration-runner.ts#runMigrations": "Проверяет план и применяет ещё не выполненные SQL-миграции транзакционно с записью checksum/history.",
  "server/services/analytics-v2.service.ts#buildAnalyticsV2Overview": "Строит согласованные week/month summaries относительно одной последней даты данных.",
  "server/services/analytics-v2.service.ts#buildAnalyticsV2Summary": "Собирает одну Analytics V2 summary: baseline, current axes, density, versions, context, associations, quality и uncertainty.",
  "server/services/extraction.service.ts#extractSignal": "Выбирает provider/model, выполняет один transient extraction request и всегда возвращает sanitized Signal либо явный fallback.",
  "server/services/insight.service.ts#getCurrentInsightSnapshots": "Проверяет достаточность day/week/month evidence и создаёт или обновляет только допустимые текущие snapshots.",
  "server/services/insight-v3.service.ts#buildInsightV3Input": "Преобразует Analytics V2 summary в ограниченный evidence pack для пользовательского observation.",
  "server/services/insight-v3.service.ts#composeInsightV3Text": "Формирует не-клинический observation text только из выбранных evidence и uncertainty.",
  "shared/contracts/signalAnalysis.ts#analyzeSignalContext": "Детерминированно выводит intent, структуру и temporal context одной записи без истории и модельных догадок.",
};

const DIRECTORY_PURPOSES = {
  "client/src/platform/": "Клиентская platform infrastructure без продуктового UI",
  "client/src/shared/": "Действительно общая клиентская инфраструктура и примитивы",
  "client/src/app/": "Клиентская оркестрация приложения и lifecycle hook",
  "client/src/components/editor/": "UI-компонент редактора",
  "client/src/components/floating/": "Инфраструктура плавающих панелей и их геометрии",
  "client/src/components/": "Пользовательский UI-компонент",
  "client/src/features/auth/": "Клиентская feature server-auth",
  "client/src/features/editor/": "Клиентская feature редактора",
  "client/src/features/emotion/": "Локальный эксперимент извлечения emotion evidence",
  "client/src/features/entries/": "Клиентская feature архива записей",
  "client/src/features/exportImport/": "Локальный export/import",
  "client/src/features/extraction/": "Клиентский адаптер extraction API",
  "client/src/features/insights/": "Клиентская feature observations/insights",
  "client/src/features/rag/": "Локальная evidence-pack и ограниченная интерпретация",
  "client/src/features/selfReports/": "Локальные self-reports и синхронизация агрегатов",
  "client/src/features/semantic/": "Локальные embeddings и semantic index",
  "client/src/features/settings/": "Состояние и UI настроек",
  "client/src/features/sync/": "Политики и jobs фоновой синхронизации",
  "client/src/features/vault/": "React/API-адаптеры локального vault",
  "client/src/i18n/": "Интернационализация интерфейса",
  "client/src/lib/": "Низкоуровневая клиентская библиотека",
  "server/api/": "Express router HTTP API",
  "server/config/": "Конфигурация backend",
  "server/core/": "Доменные схемы, типы и чистые mapper-функции backend",
  "server/db/": "SQLite bootstrap и миграции",
  "server/middleware/": "Express middleware",
  "server/repositories/": "SQL repository без продуктовой оркестрации",
  "server/services/": "Backend service с бизнес-оркестрацией",
  "server/modules/analytics/": "Вертикальный backend-модуль analytics",
  "server/modules/auth/": "Вертикальный backend-модуль owner auth",
  "server/modules/entries/": "Вертикальный backend-модуль entries и signal persistence",
  "server/modules/exports/": "Вертикальный backend-модуль metadata export",
  "server/modules/extraction/": "Вертикальный backend-модуль extraction и signal contracts",
  "server/modules/insights/": "Вертикальный backend-модуль insight snapshots",
  "server/modules/selfReports/": "Вертикальный backend-модуль self-report aggregates",
  "server/platform/": "Общая backend platform infrastructure",
  "shared/contracts/": "Общий runtime/type контракт клиента и сервера",
  "test/e2e/": "Playwright end-to-end проверка",
  "test/helpers/": "Тестовая инфраструктура",
  "test/": "Node test для соответствующего сценария",
  "docs/": "Ручная проектная документация",
  "client/public/": "Статический browser asset",
  "client/assets/": "Скриншот интерфейса для README",
};

const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs"]);
const IGNORED_PATHS = new Set(["docs/CODEMAP.md"]);

function normalizePath(value) {
  return value.replaceAll("\\", "/");
}

function listProjectFiles() {
  const output = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard"],
    { cwd: projectRoot, encoding: "utf8" },
  );

  return [...new Set(output.split(/\r?\n/u).filter(Boolean).map(normalizePath))]
    .filter((file) => !IGNORED_PATHS.has(file))
    .filter((file) => existsSync(path.join(projectRoot, file)))
    .sort((left, right) => left.localeCompare(right));
}

function isExported(node) {
  return Boolean(
    node.modifiers?.some(
      (modifier) =>
        modifier.kind === ts.SyntaxKind.ExportKeyword ||
        modifier.kind === ts.SyntaxKind.DefaultKeyword,
    ),
  );
}

function lineOf(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function endLineOf(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
}

function analyzeCode(file) {
  const absolutePath = path.join(projectRoot, file);
  const sourceText = readFileSync(absolutePath, "utf8");
  const scriptKind = file.endsWith(".tsx")
    ? ts.ScriptKind.TSX
    : file.endsWith(".ts")
      ? ts.ScriptKind.TS
      : ts.ScriptKind.JS;
  const sourceFile = ts.createSourceFile(
    file,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );
  const result = {
    functions: [],
    publicDeclarations: [],
    routes: [],
    reexports: false,
  };

  function enclosingFunctionName(node) {
    let current = node.parent;
    while (current && current !== sourceFile) {
      if (ts.isFunctionDeclaration(current) && current.name) {
        return current.name.text;
      }
      if (ts.isMethodDeclaration(current) && current.name) {
        return current.name.getText(sourceFile);
      }
      if (
        (ts.isArrowFunction(current) || ts.isFunctionExpression(current)) &&
        ts.isVariableDeclaration(current.parent) &&
        ts.isIdentifier(current.parent.name)
      ) {
        return current.parent.name.text;
      }
      current = current.parent;
    }
    return null;
  }

  function functionScope(node, exported) {
    if (exported) return "public";
    if (ts.isMethodDeclaration(node)) return "method";
    return enclosingFunctionName(node) ? "nested" : "internal";
  }

  function directCalls(node) {
    const calls = [];
    const ignored = new Set([
      "map", "filter", "find", "some", "every", "reduce", "forEach",
      "includes", "join", "slice", "sort", "trim", "toString",
      "JSON.stringify", "JSON.parse", "console.warn", "console.log",
    ]);

    function visitCalls(current) {
      if (ts.isCallExpression(current)) {
        const expression = current.expression;
        let name = null;
        if (ts.isIdentifier(expression)) {
          name = expression.text;
        } else if (ts.isPropertyAccessExpression(expression)) {
          const owner = expression.expression;
          name = ts.isIdentifier(owner) && ["Array", "JSON", "Math", "Object", "Promise", "console", "crypto", "window"].includes(owner.text)
            ? `${owner.text}.${expression.name.text}`
            : expression.name.text;
        }
        if (name && !ignored.has(name) && !calls.includes(name)) calls.push(name);
      }
      ts.forEachChild(current, visitCalls);
    }

    visitCalls(node);
    return calls.slice(0, 8);
  }

  function addFunction(name, node, exported, parameters = []) {
    const callable = ts.isVariableDeclaration(node) ? node.initializer : node;
    let returnsValue = Boolean(
      callable &&
      ts.isArrowFunction(callable) &&
      !ts.isBlock(callable.body),
    );
    if (!returnsValue && callable) {
      function findReturn(current) {
        if (returnsValue) return;
        if (ts.isReturnStatement(current) && current.expression) {
          returnsValue = true;
          return;
        }
        ts.forEachChild(current, findReturn);
      }
      findReturn(callable);
    }

    result.functions.push({
      name,
      startLine: lineOf(sourceFile, node),
      endLine: endLineOf(sourceFile, node),
      scope: functionScope(node, exported),
      owner: enclosingFunctionName(node),
      parameters: parameters.map((parameter) => parameter.replaceAll(/\s+/gu, " ").trim()),
      calls: directCalls(node),
      returnsValue,
    });
  }

  for (const statement of sourceFile.statements) {
    if (ts.isClassDeclaration(statement) && statement.name && isExported(statement)) {
      result.publicDeclarations.push({
        name: `class ${statement.name.text}`,
        line: lineOf(sourceFile, statement),
      });
      continue;
    }

    if (
      (ts.isInterfaceDeclaration(statement) ||
        ts.isTypeAliasDeclaration(statement) ||
        ts.isEnumDeclaration(statement)) &&
      isExported(statement)
    ) {
      result.publicDeclarations.push({
        name: `type ${statement.name.text}`,
        line: lineOf(sourceFile, statement),
      });
      continue;
    }

    if (ts.isVariableStatement(statement) && isExported(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (
          ts.isIdentifier(declaration.name) &&
          !(
            declaration.initializer &&
            (ts.isArrowFunction(declaration.initializer) ||
              ts.isFunctionExpression(declaration.initializer))
          )
        ) {
          result.publicDeclarations.push({
            name: `const ${declaration.name.text}`,
            line: lineOf(sourceFile, declaration),
          });
        }
      }
    }

    if (ts.isExportDeclaration(statement)) {
      result.reexports = true;
    }
  }

  function visit(node) {
    if (ts.isFunctionDeclaration(node) && node.name) {
      addFunction(
        node.name.text,
        node,
        isExported(node),
        node.parameters.map((parameter) => parameter.name.getText(sourceFile)),
      );
    } else if (ts.isMethodDeclaration(node) && node.name) {
      addFunction(
        node.name.getText(sourceFile),
        node,
        false,
        node.parameters.map((parameter) => parameter.name.getText(sourceFile)),
      );
    } else if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))
    ) {
      const variableStatement = node.parent?.parent;
      addFunction(
        node.name.text,
        node,
        Boolean(variableStatement && ts.isVariableStatement(variableStatement) && isExported(variableStatement)),
        node.initializer.parameters.map((parameter) => parameter.name.getText(sourceFile)),
      );
    }

    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression)
    ) {
      const method = node.expression.name.text.toUpperCase();
      const owner = node.expression.expression.getText(sourceFile);
      const routeMethods = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);
      const firstArgument = node.arguments[0];

      if (
        routeMethods.has(method) &&
        /(?:router|app)$/iu.test(owner) &&
        firstArgument &&
        ts.isStringLiteralLike(firstArgument)
      ) {
        result.routes.push(`${method} ${firstArgument.text} (L${lineOf(sourceFile, node)})`);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  result.functions.sort((left, right) => left.startLine - right.startLine);
  return result;
}

function humanizeStem(file) {
  const stem = path.basename(file, path.extname(file));
  return stem
    .replaceAll(/[-_.]+/gu, " ")
    .replaceAll(/([a-z\d])([A-Z])/gu, "$1 $2")
    .toLocaleLowerCase();
}

function humanizeIdentifier(name) {
  return name
    .replace(/^(?:use|get|set|load|read|write|save|create|build|update|delete|remove|format|parse|validate|assert|normalize|handle|process|run|sync|enqueue|register|calculate|collect|extract|map|merge|apply|migrate|encrypt|decrypt|compare|select|compose|infer|plan|recover|mark|count|list|find|filter|sort|prune|clamp|round|split|group|open|close|lock|unlock|add|request|send|clear|touch|revoke|verify|hash|generate|serialize|score|pick|detect|subscribe|emit|is|has)/u, "")
    .replaceAll(/([a-z\d])([A-Z])/gu, "$1 $2")
    .replaceAll(/[-_.]+/gu, " ")
    .trim()
    .toLocaleLowerCase() || name;
}

function describeFunction(file, fn) {
  const exact = FUNCTION_PURPOSES[`${file}#${fn.name}`];
  if (exact) return exact;

  const subject = humanizeIdentifier(fn.name);
  const rules = [
    [/^[A-Z]/u, `Рендерит React-компонент ${fn.name} и связывает его props с соответствующей UI-поверхностью.`],
    [/^use/u, `Управляет React-состоянием, derived values и side effects для ${subject}.`],
    [/^(?:is|has|can|should)/u, `Проверяет условие ${subject} и возвращает логический результат без изменения состояния.`],
    [/^(?:get|read|load|list)/u, `Получает ${subject} из принадлежащего модулю источника данных.`],
    [/^(?:set|update|mark|touch)/u, `Изменяет ${subject}, сохраняя инварианты данного модуля.`],
    [/^(?:change|toggle)/u, `Обновляет или переключает ${subject} и связанные derived state.`],
    [/^(?:reset)/u, `Сбрасывает ${subject} в исходное согласованное состояние.`],
    [/^(?:save|write|insert|upsert|replace)/u, `Сохраняет ${subject} в принадлежащем модулю хранилище или read model.`],
    [/^(?:delete|remove|clear|revoke)/u, `Удаляет или очищает ${subject} с необходимыми связанными действиями.`],
    [/^(?:build|create|generate|compose)/u, `Создаёт ${subject} из переданных данных, не отдавая вызывающему коду детали сборки.`],
    [/^(?:normalize|sanitize)/u, `Приводит ${subject} к безопасной канонической форме и отбрасывает неподдерживаемые значения.`],
    [/^(?:validate|assert|verify)/u, `Проверяет корректность ${subject} и явно отклоняет нарушение контракта.`],
    [/^(?:parse|read)/u, `Разбирает ${subject} и преобразует вход в типизированное представление.`],
    [/^(?:format|serialize|stringify)/u, `Преобразует ${subject} в стабильное представление для UI, сети или хранения.`],
    [/^(?:handle|process|run|start|stop|cancel|release)/u, `Исполняет сценарий ${subject} и координирует его побочные эффекты.`],
    [/^(?:sync|enqueue|register)/u, `Оркестрирует ${subject} в инфраструктуре синхронизации или фоновой очереди.`],
    [/^(?:calculate|score|count)/u, `Детерминированно вычисляет ${subject} из входных данных.`],
    [/^(?:collect|extract)/u, `Извлекает ${subject} из входных данных без самостоятельного сохранения результата.`],
    [/^(?:map|merge|apply)/u, `Преобразует или объединяет ${subject} по правилам домена.`],
    [/^(?:migrate)/u, `Переводит ${subject} из legacy-формы в текущую без потери поддерживаемых данных.`],
    [/^(?:encrypt|decrypt|hash)/u, `Выполняет криптографическое преобразование ${subject} в рамках локальной privacy boundary.`],
    [/^(?:compare|sort)/u, `Сравнивает ${subject} для стабильного детерминированного порядка.`],
    [/^(?:find|select|pick|filter|prune)/u, `Выбирает ${subject}, удовлетворяющий ограничениям текущего сценария.`],
    [/^(?:infer|plan)/u, `Выводит ${subject} по явным правилам без скрытых побочных эффектов.`],
    [/^(?:clamp|round)/u, `Ограничивает ${subject} допустимым диапазоном или точностью.`],
    [/^(?:open|close|lock|unlock)/u, `Управляет состоянием ${subject} и соответствующей границей доступа.`],
    [/^(?:request|send)/u, `Выполняет внешний запрос для ${subject} и нормализует результат или ошибку.`],
  ];

  const matched = rules.find(([pattern]) => pattern.test(fn.name))?.[1];
  if (matched) return matched;
  if (/(?:Equal|Equals|Same)$/u.test(fn.name)) {
    return `Сравнивает ${subject} и возвращает результат равенства без изменения состояния.`;
  }
  if (fn.returnsValue) {
    return `Возвращает вычисленное значение ${subject} для использования внутри данного модуля.`;
  }
  return `Выполняет локальную операцию ${subject} внутри ответственности этого файла.`;
}

function purposeFor(file) {
  if (PURPOSES[file]) return PURPOSES[file];

  if (file.startsWith("test/")) {
    return `${DIRECTORY_PURPOSES[matchingPrefix(file)]}: ${humanizeStem(file)}.`;
  }

  if (file.endsWith(".sql")) return "SQL-миграция схемы SQLite.";
  if (file.endsWith(".css")) return "Стили соответствующей клиентской поверхности.";
  if (/package-lock\.json$/u.test(file)) return "Автогенерируемая фиксация npm dependency tree.";
  if (/package\.json$/u.test(file)) return "npm manifest, scripts и dependency policy соответствующего workspace.";
  if (/tsconfig.*\.json$/u.test(file)) return "Конфигурация TypeScript для соответствующей цели сборки.";
  if (/\.(png|jpg|jpeg|svg|ico)$/iu.test(file)) return "Статический визуальный asset; функций не содержит.";
  if (file.endsWith(".md")) return "Ручная документация по теме, обозначенной именем файла.";

  const prefix = matchingPrefix(file);
  if (prefix) {
    return `${DIRECTORY_PURPOSES[prefix]}: ${humanizeStem(file)}.`;
  }

  return `Проектный файл: ${humanizeStem(file)}.`;
}

function matchingPrefix(file) {
  return Object.keys(DIRECTORY_PURPOSES)
    .sort((left, right) => right.length - left.length)
    .find((prefix) => file.startsWith(prefix));
}

function sectionFor(file) {
  if (file.startsWith("client/src/")) return "Client runtime";
  if (file.startsWith("server/")) return "Server runtime";
  if (file.startsWith("shared/")) return "Shared contracts";
  if (file.startsWith("migrations/")) return "Database migrations";
  if (file.startsWith("test/")) return "Tests";
  if (file.startsWith("docs/")) return "Documentation";
  if (file.startsWith("client/")) return "Client support files";
  if (file.startsWith("scripts/")) return "Maintenance scripts";
  return "Root and deployment files";
}

function escapeTableCell(value) {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

function renderFileMapRow(file) {
  return `| \`${file}\` | ${escapeTableCell(purposeFor(file))} |`;
}

function renderFunction(file, fn) {
  const range = fn.startLine === fn.endLine
    ? `L${fn.startLine}`
    : `L${fn.startLine}–L${fn.endLine}`;
  const scopeLabels = {
    public: "public API",
    internal: "internal helper",
    nested: `nested helper в ${fn.owner}`,
    method: "class/object method",
  };
  const lines = [
    `#### \`${fn.name}\` — ${range} · ${scopeLabels[fn.scope]}`,
    "",
    describeFunction(file, fn),
  ];

  if (fn.parameters.length > 0) {
    lines.push("", `- Параметры: ${fn.parameters.map((value) => `\`${value}\``).join(", ")}.`);
  }
  if (fn.calls.length > 0) {
    lines.push("", `- Основные вызовы: ${fn.calls.map((value) => `\`${value}\``).join(", ")}.`);
  }

  return lines.join("\n");
}

function renderFunctionFile(file, analysis) {
  const lines = [`### \`${file}\``, "", purposeFor(file), ""];

  if (analysis.functions.length === 0) {
    lines.push(
      analysis.reexports
        ? "Именованных функций нет: файл служит re-export границей."
        : "Именованных функций нет: логика находится в bootstrap-коде, данных или анонимных callbacks.",
    );
  } else {
    for (const fn of analysis.functions) {
      lines.push(renderFunction(file, fn), "");
    }
  }

  if (analysis.routes.length > 0) {
    lines.push("#### HTTP routes", "");
    for (const route of analysis.routes) lines.push(`- \`${route}\``);
    lines.push("");
  }

  if (analysis.publicDeclarations.length > 0) {
    lines.push(
      "#### Публичные типы, классы и константы",
      "",
      analysis.publicDeclarations
        .map((declaration) => `- \`${declaration.name}\` — L${declaration.line}`)
        .join("\n"),
      "",
    );
  }

  return lines.join("\n").trim();
}

const files = listProjectFiles();
const sections = new Map();

for (const file of files) {
  const section = sectionFor(file);
  const sectionFiles = sections.get(section) ?? [];
  sectionFiles.push(file);
  sections.set(section, sectionFiles);
}

const sectionOrder = [
  "Client runtime",
  "Server runtime",
  "Shared contracts",
  "Database migrations",
  "Tests",
  "Documentation",
  "Client support files",
  "Maintenance scripts",
  "Root and deployment files",
];

const document = [
  "# Athena code map",
  "",
  "> Этот файл генерируется командой `npm run docs:codemap`. Не редактируйте каталог и диапазоны строк вручную: исправляйте код или `scripts/generate-code-map.mjs`.",
  "",
  "## Как читать карту",
  "",
  "- Сначала идёт компактная карта всех файлов и их зон ответственности.",
  "- После карты расположен подробный справочник именованных функций, методов и вложенных helpers.",
  "- Для каждой функции указаны назначение, область видимости, параметры, основные вызовы и диапазон строк `Lx–Ly`.",
  "- Описания критических функций заданы вручную; простые helpers документируются по имени, параметрам и вызовам. Если описание неточно, функцию стоит переименовать или добавить override в генератор.",
  "- Анонимные React callbacks и inline route handlers не получают искусственных имён; HTTP routes перечисляются отдельно.",
  "- Диапазоны строк относятся к текущему состоянию кода; после изменений перегенерируйте карту.",
  "- `node_modules`, build artifacts, runtime `data/` и сам этот generated-файл в каталог не входят.",
  "",
  "## Основные потоки",
  "",
  "```text",
  "main.tsx -> App.tsx -> auth/vault gates -> AthenaWorkspace",
  "                                      -> useAthenaApp",
  "                                         |- editor + local IndexedDB",
  "                                         |- entries/search",
  "                                         |- durable queue -> backend API",
  "                                         `- insights/settings",
  "",
  "Express route -> service -> repository -> SQLite",
  "entry text -> transient extraction -> sanitized Signal -> deterministic analytics -> insight snapshot",
  "```",
  "",
  "## Границы данных",
  "",
  "- Сырой текст записей, drafts, search index и raw self-reports принадлежат браузеру.",
  "- Backend принимает transient text только на extraction endpoint и хранит textless metadata/signals/aggregates/snapshots.",
  "- `shared/contracts` задаёт протокол между клиентом и сервером; изменения required fields требуют осознанной версии контракта.",
  "- UI не должен обращаться к SQLite напрямую: client API вызывает route, route — service, service — repository.",
  "",
  "## Карта файлов",
  "",
];

for (const section of sectionOrder) {
  const sectionFiles = sections.get(section);
  if (!sectionFiles?.length) continue;
  document.push(`### ${section}`, "", "| Файл | Ответственность |", "| --- | --- |");
  for (const file of sectionFiles) {
    document.push(renderFileMapRow(file));
  }
  document.push("");
}

document.push(
  "## Справочник функций",
  "",
  "Здесь перечислены все именованные function declarations, функции в переменных, class methods и вложенные именованные helpers. Диапазон строк показывает, какой участок файла реализует функцию.",
  "",
);

for (const section of sectionOrder) {
  const sectionFiles = sections.get(section)?.filter((file) =>
    CODE_EXTENSIONS.has(path.extname(file).toLocaleLowerCase()),
  );
  if (!sectionFiles?.length) continue;

  document.push(`## ${section}: функции`, "");
  for (const file of sectionFiles) {
    document.push(renderFunctionFile(file, analyzeCode(file)), "");
  }
}

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${document.join("\n").trim()}\n`, "utf8");
console.log(`Wrote ${normalizePath(path.relative(projectRoot, outputPath))} for ${files.length} files.`);
