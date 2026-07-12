import type { InsightSnapshot } from "../../../shared/contracts";
import {
  DEFAULT_ATHENA_INSIGHT_LANGUAGE,
  getAthenaInsightTopics,
  type AthenaInsightLanguage,
} from "./athenaInsightPhraseLibraries";
import { getPlainInsightTopics } from "./plainInsightPhraseLibraries";
import { getProfileScopedStorageKey } from "../../vault/vaultProfiles";

type InsightTextOptions = {
  language?: AthenaInsightLanguage;
  personaTextEnabled: boolean;
};

type InsightTopic = {
  id: string;
  aliases: string[];
  subject: string;
  templates: string[];
  advice: string[];
};

export function formatInsightText(
  insight: InsightSnapshot,
  {
    language = DEFAULT_ATHENA_INSIGHT_LANGUAGE,
    personaTextEnabled,
  }: InsightTextOptions,
) {
  const topic = getInsightTopic(insight);

  if (!topic) return insight.text;

  const topics = personaTextEnabled
    ? getAthenaInsightTopics(language)
    : getPlainInsightTopics(language);
  const topicProfile = findTopicProfile(topic, topics);
  const subject = topicProfile?.subject ?? `«${topic.trim()}»`;
  const tone = personaTextEnabled
    ? getAthenaInsightTone(language)
    : getPlainInsightTone(language);
  const topicKey = topicProfile?.id ?? normalizeTopic(topic);
  const seed = [
    tone,
    insight.id,
    insight.layer,
    insight.period_end,
    topicKey,
  ].join(":");

  const template =
    pickInsightLine(topicProfile?.templates ?? [], `${seed}:template`, {
      insightId: insight.id,
      kind: "template",
      tone,
      topicKey,
    }) ??
    fallbackTemplate(insight.layer, personaTextEnabled, language);
  const advice =
    pickInsightLine(topicProfile?.advice ?? [], `${seed}:advice`, {
      insightId: insight.id,
      kind: "advice",
      tone,
      topicKey,
    }) ??
    fallbackAdvice(personaTextEnabled, language);

  return joinSentences(
    renderTemplate(template, subject),
    renderTemplate(advice, subject),
  );
}

function findTopicProfile(topic: string, topics: InsightTopic[]) {
  const normalized = normalizeTopic(topic);

  return topics.find((item) => {
    if (normalizeTopic(item.id) === normalized) return true;

    return item.aliases.some((alias) => normalizeTopic(alias) === normalized);
  });
}

function getInsightTopic(insight: InsightSnapshot) {
  if (insight.topic?.trim()) return insight.topic.trim();

  const legacyTopic = insight.text.match(/тема:\s*([^.;]+)/i)?.[1]?.trim();
  return legacyTopic || null;
}

function fallbackTemplate(
  layer: InsightSnapshot["layer"],
  personaTextEnabled: boolean,
  language: AthenaInsightLanguage,
) {
  if (personaTextEnabled) {
    if (language === "en") {
      if (layer === "day") {
        return "Yesterday's weave brought {subject} back into view.";
      }

      if (layer === "week") {
        return "Across the week, {subject} kept forming a visible line.";
      }

      return "Across the month, {subject} became one of the clearer patterns.";
    }

    if (language === "de") {
      if (layer === "day") {
        return "Im gestrigen Gewebe trat {subject} wieder hervor.";
      }

      if (layer === "week") {
        return "In der Woche blieb {subject} als deutlicher Faden sichtbar.";
      }

      return "Im Monatsmuster wurde {subject} klarer erkennbar.";
    }

    if (language === "uk") {
      if (layer === "day") {
        return "У візерунку вчорашнього дня знову проступила тема {subject}.";
      }

      if (layer === "week") {
        return "У тканині тижня {subject} залишалася помітною ниткою.";
      }

      return "У місячному полотні {subject} стала виразнішим знаком.";
    }

    if (layer === "day") {
      return "В узоре вчерашнего дня снова проступила тема {subject}.";
    }

    if (layer === "week") {
      return "В ткани недели снова заметна тема {subject}.";
    }

    return "В узоре месяца отчетливее проступила тема {subject}.";
  }

  if (layer === "day") {
    if (language === "en") {
      return "Yesterday brought {subject} back into focus.";
    }

    if (language === "de") {
      return "Gestern rückte {subject} wieder in den Fokus.";
    }

    if (language === "uk") {
      return "Учора {subject} знову опинилася у фокусі.";
    }

    return "Вчера снова возвращалась тема {subject}.";
  }

  if (layer === "week") {
    if (language === "en") {
      return "This week, {subject} appeared more than once.";
    }

    if (language === "de") {
      return "Diese Woche tauchte {subject} mehr als einmal auf.";
    }

    if (language === "uk") {
      return "Цього тижня {subject} з'являлася більше ніж раз.";
    }

    return "На этой неделе снова возвращалась тема {subject}.";
  }

  if (language === "en") {
    return "Across the month, {subject} appeared more often than other themes.";
  }

  if (language === "de") {
    return "Im Monatsverlauf erschien {subject} häufiger als andere Themen.";
  }

  if (language === "uk") {
    return "Протягом місяця {subject} з'являлася частіше за інші теми.";
  }

  return "За месяц тема {subject} появлялась чаще других.";
}

function fallbackAdvice(
  personaTextEnabled: boolean,
  language: AthenaInsightLanguage,
) {
  if (personaTextEnabled) {
    if (language === "en") {
      return "Choose one precise step and do not try to untangle the whole pattern at once.";
    }

    if (language === "de") {
      return "Wähle einen klaren Schritt und versuche nicht, das ganze Gewebe sofort zu ordnen.";
    }

    if (language === "uk") {
      return "Обери один точний крок і не намагайся розплутати все полотно одразу.";
    }

    return "Выбери один точный шаг и не пытайся распутать весь узел сразу.";
  }

  if (language === "en") {
    return "Choose one small step that makes this topic clearer or lighter.";
  }

  if (language === "de") {
    return "Wähle einen kleinen Schritt, der dieses Thema klarer oder leichter macht.";
  }

  if (language === "uk") {
    return "Обери один малий крок, який зробить цю тему яснішою або легшою.";
  }

  return "Выбери один маленький шаг, который сделает эту тему понятнее или легче.";
}

function getAthenaInsightTone(language: AthenaInsightLanguage) {
  return language === DEFAULT_ATHENA_INSIGHT_LANGUAGE
    ? "athena"
    : `athena:${language}`;
}

function getPlainInsightTone(language: AthenaInsightLanguage) {
  return language === DEFAULT_ATHENA_INSIGHT_LANGUAGE
    ? "plain"
    : `plain:${language}`;
}

function renderTemplate(template: string, subject: string) {
  return template.replaceAll("{subject}", subject).trim();
}

function joinSentences(first: string, second: string) {
  if (!first) return second;
  if (!second) return first;

  return `${first} ${second}`;
}

function pickInsightLine(
  items: string[],
  seed: string,
  scope: {
    insightId: number;
    kind: "template" | "advice";
    tone: string;
    topicKey: string;
  },
) {
  if (items.length === 0) return null;

  const storage = getLocalStorage();
  if (!storage) return deterministicPick(items, seed);

  const choiceKey = getChoiceKey(scope, items.length);
  const existingChoice = readIndex(storage.getItem(choiceKey), items.length);
  if (existingChoice !== null) return items[existingChoice];

  const bagKey = getBagKey(scope, items.length);
  const bag = readBag(storage.getItem(bagKey), items.length);
  const bagPosition = hashSeed(seed) % bag.length;
  const pickedIndex = bag[bagPosition];

  bag.splice(bagPosition, 1);

  try {
    storage.setItem(choiceKey, String(pickedIndex));
    storage.setItem(bagKey, JSON.stringify(bag));
  } catch {
    return items[pickedIndex] ?? deterministicPick(items, seed);
  }

  return items[pickedIndex] ?? deterministicPick(items, seed);
}

function getChoiceKey(
  scope: {
    insightId: number;
    kind: "template" | "advice";
    tone: string;
    topicKey: string;
  },
  itemCount: number,
) {
  return getProfileScopedStorageKey([
    "athena_insight_choice",
    scope.tone,
    scope.kind,
    scope.topicKey,
    scope.insightId,
    itemCount,
  ].join(":"));
}

function getBagKey(
  scope: {
    kind: "template" | "advice";
    tone: string;
    topicKey: string;
  },
  itemCount: number,
) {
  return getProfileScopedStorageKey([
    "athena_insight_bag",
    scope.tone,
    scope.kind,
    scope.topicKey,
    itemCount,
  ].join(":"));
}

function readIndex(raw: string | null, itemCount: number) {
  if (!raw) return null;

  const index = Number(raw);
  if (!Number.isInteger(index) || index < 0 || index >= itemCount) return null;

  return index;
}

function readBag(raw: string | null, itemCount: number) {
  const freshBag = () =>
    Array.from({ length: itemCount }, (_, index) => index);

  if (!raw) return freshBag();

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return freshBag();

    const uniqueIndexes = new Set(
      parsed.filter(
        (value): value is number =>
          Number.isInteger(value) && value >= 0 && value < itemCount,
      ),
    );
    const bag = Array.from(uniqueIndexes);

    return bag.length > 0 ? bag : freshBag();
  } catch {
    return freshBag();
  }
}

function getLocalStorage() {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

function deterministicPick<T>(items: T[], seed: string) {
  if (items.length === 0) return null;

  return items[hashSeed(seed) % items.length];
}

function hashSeed(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function normalizeTopic(topic: string) {
  return topic.trim().toLowerCase();
}
