import { markerPriority } from "../extraction/markers.js";
import {
  SELF_REPORT_ANALYTICS_AXES,
  type AnalyticsV2ContextItem,
  type SelfReportAnalyticsAxis,
} from "./analyticsV2.types.js";

export function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(String(value));
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function compareContextItems(
  left: AnalyticsV2ContextItem,
  right: AnalyticsV2ContextItem,
) {
  return (
    right.days - left.days ||
    right.count - left.count ||
    left.name.localeCompare(right.name)
  );
}

export function compareMarkerItems(
  left: AnalyticsV2ContextItem,
  right: AnalyticsV2ContextItem,
) {
  return (
    right.days - left.days ||
    right.count - left.count ||
    markerPriority(right.name) - markerPriority(left.name) ||
    left.name.localeCompare(right.name)
  );
}

export function isSelfReportAxis(
  axis: string,
): axis is SelfReportAnalyticsAxis {
  return (SELF_REPORT_ANALYTICS_AXES as readonly string[]).includes(axis);
}

export function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

export function present(value: string | null): string[] {
  return value ? [value] : [];
}

export function areSameStrings(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}
