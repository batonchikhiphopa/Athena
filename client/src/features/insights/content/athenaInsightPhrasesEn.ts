import type { AthenaInsightTopic } from "./athenaInsightPhrasesTypes";

const ATHENA_INSIGHT_TEMPLATE_FRAMES_EN = [
  "A recurring contour around {subject} is beginning to stand out in the archive.",
  "The recent entries keep returning to the structure of {subject}.",
  "I can see a pattern forming where {subject} has become one of the load-bearing themes.",
  "The signal is not loud, but it is persistent: {subject} is asking for attention.",
  "Across the last pages, {subject} appears like a line drawn with deliberate pressure.",
  "The weave is tightening around {subject}, and the pattern is becoming easier to read.",
  "Your notes suggest that {subject} is no longer background texture, but part of the main design.",
  "A clear strategic question is forming around {subject}.",
];

const ATHENA_INSIGHT_ADVICE_EN = [
  "Choose one precise action around {subject}, small enough to complete without ceremony.",
  "Remove one unnecessary demand from this area and let the structure breathe.",
  "Look at the next step as a mason would: stable foundation first, ornament later.",
  "Do not try to solve the whole pattern at once; tighten the single thread in your hand.",
  "Give this theme a quiet boundary, so it does not claim the whole field of your attention.",
  "Name the resource this area needs most: time, rest, courage, clarity, or help.",
  "Let discipline serve steadiness here, not severity.",
  "Return to this theme with a cool mind and one measurable next move.",
];

type TopicSeed = {
  id: string;
  aliases: string[];
  subject: string;
};

function createTopic(seed: TopicSeed): AthenaInsightTopic {
  return {
    ...seed,
    templates: ATHENA_INSIGHT_TEMPLATE_FRAMES_EN,
    advice: ATHENA_INSIGHT_ADVICE_EN,
  };
}

export const ATHENA_INSIGHT_TOPICS_EN: AthenaInsightTopic[] = [
  createTopic({
    id: "health",
    aliases: ["health", "wellbeing", "body", "здоровье", "самочувствие", "тело"],
    subject: "bodily steadiness",
  }),
  createTopic({
    id: "sleep",
    aliases: ["sleep", "rest", "night", "сон", "отдых", "ночь"],
    subject: "nightly restoration",
  }),
  createTopic({
    id: "recovery",
    aliases: ["recovery", "reset", "restoration", "восстановление", "перезагрузка"],
    subject: "the return of strength",
  }),
  createTopic({
    id: "fatigue",
    aliases: ["fatigue", "exhaustion", "depletion", "усталость", "истощение", "бессилие"],
    subject: "the weight of spent energy",
  }),
  createTopic({
    id: "work",
    aliases: ["work", "tasks", "career", "работа", "задачи", "карьера"],
    subject: "the architecture of work",
  }),
  createTopic({
    id: "focus",
    aliases: ["focus", "attention", "concentration", "фокус", "внимание", "концентрация"],
    subject: "the discipline of attention",
  }),
  createTopic({
    id: "productivity",
    aliases: ["productivity", "efficiency", "output", "продуктивность", "дела", "эффективность"],
    subject: "deliberate making",
  }),
  createTopic({
    id: "learning",
    aliases: ["learning", "study", "skills", "обучение", "учеба", "навыки"],
    subject: "the craft of learning",
  }),
  createTopic({
    id: "relationships",
    aliases: ["relationships", "partner", "closeness", "отношения", "близкие", "партнер"],
    subject: "chosen bonds",
  }),
  createTopic({
    id: "family",
    aliases: ["family", "parents", "children", "семья", "родители", "дети"],
    subject: "the inner hearth",
  }),
  createTopic({
    id: "home",
    aliases: ["home", "space", "household", "дом", "быт", "пространство"],
    subject: "the order of home",
  }),
  createTopic({
    id: "money",
    aliases: ["money", "finance", "budget", "деньги", "финансы", "бюджет"],
    subject: "material footing",
  }),
  createTopic({
    id: "uncertainty",
    aliases: ["uncertainty", "unknown", "anxiety", "неопределенность", "неизвестность", "тревога"],
    subject: "the unmarked road ahead",
  }),
  createTopic({
    id: "conflict",
    aliases: ["conflict", "argument", "disagreement", "конфликт", "спор", "несогласие"],
    subject: "colliding wills",
  }),
  createTopic({
    id: "social",
    aliases: ["social", "friends", "communication", "общение", "друзья", "социум"],
    subject: "the field of encounters",
  }),
  createTopic({
    id: "creativity",
    aliases: ["creativity", "ideas", "inspiration", "творчество", "идеи", "вдохновение"],
    subject: "the shaping of ideas",
  }),
  createTopic({
    id: "exercise",
    aliases: ["exercise", "movement", "sport", "движение", "спорт", "активность"],
    subject: "embodied strength",
  }),
  createTopic({
    id: "travel",
    aliases: ["travel", "road", "journey", "поездки", "дорога", "путешествие"],
    subject: "roads beyond the familiar",
  }),
  createTopic({
    id: "planning",
    aliases: ["planning", "plans", "future", "goals", "планы", "будущее", "цели"],
    subject: "strategic direction",
  }),
  createTopic({
    id: "emotions",
    aliases: ["emotions", "feelings", "state", "эмоции", "чувства", "состояние"],
    subject: "the weather of the inner life",
  }),
];
