export function state(level = "medium", confidence = "medium", basis = ["test evidence"]) {
  return { level, confidence, basis };
}

export function metricConfidence(value = "medium") {
  return {
    load: value,
    fatigue: value,
    focus: value,
  };
}

export function validSignal(overrides = {}) {
  return {
    topics: ["работа"],
    activities: ["кодинг"],
    markers: ["deep_work"],
    state_inference: {
      load: state("medium"),
      fatigue: state("medium"),
      focus: state("medium"),
    },
    emotion_signals: {},
    metric_confidence: metricConfidence(),
    quality_reason: "test_signal",
    load: 5,
    fatigue: 5,
    focus: 5,
    signal_quality: "valid",
    ...overrides,
  };
}

export function sparseSignal(overrides = {}) {
  return {
    topics: ["работа"],
    activities: [],
    markers: [],
    state_inference: {},
    emotion_signals: {},
    metric_confidence: metricConfidence("low"),
    quality_reason: "text_context_only",
    load: null,
    fatigue: null,
    focus: null,
    signal_quality: "sparse",
    ...overrides,
  };
}

export function fallbackSignal(overrides = {}) {
  return {
    topics: [],
    activities: [],
    markers: [],
    state_inference: {},
    emotion_signals: {},
    metric_confidence: metricConfidence("low"),
    quality_reason: "fallback",
    load: null,
    fatigue: null,
    focus: null,
    signal_quality: "fallback",
    ...overrides,
  };
}
