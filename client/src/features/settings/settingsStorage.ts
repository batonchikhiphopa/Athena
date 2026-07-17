import type { ExtractionSettings } from "../../shared/contracts";
import { getProfileScopedStorageKey } from "../vault/vaultProfiles";

const DEBUG_MODE_KEY = "athena_debug_mode";
const EXTRACTION_SETTINGS_KEY = "athena_extraction_settings";
const PERSONA_TEXT_ENABLED_KEY = "athena_persona_text_enabled";

export const SETTINGS_STORAGE_KEYS = [
  DEBUG_MODE_KEY,
  EXTRACTION_SETTINGS_KEY,
  PERSONA_TEXT_ENABLED_KEY,
] as const;

export function getDebugMode() {
  return localStorage.getItem(key(DEBUG_MODE_KEY)) === "true";
}

export function setDebugMode(value: boolean) {
  localStorage.setItem(key(DEBUG_MODE_KEY), String(value));
}

export function getPersonaTextEnabled() {
  return localStorage.getItem(key(PERSONA_TEXT_ENABLED_KEY)) !== "false";
}

export function setPersonaTextEnabled(value: boolean) {
  localStorage.setItem(key(PERSONA_TEXT_ENABLED_KEY), String(value));
}

export function getExtractionSettings(): ExtractionSettings | null {
  const raw = localStorage.getItem(key(EXTRACTION_SETTINGS_KEY));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as ExtractionSettings;
    if (!['ollama', 'gemini', 'off'].includes(parsed.provider)) return null;
    if (typeof parsed.model !== "string" || !parsed.model.trim()) return null;
    return { provider: parsed.provider, model: parsed.model };
  } catch {
    return null;
  }
}

export function setExtractionSettings(value: ExtractionSettings) {
  localStorage.setItem(key(EXTRACTION_SETTINGS_KEY), JSON.stringify(value));
}

function key(value: string) {
  return getProfileScopedStorageKey(value);
}
