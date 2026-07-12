import { ATHENA_INSIGHT_TOPICS_DE } from "./athenaInsightPhrasesDe";
import { ATHENA_INSIGHT_TOPICS_EN } from "./athenaInsightPhrasesEn";
import { ATHENA_INSIGHT_TOPICS_RU } from "./athenaInsightPhrasesRu";
import { ATHENA_INSIGHT_TOPICS_UK } from "./athenaInsightPhrasesUk";
import type { AthenaInsightTopic } from "./athenaInsightPhrasesTypes";

export const ATHENA_INSIGHT_LANGUAGES = ["en", "de", "ru", "uk"] as const;

export type AthenaInsightLanguage = (typeof ATHENA_INSIGHT_LANGUAGES)[number];

export const DEFAULT_ATHENA_INSIGHT_LANGUAGE: AthenaInsightLanguage = "en";

const ATHENA_INSIGHT_TOPIC_LIBRARIES = {
  de: ATHENA_INSIGHT_TOPICS_DE,
  en: ATHENA_INSIGHT_TOPICS_EN,
  ru: ATHENA_INSIGHT_TOPICS_RU,
  uk: ATHENA_INSIGHT_TOPICS_UK,
} satisfies Record<AthenaInsightLanguage, AthenaInsightTopic[]>;

export function getAthenaInsightTopics(
  language: AthenaInsightLanguage = DEFAULT_ATHENA_INSIGHT_LANGUAGE,
) {
  return ATHENA_INSIGHT_TOPIC_LIBRARIES[language];
}
