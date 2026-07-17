import { getProfileScopedStorageKey } from "../vault/vaultProfiles";

const ACTIVITY_INSIGHT_USAGE_KEY = "athena_activity_insight_daily_usage";
export const ACTIVITY_INSIGHT_DAILY_LIMIT = 1;
export const ACTIVITY_INSIGHT_STORAGE_KEYS = [
  ACTIVITY_INSIGHT_USAGE_KEY,
] as const;

type DailyUsage = {
  count: number;
  date: string;
};

export function reserveActivityInsightGeneration() {
  const usage = readUsage();
  if (usage.count >= ACTIVITY_INSIGHT_DAILY_LIMIT) return false;

  persistUsage({ ...usage, count: usage.count + 1 });
  return true;
}

function readUsage(): DailyUsage {
  const date = localDateKey();
  const raw = localStorage.getItem(storageKey());
  if (!raw) return { count: 0, date };

  try {
    const parsed = JSON.parse(raw) as Partial<DailyUsage>;
    if (parsed.date !== date) return { count: 0, date };

    return {
      count:
        typeof parsed.count === "number" && Number.isFinite(parsed.count)
          ? Math.min(
              ACTIVITY_INSIGHT_DAILY_LIMIT,
              Math.max(0, Math.floor(parsed.count)),
            )
          : 0,
      date,
    };
  } catch {
    return { count: 0, date };
  }
}

function persistUsage(usage: DailyUsage) {
  localStorage.setItem(storageKey(), JSON.stringify(usage));
}

function storageKey() {
  return getProfileScopedStorageKey(ACTIVITY_INSIGHT_USAGE_KEY);
}

function localDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
