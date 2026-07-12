import type {
  AnalyticsV2Window,
  AnalyticsV2WindowKind,
} from "./analyticsV2.types.js";

export function buildWindow(
  kind: AnalyticsV2WindowKind,
  start: string,
  end: string,
): AnalyticsV2Window {
  return { days: daysBetween(start, end) + 1, end, kind, start };
}

export function assertDateRange(from: string, to: string) {
  if (!isDateOnly(from) || !isDateOnly(to) || from > to) {
    throw new Error("invalid_analytics_v2_date_range");
  }
}

export function isDateInRange(date: string, from: string, to: string) {
  return date >= from && date <= to;
}

export function eachDateInRange(from: string, to: string): string[] {
  const dates: string[] = [];
  const current = parseDateOnly(from);
  const end = parseDateOnly(to);
  while (current <= end) {
    dates.push(formatDateOnly(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

export function subtractDays(dateOnly: string, days: number): string {
  const date = parseDateOnly(dateOnly);
  date.setUTCDate(date.getUTCDate() - days);
  return formatDateOnly(date);
}

function isDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function daysBetween(from: string, to: string): number {
  return (
    (parseDateOnly(to).getTime() - parseDateOnly(from).getTime()) / 86_400_000
  );
}

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}
