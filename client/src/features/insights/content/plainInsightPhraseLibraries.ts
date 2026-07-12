import type { Language } from "../../../i18n/languages";
import {
  PLAIN_INSIGHT_TOPICS,
  type PlainInsightTopic,
} from "./insightPhrases";

type PlainTopicDefinition = {
  id: string;
  aliases: string[];
  subject: string;
};

const enTemplates = [
  "Your recent entries keep returning to {subject}.",
  "The notes from this period show repeated attention to {subject}.",
  "It looks like {subject} has become more visible in your diary.",
  "Several recent observations seem connected with {subject}.",
  "This topic keeps coming back in a quiet but noticeable way: {subject}.",
];

const enAdvice = [
  "Pick one small action that would make this topic lighter today.",
  "Write down what you can influence here and what can wait.",
  "Try to reduce this topic to one clear next step.",
  "Give yourself a short pause before deciding what to do next.",
  "Name the need behind this pattern before trying to fix it.",
];

const deTemplates = [
  "Deine letzten Einträge kehren immer wieder zu {subject} zurück.",
  "In den Notizen dieser Zeit zeigt sich wiederholt Aufmerksamkeit für {subject}.",
  "Es sieht so aus, als wäre {subject} in deinem Tagebuch sichtbarer geworden.",
  "Mehrere aktuelle Beobachtungen scheinen mit {subject} verbunden zu sein.",
  "Dieses Thema taucht leise, aber deutlich wieder auf: {subject}.",
];

const deAdvice = [
  "Wähle eine kleine Handlung, die dieses Thema heute etwas leichter macht.",
  "Notiere, was du hier beeinflussen kannst und was warten darf.",
  "Reduziere dieses Thema auf einen klaren nächsten Schritt.",
  "Gönn dir eine kurze Pause, bevor du entscheidest, wie es weitergeht.",
  "Benenne das Bedürfnis hinter diesem Muster, bevor du es lösen willst.",
];

const ukTemplates = [
  "Останні записи знову повертаються до {subject}.",
  "У нотатках цього періоду помітна повторна увага до {subject}.",
  "Схоже, {subject} стала виразнішою темою у щоденнику.",
  "Кілька недавніх спостережень пов'язані з {subject}.",
  "Ця тема повертається тихо, але помітно: {subject}.",
];

const ukAdvice = [
  "Обери одну малу дію, яка зробить цю тему легшою сьогодні.",
  "Запиши, на що тут можеш вплинути, а що може зачекати.",
  "Зведи цю тему до одного зрозумілого наступного кроку.",
  "Дай собі коротку паузу, перш ніж вирішувати, що робити далі.",
  "Назви потребу за цим патерном, перш ніж намагатися його виправити.",
];

const enTopics = buildTopics(
  [
    topic("health", ["health", "wellbeing", "body", "здоровье", "самочувствие"], "your wellbeing"),
    topic("sleep", ["sleep", "rest", "night", "сон", "отдых"], "sleep"),
    topic("recovery", ["recovery", "reset", "restoration", "восстановление"], "recovery"),
    topic("fatigue", ["fatigue", "exhaustion", "усталость", "истощение"], "fatigue"),
    topic("work", ["work", "tasks", "career", "работа", "задачи"], "work"),
    topic("focus", ["focus", "attention", "concentration", "внимание"], "attention"),
    topic("productivity", ["productivity", "efficiency", "продуктивность"], "productivity"),
    topic("learning", ["learning", "study", "skills", "обучение", "навыки"], "learning"),
    topic("relationships", ["relationships", "partner", "closeness", "отношения"], "relationships"),
    topic("family", ["family", "parents", "children", "семья"], "family"),
    topic("home", ["home", "space", "household", "дом", "быт"], "home"),
    topic("money", ["money", "finance", "budget", "деньги", "финансы"], "finances"),
    topic("uncertainty", ["uncertainty", "unknown", "anxiety", "тревога"], "uncertainty"),
    topic("conflict", ["conflict", "argument", "disagreement", "конфликт"], "conflict"),
    topic("social", ["social", "friends", "communication", "общение"], "social energy"),
    topic("creativity", ["creativity", "ideas", "inspiration", "творчество"], "creativity"),
    topic("exercise", ["exercise", "movement", "sport", "движение"], "movement"),
    topic("travel", ["travel", "journey", "road", "поездки"], "travel"),
    topic("planning", ["planning", "plans", "future", "goals", "планы"], "plans"),
    topic("emotions", ["emotions", "feelings", "state", "эмоции"], "emotions"),
  ],
  enTemplates,
  enAdvice,
);

const deTopics = buildTopics(
  [
    topic("health", ["gesundheit", "wohlbefinden", "körper", "health", "здоровье"], "dein Wohlbefinden"),
    topic("sleep", ["schlaf", "ruhe", "nacht", "sleep", "сон"], "Schlaf"),
    topic("recovery", ["erholung", "regeneration", "reset", "recovery"], "Erholung"),
    topic("fatigue", ["müdigkeit", "erschöpfung", "fatigue", "усталость"], "Müdigkeit"),
    topic("work", ["arbeit", "aufgaben", "karriere", "work", "работа"], "Arbeit"),
    topic("focus", ["fokus", "aufmerksamkeit", "konzentration", "focus"], "Aufmerksamkeit"),
    topic("productivity", ["produktivität", "effizienz", "productivity"], "Produktivität"),
    topic("learning", ["lernen", "studium", "fähigkeiten", "learning"], "Lernen"),
    topic("relationships", ["beziehungen", "nähe", "partner", "relationships"], "Beziehungen"),
    topic("family", ["familie", "eltern", "kinder", "family"], "Familie"),
    topic("home", ["zuhause", "haushalt", "raum", "home"], "Zuhause"),
    topic("money", ["geld", "finanzen", "budget", "money"], "Finanzen"),
    topic("uncertainty", ["unsicherheit", "ungewissheit", "angst", "uncertainty"], "Unsicherheit"),
    topic("conflict", ["konflikt", "streit", "uneinigkeit", "conflict"], "Konflikte"),
    topic("social", ["soziales", "freunde", "kommunikation", "social"], "soziale Energie"),
    topic("creativity", ["kreativität", "ideen", "inspiration", "creativity"], "Kreativität"),
    topic("exercise", ["bewegung", "sport", "aktivität", "exercise"], "Bewegung"),
    topic("travel", ["reise", "weg", "unterwegssein", "travel"], "Reisen"),
    topic("planning", ["planung", "pläne", "zukunft", "ziele", "planning"], "Pläne"),
    topic("emotions", ["emotionen", "gefühle", "zustand", "emotions"], "Emotionen"),
  ],
  deTemplates,
  deAdvice,
);

const ukTopics = buildTopics(
  [
    topic("health", ["здоров'я", "самопочуття", "тіло", "health", "здоровье"], "самопочуття"),
    topic("sleep", ["сон", "відпочинок", "ніч", "sleep"], "сон"),
    topic("recovery", ["відновлення", "перезавантаження", "recovery"], "відновлення"),
    topic("fatigue", ["втома", "виснаження", "fatigue", "усталость"], "втома"),
    topic("work", ["робота", "завдання", "кар'єра", "work"], "робота"),
    topic("focus", ["фокус", "увага", "концентрація", "focus"], "увага"),
    topic("productivity", ["продуктивність", "ефективність", "справи", "productivity"], "продуктивність"),
    topic("learning", ["навчання", "учоба", "навички", "learning"], "навчання"),
    topic("relationships", ["стосунки", "близькі", "партнер", "relationships"], "стосунки"),
    topic("family", ["сім'я", "батьки", "діти", "family"], "сім'я"),
    topic("home", ["дім", "побут", "простір", "home"], "дім"),
    topic("money", ["гроші", "фінанси", "бюджет", "money"], "фінанси"),
    topic("uncertainty", ["невизначеність", "невідомість", "тривога", "uncertainty"], "невизначеність"),
    topic("conflict", ["конфлікт", "суперечка", "незгода", "conflict"], "конфлікт"),
    topic("social", ["спілкування", "друзі", "соціум", "social"], "спілкування"),
    topic("creativity", ["творчість", "ідеї", "натхнення", "creativity"], "творчість"),
    topic("exercise", ["рух", "спорт", "активність", "exercise"], "рух"),
    topic("travel", ["подорожі", "дорога", "мандрівка", "travel"], "подорожі"),
    topic("planning", ["плани", "майбутнє", "цілі", "planning"], "плани"),
    topic("emotions", ["емоції", "почуття", "стан", "emotions"], "емоції"),
  ],
  ukTemplates,
  ukAdvice,
);

const plainInsightLibraries = {
  de: deTopics,
  en: enTopics,
  ru: PLAIN_INSIGHT_TOPICS,
  uk: ukTopics,
} satisfies Record<Language, PlainInsightTopic[]>;

export function getPlainInsightTopics(language: Language = "en") {
  return plainInsightLibraries[language];
}

function topic(id: string, aliases: string[], subject: string): PlainTopicDefinition {
  return { aliases, id, subject };
}

function buildTopics(
  definitions: PlainTopicDefinition[],
  templates: string[],
  advice: string[],
): PlainInsightTopic[] {
  return definitions.map((definition) => ({
    ...definition,
    advice,
    templates,
  }));
}
