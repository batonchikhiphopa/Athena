import { useEffect, useRef, useState } from "react";
import type { SelfReportValues } from "../../features/selfReports/selfReportTypes";
import { useI18n } from "../../i18n/useI18n";
import { EyeClosedIcon, EyeOpenIcon, HeartIcon } from "../icon";
import { SelfReportMenu } from "./SelfReportMenu";

type EditorActionButtonsProps = {
  analysisEnabled: boolean;
  selfReportCloseSignal: number;
  selfReportValues: SelfReportValues;
  onInsertTag: () => void;
  onSelfReportCommit: (values: SelfReportValues) => void;
  onNewBlankPage: () => void;
  onToggleAnalysisEnabled: () => void;
};

export function EditorActionButtons({
  analysisEnabled,
  selfReportCloseSignal,
  selfReportValues,
  onInsertTag,
  onSelfReportCommit,
  onNewBlankPage,
  onToggleAnalysisEnabled,
}: EditorActionButtonsProps) {
  const { t } = useI18n();
  const [isSelfReportMenuOpen, setIsSelfReportMenuOpen] = useState(false);
  const [isHeartPulsing, setIsHeartPulsing] = useState(false);
  const [heartPulseKey, setHeartPulseKey] = useState(0);
  const menuTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (menuTimerRef.current !== null) {
        window.clearTimeout(menuTimerRef.current);
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

  return (
    <>
      <button
        aria-label={t("editor.action.addTag")}
        onClick={onInsertTag}
        type="button"
        className="
          absolute top-1 right-[6.5rem] z-20
          h-6 w-6 flex items-center justify-center
          rounded-full

          text-[14px] leading-none
          text-zinc-400
          hover:text-zinc-700
          hover:bg-zinc-200/40

          opacity-70 hover:opacity-100
          transition
        "
      >
        #
      </button>

      <button
        aria-label={
          analysisEnabled
            ? t("editor.action.analysisDisable")
            : t("editor.action.analysisEnable")
        }
        aria-pressed={analysisEnabled}
        onClick={onToggleAnalysisEnabled}
        type="button"
        className="
          absolute top-1 right-[4.5rem] z-20
          h-6 w-6 flex items-center justify-center
          rounded-full

          text-zinc-400
          hover:text-zinc-700
          hover:bg-zinc-200/40

          opacity-70 hover:opacity-100
          transition
        "
      >
        {analysisEnabled ? <EyeOpenIcon /> : <EyeClosedIcon />}
      </button>

      <button
        aria-label={t("editor.action.selfReport")}
        aria-expanded={isSelfReportMenuOpen}
        onClick={handleSelfReportClick}
        type="button"
        className="
          absolute top-1 right-10 z-20
          h-6 w-6 flex items-center justify-center
          rounded-full

          text-zinc-400
          hover:text-rose-500
          hover:bg-rose-50

          opacity-70 hover:opacity-100
          transition
        "
      >
        <span
          className={isHeartPulsing ? "heart-double-pulse" : ""}
          key={heartPulseKey}
          onAnimationEnd={() => setIsHeartPulsing(false)}
        >
          <HeartIcon />
        </span>
      </button>

      <button
        aria-label={t("editor.action.newEntry")}
        onClick={onNewBlankPage}
        type="button"
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
      >
        <span className="translate-y-[-2px]">×</span>
      </button>

      <SelfReportMenu
        externalCloseSignal={selfReportCloseSignal}
        isOpen={isSelfReportMenuOpen}
        values={selfReportValues}
        onCommit={onSelfReportCommit}
        onClose={() => setIsSelfReportMenuOpen(false)}
      />
    </>
  );
}
