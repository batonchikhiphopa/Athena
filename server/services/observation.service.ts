import { markerLabel } from "../core/markers.js";

type CountItem = {
  name: string;
  count: number;
};

type RecurrenceItem = CountItem & {
  days: number;
};

type ObservationInput = {
  metrics?: {
    finalized_entries: number;
    valid_entries: number;
    density: number;
  };
  flags: {
    mixed_version: boolean;
    elevated_load: boolean;
    elevated_fatigue: boolean;
    low_focus: boolean;
    low_density: boolean;
  };
  gaps: {
    total_missing_days: number;
  };
  top_topics?: CountItem[];
  top_markers?: CountItem[];
  recurrence?: {
    topics?: RecurrenceItem[];
    markers?: RecurrenceItem[];
  };
};

export const OBSERVATION_PROMPT_CONTRACT = [
  "Use only aggregate analytics input.",
  "Do not read raw diary text.",
  "Write one short dry observation.",
  "Do not advise, motivate, coach, or infer causes.",
  "If density is low, say that the observation is unstable.",
].join("\n");

export function generateObservation(input: ObservationInput): string {
  const {
    metrics,
    flags,
    gaps,
    top_topics: topTopics,
    top_markers: topMarkers,
    recurrence,
  } = input;

  if (!metrics || metrics.finalized_entries === 0) {
    return "Недостаточно данных для наблюдения.";
  }

  if (metrics.density < 0.25 || metrics.valid_entries < 2) {
    const lowDensityParts = ["Плотность валидных сигналов низкая."];
    const markerObservation = describeMarkerObservation({ topMarkers, recurrence });

    if (markerObservation) {
      lowDensityParts.push(markerObservation);
      return lowDensityParts.join(" ");
    }

    return "Плотность валидных сигналов низкая; устойчивых паттернов не видно.";
  }

  const parts: string[] = [];

  if (flags.mixed_version) {
    parts.push("Окно пересекает границу версий.");
  }

  if (flags.elevated_load) {
    parts.push("Нагрузка держится на повышенном уровне.");
  }

  if (flags.elevated_fatigue) {
    parts.push("Усталость держится на повышенном уровне.");
  }

  if (flags.low_focus) {
    parts.push("Фокус остается низким.");
  }

  const markerObservation = describeMarkerObservation({ topMarkers, recurrence });
  if (markerObservation) {
    parts.push(markerObservation);
  }

  const recurringTopic = recurrence?.topics?.[0];
  if (recurringTopic) {
    parts.push(`Чаще всего повторяется тема: ${recurringTopic.name}.`);
  } else if (topTopics?.[0]) {
    parts.push(`Самая частая тема окна: ${topTopics[0].name}.`);
  }

  if (gaps.total_missing_days > 0) {
    parts.push("В окне есть пропуски записей.");
  }

  if (parts.length === 0) {
    return "Выраженных паттернов в окне не видно.";
  }

  if (flags.low_density) {
    parts.unshift("Плотность валидных сигналов снижена.");
  }

  return parts.join(" ");
}

function describeMarkerObservation({
  topMarkers,
  recurrence,
}: Pick<ObservationInput, "top_markers" | "recurrence"> & {
  topMarkers?: CountItem[];
}): string | null {
  const recurringMarker = recurrence?.markers?.[0];

  if (recurringMarker) {
    return `Чаще всего повторяется маркер: ${markerLabel(recurringMarker.name)}.`;
  }

  if (topMarkers?.[0]) {
    return `Отмечен маркер: ${markerLabel(topMarkers[0].name)}.`;
  }

  return null;
}
