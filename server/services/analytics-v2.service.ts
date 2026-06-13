import {
  ANALYTICS_V2_VERSION,
  EXTRACTED_ANALYTICS_AXES,
  SELF_REPORT_ANALYTICS_AXES,
  type AnalyticsV2Association,
  type AnalyticsV2AssociationDirection,
  type AnalyticsV2AssociationStrength,
  type AnalyticsV2Axis,
  type AnalyticsV2AxisSource,
  type AnalyticsV2AxisSummary,
  type AnalyticsV2BaselineQuality,
  type AnalyticsV2Context,
  type AnalyticsV2ContextItem,
  type AnalyticsV2Density,
  type AnalyticsV2Direction,
  type AnalyticsV2Overview,
  type AnalyticsV2Quality,
  type AnalyticsV2QualityGrade,
  type AnalyticsV2QualityReason,
  type AnalyticsV2Summary,
  type AnalyticsV2TrendDirection,
  type AnalyticsV2Versions,
  type AnalyticsV2VolatilityDirection,
  type AnalyticsV2Window,
  type AnalyticsV2WindowKind,
  type AnalyticsV2WindowResponse,
  type ExtractedAnalyticsAxis,
  type SelfReportAnalyticsAxis,
} from "../core/analytics-v2.schema.js";
import { markerPriority } from "../core/markers.js";
import type { AthenaDb } from "../db/sqlite.js";
import {
  getAnalyticsV2RowsInRange,
  getLatestAnalyticsV2Date,
  type AnalyticsV2EntrySignalRow,
  type AnalyticsV2SelfReportAggregateRow,
} from "../repositories/analytics-v2.repository.js";

type AnalyticsV2Request = {
  from: string;
  kind: AnalyticsV2WindowKind;
  to: string;
};

type NormalizedEntrySignal = {
  activities: string[];
  date: string;
  entryId: number;
  markers: string[];
  metrics: Record<ExtractedAnalyticsAxis, number | null>;
  signalQuality: string | null;
  status: string;
  tags: string[];
  topics: string[];
  version: {
    model: string | null;
    prompt: string | null;
    schema: string | null;
  };
};

type NormalizedSelfReportAggregate = {
  aggregateVersion: string;
  axis: SelfReportAnalyticsAxis;
  count: number;
  date: string;
  mean: number;
  schemaVersion: string;
};

type DateValue = {
  date: string;
  value: number | null;
};

type SeriesResult = {
  invalidSampleSeen: boolean;
  values: DateValue[];
};

type AxisBuildResult = {
  axes: Record<AnalyticsV2Axis, AnalyticsV2AxisSummary>;
  currentSeries: Record<AnalyticsV2Axis, DateValue[]>;
};

type VersionSet = {
  models: string[];
  prompt_versions: string[];
  schema_versions: string[];
  self_report_aggregate_versions: string[];
};

type CountBucket = {
  count: number;
  dates: Set<string>;
  name: string;
};

const BASELINE_WINDOW_DAYS = 28;
const CURRENT_WINDOW_DAYS: Record<AnalyticsV2WindowKind, number> = {
  baseline: BASELINE_WINDOW_DAYS,
  day: 1,
  month: 30,
  week: 7,
};
const DIRECTION_THRESHOLD = 0.75;
const TREND_THRESHOLD = 0.15;
const VOLATILITY_THRESHOLD = 0.5;
const SUDDEN_CHANGE_THRESHOLD = 2;
const ASSOCIATION_MIN_PAIRED_DAYS = 5;

export async function buildAnalyticsV2Overview(
  db: AthenaDb,
): Promise<AnalyticsV2Overview> {
  const latestDate = await getLatestAnalyticsV2Date(db);

  if (!latestDate) {
    return {
      month: noDataResponse(),
      week: noDataResponse(),
    };
  }

  const [week, month] = await Promise.all([
    buildAnalyticsV2Summary(db, {
      from: subtractDays(latestDate, CURRENT_WINDOW_DAYS.week - 1),
      kind: "week",
      to: latestDate,
    }),
    buildAnalyticsV2Summary(db, {
      from: subtractDays(latestDate, CURRENT_WINDOW_DAYS.month - 1),
      kind: "month",
      to: latestDate,
    }),
  ]);

  return { month, week };
}

export async function buildAnalyticsV2Summary(
  db: AthenaDb,
  { from, kind, to }: AnalyticsV2Request,
): Promise<AnalyticsV2WindowResponse> {
  assertDateRange(from, to);

  const baselineEnd = subtractDays(from, 1);
  const baselineStart = subtractDays(baselineEnd, BASELINE_WINDOW_DAYS - 1);
  const rows = await getAnalyticsV2RowsInRange(db, {
    from: baselineStart,
    to,
  });

  const entries = normalizeEntryRows(rows.entries);
  const selfReports = normalizeSelfReportRows(rows.selfReports);
  const currentEntries = entries.filter((entry) =>
    isDateInRange(entry.date, from, to),
  );
  const baselineEntries = entries.filter((entry) =>
    isDateInRange(entry.date, baselineStart, baselineEnd),
  );
  const currentSelfReports = selfReports.filter((aggregate) =>
    isDateInRange(aggregate.date, from, to),
  );
  const baselineSelfReports = selfReports.filter((aggregate) =>
    isDateInRange(aggregate.date, baselineStart, baselineEnd),
  );

  if (currentEntries.length === 0) {
    return noDataResponse();
  }

  const currentDates = eachDateInRange(from, to);
  const baselineDates = eachDateInRange(baselineStart, baselineEnd);
  const window = buildWindow(kind, from, to);
  const baselineWindow = buildWindow("baseline", baselineStart, baselineEnd);
  const density = buildDensity(currentEntries, currentDates);
  const versions = buildVersions({
    baselineEntries,
    baselineSelfReports,
    currentEntries,
    currentSelfReports,
  });
  const { axes, currentSeries } = buildAxes({
    baselineDates,
    baselineEntries,
    baselineSelfReports,
    currentDates,
    currentEntries,
    currentSelfReports,
    extractedComparisonBlocked: versions.version_boundary_blocks_comparison,
  });
  const associations = buildAssociations(currentSeries);
  const context = buildContext(currentEntries);
  const quality = buildQuality({
    axes,
    currentEntries,
    density,
    versions,
  });

  return {
    reason: null,
    summary: {
      axes,
      associations,
      baseline_window: baselineWindow,
      context,
      density,
      quality,
      version: ANALYTICS_V2_VERSION,
      versions,
      window,
    },
  };
}

function noDataResponse(): AnalyticsV2WindowResponse {
  return {
    reason: "no_data",
    summary: null,
  };
}

function normalizeEntryRows(
  rows: AnalyticsV2EntrySignalRow[],
): NormalizedEntrySignal[] {
  return rows.map((row) => ({
    activities: parseJsonArray(row.activities),
    date: row.entry_date,
    entryId: row.entry_id,
    markers: parseJsonArray(row.markers),
    metrics: {
      fatigue: normalizeScore(row.fatigue),
      focus: normalizeScore(row.focus),
      load: normalizeScore(row.load),
    },
    signalQuality: row.signal_quality,
    status: row.status,
    tags: parseJsonArray(row.tags),
    topics: parseJsonArray(row.topics),
    version: {
      model: row.model,
      prompt: row.prompt_version,
      schema: row.schema_version,
    },
  }));
}

function normalizeSelfReportRows(
  rows: AnalyticsV2SelfReportAggregateRow[],
): NormalizedSelfReportAggregate[] {
  return rows.flatMap((row) => {
    if (!isSelfReportAxis(row.axis)) return [];

    return [
      {
        aggregateVersion: row.aggregate_version,
        axis: row.axis,
        count: row.count,
        date: row.local_day,
        mean: row.mean,
        schemaVersion: row.schema_version,
      },
    ];
  });
}

function buildAxes({
  baselineDates,
  baselineEntries,
  baselineSelfReports,
  currentDates,
  currentEntries,
  currentSelfReports,
  extractedComparisonBlocked,
}: {
  baselineDates: string[];
  baselineEntries: NormalizedEntrySignal[];
  baselineSelfReports: NormalizedSelfReportAggregate[];
  currentDates: string[];
  currentEntries: NormalizedEntrySignal[];
  currentSelfReports: NormalizedSelfReportAggregate[];
  extractedComparisonBlocked: boolean;
}): AxisBuildResult {
  const axes = {} as Record<AnalyticsV2Axis, AnalyticsV2AxisSummary>;
  const currentSeries = {} as Record<AnalyticsV2Axis, DateValue[]>;

  for (const axis of EXTRACTED_ANALYTICS_AXES) {
    const current = buildExtractedSeries(currentEntries, currentDates, axis);
    const baseline = buildExtractedSeries(baselineEntries, baselineDates, axis);
    currentSeries[axis] = current.values;
    axes[axis] = buildAxisSummary({
      baseline,
      comparisonBlocked: extractedComparisonBlocked,
      current,
      source: "extracted",
    });
  }

  for (const axis of SELF_REPORT_ANALYTICS_AXES) {
    const current = buildSelfReportSeries(currentSelfReports, currentDates, axis);
    const baseline = buildSelfReportSeries(baselineSelfReports, baselineDates, axis);
    currentSeries[axis] = current.values;
    axes[axis] = buildAxisSummary({
      baseline,
      comparisonBlocked: false,
      current,
      source: "self_report",
    });
  }

  return { axes, currentSeries };
}

function buildAxisSummary({
  baseline,
  comparisonBlocked,
  current,
  source,
}: {
  baseline: SeriesResult;
  comparisonBlocked: boolean;
  current: SeriesResult;
  source: AnalyticsV2AxisSource;
}): AnalyticsV2AxisSummary {
  const currentValues = numericValues(current.values);
  const baselineValues = numericValues(baseline.values);
  const currentMean = calculateAverage(currentValues);
  const baselineQuality = getBaselineQuality(baselineValues.length);
  const canUseBaseline = baselineQuality !== "insufficient";
  const baselineMean = canUseBaseline ? calculateAverage(baselineValues) : null;
  const baselineSd = canUseBaseline
    ? calculateSampleStandardDeviation(baselineValues)
    : null;
  const delta =
    currentMean !== null &&
    baselineMean !== null &&
    canUseBaseline &&
    !comparisonBlocked
      ? currentMean - baselineMean
      : null;
  const zDelta =
    delta !== null && baselineSd !== null ? delta / Math.max(baselineSd, 1) : null;
  const slope = calculateTrendSlope(current.values);
  const volatility = calculateSampleStandardDeviation(currentValues);
  const volatilityDelta =
    volatility !== null &&
    baselineSd !== null &&
    canUseBaseline &&
    !comparisonBlocked
      ? volatility - baselineSd
      : null;
  const suddenDelta = calculateSuddenDelta(current.values);
  const uncertainty = buildAxisUncertainty({
    baselineInvalidSampleSeen: baseline.invalidSampleSeen,
    baselineQuality,
    comparisonBlocked,
    currentInvalidSampleSeen: current.invalidSampleSeen,
    currentSampleDays: currentValues.length,
  });

  return {
    baseline_mean: roundNullable(baselineMean),
    baseline_quality: baselineQuality,
    baseline_sample_days: baselineValues.length,
    baseline_sd: roundNullable(baselineSd),
    current_mean: roundNullable(currentMean),
    current_sample_days: currentValues.length,
    delta_from_baseline: roundNullable(delta),
    direction: getDirection(delta),
    source,
    slope: roundNullable(slope),
    sudden_change:
      suddenDelta !== null && Math.abs(suddenDelta) >= SUDDEN_CHANGE_THRESHOLD,
    sudden_delta: roundNullable(suddenDelta),
    trend_direction: getTrendDirection(slope),
    uncertainty,
    volatility: roundNullable(volatility),
    volatility_delta: roundNullable(volatilityDelta),
    volatility_direction: getVolatilityDirection(volatilityDelta),
    z_delta: roundNullable(zDelta),
  };
}

function buildExtractedSeries(
  entries: NormalizedEntrySignal[],
  dates: string[],
  axis: ExtractedAnalyticsAxis,
): SeriesResult {
  const valuesByDate = new Map<string, number[]>();
  let invalidSampleSeen = false;

  for (const entry of entries) {
    if (entry.signalQuality !== "valid") continue;

    const value = entry.metrics[axis];
    if (value === null) continue;

    if (!isScore(value)) {
      invalidSampleSeen = true;
      continue;
    }

    const values = valuesByDate.get(entry.date) ?? [];
    values.push(value);
    valuesByDate.set(entry.date, values);
  }

  return {
    invalidSampleSeen,
    values: dates.map((date) => ({
      date,
      value: calculateAverage(valuesByDate.get(date) ?? []),
    })),
  };
}

function buildSelfReportSeries(
  aggregates: NormalizedSelfReportAggregate[],
  dates: string[],
  axis: SelfReportAnalyticsAxis,
): SeriesResult {
  const weightedByDate = new Map<string, { count: number; sum: number }>();
  let invalidSampleSeen = false;

  for (const aggregate of aggregates) {
    if (aggregate.axis !== axis) continue;

    if (!isScore(aggregate.mean) || aggregate.count <= 0) {
      invalidSampleSeen = true;
      continue;
    }

    const existing = weightedByDate.get(aggregate.date) ?? { count: 0, sum: 0 };
    existing.count += aggregate.count;
    existing.sum += aggregate.mean * aggregate.count;
    weightedByDate.set(aggregate.date, existing);
  }

  return {
    invalidSampleSeen,
    values: dates.map((date) => {
      const aggregate = weightedByDate.get(date);

      return {
        date,
        value: aggregate ? aggregate.sum / aggregate.count : null,
      };
    }),
  };
}

function buildAxisUncertainty({
  baselineInvalidSampleSeen,
  baselineQuality,
  comparisonBlocked,
  currentInvalidSampleSeen,
  currentSampleDays,
}: {
  baselineInvalidSampleSeen: boolean;
  baselineQuality: AnalyticsV2BaselineQuality;
  comparisonBlocked: boolean;
  currentInvalidSampleSeen: boolean;
  currentSampleDays: number;
}) {
  const uncertainty: string[] = [];

  if (currentSampleDays === 0) uncertainty.push("no_current_samples");
  if (baselineQuality === "insufficient") {
    uncertainty.push("insufficient_axis_baseline");
  }
  if (baselineQuality === "weak") uncertainty.push("weak_axis_baseline");
  if (comparisonBlocked) uncertainty.push("version_boundary_blocks_comparison");
  if (currentInvalidSampleSeen || baselineInvalidSampleSeen) {
    uncertainty.push("invalid_sample_seen");
  }

  return uncertainty;
}

function buildDensity(
  entries: NormalizedEntrySignal[],
  currentDates: string[],
): AnalyticsV2Density {
  const entryDateSet = new Set(entries.map((entry) => entry.date));
  const validDateSet = new Set(
    entries
      .filter((entry) => entry.signalQuality === "valid")
      .map((entry) => entry.date),
  );
  const sparseDateSet = new Set(
    entries
      .filter(
        (entry) =>
          entry.signalQuality === "sparse" && !validDateSet.has(entry.date),
      )
      .map((entry) => entry.date),
  );
  const fallbackDateSet = new Set(
    entries
      .filter(
        (entry) =>
          (entry.status === "fallback" || entry.signalQuality === "fallback") &&
          !validDateSet.has(entry.date) &&
          !sparseDateSet.has(entry.date),
      )
      .map((entry) => entry.date),
  );
  const days = currentDates.length;
  const entryDays = entryDateSet.size;
  const noEntryDays = Math.max(0, days - entryDays);

  return {
    entry_coverage: roundRatio(entryDays / days),
    entry_days: entryDays,
    fallback_days: fallbackDateSet.size,
    fallback_density: roundRatio(fallbackDateSet.size / Math.max(entryDays, 1)),
    missingness: roundRatio(noEntryDays / days),
    no_entry_days: noEntryDays,
    sparse_days: sparseDateSet.size,
    valid_days: validDateSet.size,
    valid_density: roundRatio(validDateSet.size / days),
  };
}

function buildVersions({
  baselineEntries,
  baselineSelfReports,
  currentEntries,
  currentSelfReports,
}: {
  baselineEntries: NormalizedEntrySignal[];
  baselineSelfReports: NormalizedSelfReportAggregate[];
  currentEntries: NormalizedEntrySignal[];
  currentSelfReports: NormalizedSelfReportAggregate[];
}): AnalyticsV2Versions {
  const current = buildVersionSet(currentEntries, currentSelfReports);
  const baseline = buildVersionSet(baselineEntries, baselineSelfReports);
  const schemaBlocks =
    current.schema_versions.length > 0 &&
    baseline.schema_versions.length > 0 &&
    !areSameStrings(current.schema_versions, baseline.schema_versions);
  const promptBlocks =
    current.prompt_versions.length > 0 &&
    baseline.prompt_versions.length > 0 &&
    !areSameStrings(current.prompt_versions, baseline.prompt_versions);
  const allModels = uniqueSorted([...current.models, ...baseline.models]);

  return {
    baseline,
    current,
    mixed_model:
      allModels.length > 1 ||
      current.models.length > 1 ||
      baseline.models.length > 1,
    version_boundary_blocks_comparison: schemaBlocks || promptBlocks,
  };
}

function buildVersionSet(
  entries: NormalizedEntrySignal[],
  selfReports: NormalizedSelfReportAggregate[],
): VersionSet {
  return {
    models: uniqueSorted(entries.flatMap((entry) => present(entry.version.model))),
    prompt_versions: uniqueSorted(
      entries.flatMap((entry) => present(entry.version.prompt)),
    ),
    schema_versions: uniqueSorted(
      entries.flatMap((entry) => present(entry.version.schema)),
    ),
    self_report_aggregate_versions: uniqueSorted(
      selfReports.map((aggregate) => aggregate.aggregateVersion),
    ),
  };
}

function buildContext(entries: NormalizedEntrySignal[]): AnalyticsV2Context {
  const meaningfulEntries = entries.filter(
    (entry) => entry.signalQuality === "valid" || entry.signalQuality === "sparse",
  );
  const topics = buildCountItems(meaningfulEntries, (entry) => entry.topics);
  const activities = buildCountItems(
    meaningfulEntries,
    (entry) => entry.activities,
  );
  const markers = buildCountItems(
    meaningfulEntries,
    (entry) => entry.markers,
    compareMarkerItems,
  );
  const tags = buildCountItems(entries, (entry) => entry.tags);

  return {
    activities,
    markers,
    recurrence: {
      markers: markers.filter((item) => item.days > 1).slice(0, 5),
      tags: tags.filter((item) => item.days > 1).slice(0, 5),
      topics: topics.filter((item) => item.days > 1).slice(0, 5),
    },
    tags,
    topics,
  };
}

function buildCountItems(
  entries: NormalizedEntrySignal[],
  selectValues: (entry: NormalizedEntrySignal) => string[],
  compareItems: (
    left: AnalyticsV2ContextItem,
    right: AnalyticsV2ContextItem,
  ) => number = compareContextItems,
): AnalyticsV2ContextItem[] {
  const buckets = new Map<string, CountBucket>();

  for (const entry of entries) {
    for (const value of new Set(selectValues(entry))) {
      const bucket = buckets.get(value) ?? {
        count: 0,
        dates: new Set<string>(),
        name: value,
      };
      bucket.count += 1;
      bucket.dates.add(entry.date);
      buckets.set(value, bucket);
    }
  }

  return Array.from(buckets.values())
    .map((bucket) => ({
      count: bucket.count,
      days: bucket.dates.size,
      name: bucket.name,
    }))
    .sort(compareItems)
    .slice(0, 10);
}

function buildAssociations(
  currentSeries: Record<AnalyticsV2Axis, DateValue[]>,
): AnalyticsV2Association[] {
  const associations: AnalyticsV2Association[] = [];

  for (const leftAxis of EXTRACTED_ANALYTICS_AXES) {
    for (const rightAxis of SELF_REPORT_ANALYTICS_AXES) {
      const pairs = pairSeries(currentSeries[leftAxis], currentSeries[rightAxis]);
      const correlation =
        pairs.length >= ASSOCIATION_MIN_PAIRED_DAYS
          ? calculatePearsonCorrelation(pairs)
          : null;
      const uncertainty: string[] = [];

      if (pairs.length < ASSOCIATION_MIN_PAIRED_DAYS) {
        uncertainty.push("insufficient_paired_days");
      }
      if (pairs.length >= ASSOCIATION_MIN_PAIRED_DAYS && correlation === null) {
        uncertainty.push("flat_or_invalid_series");
      }
      if (correlation !== null) {
        uncertainty.push("association_not_causation");
      }

      associations.push({
        correlation: roundNullable(correlation),
        direction: getAssociationDirection(correlation),
        left_axis: leftAxis,
        paired_days: pairs.length,
        right_axis: rightAxis,
        strength: getAssociationStrength(correlation),
        uncertainty,
      });
    }
  }

  return associations;
}

function buildQuality({
  axes,
  currentEntries,
  density,
  versions,
}: {
  axes: Record<AnalyticsV2Axis, AnalyticsV2AxisSummary>;
  currentEntries: NormalizedEntrySignal[];
  density: AnalyticsV2Density;
  versions: AnalyticsV2Versions;
}): AnalyticsV2Quality {
  const relevantAxes = Object.values(axes).filter(
    (axis) => axis.current_sample_days > 0,
  );
  const flags = new Set<string>();

  if (density.valid_density < 0.25) flags.add("very_low_valid_density");
  else if (density.valid_density < 0.5) flags.add("low_valid_density");
  if (density.missingness > 0.5) flags.add("high_missingness");
  if (density.fallback_density >= 0.5) flags.add("fallback_heavy");
  if (density.valid_days === 0 && currentEntries.length > 0) {
    flags.add("no_valid_signals");
  }
  if (relevantAxes.length === 0) flags.add("no_current_axis_samples");
  if (
    relevantAxes.length > 0 &&
    relevantAxes.every((axis) => axis.baseline_quality === "insufficient")
  ) {
    flags.add("all_axis_baselines_insufficient");
  }
  if (versions.version_boundary_blocks_comparison) {
    flags.add("version_boundary_blocks_comparison");
  }
  if (versions.mixed_model) flags.add("mixed_model");
  if (
    Object.values(axes).some((axis) =>
      axis.uncertainty.includes("invalid_sample_seen"),
    )
  ) {
    flags.add("invalid_sample_seen");
  }
  const grade = getQualityGrade({ density, relevantAxes, versions });

  return {
    flags: Array.from(flags).sort(),
    grade,
    reason: getQualityReason({
      currentEntries,
      density,
      grade,
      relevantAxes,
      versions,
    }),
  };
}

function getQualityGrade({
  density,
  relevantAxes,
  versions,
}: {
  density: AnalyticsV2Density;
  relevantAxes: AnalyticsV2AxisSummary[];
  versions: AnalyticsV2Versions;
}): AnalyticsV2QualityGrade {
  const hasCurrentAxisSamples = relevantAxes.length > 0;
  const allRelevantBaselinesInsufficient =
    relevantAxes.length > 0 &&
    relevantAxes.every((axis) => axis.baseline_quality === "insufficient");
  const hasUsableBaseline = relevantAxes.some(
    (axis) =>
      axis.baseline_quality === "usable" || axis.baseline_quality === "strong",
  );
  const allStrongBaselines =
    relevantAxes.length > 0 &&
    relevantAxes.every((axis) => axis.baseline_quality === "strong");

  if (
    density.valid_density < 0.25 ||
    !hasCurrentAxisSamples ||
    allRelevantBaselinesInsufficient
  ) {
    return "insufficient";
  }

  if (
    density.valid_density >= 0.7 &&
    allStrongBaselines &&
    !versions.version_boundary_blocks_comparison
  ) {
    return "strong";
  }

  if (
    density.valid_density >= 0.5 &&
    hasUsableBaseline &&
    !versions.version_boundary_blocks_comparison
  ) {
    return "usable";
  }

  return "weak";
}

function getQualityReason({
  currentEntries,
  density,
  grade,
  relevantAxes,
  versions,
}: {
  currentEntries: NormalizedEntrySignal[];
  density: AnalyticsV2Density;
  grade: AnalyticsV2QualityGrade;
  relevantAxes: AnalyticsV2AxisSummary[];
  versions: AnalyticsV2Versions;
}): AnalyticsV2QualityReason {
  if (versions.version_boundary_blocks_comparison) return "version_boundary";
  if (density.valid_days === 0 && currentEntries.length > 0) {
    return "no_valid_signals";
  }
  if (relevantAxes.length === 0) return "no_axis_samples";
  if (grade === "insufficient" || grade === "weak") return "weak_support";

  return "ok";
}

function getBaselineQuality(sampleDays: number): AnalyticsV2BaselineQuality {
  if (sampleDays < 5) return "insufficient";
  if (sampleDays < 14) return "weak";
  if (sampleDays < 21) return "usable";
  return "strong";
}

function getDirection(value: number | null): AnalyticsV2Direction {
  if (value === null) return "unknown";
  if (Math.abs(value) < DIRECTION_THRESHOLD) return "stable";
  return value > 0 ? "up" : "down";
}

function getTrendDirection(value: number | null): AnalyticsV2TrendDirection {
  if (value === null) return "unknown";
  if (Math.abs(value) < TREND_THRESHOLD) return "flat";
  return value > 0 ? "rising" : "falling";
}

function getVolatilityDirection(
  value: number | null,
): AnalyticsV2VolatilityDirection {
  if (value === null) return "unknown";
  if (Math.abs(value) < VOLATILITY_THRESHOLD) return "stable";
  return value > 0 ? "more_variable" : "less_variable";
}

function getAssociationDirection(
  correlation: number | null,
): AnalyticsV2AssociationDirection {
  if (correlation === null) return "unknown";
  if (Math.abs(correlation) < 0.1) return "none";
  return correlation > 0 ? "positive" : "negative";
}

function getAssociationStrength(
  correlation: number | null,
): AnalyticsV2AssociationStrength {
  if (correlation === null) return "unknown";

  const absolute = Math.abs(correlation);
  if (absolute < 0.3) return "weak";
  if (absolute < 0.6) return "moderate";
  return "strong";
}

function calculateTrendSlope(values: DateValue[]): number | null {
  const points = values.flatMap((item, index) =>
    item.value === null ? [] : [{ x: index, y: item.value }],
  );

  if (points.length < 3) return null;

  const meanX = calculateAverage(points.map((point) => point.x));
  const meanY = calculateAverage(points.map((point) => point.y));
  if (meanX === null || meanY === null) return null;

  const numerator = points.reduce(
    (sum, point) => sum + (point.x - meanX) * (point.y - meanY),
    0,
  );
  const denominator = points.reduce(
    (sum, point) => sum + (point.x - meanX) ** 2,
    0,
  );

  if (denominator === 0) return null;

  return numerator / denominator;
}

function calculateSuddenDelta(values: DateValue[]): number | null {
  if (values.length < 7) return null;

  const recentValues = numericValues(values.slice(-3));
  const previousValues = numericValues(values.slice(0, -3));

  if (recentValues.length < 2 || previousValues.length < 2) return null;

  const recentMean = calculateAverage(recentValues);
  const previousMean = calculateAverage(previousValues);

  if (recentMean === null || previousMean === null) return null;

  return recentMean - previousMean;
}

function pairSeries(
  leftValues: DateValue[],
  rightValues: DateValue[],
): Array<[number, number]> {
  const rightByDate = new Map(
    rightValues.flatMap((item) => (item.value === null ? [] : [[item.date, item.value]])),
  );

  return leftValues.flatMap((left) => {
    if (left.value === null) return [];

    const right = rightByDate.get(left.date);
    if (right === undefined) return [];

    return [[left.value, right] as [number, number]];
  });
}

function calculatePearsonCorrelation(pairs: Array<[number, number]>): number | null {
  if (pairs.length < 2) return null;

  const leftMean = calculateAverage(pairs.map(([left]) => left));
  const rightMean = calculateAverage(pairs.map(([, right]) => right));
  if (leftMean === null || rightMean === null) return null;

  let numerator = 0;
  let leftDenominator = 0;
  let rightDenominator = 0;

  for (const [left, right] of pairs) {
    const leftDelta = left - leftMean;
    const rightDelta = right - rightMean;
    numerator += leftDelta * rightDelta;
    leftDenominator += leftDelta ** 2;
    rightDenominator += rightDelta ** 2;
  }

  const denominator = Math.sqrt(leftDenominator * rightDenominator);
  if (denominator === 0) return null;

  return numerator / denominator;
}

function calculateAverage(values: number[]): number | null {
  if (values.length === 0) return null;

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateSampleStandardDeviation(values: number[]): number | null {
  if (values.length < 2) return null;

  const mean = calculateAverage(values);
  if (mean === null) return null;

  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    (values.length - 1);

  return Math.sqrt(variance);
}

function numericValues(values: DateValue[]): number[] {
  return values.flatMap((item) => (item.value === null ? [] : [item.value]));
}

function normalizeScore(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isScore(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 10;
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

function compareContextItems(
  left: AnalyticsV2ContextItem,
  right: AnalyticsV2ContextItem,
) {
  return (
    right.days - left.days ||
    right.count - left.count ||
    left.name.localeCompare(right.name)
  );
}

function compareMarkerItems(
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

function buildWindow(
  kind: AnalyticsV2WindowKind,
  start: string,
  end: string,
): AnalyticsV2Window {
  return {
    days: daysBetween(start, end) + 1,
    end,
    kind,
    start,
  };
}

function assertDateRange(from: string, to: string) {
  if (!isDateOnly(from) || !isDateOnly(to) || from > to) {
    throw new Error("invalid_analytics_v2_date_range");
  }
}

function isDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isDateInRange(date: string, from: string, to: string) {
  return date >= from && date <= to;
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

function subtractDays(dateOnly: string, days: number): string {
  const date = parseDateOnly(dateOnly);
  date.setUTCDate(date.getUTCDate() - days);

  return formatDateOnly(date);
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

function roundRatio(value: number): number {
  return roundNumber(value);
}

function roundNullable(value: number | null): number | null {
  return value === null ? null : roundNumber(value);
}

function roundNumber(value: number): number {
  const rounded = Number(value.toFixed(3));
  return Object.is(rounded, -0) ? 0 : rounded;
}

function isSelfReportAxis(axis: string): axis is SelfReportAnalyticsAxis {
  return (SELF_REPORT_ANALYTICS_AXES as readonly string[]).includes(axis);
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

function present(value: string | null): string[] {
  return value ? [value] : [];
}

function areSameStrings(left: string[], right: string[]) {
  if (left.length !== right.length) return false;

  return left.every((value, index) => value === right[index]);
}
