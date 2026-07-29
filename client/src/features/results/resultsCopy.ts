import type { Language } from "../../i18n/languages";

export type ResultsCopy = {
  activityGraph: string;
  activities: string;
  debug: {
    burnout: string;
    confidence: string;
    evidence: string;
    fatigue: string;
    focus: string;
    generated: string;
    kind: string;
    load: string;
    model: string;
    recentEvents: string;
    rhythm: string;
    span: string;
    stage: string;
    stale: string;
    status: string;
    title: string;
  };
  demoInsight: {
    activity: string;
    habit: string;
    task: string;
  };
  demoNotice: string;
  empty: string;
  insightInsufficient: string;
  insightLoading: string;
  insightUnavailable: string;
  insightUpdating: string;
  insightDailyLimit: string;
  latest: (date: string) => string;
  openInResults: string;
  reviewPeriod: string;
  snapshotMentions: string;
  snapshotResults: string;
  snapshotBlockers: string;
  rhythm: Record<"insufficient" | "irregular" | "paused" | "returning" | "steady", string>;
  sourceEntries: string;
  stage: Record<"active" | "completed" | "stalled" | "starting" | "unknown", string>;
  tasks: string;
};

const en: ResultsCopy = {
  activityGraph: "Activity",
  activities: "Activities",
  debug: {
    burnout: "burnout relation",
    confidence: "confidence",
    evidence: "evidence",
    fatigue: "fatigue",
    focus: "focus",
    generated: "generated",
    kind: "kind",
    load: "load",
    model: "model",
    recentEvents: "recent events",
    rhythm: "rhythm",
    span: "span days",
    stage: "stage",
    stale: "stale cache",
    status: "status",
    title: "Debug · local aggregate",
  },
  demoInsight: {
    activity:
      "You return to this activity when you need to untangle your thoughts. In these entries it appears alongside a calmer load and preserved focus, so it may be worth keeping readily available as a recovery practice.",
    habit:
      "This habit keeps recurring in the entries. Making its triggers and costs visible is more useful than turning it into a judgement of yourself.",
    task: "This work is moving through short cycles of progress and revision. Friction appears around the blocked parts, so keeping one clear next step is likely more useful than widening the scope.",
  },
  demoNotice: "Demo data — activities will be rebuilt from your entries",
  empty: "No clear activities have been found in the entries yet.",
  insightInsufficient:
    "So far this is only one separate episode, not enough to call it a pattern.",
  insightLoading: "Athena is restoring the latest picture…",
  insightUnavailable:
    "There is no current summary yet. Athena will keep the source entries here and update the picture when analysis is available.",
  insightUpdating: "Athena is updating the current picture…",
  insightDailyLimit: "AI review is limited to one request per day.",
  latest: (date) => `latest · ${date}`,
  openInResults: "Open in Results",
  reviewPeriod: "Last 7 days",
  snapshotMentions: "Mentions",
  snapshotResults: "Results",
  snapshotBlockers: "Blockers",
  rhythm: {
    insufficient: "not enough history",
    irregular: "irregular",
    paused: "paused",
    returning: "returning",
    steady: "steady",
  },
  sourceEntries: "Source entries",
  stage: {
    active: "the entries suggest it is in progress",
    completed: "the entries suggest it is completed",
    stalled: "the entries suggest it is stalled",
    starting: "the entries suggest it is just starting",
    unknown: "the entries do not show a clear status yet",
  },
  tasks: "Things",
};

const de: ResultsCopy = {
  activityGraph: "Aktivität",
  activities: "Aktivitäten",
  debug: {
    burnout: "Burnout-Bezug",
    confidence: "Konfidenz",
    evidence: "Evidenz",
    fatigue: "Erschöpfung",
    focus: "Fokus",
    generated: "erstellt",
    kind: "Art",
    load: "Belastung",
    model: "Modell",
    recentEvents: "letzte Ereignisse",
    rhythm: "Rhythmus",
    span: "Zeitraum in Tagen",
    stage: "Phase",
    stale: "veralteter Cache",
    status: "Status",
    title: "Debug · lokales Aggregat",
  },
  demoInsight: {
    activity:
      "Du kehrst zu dieser Aktivität zurück, wenn du deine Gedanken ordnen möchtest. In diesen Einträgen steht sie neben ruhigerer Belastung und erhaltenem Fokus; als leicht erreichbare Erholungspraxis könnte sie nützlich bleiben.",
    habit:
      "Diese Gewohnheit taucht in den Einträgen wieder auf. Auslöser und Kosten sichtbar zu machen, ist nützlicher als sie als persönliches Versagen zu behandeln.",
    task: "Diese Arbeit bewegt sich in kurzen Schleifen aus Fortschritt und Überarbeitung. Reibung zeigt sich an den blockierten Stellen; ein klarer nächster Schritt ist deshalb hilfreicher als ein breiterer Umfang.",
  },
  demoNotice: "Demo-Daten — Aktivitäten werden aus eigenen Einträgen aufgebaut",
  empty: "Noch keine klaren Aktivitäten in den Einträgen gefunden.",
  insightInsufficient:
    "Bisher ist das nur eine einzelne Episode und noch kein belastbares Muster.",
  insightLoading: "Athena stellt das letzte Bild wieder her…",
  insightUnavailable:
    "Noch gibt es keine aktuelle Zusammenfassung. Athena behält die Quelleneinträge hier und aktualisiert das Bild, sobald die Analyse verfügbar ist.",
  insightUpdating: "Athena aktualisiert das aktuelle Bild…",
  insightDailyLimit: "Das KI-Review ist auf eine Anfrage pro Tag begrenzt.",
  latest: (date) => `zuletzt · ${date}`,
  openInResults: "In Results öffnen",
  reviewPeriod: "Letzte 7 Tage",
  snapshotMentions: "Erwähnungen",
  snapshotResults: "Ergebnisse",
  snapshotBlockers: "Hindernisse",
  rhythm: {
    insufficient: "noch zu wenig Verlauf",
    irregular: "unregelmäßig",
    paused: "pausiert",
    returning: "wieder aufgenommen",
    steady: "stetig",
  },
  sourceEntries: "Quelleneinträge",
  stage: {
    active: "den Einträgen nach, in Arbeit",
    completed: "den Einträgen nach, abgeschlossen",
    stalled: "den Einträgen nach, festgefahren",
    starting: "den Einträgen nach, am Anfang",
    unknown: "aus den Einträgen noch nicht klar",
  },
  tasks: "Vorhaben",
};

const ru: ResultsCopy = {
  activityGraph: "Активность",
  activities: "Активности",
  debug: {
    burnout: "связь с выгоранием",
    confidence: "уверенность",
    evidence: "наблюдений",
    fatigue: "усталость",
    focus: "фокус",
    generated: "обновлено",
    kind: "тип",
    load: "нагрузка",
    model: "модель",
    recentEvents: "последние события",
    rhythm: "ритм",
    span: "период в днях",
    stage: "этап",
    stale: "устаревший кэш",
    status: "статус",
    title: "Debug · локальная агрегация",
  },
  demoInsight: {
    activity:
      "Ты возвращаешься к этому занятию, когда нужно разобрать мысли. В этих записях оно соседствует с более спокойной нагрузкой и сохранённым фокусом, поэтому его можно держать под рукой как практику восстановления.",
    habit:
      "Эта привычка снова появляется в записях. Полезнее сделать видимыми триггеры и цену эпизодов, чем превращать это в оценку себя.",
    task: "Дело движется короткими циклами продвижения и доработки. Напряжение заметнее рядом с застрявшими частями, поэтому сейчас полезнее удерживать один ясный следующий шаг, а не расширять фронт.",
  },
  demoNotice: "Демо-данные — занятия будут собраны из ваших записей",
  empty: "В записях пока не нашлось ясных занятий.",
  insightInsufficient:
    "Пока это только один отдельный эпизод — закономерность из него не получается.",
  insightLoading: "Athena восстанавливает последнюю картину…",
  insightUnavailable:
    "Свежего вывода пока нет. Athena сохранит здесь исходные записи и обновит картину, когда анализ будет доступен.",
  insightUpdating: "Athena обновляет текущую картину…",
  insightDailyLimit: "AI-обзор доступен не чаще одного раза в день.",
  latest: (date) => `последнее · ${date}`,
  openInResults: "Открыть в Results",
  reviewPeriod: "Последние 7 дней",
  snapshotMentions: "Упоминаний",
  snapshotResults: "Результатов",
  snapshotBlockers: "Препятствий",
  rhythm: {
    insufficient: "истории пока мало",
    irregular: "нерегулярно",
    paused: "пауза",
    returning: "возвращение",
    steady: "устойчиво",
  },
  sourceEntries: "Исходные записи",
  stage: {
    active: "судя по записям, продолжается",
    completed: "судя по записям, завершено",
    stalled: "судя по записям, застряло",
    starting: "судя по записям, только начинается",
    unknown: "по записям положение пока неясно",
  },
  tasks: "Дела",
};

const uk: ResultsCopy = {
  activityGraph: "Активність",
  activities: "Активності",
  debug: {
    burnout: "зв’язок із вигоранням",
    confidence: "впевненість",
    evidence: "спостережень",
    fatigue: "втома",
    focus: "фокус",
    generated: "оновлено",
    kind: "тип",
    load: "навантаження",
    model: "модель",
    recentEvents: "останні події",
    rhythm: "ритм",
    span: "період у днях",
    stage: "етап",
    stale: "застарілий кеш",
    status: "статус",
    title: "Debug · локальна агрегація",
  },
  demoInsight: {
    activity:
      "Ти повертаєшся до цього заняття, коли потрібно впорядкувати думки. У цих записах воно сусідить зі спокійнішим навантаженням і збереженим фокусом, тому його можна тримати поруч як практику відновлення.",
    habit:
      "Ця звичка знову з'являється в записах. Корисніше зробити видимими тригери й ціну епізодів, ніж перетворювати це на оцінку себе.",
    task: "Справа рухається короткими циклами просування й доопрацювання. Напруження помітніше біля частин, що застрягли, тому зараз корисніше втримувати один ясний наступний крок, а не розширювати фронт.",
  },
  demoNotice: "Демо-дані — заняття будуть зібрані з ваших записів",
  empty: "У записах поки не знайдено чітких занять.",
  insightInsufficient:
    "Поки це лише один окремий епізод — закономірності з нього не виходить.",
  insightLoading: "Athena відновлює останню картину…",
  insightUnavailable:
    "Свіжого висновку поки немає. Athena збереже тут вихідні записи й оновить картину, коли аналіз буде доступний.",
  insightUpdating: "Athena оновлює поточну картину…",
  insightDailyLimit: "AI-огляд доступний не частіше одного разу на день.",
  latest: (date) => `останнє · ${date}`,
  openInResults: "Відкрити в Results",
  reviewPeriod: "Останні 7 днів",
  snapshotMentions: "Згадок",
  snapshotResults: "Результатів",
  snapshotBlockers: "Перешкод",
  rhythm: {
    insufficient: "історії поки мало",
    irregular: "нерегулярно",
    paused: "пауза",
    returning: "повернення",
    steady: "стало",
  },
  sourceEntries: "Вихідні записи",
  stage: {
    active: "судячи із записів, триває",
    completed: "судячи із записів, завершено",
    stalled: "судячи із записів, застрягло",
    starting: "судячи із записів, лише починається",
    unknown: "із записів стан поки неясний",
  },
  tasks: "Справи",
};

const copyByLanguage: Record<Language, ResultsCopy> = { de, en, ru, uk };

export function getResultsCopy(language: Language) {
  return copyByLanguage[language];
}
