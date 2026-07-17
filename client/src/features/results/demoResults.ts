import type { Language } from "../../i18n/languages";
import {
  createActivityGroupFromMentions,
  detectMentionMarker,
} from "./activityAggregation";
import { normalizeActivityLabel } from "./activityCatalog";
import type {
  ActivityGroup,
  ActivityKind,
  ActivityMention,
} from "./resultsTypes";

type DemoActivity = {
  kind: ActivityKind;
  label: string;
  signals: Array<{
    fatigue: number;
    focus: number;
    load: number;
  }>;
  texts: string[];
};

export function createDemoActivities(language: Language): ActivityGroup[] {
  const today = new Date();

  return getDemoData(language).map((activity, activityIndex) => {
    const mentions: ActivityMention[] = activity.texts.map(
      (text, mentionIndex) => ({
        context: null,
        debugSignals: activity.signals[mentionIndex] ?? {
          fatigue: null,
          focus: null,
          load: null,
        },
        entryDate: dateOnly(
          new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - activityIndex * 2 - mentionIndex,
          ),
        ),
        entryId: null,
        marker: detectMentionMarker(text),
        sources: ["text"],
        text,
      }),
    );

    return createActivityGroupFromMentions({
      id: normalizeActivityLabel(activity.label),
      kind: activity.kind,
      label: activity.label,
      latestEntryDate: mentions[0].entryDate,
      mentions,
    });
  });
}

function getDemoData(language: Language): DemoActivity[] {
  if (language === "ru" || language === "uk") {
    return [
      {
        kind: "task",
        label: "Athena",
        signals: [
          { fatigue: 6, focus: 6, load: 7 },
          { fatigue: 5, focus: 7, load: 6 },
          { fatigue: 7, focus: 5, load: 8 },
          { fatigue: 4, focus: 7, load: 5 },
        ],
        texts: [
          "Разобрал навигацию Athena и убрал лишние уровни экрана.",
          "В Athena поправил сохранение записи перед переходом между вкладками.",
          "Проверил новый экран Athena на узком окне.",
          "Вернулся к Athena и упростил Results.",
        ],
      },
      {
        kind: "task",
        label: "Results",
        signals: [
          { fatigue: 6, focus: 5, load: 7 },
          { fatigue: 8, focus: 3, load: 8 },
          { fatigue: 5, focus: 7, load: 5 },
        ],
        texts: [
          "Собрал первую форму Results и проверил её на реальных сценариях.",
          "Переделал Results: карточки создавали слишком много бухгалтерии.",
          "Оставил в Results только повторяющиеся дела и исходные записи.",
        ],
      },
      {
        kind: "task",
        label: "Импорт",
        signals: [
          { fatigue: 8, focus: 3, load: 8 },
          { fatigue: 6, focus: 5, load: 7 },
        ],
        texts: [
          "Застрял на несовпадении старого формата импорта с новой схемой.",
          "Вернулся к импорту и проверил преобразование дат.",
        ],
      },
      {
        kind: "activity",
        label: "Письмо",
        signals: [
          { fatigue: 3, focus: 7, load: 3 },
          { fatigue: 4, focus: 6, load: 4 },
          { fatigue: 3, focus: 8, load: 3 },
        ],
        texts: [
          "Утром снова писал свободный текст без структуры.",
          "Писал заметки перед началом работы.",
          "Регулярно возвращаюсь к письму, когда нужно разобрать мысли.",
        ],
      },
    ];
  }

  return [
    {
      kind: "task",
      label: "Athena",
      signals: [
        { fatigue: 6, focus: 6, load: 7 },
        { fatigue: 5, focus: 7, load: 6 },
        { fatigue: 7, focus: 5, load: 8 },
        { fatigue: 4, focus: 7, load: 5 },
      ],
      texts: [
        "Reviewed Athena navigation and removed an unnecessary screen layer.",
        "Fixed entry persistence before navigating between Athena tabs.",
        "Checked the new Athena screen in a narrow window.",
        "Returned to Athena and simplified Results.",
      ],
    },
    {
      kind: "task",
      label: "Results",
      signals: [
        { fatigue: 6, focus: 5, load: 7 },
        { fatigue: 8, focus: 3, load: 8 },
        { fatigue: 5, focus: 7, load: 5 },
      ],
      texts: [
        "Built the first Results shape and checked it against real use.",
        "Reworked Results because the cards felt like bookkeeping.",
        "Kept only recurring activities and source entries in Results.",
      ],
    },
    {
      kind: "task",
      label: "Import",
      signals: [
        { fatigue: 8, focus: 3, load: 8 },
        { fatigue: 6, focus: 5, load: 7 },
      ],
      texts: [
        "Got stuck on a mismatch between the old import format and the new schema.",
        "Returned to import and verified date conversion.",
      ],
    },
    {
      kind: "activity",
      label: "Writing",
      signals: [
        { fatigue: 3, focus: 7, load: 3 },
        { fatigue: 4, focus: 6, load: 4 },
        { fatigue: 3, focus: 8, load: 3 },
      ],
      texts: [
        "Wrote freely in the morning without imposing a structure.",
        "Wrote notes before starting work.",
        "I regularly return to writing when I need to untangle thoughts.",
      ],
    },
  ];
}

function dateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
