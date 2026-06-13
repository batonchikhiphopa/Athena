export const LOCAL_HASHED_EMBEDDING_PROVIDER = {
  id: "local-hashed-semantic-v1",
  dimensions: 256,
  privacy: "browser_local",
} as const;

export type LocalEmbeddingProviderId =
  typeof LOCAL_HASHED_EMBEDDING_PROVIDER.id;

export type LocalEmbeddingVector = number[];

type WeightedFeature = {
  feature: string;
  weight: number;
};

const WORD_PATTERN = /[\p{L}\p{N}]+/gu;

const STOP_WORDS = new Set([
  "a",
  "about",
  "and",
  "at",
  "for",
  "from",
  "i",
  "in",
  "is",
  "it",
  "my",
  "of",
  "on",
  "or",
  "the",
  "to",
  "was",
  "with",
  "а",
  "без",
  "бы",
  "в",
  "во",
  "да",
  "для",
  "до",
  "и",
  "из",
  "или",
  "как",
  "к",
  "ко",
  "на",
  "не",
  "но",
  "о",
  "об",
  "от",
  "по",
  "про",
  "с",
  "со",
  "то",
  "у",
  "что",
  "это",
  "я",
]);

const RUSSIAN_SUFFIXES = [
  "иями",
  "ями",
  "ами",
  "ого",
  "ему",
  "ими",
  "ыми",
  "ая",
  "яя",
  "ый",
  "ий",
  "ой",
  "ое",
  "ее",
  "ые",
  "ие",
  "их",
  "ых",
  "ую",
  "юю",
  "ам",
  "ям",
  "ах",
  "ях",
  "ов",
  "ев",
  "ей",
  "ом",
  "ем",
  "ою",
  "ею",
  "ию",
  "ия",
  "ью",
  "а",
  "я",
  "ы",
  "и",
  "е",
  "у",
  "ю",
  "о",
];

const ENGLISH_SUFFIXES = ["ing", "ed", "es", "s"];

const CONCEPT_RULES: Array<{ concept: string; roots: string[] }> = [
  {
    concept: "work",
    roots: [
      "работ",
      "проект",
      "задач",
      "дедлайн",
      "созвон",
      "встреч",
      "клиент",
      "код",
      "спринт",
      "work",
      "job",
      "task",
      "project",
      "deadline",
      "meeting",
      "call",
      "client",
      "code",
      "sprint",
    ],
  },
  {
    concept: "fatigue",
    roots: [
      "устал",
      "усталост",
      "выгор",
      "выгоран",
      "сил",
      "энерг",
      "батарей",
      "сонн",
      "истощ",
      "exhaust",
      "tired",
      "fatigue",
      "burnout",
      "energy",
      "battery",
      "drain",
    ],
  },
  {
    concept: "stress",
    roots: [
      "стресс",
      "напряж",
      "перегруз",
      "тревог",
      "давлен",
      "overload",
      "stress",
      "pressure",
      "anxiety",
      "tense",
    ],
  },
  {
    concept: "focus",
    roots: [
      "фокус",
      "концентр",
      "вниман",
      "отвлек",
      "глубок",
      "focus",
      "concentrat",
      "attention",
      "distract",
      "deep",
    ],
  },
  {
    concept: "recovery",
    roots: [
      "отдых",
      "восстанов",
      "пауз",
      "тишин",
      "сон",
      "rest",
      "recover",
      "pause",
      "sleep",
      "quiet",
    ],
  },
  {
    concept: "mood",
    roots: [
      "настроен",
      "радост",
      "груст",
      "легк",
      "тяжел",
      "mood",
      "sad",
      "joy",
      "heavy",
      "light",
    ],
  },
];

export function embedLocalText(text: string): LocalEmbeddingVector {
  const features = createWeightedFeatures(text);
  const vector = Array.from(
    { length: LOCAL_HASHED_EMBEDDING_PROVIDER.dimensions },
    () => 0,
  );

  for (const { feature, weight } of features) {
    const hash = hashFeature(feature);
    const index = hash % LOCAL_HASHED_EMBEDDING_PROVIDER.dimensions;
    const sign = hash & 0x80000000 ? -1 : 1;
    vector[index] += sign * weight;
  }

  return normalizeVector(vector);
}

export function cosineSimilarity(
  left: LocalEmbeddingVector,
  right: LocalEmbeddingVector,
): number {
  const length = Math.min(left.length, right.length);
  let score = 0;

  for (let index = 0; index < length; index += 1) {
    score += left[index] * right[index];
  }

  return clamp(score, -1, 1);
}

export function tokenizeEmbeddingText(text: string): string[] {
  return Array.from(text.matchAll(WORD_PATTERN), ([match]) =>
    normalizeToken(match),
  ).filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

export function stemEmbeddingToken(token: string): string {
  if (token.length <= 4) return token;

  const suffixes = hasCyrillic(token) ? RUSSIAN_SUFFIXES : ENGLISH_SUFFIXES;

  for (const suffix of suffixes) {
    if (!token.endsWith(suffix)) continue;
    if (token.length - suffix.length < 3) continue;

    return token.slice(0, -suffix.length);
  }

  return token;
}

export function extractEmbeddingConcepts(text: string): string[] {
  const concepts = new Set<string>();

  for (const token of tokenizeEmbeddingText(text)) {
    const stem = stemEmbeddingToken(token);

    for (const concept of conceptsForToken(token, stem)) {
      concepts.add(concept);
    }
  }

  return Array.from(concepts).sort();
}

function createWeightedFeatures(text: string): WeightedFeature[] {
  const tokens = tokenizeEmbeddingText(text);
  const stems = tokens.map(stemEmbeddingToken);
  const features: WeightedFeature[] = [];

  for (const [index, stem] of stems.entries()) {
    features.push({ feature: `token:${stem}`, weight: 1 });

    for (const concept of conceptsForToken(tokens[index], stem)) {
      features.push({ feature: `concept:${concept}`, weight: 1.15 });
    }

    if (index > 0) {
      features.push({
        feature: `bigram:${stems[index - 1]}:${stem}`,
        weight: 0.65,
      });
    }
  }

  for (const concept of extractEmbeddingConcepts(text)) {
    features.push({ feature: `topic:${concept}`, weight: 1.5 });
  }

  return features;
}

function conceptsForToken(token: string, stem: string): string[] {
  const concepts: string[] = [];

  for (const rule of CONCEPT_RULES) {
    if (
      rule.roots.some(
        (root) => token.startsWith(root) || stem.startsWith(root),
      )
    ) {
      concepts.push(rule.concept);
    }
  }

  return concepts;
}

function normalizeToken(token: string): string {
  return token.normalize("NFKC").toLocaleLowerCase().replaceAll("ё", "е");
}

function normalizeVector(vector: LocalEmbeddingVector): LocalEmbeddingVector {
  const norm = Math.sqrt(vector.reduce((total, value) => total + value * value, 0));

  if (norm === 0) return vector;

  return vector.map((value) => value / norm);
}

function hashFeature(feature: string): number {
  let hash = 2166136261;

  for (let index = 0; index < feature.length; index += 1) {
    hash ^= feature.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function hasCyrillic(value: string): boolean {
  return /[а-я]/i.test(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
