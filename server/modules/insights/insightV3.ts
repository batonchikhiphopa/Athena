import type { InsightLayer } from "../../core/types.js";
import type {
  AnalyticsV2ContextItem,
  AnalyticsV2Summary,
} from "../analytics/analyticsV2.types.js";
import {
  buildInsightV2Input,
  composeInsightV2Text,
  insightV2Topic,
  type InsightV2Input,
} from "./insightInput.js";

export type InsightV3EvidenceKind =
  | "association"
  | "measured_signal"
  | "quality"
  | "retrieved_support"
  | "uncertainty";

export type InsightV3EvidenceItem = {
  id: string;
  kind: InsightV3EvidenceKind;
  label: string;
  value: string;
};

export type InsightV3Observation = {
  evidenceIds: string[];
  kind:
    | "hypothesis"
    | "measured_signal"
    | "retrieved_support"
    | "suggestion"
    | "uncertainty";
  text: string;
};

export type InsightV3Input = {
  evidence: InsightV3EvidenceItem[];
  layer: InsightLayer;
  observations: InsightV3Observation[];
  period: {
    end: string;
    start: string;
  };
  uncertainty: string[];
  v2Input: InsightV2Input;
  version: "insight.v3";
};

const AXIS_LABELS: Record<string, string> = {
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

export function buildInsightV3Input(
  summary: AnalyticsV2Summary,
  layer: InsightLayer,
): InsightV3Input {
  const v2Input = buildInsightV2Input(summary, layer);
  const evidence = buildEvidence(summary, v2Input);
  const observations = buildObservations(v2Input, evidence);

  return {
    evidence,
    layer,
    observations,
    period: {
      end: summary.window.end,
      start: summary.window.start,
    },
    uncertainty: collectUncertainty(summary, v2Input),
    v2Input,
    version: "insight.v3",
  };
}

export function composeInsightV3Text(input: InsightV3Input): string | null {
  const baseText = composeInsightV2Text(input.v2Input);
  if (!baseText) return null;

  const supportText = composeSupportText(input);
  const interpretationText = composeInterpretationText(input);
  const evidenceText = [supportText, interpretationText].filter(Boolean).join(" ");

  if (!evidenceText) return baseText;

  const text = baseText.includes(" Ограничение:")
    ? baseText.replace(" Ограничение:", ` ${evidenceText} Ограничение:`)
    : `${baseText} ${evidenceText}`;

  return assertNonClinicalText(text);
}

export function insightV3Topic(input: InsightV3Input): string | null {
  return insightV2Topic(input.v2Input);
}

function buildEvidence(
  summary: AnalyticsV2Summary,
  input: InsightV2Input,
): InsightV3EvidenceItem[] {
  const evidence: InsightV3EvidenceItem[] = [];
  const axis = input.primaryAxis;

  if (axis) {
    evidence.push({
      id: `measured:${axis.axis}`,
      kind: "measured_signal",
      label: axisLabel(axis.axis),
      value: describeAxisEvidence(axis),
    });
  }

  for (const context of selectContextEvidence(input)) {
    evidence.push(context);
  }

  if (input.selfReportAgreement) {
    evidence.push({
      id: `association:${input.selfReportAgreement.extractedAxis}:${input.selfReportAgreement.selfReportAxis}`,
      kind: "association",
      label: "связь самооценки и сигнала",
      value: `${axisLabel(
        input.selfReportAgreement.selfReportAxis,
      )} и ${axisLabel(input.selfReportAgreement.extractedAxis)}: r=${roundNumber(
        input.selfReportAgreement.correlation,
      )}, ${input.selfReportAgreement.strength}`,
    });
  }

  evidence.push({
    id: "quality:window",
    kind: "quality",
    label: "качество окна",
    value: `${summary.quality.grade}; valid density ${roundNumber(
      summary.density.valid_density,
    )}; coverage ${roundNumber(summary.density.entry_coverage)}`,
  });

  for (const uncertainty of collectUncertainty(summary, input)) {
    evidence.push({
      id: `uncertainty:${uncertainty}`,
      kind: "uncertainty",
      label: "ограничение",
      value: uncertainty,
    });
  }

  return evidence;
}

function buildObservations(
  input: InsightV2Input,
  evidence: InsightV3EvidenceItem[],
): InsightV3Observation[] {
  const observations: InsightV3Observation[] = [];
  const measured = evidence.find((item) => item.kind === "measured_signal");
  const retrieved = evidence.filter((item) => item.kind === "retrieved_support");
  const uncertainty = evidence.filter((item) => item.kind === "uncertainty");

  if (measured) {
    observations.push({
      evidenceIds: [measured.id],
      kind: "measured_signal",
      text: measured.value,
    });
  }

  if (retrieved.length > 0) {
    observations.push({
      evidenceIds: retrieved.map((item) => item.id),
      kind: "retrieved_support",
      text: retrieved.map((item) => item.value).join("; "),
    });
  }

  if (measured && retrieved.length > 0) {
    observations.push({
      evidenceIds: [measured.id, ...retrieved.map((item) => item.id)],
      kind: "hypothesis",
      text:
        "возможная связь между измеримым сдвигом и повторяющимся контекстом",
    });
  }

  observations.push({
    evidenceIds: measured ? [measured.id] : [],
    kind: "suggestion",
    text: input.primaryAxis
      ? `маленький шаг для оси "${axisLabel(input.primaryAxis.axis)}"`
      : "маленький шаг для повторяющегося контекста",
  });

  if (uncertainty.length > 0) {
    observations.push({
      evidenceIds: uncertainty.map((item) => item.id),
      kind: "uncertainty",
      text: uncertainty.map((item) => item.value).join("; "),
    });
  }

  return observations;
}

function selectContextEvidence(
  input: InsightV2Input,
): InsightV3EvidenceItem[] {
  const items: Array<{
    idPrefix: string;
    item: AnalyticsV2ContextItem | null;
    label: string;
  }> = [
    { idPrefix: "topic", item: input.context.topTopic, label: "тема" },
    { idPrefix: "marker", item: input.context.topMarker, label: "маркер" },
    { idPrefix: "tag", item: input.context.topTag, label: "тег" },
  ];

  return items.flatMap(({ idPrefix, item, label }) => {
    if (!item) return [];

    return [
      {
        id: `context:${idPrefix}:${item.name}`,
        kind: "retrieved_support" as const,
        label,
        value: `${label} ${item.name}: ${item.count} раз, ${item.days} дн.`,
      },
    ];
  });
}

function composeSupportText(input: InsightV3Input): string | null {
  const measured = input.evidence.find((item) => item.kind === "measured_signal");
  const contexts = input.evidence
    .filter((item) => item.kind === "retrieved_support")
    .slice(0, 2);
  const quality = input.evidence.find((item) => item.kind === "quality");
  const parts = [
    measured ? `измерение: ${measured.value}` : null,
    contexts.length > 0
      ? `контекст: ${contexts.map((item) => item.value).join("; ")}`
      : null,
    quality ? `качество: ${quality.value}` : null,
  ].filter(Boolean);

  if (parts.length === 0) return null;

  return `Поддержка: ${parts.join("; ")}.`;
}

function composeInterpretationText(input: InsightV3Input): string | null {
  const hasMeasured = input.evidence.some(
    (item) => item.kind === "measured_signal",
  );
  const hasContext = input.evidence.some(
    (item) => item.kind === "retrieved_support",
  );

  if (!hasMeasured && !hasContext) return null;

  if (hasMeasured && hasContext) {
    return "Интерпретация: возможная связь между сдвигом и контекстом, но это не доказательство причины.";
  }

  return "Интерпретация: это осторожное чтение имеющихся данных, без вывода о причине.";
}

function collectUncertainty(
  summary: AnalyticsV2Summary,
  input: InsightV2Input,
): string[] {
  const uncertainty = new Set<string>(summary.quality.flags);

  for (const item of input.primaryAxis?.uncertainty ?? []) {
    uncertainty.add(item);
  }

  if (summary.quality.grade === "insufficient") {
    uncertainty.add("insufficient_quality");
  }

  if (summary.density.valid_density < 0.5) {
    uncertainty.add("low_valid_density");
  }

  return Array.from(uncertainty).sort();
}

function describeAxisEvidence(
  axis: NonNullable<InsightV2Input["primaryAxis"]>,
): string {
  const current =
    axis.currentMean === null ? "нет значения" : `${roundNumber(axis.currentMean)}/10`;
  const delta =
    axis.delta === null ? "без baseline delta" : `delta ${signed(axis.delta)}`;

  return `${axisLabel(axis.axis)}: current ${current}, ${delta}, trend ${axis.trend}, baseline ${axis.baselineQuality}`;
}

function axisLabel(axis: string): string {
  return AXIS_LABELS[axis] ?? axis;
}

function signed(value: number): string {
  return value > 0 ? `+${roundNumber(value)}` : String(roundNumber(value));
}

function roundNumber(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function assertNonClinicalText(text: string): string {
  const lower = text.toLowerCase();
  const clinicalWord = SENSITIVE_CLINICAL_WORDS.find((word) =>
    lower.includes(word),
  );

  if (clinicalWord) {
    throw new Error(`insight_v3_clinical_language:${clinicalWord}`);
  }

  return text;
}
