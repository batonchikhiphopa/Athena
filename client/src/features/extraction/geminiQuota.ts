import { getProfileScopedStorageKey } from "../vault/vaultProfiles";

const GEMINI_DAILY_EXTRACTION_USAGE_KEY = "athena_gemini_daily_extraction_usage";
export const GEMINI_DAILY_EXTRACTION_LIMIT = 20;
export const GEMINI_QUOTA_STORAGE_KEYS = [GEMINI_DAILY_EXTRACTION_USAGE_KEY] as const;

type GeminiDailyExtractionUsage = { date: string; count: number };

export function getGeminiDailyExtractionUsage(): GeminiDailyExtractionUsage {
  const today = localDateKey();
  const raw = localStorage.getItem(storageKey());
  if (!raw) return { date: today, count: 0 };

  try {
    const parsed = JSON.parse(raw) as Partial<GeminiDailyExtractionUsage>;
    const count = typeof parsed.count === "number" && Number.isFinite(parsed.count)
      ? Math.max(0, Math.floor(parsed.count))
      : 0;
    if (parsed.date !== today) return { date: today, count: 0 };
    return { date: today, count: Math.min(count, GEMINI_DAILY_EXTRACTION_LIMIT) };
  } catch {
    return { date: today, count: 0 };
  }
}

export function getRemainingGeminiDailyExtractions() {
  return Math.max(
    0,
    GEMINI_DAILY_EXTRACTION_LIMIT - getGeminiDailyExtractionUsage().count,
  );
}

export function reserveGeminiDailyExtraction() {
  const usage = getGeminiDailyExtractionUsage();
  if (usage.count >= GEMINI_DAILY_EXTRACTION_LIMIT) return false;
  persist({ date: usage.date, count: usage.count + 1 });
  return true;
}

export function releaseGeminiDailyExtraction() {
  const usage = getGeminiDailyExtractionUsage();
  if (usage.count <= 0) return;
  persist({ date: usage.date, count: usage.count - 1 });
}

function persist(usage: GeminiDailyExtractionUsage) {
  localStorage.setItem(storageKey(), JSON.stringify(usage));
}

function storageKey() {
  return getProfileScopedStorageKey(GEMINI_DAILY_EXTRACTION_USAGE_KEY);
}

function localDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
