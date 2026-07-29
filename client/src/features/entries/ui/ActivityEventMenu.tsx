import { useCallback, useEffect, useState } from "react";
import { ACTIVITY_CONTEXT_EVENTS } from "../../../shared/contracts";
import type { ActivityContextEvent } from "../../../shared/contracts";
import { TooltipButton } from "../../../components/TooltipButton";
import { FloatingPanel } from "../../../components/floating";
import { useI18n } from "../../../i18n/useI18n";
import { LineLever } from "../../editor/ui/LineLever";
import { getResultsCorrectionCopy } from "../../results/resultsCorrectionCopy";

const SELECTABLE_EVENTS = ACTIVITY_CONTEXT_EVENTS.filter(
  (event): event is Exclude<ActivityContextEvent, "unknown"> => event !== "unknown",
);

export function ActivityEventMenu({
  isOpen,
  value = "unknown",
  onClose,
  onCommit,
}: {
  isOpen: boolean;
  value?: ActivityContextEvent;
  onClose: () => void;
  onCommit: (event: ActivityContextEvent) => void;
}) {
  const { language, t } = useI18n();
  const copy = getResultsCorrectionCopy(language);
  const initialIndex = value === "unknown" ? 0 : SELECTABLE_EVENTS.indexOf(value);
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (isOpen) setIndex(initialIndex);
  }, [initialIndex, isOpen]);

  const closePanel = useCallback(() => {
    onCommit(SELECTABLE_EVENTS[index] ?? "unknown");
    onClose();
  }, [index, onClose, onCommit]);

  const event = SELECTABLE_EVENTS[index] ?? "unknown";
  const label = copy.eventLabel[event];

  return (
    <FloatingPanel
      aria-label={copy.event}
      className="rounded-2xl border border-white/20 bg-white/25 px-7 pb-5 pt-7 text-zinc-500 backdrop-blur-[2px]"
      defaultPosition={{ x: 80, y: 96 }}
      id="activity-event"
      isOpen={isOpen}
      occlusion="editor-text"
      onClose={closePanel}
      testId="activity-event-menu"
    >
      <TooltipButton
        aria-label={t("common.close")}
        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-sm leading-none text-zinc-300 transition hover:bg-zinc-100 hover:text-zinc-700"
        onClick={closePanel}
        tooltip={t("common.close")}
        tooltipPlacement="left"
        type="button"
      >
        <span className="translate-y-[-1px]">×</span>
      </TooltipButton>
      <label className="grid min-w-[4.75rem] justify-items-center gap-3">
        <span className="text-center text-xs font-medium text-zinc-700">{label}</span>
        <LineLever
          label={label}
          max={SELECTABLE_EVENTS.length - 1}
          value={index}
          onChange={setIndex}
        />
      </label>
    </FloatingPanel>
  );
}
