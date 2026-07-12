import { ATHENA_LIBRARY_DE } from "./athenaPhrasesDe";
import { ATHENA_LIBRARY_EN } from "./athenaPhrasesEn";
import { ATHENA_LIBRARY_RU } from "./athenaPhrasesRu";
import { ATHENA_LIBRARY_UK } from "./athenaPhrasesUk";
import type { AthenaPhraseLibrary } from "./athenaPhrasesTypes";

export const ATHENA_PHRASE_LANGUAGES = ["en", "de", "ru", "uk"] as const;

export type AthenaPhraseLanguage = (typeof ATHENA_PHRASE_LANGUAGES)[number];

export const DEFAULT_ATHENA_PHRASE_LANGUAGE: AthenaPhraseLanguage = "en";

const ATHENA_PHRASE_LIBRARIES = {
  de: ATHENA_LIBRARY_DE,
  en: ATHENA_LIBRARY_EN,
  ru: ATHENA_LIBRARY_RU,
  uk: ATHENA_LIBRARY_UK,
} satisfies Record<AthenaPhraseLanguage, AthenaPhraseLibrary>;

export function getAthenaPhraseLibrary(
  language: AthenaPhraseLanguage = DEFAULT_ATHENA_PHRASE_LANGUAGE,
) {
  return ATHENA_PHRASE_LIBRARIES[language];
}
