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
  aliases: string;
  cancel: string;
  coachReviewEmpty: string;
  coachReviewIntro: string;
  coachReviewTitle: string;
  confidence: string;
  correct: string;
  direction: string;
  directionDescription: string;
  organization: string;
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
  trackingMode: string;
  trackingModeLabel: Record<"standard" | "reduce", string>;
  userVersion: string;
  webSources: string;
};

const en: ResultsCorrectionCopy = {
  accept: "Include in Results",
  add: "Add",
  addAlias: "Add monitoring alias",
  addMonitoringTag: "Add tag",
  aiDisabled: "Gemini is unavailable or there are not enough confirmed facts.",
  aliases: "Aliases",
  cancel: "Cancel",
  coachReviewEmpty: "No formulated review yet.",
  coachReviewIntro: "Athena separates the situation shown by confirmed Results facts from optional actions and web-grounded suggestions.",
  coachReviewTitle: "Work review",
  confidence: "Confidence",
  correct: "Correct",
  direction: "Direction",
  directionDescription: "Optional user-owned group, for example “Learn German”.",
  organization: "Organisation",
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
  kind: { activity: "repeatable activity", task: "work item" },
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
  status: {
    accepted: "accepted",
    corrected: "corrected",
    pending: "pending",
    rejected: "rejected",
  },
  tagRule: "linked by tag rule",
  trackingMode: "Tracking",
  trackingModeLabel: { reduce: "Reduce", standard: "Standard" },
  userVersion: "Canonical user version",
  webSources: "Web sources",
};

const ru: ResultsCorrectionCopy = {
  ...en,
  accept: "Включить в Results",
  add: "Добавить",
  addAlias: "Добавить алиас мониторинга",
  addMonitoringTag: "Добавить тег",
  aiDisabled: "Gemini недоступен или подтверждённых фактов пока недостаточно.",
  aliases: "Алиасы",
  cancel: "Отмена",
  coachReviewEmpty: "Сформулированного обзора пока нет.",
  coachReviewIntro: "Athena отделяет положение дел по подтверждённым фактам Results от необязательных действий и советов из веб-источников.",
  coachReviewTitle: "Обзор по делам",
  confidence: "Уверенность",
  correct: "Исправить",
  direction: "Направление",
  directionDescription: "Необязательная пользовательская группа, например «Учить немецкий».",
  organization: "Организация",
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
  kind: { activity: "повторяющаяся практика", task: "дело" },
  machineProposal: "Извлечено автоматически",
  manageTitle: "Настройка дела",
  manualLink: "Привязать запись вручную",
  manualLinkDescription: "Пользовательская связь канонична и хранится отдельно от extraction.",
  merge: "Объединить с",
  mergeDescription: "Алиасы и исходные связи перейдут к выбранному делу.",
  monitoringAliases: "Точные алиасы, которые должна отслеживать Athena",
  monitoringTags: "Автопривязка по тегам",
  monitoringTagsDescription: "Записи с любым из этих тегов автоматически прикрепляются к делу. Записи с отключённым анализом не используются.",
  moveToNew: "Перенести в новое дело",
  pendingIntro: "Athena заметила возможное новое дело. До вашего решения оно не попадёт в Results.",
  proposalsTitle: "Предложения для Results",
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
  status: {
    accepted: "accepted",
    corrected: "corrected",
    pending: "pending",
    rejected: "rejected",
  },
  tagRule: "привязано по тегу",
  trackingMode: "Режим отслеживания",
  trackingModeLabel: { reduce: "Сократить", standard: "Обычный" },
  userVersion: "Каноническая версия пользователя",
  webSources: "Веб-источники",
};

const de: ResultsCorrectionCopy = {
  ...en,
  accept: "In Results aufnehmen",
  addMonitoringTag: "Tag hinzufügen",
  coachReviewEmpty: "Noch kein Review formuliert.",
  coachReviewIntro: "Athena trennt die durch bestätigte Results-Fakten belegte Lage von optionalen Handlungen und webbasierten Hinweisen.",
  coachReviewTitle: "Arbeitsreview",
  correct: "Korrigieren",
  formulateReview: "Review formulieren",
  kind: { activity: "wiederholte Aktivität", task: "Vorhaben" },
  machineProposal: "Automatisch extrahiert",
  monitoringTags: "Automatische Verknüpfung nach Tag",
  monitoringTagsDescription: "Einträge mit einem dieser Tags werden automatisch verknüpft. Einträge mit deaktivierter Analyse bleiben ausgeschlossen.",
  proposalsTitle: "Extraktionsvorschläge",
  reject: "Ablehnen",
  reviewPeriod: { day: "Heute", week: "Letzte 7 Tage" },
  reviewSignal: {
    blocked: "Hindernis erfasst",
    completed: "Abschluss erfasst",
    missingNextStep: "nächster Schritt fehlt",
    moved: "vorangekommen",
    repeated: "ohne Ergebnis wiederholt",
  },
  tagRule: "über Tag-Regel verknüpft",
  webSources: "Webquellen",
};

const uk: ResultsCorrectionCopy = {
  ...en,
  accept: "Додати до Results",
  addMonitoringTag: "Додати тег",
  coachReviewEmpty: "Сформульованого огляду поки немає.",
  coachReviewIntro: "Athena відокремлює стан справ за підтвердженими фактами Results від необов'язкових дій і порад із веб-джерел.",
  coachReviewTitle: "Огляд справ",
  correct: "Виправити",
  formulateReview: "Сформулювати огляд",
  kind: { activity: "повторювана практика", task: "справа" },
  machineProposal: "Вилучено автоматично",
  monitoringTags: "Автоприв’язка за тегами",
  monitoringTagsDescription: "Записи з будь-яким із цих тегів автоматично прикріплюються до справи. Записи з вимкненим аналізом не використовуються.",
  proposalsTitle: "Пропозиції extraction",
  reject: "Відхилити",
  reviewPeriod: { day: "Сьогодні", week: "Останні 7 днів" },
  reviewSignal: {
    blocked: "є перешкода",
    completed: "зафіксовано завершення",
    missingNextStep: "немає наступного кроку",
    moved: "було просування",
    repeated: "повторювалося без результату",
  },
  tagRule: "прив’язано за тегом",
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
