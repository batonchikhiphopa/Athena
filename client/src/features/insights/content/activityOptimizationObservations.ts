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

  for (const activity of activities) {
    const children = activities.filter(
      (candidate) => entityById.get(candidate.id)?.parentId === activity.id,
    );
    if (children.length === 0) continue;
    result.push(parentObservation(activity, children, language));
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

function parentObservation(
  activity: ActivityGroup,
  children: ActivityGroup[],
  language: Language,
) {
  const labels = children.map((child) => child.label).join(", ");
  if (language === "ru") {
    return {
      facts: `У «${activity.label}» есть связанные дела: ${labels}.`,
      id: `parent:${activity.id}`,
      recommendation: "Проверь, помогает ли эта ветка главному делу: выбери один дочерний шаг, который действительно должен произойти до следующего продвижения родителя.",
      title: `Уточнить ветку «${activity.label}»`,
    };
  }
  if (language === "uk") {
    return {
      facts: `У «${activity.label}» є пов'язані справи: ${labels}.`,
      id: `parent:${activity.id}`,
      recommendation: "Перевір, чи ця гілка справді допомагає головній справі: вибери один дочірній крок, який має відбутися перед наступним просуванням батьківської справи.",
      title: `Уточнити гілку «${activity.label}»`,
    };
  }
  if (language === "de") {
    return {
      facts: `Verknüpfte Einträge unter „${activity.label}“: ${labels}.`,
      id: `parent:${activity.id}`,
      recommendation: "Prüfe, ob dieser Zweig dem Hauptvorhaben wirklich hilft: Wähle einen Kind-Schritt, der vor dem nächsten Fortschritt des Elternpunkts passieren muss.",
      title: `Zweig „${activity.label}“ klären`,
    };
  }
  return {
    facts: `Linked items under “${activity.label}”: ${labels}.`,
    id: `parent:${activity.id}`,
    recommendation: "Check whether this branch serves its parent: choose one child step that genuinely needs to happen before the parent's next progress.",
    title: `Clarify “${activity.label}” branch`,
  };
}

function blockerObservation(activity: ActivityGroup, blockers: number, language: Language) {
  if (language === "ru") {
    return {
      facts: `Для «${activity.label}» зафиксировано препятствий: ${blockers}.`,
      id: `blocker:${activity.id}`,
      recommendation: "Перед тем как оптимизировать весь процесс, выбери одно препятствие и подготовь обходной шаг, который можно проверить в следующем эпизоде.",
      title: `Разблокировать «${activity.label}»`,
    };
  }
  if (language === "uk") {
    return {
      facts: `Для «${activity.label}» зафіксовано перешкод: ${blockers}.`,
      id: `blocker:${activity.id}`,
      recommendation: "Перед тим як оптимізувати весь процес, вибери одну перешкоду й підготуй обхідний крок, який можна перевірити в наступному епізоді.",
      title: `Розблокувати «${activity.label}»`,
    };
  }
  if (language === "de") {
    return {
      facts: `Erfasste Hindernisse für „${activity.label}“: ${blockers}.`,
      id: `blocker:${activity.id}`,
      recommendation: "Bevor du den ganzen Prozess optimierst, wähle ein Hindernis und bereite einen Ausweichschritt vor, den du in der nächsten Episode prüfen kannst.",
      title: `„${activity.label}“ entblocken`,
    };
  }

  return {
    facts: `Recorded blockers for “${activity.label}”: ${blockers}.`,
    id: `blocker:${activity.id}`,
    recommendation: "Before optimising the whole process, choose one blocker and prepare one workaround you can test in the next episode.",
    title: `Unblock “${activity.label}”`,
  };
}
