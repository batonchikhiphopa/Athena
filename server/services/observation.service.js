export const OBSERVATION_PROMPT_CONTRACT = [
  "Use only aggregate analytics input.",
  "Do not read raw diary text.",
  "Write one short dry observation.",
  "Do not advise, motivate, coach, or infer causes.",
  "If density is low, say that the observation is unstable.",
].join("\n");

export function generateObservation(input) {
  const { metrics, flags, gaps, top_topics: topTopics, recurrence } = input;

  if (!metrics || metrics.finalized_entries === 0) {
    return "Недостаточно данных для наблюдения.";
  }

  if (metrics.density < 0.25 || metrics.valid_entries < 2) {
    return "Плотность валидных сигналов низкая; устойчивых паттернов не видно.";
  }

  const parts = [];

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
