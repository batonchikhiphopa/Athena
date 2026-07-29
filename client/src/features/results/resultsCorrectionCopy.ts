import type { ActivityContextEvent } from "../../shared/contracts";
import type { Language } from "../../i18n/languages";
import type { ExtractionProposalStatus } from "./resultsCorrections";
import type { ActivityKind } from "./resultsTypes";
import type { ReviewPeriod, ReviewQuestion } from "./reviewModel";

export type ResultsCorrectionCopy = {
  accept: string;
  add: string;
  addAlias: string;
  addMonitoringTag: string;
  aiDisabled: string;
  aliasPlaceholder: string;
  aliases: string;
  cancel: string;
  coachReviewEmpty: string;
  coachReviewIntro: string;
  coachReviewTitle: string;
  confidence: string;
  correct: string;
  emptySources: string;
  event: string;
  eventLabel: Record<ActivityContextEvent, string>;
  formulateReview: string;
  kind: Record<ActivityKind, string>;
  machineProposal: string;
  manageTitle: string;
  manualLink: string;
  manualLinkDescription: string;
  merge: string;
  mergeDescription: string;
  monitoringAliases: string;
  monitoringTags: string;
  monitoringTagsDescription: string;
  moveToNew: string;
  pendingIntro: string;
  proposalsTitle: string;
  reject: string;
  remove: string;
  restore: string;
  reviewPeriod: Record<ReviewPeriod, string>;
  reviewSignal: Record<ReviewQuestion, string>;
  save: string;
  sourceEntry: string;
  sources: string;
  split: string;
  status: Record<ExtractionProposalStatus, string>;
  tagRule: string;
  chooseEpisodeEvent: string;
  chooseTag: string;
  addAliasOrTag: string;
  activityKind: string;
  dragActivity: (label: string) => string;
  dropAsParent: string;
  itemName: string;
  renameHint: string;
  priority: string;
  priorityDescription: string;
  priorityLabel: (priority: number) => string;
  userVersion: string;
  webSources: string;
};

const en: ResultsCorrectionCopy = {
  accept: "Include in Results",
  add: "Add",
  addAlias: "Add monitoring alias",
  addMonitoringTag: "Add tag",
  aiDisabled: "Gemini is unavailable or there are not enough confirmed facts.",
  aliasPlaceholder: "alias",
  aliases: "Aliases",
  cancel: "Cancel",
  coachReviewEmpty: "No formulated review yet.",
  coachReviewIntro: "Athena separates the situation shown by confirmed Results facts from optional actions and web-grounded suggestions.",
  coachReviewTitle: "Work review",
  confidence: "Confidence",
  correct: "Correct",
  chooseEpisodeEvent: "Choose episode stage",
  chooseTag: "Choose tag",
  emptySources: "No linked source entries.",
  event: "Event type",
  eventLabel: {
    abandoned: "abandoned",
    blocked: "blocked",
    completed: "completed",
    maintained: "maintained",
    paused: "paused",
    planned: "planned",
    progressed: "progressed",
    result: "result",
    started: "started",
    unknown: "unknown",
  },
  formulateReview: "Formulate review",
  kind: { activity: "repeatable activity", habit: "harmful habit", task: "work item" },
  machineProposal: "Automatically extracted",
  manageTitle: "Results item",
  manualLink: "Link an entry manually",
  manualLinkDescription: "The user link is canonical and stays separate from extraction.",
  merge: "Merge into",
  mergeDescription: "Aliases and source links move to the selected item.",
  monitoringAliases: "Exact aliases Athena should monitor",
  monitoringTags: "Automatic links by tag",
  monitoringTagsDescription: "Entries with any of these tags are attached automatically. Entries with analysis disabled stay excluded.",
  moveToNew: "Move to a new item",
  pendingIntro: "Athena found a new possible item. It will not enter Results until you decide.",
  proposalsTitle: "Extraction proposals",
  reject: "Reject",
  remove: "Remove",
  restore: "Restore link",
  reviewPeriod: { day: "Today", week: "Last 7 days" },
  reviewSignal: {
    blocked: "blocker recorded",
    completed: "completion recorded",
    missingNextStep: "next step missing",
    moved: "moved forward",
    repeated: "repeated without a result",
  },
  save: "Save",
  sourceEntry: "Source entry",
  sources: "Source links",
  split: "Separate",
  addAliasOrTag: "Add alias or tag",
  activityKind: "Item type",
  dragActivity: (label) => `Move ${label}`,
  dropAsParent: "Drag a lower-priority item here",
  itemName: "Item name",
  renameHint: "Double-click to rename",
  status: {
    accepted: "accepted",
    corrected: "corrected",
    pending: "pending",
    rejected: "rejected",
  },
  tagRule: "linked by tag rule",
  priority: "Priority",
  priorityDescription: "A higher rank can become the parent of lower-ranked items.",
  priorityLabel: (priority) => {
    const normalized = Math.max(1, Math.min(5, priority));
    const labels = ["", "Dormant", "Routine", "Tactic", "Command", "Aegis"];
    return `${labels[normalized]} priority`;
  },
  userVersion: "Canonical user version",
  webSources: "Web sources",
};

const ru: ResultsCorrectionCopy = {
  accept: "Включить в результаты",
  add: "Добавить",
  addAlias: "Добавить алиас мониторинга",
  addMonitoringTag: "Добавить тег",
  aiDisabled: "Gemini недоступен или подтверждённых фактов пока недостаточно.",
  aliasPlaceholder: "алиас",
  aliases: "Алиасы",
  cancel: "Отмена",
  coachReviewEmpty: "Сформулированного обзора пока нет.",
  coachReviewIntro: "Athena отделяет положение дел по подтверждённым фактам от необязательных действий и советов из веб-источников.",
  coachReviewTitle: "Обзор по делам",
  confidence: "Уверенность",
  correct: "Исправить",
  chooseEpisodeEvent: "Выбрать этап эпизода",
  chooseTag: "Выбрать тег",
  emptySources: "Связанных исходных записей нет.",
  event: "Тип события",
  eventLabel: {
    abandoned: "отказ",
    blocked: "препятствие",
    completed: "завершение",
    maintained: "поддержание",
    paused: "пауза",
    planned: "план",
    progressed: "продвижение",
    result: "результат",
    started: "начало",
    unknown: "не определено",
  },
  formulateReview: "Сформулировать обзор",
  kind: { activity: "повторяющаяся практика", habit: "вредная привычка", task: "дело" },
  machineProposal: "Извлечено автоматически",
  manageTitle: "Настройка дела",
  manualLink: "Привязать запись вручную",
  manualLinkDescription: "Пользовательская связь канонична и хранится отдельно от автоматического извлечения.",
  merge: "Объединить с",
  mergeDescription: "Алиасы и исходные связи перейдут к выбранному делу.",
  monitoringAliases: "Точные алиасы, которые должна отслеживать Athena",
  monitoringTags: "Автопривязка по тегам",
  monitoringTagsDescription: "Записи с любым из этих тегов автоматически прикрепляются к делу. Записи с отключённым анализом не используются.",
  moveToNew: "Перенести в новое дело",
  pendingIntro: "Athena заметила возможное новое дело. До вашего решения оно не попадёт в результаты.",
  proposalsTitle: "Предложения для результатов",
  reject: "Отклонить",
  remove: "Удалить",
  restore: "Вернуть связь",
  reviewPeriod: { day: "Сегодня", week: "Последние 7 дней" },
  reviewSignal: {
    blocked: "есть препятствие",
    completed: "зафиксировано завершение",
    missingNextStep: "нет следующего шага",
    moved: "было движение",
    repeated: "повторялось без результата",
  },
  save: "Сохранить",
  sourceEntry: "Исходная запись",
  sources: "Связи с записями",
  split: "Разделить",
  addAliasOrTag: "Добавить алиас или тег",
  activityKind: "Тип дела",
  dragActivity: (label) => `Переместить ${label}`,
  dropAsParent: "Перетащите сюда дело с меньшим приоритетом",
  itemName: "Название дела",
  renameHint: "Дважды нажмите, чтобы переименовать",
  status: {
    accepted: "принято",
    corrected: "исправлено",
    pending: "ожидает решения",
    rejected: "отклонено",
  },
  tagRule: "привязано по тегу",
  priority: "Приоритет",
  priorityDescription: "Дело с более высоким рангом может стать родителем для дел ниже рангом.",
  priorityLabel: (priority) => {
    const normalized = Math.max(1, Math.min(5, priority));
    const labels = ["", "Спящий", "Рутинный", "Тактический", "Командный", "Опорный"];
    return `${labels[normalized]} приоритет`;
  },
  userVersion: "Каноническая версия пользователя",
  webSources: "Веб-источники",
};

const de: ResultsCorrectionCopy = {
  accept: "In Results aufnehmen",
  add: "Hinzufügen",
  addAlias: "Monitoring-Alias hinzufügen",
  addMonitoringTag: "Tag hinzufügen",
  aiDisabled: "Gemini ist nicht verfügbar oder es gibt noch nicht genug bestätigte Fakten.",
  coachReviewEmpty: "Noch kein Review formuliert.",
  coachReviewIntro: "Athena trennt die durch bestätigte Results-Fakten belegte Lage von optionalen Handlungen und webbasierten Hinweisen.",
  coachReviewTitle: "Arbeitsreview",
  confidence: "Konfidenz",
  correct: "Korrigieren",
  aliasPlaceholder: "Alias",
  aliases: "Aliase",
  cancel: "Abbrechen",
  chooseEpisodeEvent: "Episodephase wählen",
  chooseTag: "Tag wählen",
  emptySources: "Keine verknüpften Quelleneinträge.",
  event: "Ereignistyp",
  eventLabel: {
    abandoned: "abgebrochen",
    blocked: "blockiert",
    completed: "abgeschlossen",
    maintained: "gehalten",
    paused: "pausiert",
    planned: "geplant",
    progressed: "vorangekommen",
    result: "Ergebnis",
    started: "gestartet",
    unknown: "unklar",
  },
  formulateReview: "Review formulieren",
  kind: { activity: "wiederholte Aktivität", habit: "schädliche Gewohnheit", task: "Vorhaben" },
  machineProposal: "Automatisch extrahiert",
  manageTitle: "Results-Eintrag",
  manualLink: "Eintrag manuell verknüpfen",
  manualLinkDescription: "Die Nutzerverknüpfung ist kanonisch und bleibt von der Extraktion getrennt.",
  merge: "Zusammenführen mit",
  mergeDescription: "Aliase und Quellverknüpfungen wandern zum ausgewählten Eintrag.",
  monitoringAliases: "Exakte Aliase, die Athena beobachten soll",
  monitoringTags: "Automatische Verknüpfung nach Tag",
  monitoringTagsDescription: "Einträge mit einem dieser Tags werden automatisch verknüpft. Einträge mit deaktivierter Analyse bleiben ausgeschlossen.",
  pendingIntro: "Athena hat einen möglichen neuen Eintrag gefunden. Er erscheint erst in Results, wenn du entschieden hast.",
  proposalsTitle: "Extraktionsvorschläge",
  reject: "Ablehnen",
  remove: "Entfernen",
  restore: "Verknüpfung wiederherstellen",
  reviewPeriod: { day: "Heute", week: "Letzte 7 Tage" },
  reviewSignal: {
    blocked: "Hindernis erfasst",
    completed: "Abschluss erfasst",
    missingNextStep: "nächster Schritt fehlt",
    moved: "vorangekommen",
    repeated: "ohne Ergebnis wiederholt",
  },
  tagRule: "über Tag-Regel verknüpft",
  save: "Speichern",
  sourceEntry: "Quelleneintrag",
  sources: "Quellverknüpfungen",
  split: "Trennen",
  status: {
    accepted: "angenommen",
    corrected: "korrigiert",
    pending: "offen",
    rejected: "abgelehnt",
  },
  addAliasOrTag: "Alias oder Tag hinzufügen",
  activityKind: "Eintragstyp",
  dragActivity: (label) => `${label} verschieben`,
  dropAsParent: "Ein Vorhaben mit niedrigerer Priorität hierher ziehen",
  itemName: "Name des Eintrags",
  moveToNew: "In neuen Eintrag verschieben",
  renameHint: "Zum Umbenennen doppelklicken",
  priority: "Priorität",
  priorityDescription: "Ein höherer Rang kann Elternpunkt für niedriger eingestufte Einträge werden.",
  priorityLabel: (priority) => {
    const normalized = Math.max(1, Math.min(5, priority));
    const labels = ["", "Ruhend", "Routine", "Taktisch", "Führung", "Anker"];
    return `${labels[normalized]} Priorität`;
  },
  userVersion: "Kanonische Nutzerversion",
  webSources: "Webquellen",
};

const uk: ResultsCorrectionCopy = {
  accept: "Додати до результатів",
  add: "Додати",
  addAlias: "Додати аліас моніторингу",
  addMonitoringTag: "Додати тег",
  aiDisabled: "Gemini недоступний або підтверджених фактів поки недостатньо.",
  aliasPlaceholder: "аліас",
  aliases: "Аліаси",
  cancel: "Скасувати",
  coachReviewEmpty: "Сформульованого огляду поки немає.",
  coachReviewIntro: "Athena відокремлює стан справ за підтвердженими фактами від необов'язкових дій і порад із веб-джерел.",
  coachReviewTitle: "Огляд справ",
  confidence: "Впевненість",
  correct: "Виправити",
  chooseEpisodeEvent: "Вибрати етап епізоду",
  chooseTag: "Вибрати тег",
  emptySources: "Пов'язаних вихідних записів немає.",
  event: "Тип події",
  eventLabel: {
    abandoned: "відмова",
    blocked: "перешкода",
    completed: "завершення",
    maintained: "підтримання",
    paused: "пауза",
    planned: "план",
    progressed: "просування",
    result: "результат",
    started: "початок",
    unknown: "не визначено",
  },
  formulateReview: "Сформулювати огляд",
  kind: { activity: "повторювана практика", habit: "шкідлива звичка", task: "справа" },
  machineProposal: "Вилучено автоматично",
  manageTitle: "Налаштування справи",
  manualLink: "Прив'язати запис вручну",
  manualLinkDescription: "Користувацький зв'язок канонічний і зберігається окремо від автоматичного вилучення.",
  merge: "Об'єднати з",
  mergeDescription: "Аліаси й вихідні зв'язки перейдуть до вибраної справи.",
  monitoringAliases: "Точні аліаси, які Athena має відстежувати",
  monitoringTags: "Автоприв’язка за тегами",
  monitoringTagsDescription: "Записи з будь-яким із цих тегів автоматично прикріплюються до справи. Записи з вимкненим аналізом не використовуються.",
  pendingIntro: "Athena помітила можливу нову справу. До вашого рішення вона не потрапить до результатів.",
  proposalsTitle: "Пропозиції для результатів",
  reject: "Відхилити",
  remove: "Видалити",
  restore: "Повернути зв'язок",
  reviewPeriod: { day: "Сьогодні", week: "Останні 7 днів" },
  reviewSignal: {
    blocked: "є перешкода",
    completed: "зафіксовано завершення",
    missingNextStep: "немає наступного кроку",
    moved: "було просування",
    repeated: "повторювалося без результату",
  },
  tagRule: "прив’язано за тегом",
  save: "Зберегти",
  sourceEntry: "Вихідний запис",
  sources: "Зв'язки із записами",
  split: "Розділити",
  status: {
    accepted: "прийнято",
    corrected: "виправлено",
    pending: "очікує рішення",
    rejected: "відхилено",
  },
  addAliasOrTag: "Додати аліас або тег",
  activityKind: "Тип справи",
  dragActivity: (label) => `Перемістити ${label}`,
  dropAsParent: "Перетягніть сюди справу з нижчим пріоритетом",
  itemName: "Назва справи",
  moveToNew: "Перенести в нову справу",
  renameHint: "Двічі натисніть, щоб перейменувати",
  priority: "Пріоритет",
  priorityDescription: "Справа з вищим рангом може стати батьківською для справ нижчого рангу.",
  priorityLabel: (priority) => {
    const normalized = Math.max(1, Math.min(5, priority));
    const labels = ["", "Сплячий", "Рутинний", "Тактичний", "Командний", "Опорний"];
    return `${labels[normalized]} пріоритет`;
  },
  userVersion: "Канонічна версія користувача",
  webSources: "Веб-джерела",
};

const copyByLanguage: Record<Language, ResultsCorrectionCopy> = {
  de,
  en,
  ru,
  uk,
};

export function getResultsCorrectionCopy(language: Language) {
  return copyByLanguage[language];
}
