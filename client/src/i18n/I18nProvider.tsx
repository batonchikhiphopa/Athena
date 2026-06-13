import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_LANGUAGE,
  isSupportedLanguage,
  LANGUAGE_STORAGE_KEY,
  type Language,
} from "./languages";
import { translateMessage, type MessageKey } from "./messages";
import { I18nContext } from "./i18nContext";
import { getProfileScopedStorageKey } from "../lib/vaultProfiles";

type TranslateValues = Record<string, string | number>;

type I18nProviderProps = {
  children: ReactNode;
};

export function I18nProvider({ children }: I18nProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = readStoredLanguage();
    return stored ?? DEFAULT_LANGUAGE;
  });

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    localStorage.setItem(getLanguageStorageKey(), nextLanguage);
  }, []);

  const t = useCallback(
    (key: MessageKey, values?: TranslateValues) =>
      translateMessage(language, key, values),
    [language],
  );

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, setLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function readStoredLanguage() {
  try {
    const stored = localStorage.getItem(getLanguageStorageKey());
    return stored && isSupportedLanguage(stored) ? stored : null;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function getLanguageStorageKey() {
  return getProfileScopedStorageKey(LANGUAGE_STORAGE_KEY);
}
