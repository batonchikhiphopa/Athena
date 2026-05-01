export const MARKERS = [
  "deadline_pressure",
  "context_switching",
  "deep_work",
  "admin_work",
  "creative_work",
  "late_night_ideas",
  "social_interaction",
  "conflict",
  "uncertainty",
  "health",
  "health_issue",
  "sleep",
  "sleep_issue",
  "exercise",
  "learning",
  "recovery",
  "recovery_need",
  "travel",
];

export const MARKER_LABELS = {
  deadline_pressure: "давление сроков",
  context_switching: "переключение контекста",
  deep_work: "глубокая работа",
  admin_work: "административная работа",
  creative_work: "творческая работа",
  late_night_ideas: "ночные идеи",
  social_interaction: "социальное взаимодействие",
  conflict: "конфликт",
  uncertainty: "неопределенность",
  health: "самочувствие",
  health_issue: "проблема самочувствия",
  sleep: "сон",
  sleep_issue: "нарушение сна",
  exercise: "физическая активность",
  learning: "обучение",
  recovery: "восстановление",
  recovery_need: "потребность в восстановлении",
  travel: "поездки",
};

const MARKER_PRIORITIES = {
  sleep_issue: 100,
  health_issue: 95,
  recovery_need: 80,
  deadline_pressure: 70,
  conflict: 65,
  uncertainty: 60,
  context_switching: 55,
  late_night_ideas: 50,
};

export function markerLabel(marker) {
  return MARKER_LABELS[marker] ?? marker;
}

export function markerPriority(marker) {
  return MARKER_PRIORITIES[marker] ?? 0;
}
