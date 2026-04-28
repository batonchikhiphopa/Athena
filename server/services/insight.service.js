import {
  ACTIVE_PROMPT_VERSION,
  ACTIVE_SCHEMA_VERSION,
} from "../config/versions.js";
import {
  countValidDays,
  listVisibleSnapshots,
  softDeleteSnapshot,
  getLatestVisibleSnapshot,
  getTopTopic,
  upsertSnapshot,
} from "../repositories/insight.repository.js";

const LAYERS = [
  {
    layer: "day",
    days: 1,
    minValidDays: 1,
    retainDays: 0,
  },
  {
    layer: "week",
    days: 7,
    minValidDays: 4,
    retainDays: 14,
  },
  {
    layer: "month",
    days: 30,
    minValidDays: 14,
    retainDays: 45,
  },
];

export async function getCurrentInsightSnapshots(db, { today }) {
  const safeToday = isDateOnly(today) ? today : formatDateOnly(new Date());
  const snapshots = [];

  for (const config of LAYERS) {
    const periodEnd =
      config.layer === "day" ? addDays(safeToday, -1) : safeToday;
    const periodStart = addDays(periodEnd, -(config.days - 1));
    const validDays = await countValidDays(db, {
      from: periodStart,
      to: periodEnd,
    });

    if (validDays >= config.minValidDays) {
      const snapshot = await createOrRefreshSnapshot(db, {
        ...config,
        periodStart,
        periodEnd,
        today: safeToday,
      });

      if (snapshot) {
        snapshots.push(toPublicSnapshot(snapshot));
      }
      continue;
    }

    if (config.layer === "day") continue;

    const retained = await getLatestVisibleSnapshot(db, {
      layer: config.layer,
      today: safeToday,
    });

    if (retained) {
      snapshots.push(toPublicSnapshot(retained));
    }
  }

  return snapshots;
}

export async function listInsightSnapshots(db) {
  const snapshots = await listVisibleSnapshots(db);
  return snapshots.map(toPublicSnapshot);
}

export async function deleteInsightSnapshot(db, id) {
  if (!Number.isInteger(Number(id))) return false;

  return softDeleteSnapshot(db, Number(id));
}

async function createOrRefreshSnapshot(
  db,
  { layer, periodStart, periodEnd, retainDays, today },
) {
  const topTopic = await getTopTopic(db, {
    from: periodStart,
    to: periodEnd,
  });
  const text = composeInsightText({ layer, topTopic });
  if (!text) return null;
  const generatedAt = new Date().toISOString();
  const expiresAt =
    layer === "day" ? today : addDays(periodEnd, retainDays);

  return upsertSnapshot(db, {
    layer,
    periodStart,
    periodEnd,
    topic: topTopic,
    text,
    generatedAt,
    expiresAt,
    schemaVersion: ACTIVE_SCHEMA_VERSION,
    promptVersion: ACTIVE_PROMPT_VERSION,
  });
}

function composeInsightText({ layer, topTopic }) {
  if (!topTopic) return null;

  const subject = topicSubject(topTopic);
  const advice = topicAdvice(topTopic);

  if (layer === "day") {
    return `Вчера снова возвращалась тема ${subject}. ${advice}`;
  }

  if (layer === "week") {
    return `На этой неделе снова возвращалась тема ${subject}. ${advice}`;
  }

  return `За месяц тема ${subject} появлялась чаще других. ${advice}`;
}

function toPublicSnapshot(snapshot) {
  return {
    id: snapshot.id,
    layer: snapshot.layer,
    period_start: snapshot.period_start,
    period_end: snapshot.period_end,
    topic: snapshot.topic ?? null,
    text: snapshot.text,
    generated_at: snapshot.generated_at,
    expires_at: snapshot.expires_at,
  };
}

function topicSubject(topic) {
  const normalized = normalizeTopic(topic);
  const knownSubjects = {
    health: "самочувствия",
    здоровье: "самочувствия",
    самочувствие: "самочувствия",
    wellbeing: "самочувствия",
    "well-being": "самочувствия",
    sleep: "сна",
    сон: "сна",
    rest: "отдыха",
    отдых: "отдыха",
    recovery: "восстановления",
    восстановление: "восстановления",
    work: "работы",
    работа: "работы",
    job: "работы",
    career: "работы",
    focus: "фокуса",
    фокус: "фокуса",
    productivity: "продуктивности",
    продуктивность: "продуктивности",
    learning: "обучения",
    обучение: "обучения",
    study: "обучения",
    family: "семьи",
    семья: "семьи",
    home: "дома",
    дом: "дома",
    relationship: "отношений",
    relationships: "отношений",
    отношения: "отношений",
    money: "денег",
    деньги: "денег",
    finance: "денег",
    finances: "денег",
  };

  return knownSubjects[normalized] ?? `«${topic.trim()}»`;
}

function topicAdvice(topic) {
  const normalized = normalizeTopic(topic);

  if (
    ["health", "здоровье", "самочувствие", "wellbeing", "well-being"].includes(
      normalized,
    )
  ) {
    return "Не раскручивай это в тревогу: выбери один простой шаг заботы о себе сегодня.";
  }

  if (
    ["sleep", "сон", "rest", "отдых", "recovery", "восстановление"].includes(
      normalized,
    )
  ) {
    return "Начни с базы: чуть меньше экрана, чуть больше тишины и нормальный вечер без перегруза.";
  }

  if (
    [
      "work",
      "работа",
      "job",
      "career",
      "focus",
      "фокус",
      "productivity",
      "продуктивность",
    ].includes(normalized)
  ) {
    return "Попробуй выбрать один следующий шаг, а не держать весь ком задач в голове.";
  }

  return "Выбери один маленький шаг, который сделает эту тему понятнее или легче.";
}

function normalizeTopic(topic) {
  return String(topic).trim().toLowerCase();
}

function isDateOnly(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function addDays(dateOnly, days) {
  const [year, month, day] = dateOnly.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);

  return formatDateOnly(date);
}

function formatDateOnly(date) {
  return date.toISOString().slice(0, 10);
}
