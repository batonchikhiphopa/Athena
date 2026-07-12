export type DateValue = { date: string; value: number | null };

export function calculateTrendSlope(values: DateValue[]): number | null {
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
  return denominator === 0 ? null : numerator / denominator;
}

export function calculateSuddenDelta(values: DateValue[]): number | null {
  if (values.length < 7) return null;
  const recent = numericValues(values.slice(-3));
  const previous = numericValues(values.slice(0, -3));
  if (recent.length < 2 || previous.length < 2) return null;
  const recentMean = calculateAverage(recent);
  const previousMean = calculateAverage(previous);
  return recentMean === null || previousMean === null
    ? null
    : recentMean - previousMean;
}

export function pairSeries(
  leftValues: DateValue[],
  rightValues: DateValue[],
): Array<[number, number]> {
  const rightByDate = new Map(
    rightValues.flatMap((item) =>
      item.value === null ? [] : [[item.date, item.value]],
    ),
  );
  return leftValues.flatMap((left) => {
    if (left.value === null) return [];
    const right = rightByDate.get(left.date);
    return right === undefined ? [] : [[left.value, right] as [number, number]];
  });
}

export function calculatePearsonCorrelation(
  pairs: Array<[number, number]>,
): number | null {
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
  return denominator === 0 ? null : numerator / denominator;
}

export function calculateAverage(values: number[]): number | null {
  return values.length === 0
    ? null
    : values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function calculateSampleStandardDeviation(
  values: number[],
): number | null {
  if (values.length < 2) return null;
  const mean = calculateAverage(values);
  if (mean === null) return null;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    (values.length - 1);
  return Math.sqrt(variance);
}

export function numericValues(values: DateValue[]): number[] {
  return values.flatMap((item) => (item.value === null ? [] : [item.value]));
}

export function normalizeScore(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function isScore(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 10;
}

export function roundRatio(value: number): number {
  return roundNumber(value);
}

export function roundNullable(value: number | null): number | null {
  return value === null ? null : roundNumber(value);
}

export function roundNumber(value: number): number {
  const rounded = Number(value.toFixed(3));
  return Object.is(rounded, -0) ? 0 : rounded;
}
