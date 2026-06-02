export const SUPPORTED_LANGUAGES = ["en", "de", "ru", "uk"] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = "en";

export const LANGUAGE_LABELS: Record<Language, string> = {
  de: "Deutsch",
  en: "English",
  ru: "Русский",
  uk: "Українська",
};

export const LANGUAGE_STORAGE_KEY = "athena_language";

export function isSupportedLanguage(value: string): value is Language {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

export function detectBrowserLanguage(): Language {
  if (typeof navigator === "undefined") return DEFAULT_LANGUAGE;

  const candidates = [navigator.language, ...navigator.languages].filter(Boolean);

  for (const candidate of candidates) {
    const prefix = candidate.toLowerCase().split("-")[0];
    if (isSupportedLanguage(prefix)) return prefix;
  }

  return DEFAULT_LANGUAGE;
}
