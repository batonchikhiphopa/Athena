import type { ExtractionProvider, Signal } from "../types";

export function createFallbackSignal(): Signal {
  return {
    topics: [],
    activities: [],
    markers: [],
    load: null,
    fatigue: null,
    focus: null,
    signal_quality: "fallback",
  };
}

export function createFallbackMetadata(
  provider: ExtractionProvider = "off",
  model = "fallback",
  errorCode = "client_fallback",
) {
  return {
    schema_version: "signal.v1",
    prompt_version: "extraction.v1",
    provider,
    model,
    error_code: errorCode,
    created_at: new Date().toISOString(),
  };
}
