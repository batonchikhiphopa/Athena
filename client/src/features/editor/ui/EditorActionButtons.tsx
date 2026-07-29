import { useEffect, useRef, useState } from "react";
import type { SelfReportValues } from "../../selfReports/selfReportTypes";
import { useI18n } from "../../../i18n/useI18n";
import { EyeClosedIcon, EyeOpenIcon, HeartIcon } from "../../../components/icon";
import { TooltipButton } from "../../../components/TooltipButton";
import { SelfReportMenu } from "./SelfReportMenu";
import { ActivityEventMenu } from "../../entries/ui/ActivityEventMenu";
import { PickaxeIcon } from "../../entries/ui/entryUiHelpers";
import type { ActivityContextEvent } from "../../../shared/contracts";
import { getResultsCorrectionCopy } from "../../results/resultsCorrectionCopy";

type EditorActionButtonsProps = {
  analysisEnabled: boolean;
  entryEvent: ActivityContextEvent;
  selfReportCloseSignal: number;
  selfReportValues: SelfReportValues;
  onInsertTag: () => void;
  onEntryEventCommit: (event: ActivityContextEvent) => void;
  onSelfReportCommit: (values: SelfReportValues) => void;
  onNewBlankPage: () => void;
  onToggleAnalysisEnabled: () => void;
};

export function EditorActionButtons({
  analysisEnabled,
  entryEvent,
  selfReportCloseSignal,
  selfReportValues,
  onInsertTag,
  onEntryEventCommit,
  onSelfReportCommit,
  onNewBlankPage,
  onToggleAnalysisEnabled,
}: EditorActionButtonsProps) {
  const { language, t } = useI18n();
  const activityEventCopy = getResultsCorrectionCopy(language);
  const [isSelfReportMenuOpen, setIsSelfReportMenuOpen] = useState(false);
  const [isEventMenuOpen, setIsEventMenuOpen] = useState(false);
  const [isPickaxeSwinging, setIsPickaxeSwinging] = useState(false);
  const [isHeartPulsing, setIsHeartPulsing] = useState(false);
  const [heartPulseKey, setHeartPulseKey] = useState(0);
  const menuTimerRef = useRef<number | null>(null);
  const pickaxeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (menuTimerRef.current !== null) {
        window.clearTimeout(menuTimerRef.current);
      }
      if (pickaxeTimerRef.current !== null) {
        window.clearTimeout(pickaxeTimerRef.current);
      }
    };
  }, []);

  function handleSelfReportClick() {
    if (menuTimerRef.current !== null) {
      window.clearTimeout(menuTimerRef.current);
    }

    setIsSelfReportMenuOpen(false);
    setIsHeartPulsing(true);
    setHeartPulseKey((current) => current + 1);

    menuTimerRef.current = window.setTimeout(() => {
      setIsSelfReportMenuOpen(true);
      menuTimerRef.current = null;
    }, 560);
  }

  function handlePickaxeClick() {
    if (pickaxeTimerRef.current !== null) {
      window.clearTimeout(pickaxeTimerRef.current);
    }

    setIsEventMenuOpen(false);
    setIsPickaxeSwinging(true);
    pickaxeTimerRef.current = window.setTimeout(() => {
      setIsEventMenuOpen(true);
      pickaxeTimerRef.current = null;
    }, 360);
  }

  const analysisTooltip = analysisEnabled
    ? t("editor.action.analysisDisable")
    : t("editor.action.analysisEnable");

  return (
    <>
      <TooltipButton
        aria-label={t("editor.action.addTag")}
        className="
          absolute top-1 right-[8rem] z-20
          h-6 w-6 flex items-center justify-center
          rounded-full

          text-[14px] leading-none
          text-zinc-400
          hover:text-zinc-700
          hover:bg-zinc-200/40

          opacity-70 hover:opacity-100
          transition
        "
        data-testid="editor-add-tag"
        onClick={onInsertTag}
        tooltip={t("editor.action.addTag")}
        tooltipPlacement="left"
        type="button"
      >
        #
      </TooltipButton>

      <TooltipButton
        aria-label={analysisTooltip}
        aria-pressed={analysisEnabled}
        className="
          absolute top-1 right-[6rem] z-20
          h-6 w-6 flex items-center justify-center
          rounded-full

          text-zinc-400
          hover:text-zinc-700
          hover:bg-zinc-200/40

          opacity-70 hover:opacity-100
          transition
        "
        onClick={onToggleAnalysisEnabled}
        tooltip={analysisTooltip}
        tooltipPlacement="left"
        type="button"
      >
        {analysisEnabled ? <EyeOpenIcon /> : <EyeClosedIcon />}
      </TooltipButton>

      <TooltipButton
        aria-label={t("editor.action.selfReport")}
        aria-expanded={isSelfReportMenuOpen}
        className="
          absolute top-1 right-[4rem] z-20
          h-6 w-6 flex items-center justify-center
          rounded-full

          text-zinc-400
          hover:text-rose-500
          hover:bg-rose-50

          opacity-70 hover:opacity-100
          transition
        "
        data-testid="editor-self-report"
        onClick={handleSelfReportClick}
        tooltip={t("editor.action.selfReport")}
        tooltipPlacement="left"
        type="button"
      >
        <span
          className={isHeartPulsing ? "heart-double-pulse" : ""}
          key={heartPulseKey}
          onAnimationEnd={() => setIsHeartPulsing(false)}
        >
          <HeartIcon />
        </span>
      </TooltipButton>

      <TooltipButton
        aria-label={activityEventCopy.chooseEpisodeEvent}
        aria-expanded={isEventMenuOpen}
        className="
          absolute top-1 right-10 z-20
          h-6 w-6 flex items-center justify-center
          rounded-full text-zinc-400
          hover:text-zinc-700 hover:bg-zinc-200/40
          opacity-70 hover:opacity-100 transition
        "
        onClick={handlePickaxeClick}
        tooltip={activityEventCopy.event}
        tooltipPlacement="left"
        type="button"
      >
        <span
          className={isPickaxeSwinging ? "pickaxe-swing" : ""}
          onAnimationEnd={() => setIsPickaxeSwinging(false)}
        >
          <PickaxeIcon />
        </span>
      </TooltipButton>

      <TooltipButton
        aria-label={t("editor.action.newEntry")}
        className="
          absolute top-1 right-2 z-20
          h-6 w-6 flex items-center justify-center
          rounded-full

          text-[14px] leading-none
          text-zinc-400
          hover:text-zinc-700
          hover:bg-zinc-200/40

          opacity-70 hover:opacity-100
          transition
        "
        onClick={onNewBlankPage}
        tooltip={t("editor.action.newEntry")}
        tooltipPlacement="left"
        type="button"
      >
        <span className="translate-y-[-2px]">×</span>
      </TooltipButton>

      <SelfReportMenu
        externalCloseSignal={selfReportCloseSignal}
        isOpen={isSelfReportMenuOpen}
        values={selfReportValues}
        onCommit={onSelfReportCommit}
        onClose={() => setIsSelfReportMenuOpen(false)}
      />
      {isEventMenuOpen && (
        <ActivityEventMenu
          isOpen={isEventMenuOpen}
          value={entryEvent}
          onClose={() => setIsEventMenuOpen(false)}
          onCommit={onEntryEventCommit}
        />
      )}
    </>
  );
}
