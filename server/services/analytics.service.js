import { getEntriesWithSignalsInRange } from "../repositories/analytics.repository.js";
import { markerPriority } from "../core/markers.js";
import { generateObservation } from "./observation.service.js";

const FINAL_STATUSES = new Set(["extracted", "fallback", "failed"]);
const MEANINGFUL_QUALITIES = new Set(["valid", "sparse"]);

export function normalizeRows(rows) {
  return rows.map(normalizeRow);
}

export function normalizeRow(row) {
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

export function splitSignals(normalized) {
  const finalized = normalized.filter((item) => FINAL_STATUSES.has(item.status));
  const valid = finalized.filter((item) => item.quality === "valid");
  const sparse = finalized.filter((item) => item.quality === "sparse");
  const fallback = finalized.filter(
    (item) => item.status === "fallback" || item.quality === "fallback"
  );
  const failed = finalized.filter((item) => item.status === "failed");
  const meaningful = finalized.filter((item) =>
    MEANINGFUL_QUALITIES.has(item.quality)
  );

  return { finalized, valid, sparse, fallback, failed, meaningful };
}

export function calculateDensity({ finalized, valid }) {
  if (finalized.length === 0) return 0;

  return valid.length / finalized.length;
}

export function calculateAverage(values) {
  const validValues = values.filter((value) => Number.isFinite(value));

  if (validValues.length === 0) return null;

  const sum = validValues.reduce((acc, value) => acc + value, 0);

  return sum / validValues.length;
}

export function calculateTopicCounts(meaningful) {
  return countUniqueValues(meaningful, "topics");
}

export function calculateMarkerDistribution(meaningful) {
  return sortMarkerCountObject(countUniqueValuesUnsorted(meaningful, "markers"));
}

export const calculateMarkerCounts = calculateMarkerDistribution;

export function calculateDailyStates(finalized) {
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

export function calculateMonthlyRecurrence(meaningful) {
  return {
    topics: calculateRecurrence(meaningful, "topics"),
    markers: calculateMarkerRecurrence(meaningful),
  };
}

export function calculateEntryGaps(finalized, { from, to } = {}) {
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

  const ranges = [];
  let currentStart = null;
  let currentEnd = null;

  for (const date of eachDateInRange(start, end)) {
    if (presentDates.has(date)) {
      if (currentStart) {
        ranges.push(buildGapRange(currentStart, currentEnd));
        currentStart = null;
        currentEnd = null;
      }
      continue;
    }

    currentStart ??= date;
    currentEnd = date;
  }

  if (currentStart) {
    ranges.push(buildGapRange(currentStart, currentEnd));
  }

  return {
    total_missing_days: ranges.reduce((sum, range) => sum + range.days, 0),
    max_gap_days: ranges.reduce((max, range) => Math.max(max, range.days), 0),
    ranges,
  };
}

export function collectVersions(finalized) {
  const schema = new Set();
  const prompt = new Set();
  const model = new Set();

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

export function buildInterpretationInput(summary) {
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

export async function buildSummary(db, { from, to, window }) {
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

  const summary = {
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

  const observation = generateObservation(buildInterpretationInput(summary));

  return {
    ...summary,
    observation,
  };
}

function buildContext({ topics, markers, recurrence }) {
  return {
    top_topics: topCountItems(topics),
    top_markers: topCountItems(markers),
    recurring_topics: recurrence.topics.slice(0, 3),
    recurring_markers: recurrence.markers.slice(0, 3),
  };
}

function topCountItems(counts) {
  return Object.entries(counts)
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));
}

function normalizeScore(value) {
  return Number.isFinite(value) ? value : null;
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function countUniqueValues(items, key) {
  return sortCountObject(countUniqueValuesUnsorted(items, key));
}

function countUniqueValuesUnsorted(items, key) {
  const counts = {};

  for (const item of items) {
    const uniqueValues = new Set(item[key] ?? []);

    for (const value of uniqueValues) {
      counts[value] = (counts[value] || 0) + 1;
    }
  }

  return counts;
}

function sortCountObject(counts) {
  return Object.fromEntries(
    Object.entries(counts).sort(
      ([leftName, leftCount], [rightName, rightCount]) =>
        rightCount - leftCount || leftName.localeCompare(rightName)
    )
  );
}

function sortMarkerCountObject(counts) {
  return Object.fromEntries(
    Object.entries(counts).sort(
      ([leftName, leftCount], [rightName, rightCount]) =>
        rightCount - leftCount ||
        markerPriority(rightName) - markerPriority(leftName) ||
        leftName.localeCompare(rightName)
    )
  );
}

function calculateRecurrence(items, key) {
  const counts = new Map();

  for (const item of items) {
    const uniqueValues = new Set(item[key] ?? []);

    for (const value of uniqueValues) {
      const existing = counts.get(value) ?? {
        name: value,
        count: 0,
        dates: new Set(),
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
        left.name.localeCompare(right.name)
    );
}

function calculateMarkerRecurrence(items) {
  return calculateRecurrence(items, "markers").sort(
    (left, right) =>
      right.days - left.days ||
      right.count - left.count ||
      markerPriority(right.name) - markerPriority(left.name) ||
      left.name.localeCompare(right.name)
  );
}

function calculateMetricSamples(valid) {
  return {
    load: countNumericValues(valid.map((item) => item.load)),
    fatigue: countNumericValues(valid.map((item) => item.fatigue)),
    focus: countNumericValues(valid.map((item) => item.focus)),
  };
}

function countNumericValues(values) {
  return values.filter((value) => Number.isFinite(value)).length;
}

function getInsufficientMetricData(metricSamples) {
  return Object.entries(metricSamples)
    .filter(([, count]) => count === 0)
    .map(([metric]) => metric);
}

function groupByDate(items) {
  const groups = new Map();

  for (const item of items) {
    if (!groups.has(item.date)) {
      groups.set(item.date, []);
    }

    groups.get(item.date).push(item);
  }

  return new Map(Array.from(groups.entries()).sort(([left], [right]) => left.localeCompare(right)));
}

function calculateVersionBoundaries(finalized) {
  const sorted = [...finalized]
    .filter((item) => item.version.schema || item.version.prompt || item.version.model)
    .sort((left, right) => left.date.localeCompare(right.date));

  const boundaries = [];

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

function versionKey(item) {
  return [
    item.version.schema ?? "",
    item.version.prompt ?? "",
    item.version.model ?? "",
  ].join("|");
}

function buildGapRange(from, to) {
  return {
    from,
    to,
    days: daysBetween(from, to) + 1,
  };
}

function eachDateInRange(from, to) {
  const dates = [];
  const current = parseDateOnly(from);
  const end = parseDateOnly(to);

  while (current <= end) {
    dates.push(formatDateOnly(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

function daysBetween(from, to) {
  return (parseDateOnly(to) - parseDateOnly(from)) / 86_400_000;
}

function parseDateOnly(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDateOnly(date) {
  return date.toISOString().slice(0, 10);
}
