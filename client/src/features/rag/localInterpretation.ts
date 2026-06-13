import type {
  LocalRagEvidencePack,
  LocalRagMeasuredSignal,
  LocalRagRetrievedSupport,
} from "./evidencePack";

export type LocalEvidenceObservationKind =
  | "hypothesis"
  | "measured_signal"
  | "retrieved_support"
  | "suggestion"
  | "uncertainty";

export type LocalEvidenceObservation = {
  confidence: "high" | "low" | "medium";
  evidenceIds: string[];
  kind: LocalEvidenceObservationKind;
  text: string;
};

export type LocalEvidenceInterpretation = {
  abstainReason: string | null;
  abstained: boolean;
  evidencePackVersion: LocalRagEvidencePack["version"];
  observations: LocalEvidenceObservation[];
  provider: "local_rule_based_v1";
  query: string;
  uncertainty: string[];
  version: "rag_interpretation.v1";
};

const AXIS_LABELS: Record<LocalRagMeasuredSignal["axis"], string> = {
  fatigue: "усталость",
  focus: "фокус",
  load: "нагрузка",
};

export function interpretLocalEvidencePack(
  pack: LocalRagEvidencePack,
): LocalEvidenceInterpretation {
  if (pack.retrievedSupport.length === 0) {
    return {
      abstainReason: "no_retrieved_support",
      abstained: true,
      evidencePackVersion: pack.version,
      observations: [],
      provider: "local_rule_based_v1",
      query: pack.query,
      uncertainty: pack.uncertainty,
      version: "rag_interpretation.v1",
    };
  }

  const observations = [
    composeRetrievedSupportObservation(pack.retrievedSupport),
    composeMeasuredSignalObservation(pack.measuredSignals),
    composeHypothesisObservation(pack),
    composeSuggestionObservation(pack),
    composeUncertaintyObservation(pack),
  ].filter((item): item is LocalEvidenceObservation => item !== null);

  return {
    abstainReason: null,
    abstained: false,
    evidencePackVersion: pack.version,
    observations,
    provider: "local_rule_based_v1",
    query: pack.query,
    uncertainty: pack.uncertainty,
    version: "rag_interpretation.v1",
  };
}

function composeRetrievedSupportObservation(
  support: LocalRagRetrievedSupport[],
): LocalEvidenceObservation {
  const dates = unique(support.map((item) => item.entryDate)).slice(0, 3);

  return {
    confidence: support.length >= 3 ? "medium" : "low",
    evidenceIds: support.map((item) => item.id),
    kind: "retrieved_support",
    text: `Найдено локальных фрагментов: ${support.length}; первые даты: ${dates.join(", ")}.`,
  };
}

function composeMeasuredSignalObservation(
  signals: LocalRagMeasuredSignal[],
): LocalEvidenceObservation | null {
  if (signals.length === 0) return null;

  const byAxis = new Map<LocalRagMeasuredSignal["axis"], number[]>();

  for (const signal of signals) {
    const values = byAxis.get(signal.axis) ?? [];
    values.push(signal.value);
    byAxis.set(signal.axis, values);
  }

  const strongest = Array.from(byAxis.entries())
    .map(([axis, values]) => ({
      axis,
      mean: values.reduce((total, value) => total + value, 0) / values.length,
    }))
    .sort(
      (left, right) =>
        Math.abs(right.mean - 5) - Math.abs(left.mean - 5) ||
        left.axis.localeCompare(right.axis),
    )
    .at(0);

  if (!strongest) return null;

  const label = AXIS_LABELS[strongest.axis];
  const rounded = Math.round(strongest.mean * 10) / 10;

  return {
    confidence: signals.length >= 6 ? "medium" : "low",
    evidenceIds: signals
      .filter((signal) => signal.axis === strongest.axis)
      .map((signal) => signal.id),
    kind: "measured_signal",
    text: `В найденных записях измеримый сигнал "${label}" в среднем около ${rounded}/10.`,
  };
}

function composeHypothesisObservation(
  pack: LocalRagEvidencePack,
): LocalEvidenceObservation | null {
  if (pack.retrievedSupport.length < 2) return null;

  const evidenceIds = [
    ...pack.retrievedSupport.slice(0, 3).map((item) => item.id),
    ...pack.measuredSignals.slice(0, 3).map((item) => item.id),
  ];

  return {
    confidence: "low",
    evidenceIds,
    kind: "hypothesis",
    text:
      "Возможная интерпретация: эти записи можно рассматривать вместе, но совпадение не доказывает причину.",
  };
}

function composeSuggestionObservation(
  pack: LocalRagEvidencePack,
): LocalEvidenceObservation | null {
  if (pack.retrievedSupport.length === 0) return null;

  return {
    confidence: "low",
    evidenceIds: pack.retrievedSupport.slice(0, 2).map((item) => item.id),
    kind: "suggestion",
    text:
      "Маленький шаг: открыть один найденный фрагмент и сравнить его с более спокойной записью рядом по времени.",
  };
}

function composeUncertaintyObservation(
  pack: LocalRagEvidencePack,
): LocalEvidenceObservation | null {
  if (pack.uncertainty.length === 0) return null;

  return {
    confidence: "high",
    evidenceIds: [
      ...pack.retrievedSupport.slice(0, 2).map((item) => item.id),
      ...pack.measuredSignals.slice(0, 2).map((item) => item.id),
    ],
    kind: "uncertainty",
    text: `Ограничения: ${pack.uncertainty.join(", ")}.`,
  };
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}
