import type { Language } from "../../i18n/languages";
import type { ActivityKind } from "./resultsTypes";

type ActivityAliasGroup = {
  id: string;
  aliases: readonly string[];
  kind?: ActivityKind;
  labels: Record<Language, string>;
};

// Only exact, high-confidence equivalents belong here. Broad fuzzy matching
// would risk merging activities that merely share a topic.
const ACTIVITY_ALIAS_GROUPS = [
  {
    id: "job search",
    aliases: [
      "arbeitssuche",
      "applying for jobs",
      "bewerbungen",
      "job hunting",
      "job and education applications",
      "job and study applications",
      "job applications",
      "job search",
      "jobsuche",
      "stellenbewerbungen",
      "bewerbungen auf stellen",
      "пошук роботи",
      "відгуки на вакансії",
      "подача заявок на роботу",
      "отклики на вакансии",
      "подача заявок на работу",
      "поиск вакансий",
      "поиск работы",
    ],
    kind: "task",
    labels: {
      de: "Jobsuche",
      en: "job search",
      ru: "поиск работы",
      uk: "пошук роботи",
    },
  },
  {
    id: "german learning",
    aliases: [
      "deutsch lernen",
      "german language learning",
      "german learning",
      "learning german",
      "studying german",
      "вивчення німецької",
      "вивчення німецької мови",
      "изучение немецкого",
      "изучение немецкого языка",
      "учить немецкий",
    ],
    kind: "activity",
    labels: {
      de: "Deutsch lernen",
      en: "Learning German",
      ru: "Изучение немецкого",
      uk: "Вивчення німецької",
    },
  },
] as const satisfies readonly ActivityAliasGroup[];

const ACTIVITY_ALIAS_GROUP_BY_ID = new Map<string, ActivityAliasGroup>(
  ACTIVITY_ALIAS_GROUPS.map((group) => [group.id, group]),
);
const ACTIVITY_ID_BY_ALIAS = new Map<string, string>(
  ACTIVITY_ALIAS_GROUPS.flatMap((group) =>
    group.aliases.map((alias) => [alias, group.id] as const),
  ),
);

// Provider output is still treated as untrusted: moods, weather, places, and
// diary metadata must not turn into activities even under the current prompt.
const NON_ACTIVITY_NAMES = new Set([
  "activity",
  "anxiety",
  "avoidance",
  "balance",
  "boredom",
  "burnout",
  "conflict",
  "daily",
  "daily life",
  "day",
  "decision",
  "distress",
  "emotion",
  "emotional state",
  "energy",
  "fatigue",
  "flat",
  "focus",
  "frustration",
  "general",
  "good day",
  "good_day",
  "high stress",
  "home",
  "irritation",
  "life",
  "low energy",
  "low mood",
  "memories",
  "memory",
  "mental health",
  "mental noise",
  "mental_noise",
  "mood",
  "nostalgia",
  "notes",
  "ordinary",
  "other",
  "overthinking",
  "overwhelm",
  "poor sleep",
  "rain",
  "recovery need",
  "rumination",
  "sleep",
  "sleep quality",
  "state",
  "stress",
  "tiredness",
  "today",
  "weather",
  "wellbeing",
  "work",
  "angst",
  "erschöpfung",
  "erinnerung",
  "erinnerungen",
  "müdigkeit",
  "niedrige energie",
  "nostalgie",
  "regen",
  "schlaf",
  "schlafqualität",
  "stimmung",
  "wohlbefinden",
  "баланс",
  "выгорание",
  "день",
  "дела",
  "дождь",
  "другое",
  "жизнь",
  "избегание",
  "качество сна",
  "мало энергии",
  "ментальный шум",
  "настроение",
  "низкая энергия",
  "обычное",
  "повседневность",
  "раздражение",
  "решение",
  "руминация",
  "самочувствие",
  "сегодня",
  "сон",
  "состояние",
  "стресс",
  "тревога",
  "тревожность",
  "усталость",
  "фокус",
  "фрустрация",
  "хороший день",
  "эмоции",
  "втома",
  "дощ",
  "інше",
  "низька енергія",
  "ностальгія",
  "пам ять",
  "повсякденність",
  "самопочуття",
  "сьогодні",
  "спогад",
  "спогади",
  "стан",
  "стрес",
  "тривога",
]);

const NON_ACTIVITY_FRAGMENTS = [
  /(^| )(feeling|feelings|thoughts?|weather)( |$)/u,
  /(^| )(настроение|мысли|погода|эмоции)( |$)/u,
  /(^| )(настрій|думки|погода|емоції)( |$)/u,
  /(^| )(gefühl|gefühle|gedanken|wetter)( |$)/u,
];

const NON_PROJECT_IDENTITY_TAGS = new Set([
  "backend",
  "career",
  "code",
  "coding",
  "dev",
  "development",
  "frontend",
  "it",
  "project",
  "projects",
  "software",
  "task",
  "tasks",
  "tech",
  "technology",
  "ui",
  "ux",
  "work",
  "arbeit",
  "karriere",
  "entwicklung",
  "projekt",
  "projekte",
  "код",
  "карьера",
  "проект",
  "проекты",
  "программирование",
  "разработка",
  "работа",
  "проєкт",
  "проєкти",
  "програмування",
  "робота",
  "розробка",
  "кар єра",
]);

export const NEGATED_RESULT_PATTERN =
  /\b(?:not|never)\s+(?:done|finished|completed|fixed|built|shipped|released|implemented)\b|(?:не|так и не)\s+(?:сделал|сделано|закончил|завершил|готово|починил|исправил|собрал|реализовал|выпустил|запустил)|(?:не|так і не)\s+(?:зробив|зроблено|закінчив|завершив|готово|виправив|зібрав|реалізував)/iu;
export const BLOCKER_PATTERN =
  /не работает|не получается|не могу|застр|мешает|блок|ошиб|проблем|blocked|stuck|failed|failure|error|doesn['’]?t work|cannot|can['’]?t|застряг|помилк|не працює|не виходить/iu;
export const RESULT_PATTERN =
  /\b(done|finished|completed|fixed|built|shipped|released|launched|implemented|removed|verified)\b|сделал|готово|закончил|заверш|почин|исправ|собрал|реализ|выпуст|запуст|проверил|зробив|заверш|виправ|зібрав|реаліз|перевірив/iu;
export const COMPLETION_PATTERN =
  /\b(?:done|finished|completed|shipped|released|launched)\b|готово|закончил|завершил|выпустил|запустил|завершено|закінчив|завершив|випустив|запустив/iu;
export const PROJECT_LANGUAGE_PATTERN =
  /\b(project|feature|release|implementation|refactor|bug|build|deploy|prototype|app|code|screen|interface|navigation|database|server|client|api|ui|tab|worked on|working on|projekt|schnittstelle|bildschirm|datenbank|reiter|arbeit an)\b|проект|фич|релиз|рефактор|баг|прототип|прилож|код|экран|интерфейс|навигац|вкладк|баз[аыеу]|сервер|клиент|работа над|реализ|разработ|додел|передел|почин|исправ|выпуст|запуст|проєкт|фіч|реліз|рефактор|помилк|прототип|застосун|екран|інтерфейс|навігац|вкладк|баз[аиу]|працював над|реаліз|розроб|виправ/iu;
export const BOUNDED_TASK_LANGUAGE_PATTERN =
  /\b(application|applications|apply|applying|applied|resume|cv|interview|deadline|deliverable|submit|submitted|finish|finished|complete|completed|fix|fixed|implement|implemented|release|released|launch|launched|bewerbung|bewerbungen|bewerben|lebenslauf|vorstellungsgespräch|frist|einreichen|abschließen|fertigstellen)\b|заявк|резюме|собеседован|дедлайн|подать|подач|отправ|заверш|законч|почин|исправ|реализ|выпуст|запуст|подготов|заявк|резюме|співбесід|дедлайн|подати|подач|відправ|заверш|закінч|виправ|реаліз|випуст|запуст|підгот/iu;
export const RECURRING_LANGUAGE_PATTERN =
  /кажд(?:ый|ую|ое)|регуляр|обычно|снова занима|тренир|практик|every day|daily|weekly|regularly|routine|practice|training|щодня|регулярно|зазвичай|jeden tag|regelmäßig|routine|übung/iu;
export const KNOWN_RECURRING_ACTIVITY_PATTERN =
  /^(?:body|books?|exercise|gym|meditation|music|planning|reading|running|sport|training|walk|walking|writing|йога|книги|письмо|планирование|прогулка|спорт|тренировка|чтение|планування|прогулянка|тренування|читання|lesen|planung|schreiben|spazieren|spaziergang|training)$/iu;

export function cleanActivityLabel(value: string): string {
  return value
    .trim()
    .replace(/^#+/u, "")
    .replace(/\s+/gu, " ")
    .slice(0, 52);
}

export function normalizeActivityLabel(value: string): string {
  const normalized = normalizeText(cleanActivityLabel(value));
  return ACTIVITY_ID_BY_ALIAS.get(normalized) ?? normalized;
}

export function getActivityDisplayLabel(
  activityId: string,
  fallback: string,
  language: Language,
): string {
  const label =
    ACTIVITY_ALIAS_GROUP_BY_ID.get(activityId)?.labels[language] ?? fallback;
  return sentenceCaseLabel(label, language);
}

export function getConfiguredActivityKind(
  activityId: string,
): ActivityKind | null {
  return ACTIVITY_ALIAS_GROUP_BY_ID.get(activityId)?.kind ?? null;
}

export function hasConfiguredActivity(activityId: string): boolean {
  return ACTIVITY_ALIAS_GROUP_BY_ID.has(activityId);
}

export function isSpecificProjectIdentityTag(activityId: string): boolean {
  return (
    isUsefulActivityName(activityId) &&
    !NON_PROJECT_IDENTITY_TAGS.has(activityId)
  );
}

export function textContainsActivity(
  text: string,
  activityId: string,
): boolean {
  const normalizedText = ` ${normalizeText(text)} `;
  const aliases =
    ACTIVITY_ALIAS_GROUP_BY_ID.get(activityId)?.aliases ?? [activityId];

  return aliases.some((alias) => normalizedText.includes(` ${alias} `));
}

export function isUsefulActivityName(value: string): boolean {
  return (
    value.length >= 3 &&
    value.length <= 52 &&
    !NON_ACTIVITY_NAMES.has(value) &&
    !NON_ACTIVITY_FRAGMENTS.some((pattern) => pattern.test(value)) &&
    /\p{L}/u.test(value)
  );
}

function sentenceCaseLabel(value: string, language: Language): string {
  const characters = Array.from(value.trim());
  const firstLetterIndex = characters.findIndex((character) =>
    /\p{L}/u.test(character),
  );
  if (firstLetterIndex < 0) return value.trim();

  characters[firstLetterIndex] = characters[firstLetterIndex].toLocaleUpperCase(
    language,
  );
  return characters.join("");
}

function normalizeText(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
