import { createContext } from "react";
import type { Language } from "./languages";
import type { MessageKey } from "./messages";

type TranslateValues = Record<string, string | number>;

export type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: MessageKey, values?: TranslateValues) => string;
};

export const I18nContext = createContext<I18nContextValue | null>(null);
