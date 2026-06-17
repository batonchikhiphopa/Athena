import type { InsightLayer } from "../core/types.js";
import { markerLabel } from "../core/markers.js";
import {
  type AnalyticsV2Association,
  type AnalyticsV2Axis,
  type AnalyticsV2AxisSummary,
  type AnalyticsV2ContextItem,
  type AnalyticsV2Summary,
} from "../core/analytics-v2.schema.js";

export type InsightV2Input = {
  context: {
    topMarker: AnalyticsV2ContextItem | null;
    topTag: AnalyticsV2ContextItem | null;
    topTopic: AnalyticsV2ContextItem | null;
  };
  density: {
    entryCoverage: number;
    missingness: number;
    validDensity: number;
  };
  layer: InsightLayer;
  period: {
    end: string;
    start: string;
  };
  primaryAxis: InsightV2AxisSignal | null;
  quality: {
    flags: string[];
    grade: AnalyticsV2Summary["quality"]["grade"];
    reason: AnalyticsV2Summary["quality"]["reason"];
  };
  selfReportAgreement: InsightV2SelfReportAgreement | null;
  trackedLayer: "context" | "dynamics" | "quality" | "state" | "uncertainty";
};

type InsightV2AxisSignal = {
  axis: AnalyticsV2Axis;
  baselineQuality: AnalyticsV2AxisSummary["baseline_quality"];
  currentMean: number | null;
  delta: number | null;
  direction: AnalyticsV2AxisSummary["direction"];
  source: AnalyticsV2AxisSummary["source"];
  trend: AnalyticsV2AxisSummary["trend_direction"];
  uncertainty: string[];
};

type InsightV2SelfReportAgreement = {
  correlation: number;
  extractedAxis: AnalyticsV2Association["left_axis"];
  selfReportAxis: AnalyticsV2Association["right_axis"];
  strength: AnalyticsV2Association["strength"];
};

type TextPart = {
  priority: number;
  text: string;
};

const AXIS_LABELS: Record<AnalyticsV2Axis, string> = {
  energy: "энергия",
  fatigue: "усталость",
  focus: "фокус",
  function: "повседневная функциональность",
  load: "нагрузка",
  mood: "настроение",
  sleep_quality: "качество сна",
  stress: "стресс",
};

const SENSITIVE_CLINICAL_WORDS = [
  "депресс",
  "диагноз",
  "расстройств",
  "тревожное расстройство",
  "клиническ",
  "риск суицида",
  "кризис",
];

export function buildInsightV2Input(
  summary: AnalyticsV2Summary,
  layer: InsightLayer,
): InsightV2Input {
  const primaryAxis = selectPrimaryAxis(summary.axes);
  const topTopic = summary.context.topics[0] ?? null;
  const topMarker = summary.context.markers[0] ?? null;
  const topTag = summary.context.tags[0] ?? null;
  const selfReportAgreement = selectSelfReportAgreement(summary.associations);

  return {
    context: {
      topMarker,
      topTag,
      topTopic,
    },
    density: {
      entryCoverage: summary.density.entry_coverage,
      missingness: summary.density.missingness,
      validDensity: summary.density.valid_density,
    },
    layer,
    period: {
      end: summary.window.end,
      start: summary.window.start,
    },
    primaryAxis,
    quality: {
      flags: summary.quality.flags,
      grade: summary.quality.grade,
      reason: summary.quality.reason,
    },
    selfReportAgreement,
    trackedLayer: selectTrackedLayer(summary, primaryAxis),
  };
}

export function composeInsightV2Text(input: InsightV2Input): string | null {
  const observation = composeObservation(input);
  if (!observation) return null;

  const uncertainty = composeUncertainty(input);
  const suggestion = composeSuggestion(input);
  const text = [observation, uncertainty, suggestion].filter(Boolean).join(" ");

  return assertNonClinicalText(text);
}

export function insightV2Topic(input: InsightV2Input): string | null {
  return input.context.topTopic?.name ?? input.context.topTag?.name ?? null;
}

function selectPrimaryAxis(
  axes: AnalyticsV2Summary["axes"],
): InsightV2AxisSignal | null {
  return Object.entries(axes)
    .map(([axis, summary]) => ({
      axis: axis as AnalyticsV2Axis,
      summary,
      score: scoreAxis(summary),
    }))
    .filter((item) => item.summary.current_sample_days > 0 && item.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score || left.axis.localeCompare(right.axis),
    )
    .map(({ axis, summary }) => ({
      axis,
      baselineQuality: summary.baseline_quality,
      currentMean: summary.current_mean,
      delta: summary.delta_from_baseline,
      direction: summary.direction,
      source: summary.source,
      trend: summary.trend_direction,
      uncertainty: summary.uncertainty,
    }))
    .at(0) ?? null;
}

function scoreAxis(axis: AnalyticsV2AxisSummary): number {
  const deltaScore = axis.delta_from_baseline
    ? Math.abs(axis.delta_from_baseline) * 4
    : 0;
  const trendScore =
    axis.trend_direction === "rising" || axis.trend_direction === "falling"
      ? Math.abs(axis.slope ?? 0) * 2
      : 0;
  const currentScore = axis.current_mean === null ? 0 : Math.abs(axis.current_mean - 5);
  const baselineBonus =
    axis.baseline_quality === "strong"
      ? 3
      : axis.baseline_quality === "usable"
        ? 2
        : axis.baseline_quality === "weak"
          ? 1
          : 0;

  return deltaScore + trendScore + currentScore + baselineBonus;
}

function selectSelfReportAgreement(
  associations: AnalyticsV2Association[],
): InsightV2SelfReportAgreement | null {
  return associations
    .filter(
      (association) =>
        association.correlation !== null &&
        association.paired_days >= 5 &&
        (association.strength === "moderate" ||
          association.strength === "strong"),
    )
    .sort(
      (left, right) =>
        Math.abs(right.correlation ?? 0) - Math.abs(left.correlation ?? 0) ||
        left.left_axis.localeCompare(right.left_axis) ||
        left.right_axis.localeCompare(right.right_axis),
    )
    .map((association) => ({
      correlation: association.correlation ?? 0,
      extractedAxis: association.left_axis,
      selfReportAxis: association.right_axis,
      strength: association.strength,
    }))
    .at(0) ?? null;
}

function selectTrackedLayer(
  summary: AnalyticsV2Summary,
  primaryAxis: InsightV2AxisSignal | null,
): InsightV2Input["trackedLayer"] {
  if (summary.quality.grade === "insufficient") return "uncertainty";
  if (summary.quality.flags.length > 0) return "quality";
  if (
    primaryAxis?.delta !== null &&
    primaryAxis?.direction !== "stable" &&
    primaryAxis?.direction !== "unknown"
  ) {
    return "dynamics";
  }
  if (primaryAxis) return "state";

  return "context";
}

function composeObservation(input: InsightV2Input): string | null {
  if (input.quality.grade === "insufficient") {
    if (input.primaryAxis?.source === "self_report") {
      return composeAxisObservation(input, input.primaryAxis);
    }

    const context = describeContext(input);
    return context
      ? `Наблюдение: данных пока мало, но в окне заметен контекст: ${context}.`
      : "Наблюдение: данных пока мало, устойчивый сдвиг не виден.";
  }

  if (input.primaryAxis) {
    return composeAxisObservation(input, input.primaryAxis);
  }

  const context = describeContext(input);
  if (context) {
    return `Наблюдение: в окне чаще всего повторяется ${context}.`;
  }

  return "Наблюдение: выраженного паттерна в окне не видно.";
}

function composeAxisObservation(
  input: InsightV2Input,
  axis: InsightV2AxisSignal,
): string {
  const label = axisLabel(axis.axis);
  const windowName = layerLabel(input.layer);
  const direction = describeDirection(axis);
  const trend = describeTrend(axis);
  const context = describeContext(input);
  const agreement = describeSelfReportAgreement(input.selfReportAgreement);
  const parts: TextPart[] = [
    {
      priority: 10,
      text: `${windowName} ${label} ${direction}`,
    },
  ];

  if (trend) {
    parts.push({ priority: 20, text: trend });
  }
  if (context) {
    parts.push({ priority: 30, text: `рядом чаще встречается ${context}` });
  }
  if (agreement) {
    parts.push({ priority: 40, text: agreement });
  }

  return `Наблюдение: ${parts
    .sort((left, right) => left.priority - right.priority)
    .map((part) => part.text)
    .join("; ")}.`;
}

function composeUncertainty(input: InsightV2Input): string {
  const flags = new Set(input.quality.flags);
  const axisUncertainty = input.primaryAxis?.uncertainty ?? [];

  for (const item of axisUncertainty) flags.add(item);

  if (input.quality.grade === "strong" && flags.size === 0) {
    return "Ограничение: это наблюдение, не причина и не оценка человека.";
  }

  if (flags.has("version_boundary_blocks_comparison")) {
    return "Ограничение: окно пересекает границу версии, поэтому сравнение с обычным уровнем отключено.";
  }

  if (
    input.primaryAxis?.source === "self_report" &&
    flags.has("no_valid_signals")
  ) {
    return "Ограничение: текстовый анализ не дал валидных сигналов, поэтому опора здесь на самооценку.";
  }

  if (input.density.validDensity < 0.5 || flags.has("low_valid_density")) {
    return "Ограничение: плотность валидных сигналов снижена.";
  }

  if (
    flags.has("insufficient_axis_baseline") ||
    flags.has("all_axis_baselines_insufficient")
  ) {
    return "Ограничение: своей базы пока мало, поэтому сравнение с обычным уровнем предварительное.";
  }

  if (flags.has("weak_axis_baseline") || input.quality.grade === "weak") {
    return "Ограничение: база есть, но она еще слабая; формулировка осторожная.";
  }

  if (input.density.missingness > 0.5 || flags.has("high_missingness")) {
    return "Ограничение: в окне много дней без записей.";
  }

  return "Ограничение: это агрегированное наблюдение без чтения сырого текста.";
}

function composeSuggestion(input: InsightV2Input): string {
  const axis = input.primaryAxis?.axis;

  if (input.quality.grade === "insufficient") {
    return "Маленький шаг: просто продолжай писать в обычном ритме, чтобы собрать устойчивую опору.";
  }

  if (axis === "load" || axis === "stress") {
    return "Маленький шаг: выбери один следующий шаг и убери из головы остальной ком задач.";
  }

  if (axis === "fatigue" || axis === "energy" || axis === "sleep_quality") {
    return "Маленький шаг: сегодня сделай вечер чуть тише и короче по нагрузке.";
  }

  if (axis === "focus" || axis === "function") {
    return "Маленький шаг: оставь на ближайший блок одну задачу без параллельных переключений.";
  }

  if (axis === "mood") {
    return "Маленький шаг: отметь одну вещь, которая сегодня реально поддержала состояние.";
  }

  return "Маленький шаг: выбери одно простое действие, которое сделает повторяющуюся тему яснее.";
}

function describeDirection(axis: InsightV2AxisSignal): string {
  if (axis.direction === "up") return "выше своего обычного уровня";
  if (axis.direction === "down") return "ниже своего обычного уровня";
  if (axis.currentMean !== null) return "держится без явного сдвига";

  return "пока не имеет устойчивого значения";
}

function describeTrend(axis: InsightV2AxisSignal): string | null {
  if (axis.trend === "rising") return "внутри окна линия растет";
  if (axis.trend === "falling") return "внутри окна линия снижается";

  return null;
}

function describeContext(input: InsightV2Input): string | null {
  if (input.context.topTopic) return `тема ${topicSubject(input.context.topTopic.name)}`;
  if (input.context.topMarker) {
    return `маркер ${markerLabel(input.context.topMarker.name)}`;
  }
  if (input.context.topTag) return `тег #${input.context.topTag.name}`;

  return null;
}

function describeSelfReportAgreement(
  agreement: InsightV2SelfReportAgreement | null,
): string | null {
  if (!agreement) return null;

  const extracted = axisLabel(agreement.extractedAxis);
  const selfReport = axisLabel(agreement.selfReportAxis);
  const relation = agreement.correlation > 0 ? "движется вместе с" : "идет в обратную сторону от";

  return `самооценка «${selfReport}» ${relation} «${extracted}»`;
}

function assertNonClinicalText(text: string): string {
  const lower = text.toLowerCase();
  const clinicalWord = SENSITIVE_CLINICAL_WORDS.find((word) =>
    lower.includes(word),
  );

  if (clinicalWord) {
    throw new Error(`insight_v2_clinical_language:${clinicalWord}`);
  }

  return text;
}

function axisLabel(axis: AnalyticsV2Axis): string {
  return AXIS_LABELS[axis];
}

function layerLabel(layer: InsightLayer): string {
  if (layer === "day") return "за вчера";
  if (layer === "week") return "за неделю";

  return "за месяц";
}

function topicSubject(topic: string): string {
  const normalized = topic.trim().toLowerCase();
  const knownSubjects: Record<string, string> = {
    career: "работы",
    focus: "фокуса",
    health: "самочувствия",
    job: "работы",
    productivity: "продуктивности",
    recovery: "восстановления",
    rest: "отдыха",
    sleep: "сна",
    wellbeing: "самочувствия",
    "well-being": "самочувствия",
    восстановление: "восстановления",
    здоровье: "самочувствия",
    отдых: "отдыха",
    продуктивность: "продуктивности",
    работа: "работы",
    самочувствие: "самочувствия",
    сон: "сна",
    фокус: "фокуса",
  };

  return knownSubjects[normalized] ?? `«${topic.trim()}»`;
}
