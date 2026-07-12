import type { AthenaInsightTopic } from "./athenaInsightPhrasesTypes";

const ATHENA_INSIGHT_TEMPLATE_FRAMES_UK = [
  "У твоїх останніх записах знову виринає нитка {subject}.",
  "Кросна щоденника дедалі виразніше збирають візерунок навколо {subject}.",
  "Я бачу, як {subject} стає не випадковою згадкою, а справжнім знаком на полотні.",
  "Ця тема звучить негучно, проте наполегливо: {subject} просить уваги.",
  "Між рядками проступає питання про {subject}, і його вже важко оминути.",
  "У тканині твоїх днів {subject} набирає ваги та форми.",
  "Останні нотатки тримаються за {subject}, мов за міцну основу.",
  "Твоя внутрішня стратегія шукає яснішого ходу в темі {subject}.",
];

const ATHENA_INSIGHT_ADVICE_UK = [
  "Обери один малий, але точний крок щодо {subject}, і зроби його без зайвого галасу.",
  "Зніми з цієї теми одну зайву напругу, щоб нитка знову лягла рівно.",
  "Спершу зміцни основу, а вже потім думай про широкий візерунок.",
  "Не розплутуй усе полотно одразу; почни з вузла, який зараз у твоїй руці.",
  "Постав цій темі спокійну межу, щоб вона не забрала собі весь простір дня.",
  "Назви, чого тут бракує найбільше: часу, тиші, сміливості, ясності чи підтримки.",
  "Нехай дисципліна тут буде твоєю егідою, а не батогом.",
  "Повернися до {subject} із холодним розумом і одним зрозумілим наступним ходом.",
];

type TopicSeed = {
  id: string;
  aliases: string[];
  subject: string;
};

function createTopic(seed: TopicSeed): AthenaInsightTopic {
  return {
    ...seed,
    templates: ATHENA_INSIGHT_TEMPLATE_FRAMES_UK,
    advice: ATHENA_INSIGHT_ADVICE_UK,
  };
}

export const ATHENA_INSIGHT_TOPICS_UK: AthenaInsightTopic[] = [
  createTopic({
    id: "health",
    aliases: ["здоров'я", "самопочуття", "тіло", "health", "здоровье", "самочувствие"],
    subject: "тілесної рівноваги",
  }),
  createTopic({
    id: "sleep",
    aliases: ["сон", "відпочинок", "ніч", "sleep", "отдых"],
    subject: "нічного спокою",
  }),
  createTopic({
    id: "recovery",
    aliases: ["відновлення", "перезавантаження", "recovery", "восстановление", "перезагрузка"],
    subject: "повернення сил",
  }),
  createTopic({
    id: "fatigue",
    aliases: ["втома", "виснаження", "безсилля", "fatigue", "усталость", "истощение"],
    subject: "тягаря витраченої сили",
  }),
  createTopic({
    id: "work",
    aliases: ["робота", "завдання", "кар'єра", "work", "работа", "задачи", "карьера"],
    subject: "ладу твоєї праці",
  }),
  createTopic({
    id: "focus",
    aliases: ["фокус", "увага", "концентрація", "focus", "внимание", "концентрация"],
    subject: "гостроти уваги",
  }),
  createTopic({
    id: "productivity",
    aliases: ["продуктивність", "ефективність", "справи", "productivity", "продуктивность", "дела"],
    subject: "спокійного творення",
  }),
  createTopic({
    id: "learning",
    aliases: ["навчання", "учоба", "навички", "learning", "обучение", "учеба", "навыки"],
    subject: "плекання мудрості",
  }),
  createTopic({
    id: "relationships",
    aliases: ["стосунки", "близькі", "партнер", "relationships", "отношения", "близкие"],
    subject: "вибраних зв'язків",
  }),
  createTopic({
    id: "family",
    aliases: ["сім'я", "батьки", "діти", "family", "семья", "родители", "дети"],
    subject: "домашнього вогнища",
  }),
  createTopic({
    id: "home",
    aliases: ["дім", "побут", "простір", "home", "дом", "быт", "пространство"],
    subject: "порядку простору",
  }),
  createTopic({
    id: "money",
    aliases: ["гроші", "фінанси", "бюджет", "money", "деньги", "финансы"],
    subject: "матеріальної опори",
  }),
  createTopic({
    id: "uncertainty",
    aliases: ["невизначеність", "невідомість", "тривога", "uncertainty", "неопределенность", "неизвестность"],
    subject: "туману майбутнього",
  }),
  createTopic({
    id: "conflict",
    aliases: ["конфлікт", "суперечка", "незгода", "conflict", "конфликт", "спор", "несогласие"],
    subject: "зіткнення волі",
  }),
  createTopic({
    id: "social",
    aliases: ["спілкування", "друзі", "соціум", "social", "общение", "друзья"],
    subject: "кола зустрічей",
  }),
  createTopic({
    id: "creativity",
    aliases: ["творчість", "ідеї", "натхнення", "creativity", "творчество", "идеи", "вдохновение"],
    subject: "творення задумів",
  }),
  createTopic({
    id: "exercise",
    aliases: ["рух", "спорт", "активність", "exercise", "движение", "активность"],
    subject: "міцності тіла",
  }),
  createTopic({
    id: "travel",
    aliases: ["подорожі", "дорога", "мандрівка", "travel", "поездки", "путешествие"],
    subject: "доріг за межі звичного",
  }),
  createTopic({
    id: "planning",
    aliases: ["плани", "майбутнє", "цілі", "planning", "будущее", "цели"],
    subject: "вірної стратегії",
  }),
  createTopic({
    id: "emotions",
    aliases: ["емоції", "почуття", "стан", "emotions", "чувства", "состояние"],
    subject: "руху внутрішнього моря",
  }),
];
