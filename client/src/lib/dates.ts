import type { Language } from "../i18n/languages";

const localeByLanguage: Record<Language, string> = {
  de: "de-DE",
  en: "en-US",
  ru: "ru-RU",
  uk: "uk-UA",
};

export function todayDateOnly() {
  return toDateOnly(new Date());
}

export function formatLongDate(dateOnly: string, language: Language = "en") {
  return parseDateOnly(dateOnly).toLocaleDateString(getLocale(language), {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatShortDate(dateOnly: string, language: Language = "en") {
  return parseDateOnly(dateOnly).toLocaleDateString(getLocale(language), {
    day: "2-digit",
    month: "short",
  });
}

export function getLocale(language: Language) {
  return localeByLanguage[language];
}

function toDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateOnly(dateOnly: string) {
  const [year, month, day] = dateOnly.split("-").map(Number);
  return new Date(year, month - 1, day);
}
