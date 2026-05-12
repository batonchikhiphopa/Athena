import { getEntriesWithSignalsInRange } from "../repositories/analytics.repository.js";
import type { EntryWithSignalRangeRow } from "../repositories/analytics.repository.js";
import { markerPriority } from "../core/markers.js";
import { generateObservation } from "./observation.service.js";
import type { AthenaDb } from "../db/sqlite.js";

type MetricName = "load" | "fatigue" | "focus";
type CollectionKey = "topics" | "activities" | "markers";
type CountObject = Record<string, number>;

type NormalizedSignal = {
  entry_id: number;
  date: string;
  status: string;
  quality: string | null;
  load: number | null;
  fatigue: number | null;
  focus: number | null;
  topics: string[];
  activities: string[];
  markers: string[];
  overridden: boolean;
  version: {
    schema: string | null;
    prompt: string | null;
    model: string | null;
  };
};

type SignalSplit = {
  finalized: NormalizedSignal[];
  valid: NormalizedSignal[];
  sparse: NormalizedSignal[];
  fallback: NormalizedSignal[];
  failed: NormalizedSignal[];
  meaningful: NormalizedSignal[];
};

type DateRange = {
  from?: string;
  to?: string;
};

type AnalyticsRequest = {
  from: string;
  to: string;
  window: string;
};

type GapRange = {
  from: string;
  to: string;
  days: number;
};

type Gaps = {
  total_missing_days: number;
  max_gap_days: number;
  ranges: GapRange[];
};

type RecurrenceItem = {
  name: string;
  count: number;
  days: number;
};

type VersionBoundary = {
  date: string;
  previous: NormalizedSignal["version"];
  current: NormalizedSignal["version"];
};

type MetricSamples = Record<MetricName, number>;

const FINAL_STATUSES = new Set(["extracted", "fallback", "failed"]);
const MEANINGFUL_QUALITIES = new Set(["valid", "sparse"]);

export function normalizeRows(rows: EntryWithSignalRangeRow[]): NormalizedSignal[] {
  return rows.map(normalizeRow);
}

export function normalizeRow(row: EntryWithSignalRangeRow): NormalizedSignal {
  return {
    entry_id: row.entry_id,
    date: row.entry_date,
    status: row.status,
    quality: row.signal_quality,

    load: normalizeScore(row.load),
    fatigue: normalizeScore(row.fatigue),
    focus: normalizeScore(row.focus),

    topics: parseJsonArray(row.topics),
    activities: parseJsonArray(row.activities),
    markers: parseJsonArray(row.markers),

    overridden: Boolean(row.override_id),

    version: {
      schema: row.schema_version,
      prompt: row.prompt_version,
      model: row.model,
    },
  };
}

export function splitSignals(normalized: NormalizedSignal[]): SignalSplit {
  const finalized = normalized.filter((item) => FINAL_STATUSES.has(item.status));
  const valid = finalized.filter((item) => item.quality === "valid");
  const sparse = finalized.filter((item) => item.quality === "sparse");
  const fallback = finalized.filter(
    (item) => item.status === "fallback" || item.quality === "fallback",
  );
  const failed = finalized.filter((item) => item.status === "failed");
  const meaningful = finalized.filter((item) =>
    item.quality ? MEANINGFUL_QUALITIES.has(item.quality) : false,
  );

  return { finalized, valid, sparse, fallback, failed, meaningful };
}

export function calculateDensity({
  finalized,
  valid,
}: Pick<SignalSplit, "finalized" | "valid">): number {
  if (finalized.length === 0) return 0;

  return valid.length / finalized.length;
}

export function calculateAverage(values: Array<number | null>): number | null {
  const validValues = values.filter((value): value is number =>
    Number.isFinite(value),
  );

  if (validValues.length === 0) return null;

  const sum = validValues.reduce((acc, value) => acc + value, 0);

  return sum / validValues.length;
}

export function calculateTopicCounts(meaningful: NormalizedSignal[]): CountObject {
  return countUniqueValues(meaningful, "topics");
}

export function calculateMarkerDistribution(
  meaningful: NormalizedSignal[],
): CountObject {
  return sortMarkerCountObject(countUniqueValuesUnsorted(meaningful, "markers"));
}

export const calculateMarkerCounts = calculateMarkerDistribution;

export function calculateDailyStates(finalized: NormalizedSignal[]) {
  const groups = groupByDate(finalized);

  return Array.from(groups.entries()).map(([date, items]) => {
    const { valid, sparse, fallback, failed, meaningful } = splitSignals(items);
    const density = calculateDensity({ finalized: items, valid });
    const metricSamples = calculateMetricSamples(valid);

    return {
      date,
      entries: items.length,
      valid_entries: valid.length,
      sparse_entries: sparse.length,
      fallback_entries: fallback.length,
      failed_entries: failed.length,
      density,
      avg_load: calculateAverage(valid.map((item) => item.load)),
      avg_fatigue: calculateAverage(valid.map((item) => item.fatigue)),
      avg_focus: calculateAverage(valid.map((item) => item.focus)),
      metric_samples: metricSamples,
      topics: calculateTopicCounts(meaningful),
      markers: calculateMarkerDistribution(meaningful),
    };
  });
}

export function calculateMonthlyRecurrence(meaningful: NormalizedSignal[]) {
  return {
    topics: calculateRecurrence(meaningful, "topics"),
    markers: calculateMarkerRecurrence(meaningful),
  };
}

export function calculateEntryGaps(
  finalized: NormalizedSignal[],
  { from, to }: DateRange = {},
): Gaps {
  const presentDates = new Set(finalized.map((item) => item.date).filter(Boolean));
  const sortedDates = Array.from(presentDates).sort();
  const start = from ?? sortedDates[0];
  const end = to ?? sortedDates[sortedDates.length - 1];

  if (!start || !end) {
    return {
      total_missing_days: 0,
      max_gap_days: 0,
      ranges: [],
    };
  }

  const ranges: GapRange[] = [];
  let currentStart: string | null = null;
  let currentEnd: string | null = null;

  for (const date of eachDateInRange(start, end)) {
    if (presentDates.has(date)) {
      if (currentStart && currentEnd) {
        ranges.push(buildGapRange(currentStart, currentEnd));
        currentStart = null;
        currentEnd = null;
      }
      continue;
    }

    currentStart ??= date;
    currentEnd = date;
  }

  if (currentStart && currentEnd) {
    ranges.push(buildGapRange(currentStart, currentEnd));
  }

  return {
    total_missing_days: ranges.reduce((sum, range) => sum + range.days, 0),
    max_gap_days: ranges.reduce((max, range) => Math.max(max, range.days), 0),
    ranges,
  };
}

export function collectVersions(finalized: NormalizedSignal[]) {
  const schema = new Set<string>();
  const prompt = new Set<string>();
  const model = new Set<string>();

  for (const item of finalized) {
    if (item.version.schema) schema.add(item.version.schema);
    if (item.version.prompt) prompt.add(item.version.prompt);
    if (item.version.model) model.add(item.version.model);
  }

  return {
    schema_versions: Array.from(schema).sort(),
    prompt_versions: Array.from(prompt).sort(),
    models: Array.from(model).sort(),
    mixed_versions: schema.size > 1 || prompt.size > 1 || model.size > 1,
    boundaries: calculateVersionBoundaries(finalized),
  };
}

export function buildInterpretationInput(summary: ReturnType<typeof buildSummaryObject>) {
  return {
    window: summary.window,
    metrics: summary.metrics,
    gaps: summary.gaps,
    flags: summary.flags,
    top_topics: summary.context.top_topics,
    top_markers: summary.context.top_markers,
    recurrence: summary.recurrence,
  };
}

export async function buildSummary(
  db: AthenaDb,
  { from, to, window }: AnalyticsRequest,
) {
  const rows = await getEntriesWithSignalsInRange(db, { from, to });

  if (!rows || rows.length === 0) {
    return null;
  }

  const normalized = normalizeRows(rows);
  const { finalized, valid, sparse, fallback, failed, meaningful } =
    splitSignals(normalized);
  const density = calculateDensity({ finalized, valid });
  const metricSamples = calculateMetricSamples(valid);

  const avgLoad = calculateAverage(valid.map((item) => item.load));
  const avgFatigue = calculateAverage(valid.map((item) => item.fatigue));
  const avgFocus = calculateAverage(valid.map((item) => item.focus));
  const topics = calculateTopicCounts(meaningful);
  const markers = calculateMarkerDistribution(meaningful);
  const gaps = calculateEntryGaps(finalized, { from, to });
  const versions = collectVersions(finalized);
  const recurrence = calculateMonthlyRecurrence(meaningful);
  const context = buildContext({ topics, markers, recurrence });

  const summary = buildSummaryObject({
    window,
    from,
    to,
    normalized,
    finalized,
    valid,
    sparse,
    fallback,
    failed,
    meaningful,
    density,
    metricSamples,
    avgLoad,
    avgFatigue,
    avgFocus,
    topics,
    markers,
    gaps,
    versions,
    recurrence,
    context,
  });

  const observation = generateObservation(buildInterpretationInput(summary));

  return {
    ...summary,
    observation,
  };
}

function buildSummaryObject({
  window,
  from,
  to,
  normalized,
  finalized,
  valid,
  sparse,
  fallback,
  failed,
  meaningful,
  density,
  metricSamples,
  avgLoad,
  avgFatigue,
  avgFocus,
  topics,
  markers,
  gaps,
  versions,
  recurrence,
  context,
}: {
  window: string;
  from: string;
  to: string;
  normalized: NormalizedSignal[];
  finalized: NormalizedSignal[];
  valid: NormalizedSignal[];
  sparse: NormalizedSignal[];
  fallback: NormalizedSignal[];
  failed: NormalizedSignal[];
  meaningful: NormalizedSignal[];
  density: number;
  metricSamples: MetricSamples;
  avgLoad: number | null;
  avgFatigue: number | null;
  avgFocus: number | null;
  topics: CountObject;
  markers: CountObject;
  gaps: Gaps;
  versions: ReturnType<typeof collectVersions>;
  recurrence: ReturnType<typeof calculateMonthlyRecurrence>;
  context: ReturnType<typeof buildContext>;
}) {
  return {
    window,
    from,
    to,

    metrics: {
      entries: normalized.length,
      finalized_entries: finalized.length,
      valid_entries: valid.length,
      sparse_entries: sparse.length,
      fallback_entries: fallback.length,
      failed_entries: failed.length,
      meaningful_entries: meaningful.length,
      density,
      avg_load: avgLoad,
      avg_fatigue: avgFatigue,
      avg_focus: avgFocus,
      metric_samples: metricSamples,
    },

    daily: calculateDailyStates(finalized),
    topics,
    markers,
    context,
    recurrence,
    gaps,

    flags: {
      mixed_version: versions.mixed_versions,
      version_boundary: versions.mixed_versions,
      low_density: density < 0.5,
      insufficient_metric_data: getInsufficientMetricData(metricSamples),
      elevated_load: avgLoad !== null && avgLoad >= 7.5,
      elevated_fatigue: avgFatigue !== null && avgFatigue >= 7.5,
      low_focus: avgFocus !== null && avgFocus <= 3,
      entry_gap: gaps.total_missing_days > 0,
    },

    versions: {
      schema_versions: versions.schema_versions,
      prompt_versions: versions.prompt_versions,
      models: versions.models,
      boundaries: versions.boundaries,
    },
  };
}

function buildContext({
  topics,
  markers,
  recurrence,
}: {
  topics: CountObject;
  markers: CountObject;
  recurrence: ReturnType<typeof calculateMonthlyRecurrence>;
}) {
  return {
    top_topics: topCountItems(topics),
    top_markers: topCountItems(markers),
    recurring_topics: recurrence.topics.slice(0, 3),
    recurring_markers: recurrence.markers.slice(0, 3),
  };
}

function topCountItems(counts: CountObject) {
  return Object.entries(counts)
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));
}

function normalizeScore(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item) => typeof item === "string");
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(String(value));
    return Array.isArray(parsed)
      ? parsed.filter((item) => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function countUniqueValues(
  items: NormalizedSignal[],
  key: CollectionKey,
): CountObject {
  return sortCountObject(countUniqueValuesUnsorted(items, key));
}

function countUniqueValuesUnsorted(
  items: NormalizedSignal[],
  key: CollectionKey,
): CountObject {
  const counts: CountObject = {};

  for (const item of items) {
    const uniqueValues = new Set(item[key] ?? []);

    for (const value of uniqueValues) {
      counts[value] = (counts[value] || 0) + 1;
    }
  }

  return counts;
}

function sortCountObject(counts: CountObject): CountObject {
  return Object.fromEntries(
    Object.entries(counts).sort(
      ([leftName, leftCount], [rightName, rightCount]) =>
        rightCount - leftCount || leftName.localeCompare(rightName),
    ),
  );
}

function sortMarkerCountObject(counts: CountObject): CountObject {
  return Object.fromEntries(
    Object.entries(counts).sort(
      ([leftName, leftCount], [rightName, rightCount]) =>
        rightCount - leftCount ||
        markerPriority(rightName) - markerPriority(leftName) ||
        leftName.localeCompare(rightName),
    ),
  );
}

function calculateRecurrence(
  items: NormalizedSignal[],
  key: CollectionKey,
): RecurrenceItem[] {
  const counts = new Map<string, { name: string; count: number; dates: Set<string> }>();

  for (const item of items) {
    const uniqueValues = new Set(item[key] ?? []);

    for (const value of uniqueValues) {
      const existing = counts.get(value) ?? {
        name: value,
        count: 0,
        dates: new Set<string>(),
      };

      existing.count += 1;
      existing.dates.add(item.date);
      counts.set(value, existing);
    }
  }

  return Array.from(counts.values())
    .map((item) => ({
      name: item.name,
      count: item.count,
      days: item.dates.size,
    }))
    .filter((item) => item.count > 1)
    .sort(
      (left, right) =>
        right.days - left.days ||
        right.count - left.count ||
        left.name.localeCompare(right.name),
    );
}

function calculateMarkerRecurrence(items: NormalizedSignal[]): RecurrenceItem[] {
  return calculateRecurrence(items, "markers").sort(
    (left, right) =>
      right.days - left.days ||
      right.count - left.count ||
      markerPriority(right.name) - markerPriority(left.name) ||
      left.name.localeCompare(right.name),
  );
}

function calculateMetricSamples(valid: NormalizedSignal[]): MetricSamples {
  return {
    load: countNumericValues(valid.map((item) => item.load)),
    fatigue: countNumericValues(valid.map((item) => item.fatigue)),
    focus: countNumericValues(valid.map((item) => item.focus)),
  };
}

function countNumericValues(values: Array<number | null>): number {
  return values.filter((value) => Number.isFinite(value)).length;
}

function getInsufficientMetricData(metricSamples: MetricSamples): MetricName[] {
  return Object.entries(metricSamples)
    .filter(([, count]) => count === 0)
    .map(([metric]) => metric as MetricName);
}

function groupByDate(items: NormalizedSignal[]): Map<string, NormalizedSignal[]> {
  const groups = new Map<string, NormalizedSignal[]>();

  for (const item of items) {
    if (!groups.has(item.date)) {
      groups.set(item.date, []);
    }

    groups.get(item.date)?.push(item);
  }

  return new Map(
    Array.from(groups.entries()).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function calculateVersionBoundaries(
  finalized: NormalizedSignal[],
): VersionBoundary[] {
  const sorted = [...finalized]
    .filter((item) => item.version.schema || item.version.prompt || item.version.model)
    .sort((left, right) => left.date.localeCompare(right.date));

  const boundaries: VersionBoundary[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const previous = sorted[i - 1];
    const current = sorted[i];

    if (versionKey(previous) !== versionKey(current)) {
      boundaries.push({
        date: current.date,
        previous: previous.version,
        current: current.version,
      });
    }
  }

  return boundaries;
}

function versionKey(item: NormalizedSignal): string {
  return [
    item.version.schema ?? "",
    item.version.prompt ?? "",
    item.version.model ?? "",
  ].join("|");
}

function buildGapRange(from: string, to: string): GapRange {
  return {
    from,
    to,
    days: daysBetween(from, to) + 1,
  };
}

function eachDateInRange(from: string, to: string): string[] {
  const dates: string[] = [];
  const current = parseDateOnly(from);
  const end = parseDateOnly(to);

  while (current <= end) {
    dates.push(formatDateOnly(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

function daysBetween(from: string, to: string): number {
  return (parseDateOnly(to).getTime() - parseDateOnly(from).getTime()) / 86_400_000;
}

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}
