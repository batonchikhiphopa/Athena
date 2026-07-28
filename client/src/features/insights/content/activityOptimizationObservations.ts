import type { Language } from "../../../i18n/languages";
import type { ResultsEntity } from "../../results/resultsCorrections";
import type { ActivityGroup } from "../../results/resultsTypes";

export type ActivityOptimizationObservation = {
  facts: string;
  id: string;
  recommendation: string;
  title: string;
};

// These are deliberately deterministic: a recommendation is shown only when
// it can name confirmed Results items and a concrete recorded condition.
export function buildActivityOptimizationObservations(
  activities: ActivityGroup[],
  entities: ResultsEntity[],
  language: Language,
): ActivityOptimizationObservation[] {
  const entityById = new Map(entities.map((entity) => [entity.id, entity]));
  const result: ActivityOptimizationObservation[] = [];

  for (const [direction, members] of groupByDirection(activities, entityById)) {
    if (members.length < 2) continue;
    const labels = members.map((activity) => activity.label).join(", ");
    result.push(directionObservation(direction, labels, language));
  }

  for (const activity of activities) {
    const entity = entityById.get(activity.id);
    if (entity?.trackingMode === "reduce") {
      result.push(reduceObservation(activity, language));
    }
  }

  for (const activity of activities) {
    const blockers = activity.mentions.filter(
      (mention) =>
        mention.marker === "blocker" ||
        mention.context?.event === "blocked" ||
        Boolean(mention.context?.blockers.length),
    ).length;
    if (blockers > 0) result.push(blockerObservation(activity, blockers, language));
  }

  return result.slice(0, 3);
}

function groupByDirection(
  activities: ActivityGroup[],
  entityById: Map<string, ResultsEntity>,
) {
  const groups = new Map<string, ActivityGroup[]>();
  for (const activity of activities) {
    const entity = entityById.get(activity.id);
    if (!entity?.direction || entity.trackingMode === "reduce") continue;
    groups.set(entity.direction, [...(groups.get(entity.direction) ?? []), activity]);
  }
  return groups;
}

function directionObservation(direction: string, labels: string, language: Language) {
  if (language === "ru") {
    return {
      facts: `В направлении «${direction}» подтверждены действия: ${labels}.`,
      id: `direction:${direction}`,
      recommendation: "Проверяемый эксперимент: собери их в один короткий блок в нужном порядке и в следующей записи отметь, помогла ли связка продолжить дело.",
      title: `Как упростить «${direction}»`,
    };
  }
  return {
    facts: `Confirmed actions in “${direction}”: ${labels}.`,
    id: `direction:${direction}`,
    recommendation: "Try one short sequence in a chosen order, then note in the next entry whether the combination helped you continue.",
    title: `Make “${direction}” easier`,
  };
}

function reduceObservation(activity: ActivityGroup, language: Language) {
  const facts = language === "ru"
    ? `«${activity.label}» отмечено как то, что хочется сократить. Подтверждённых эпизодов: ${activity.mentions.length}.`
    : `“${activity.label}” is marked for reduction. Confirmed episodes: ${activity.mentions.length}.`;
  return {
    facts,
    id: `reduce:${activity.id}`,
    recommendation: language === "ru"
      ? "Вместо общего запрета задай одно измеримое правило до следующего эпизода: время остановки, лимит длительности или действие, которое делается раньше. Потом проверь именно это правило."
      : "Instead of a blanket ban, set one measurable boundary before the next episode: a stop time, duration limit, or a first action to do beforehand. Then review that boundary.",
    title: language === "ru" ? `Сократить «${activity.label}»` : `Reduce “${activity.label}”`,
  };
}

function blockerObservation(activity: ActivityGroup, blockers: number, language: Language) {
  return {
    facts: language === "ru"
      ? `Для «${activity.label}» зафиксировано препятствий: ${blockers}.`
      : `Recorded blockers for “${activity.label}”: ${blockers}.`,
    id: `blocker:${activity.id}`,
    recommendation: language === "ru"
      ? "Перед тем как оптимизировать весь процесс, выбери одно препятствие и подготовь обходной шаг, который можно проверить в следующем эпизоде."
      : "Before optimising the whole process, choose one blocker and prepare one workaround you can test in the next episode.",
    title: language === "ru" ? `Разблокировать «${activity.label}»` : `Unblock “${activity.label}”`,
  };
}
