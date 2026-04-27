import type { ExtractionConfig, ExtractionSettings } from "../../types";

export const DEFAULT_EXTRACTION_SETTINGS: ExtractionSettings = {
  provider: "ollama",
  model: "gpt-oss:20b",
};

export function normalizeExtractionSettings(
  settings: ExtractionSettings,
  config: ExtractionConfig | null,
): ExtractionSettings {
  const providerOption =
    config?.providers.find((provider) => provider.id === settings.provider) ??
    config?.providers[0];
  const provider = providerOption?.id ?? settings.provider ?? "ollama";
  const model =
    providerOption?.models.includes(settings.model)
      ? settings.model
      : providerOption?.defaultModel ?? settings.model;

  return {
    provider,
    model,
  };
}
