import type { ExtractionProvider } from "./signal.js";

export type ExtractionSettings = {
  provider: ExtractionProvider;
  model: string;
};

export type ExtractionProviderOption = {
  id: ExtractionProvider;
  label: string;
  defaultModel: string;
  models: string[];
  configured: boolean;
};

export type ExtractionConfig = {
  defaults: ExtractionSettings;
  providers: ExtractionProviderOption[];
};

export type ExtractionStatus = {
  provider: ExtractionProvider;
  model: string;
  available: boolean;
  reason: string | null;
};
