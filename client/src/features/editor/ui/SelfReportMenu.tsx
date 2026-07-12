import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import {
  DEFAULT_SELF_REPORT_VALUES,
  type SelfReportAxis,
  type SelfReportValues,
} from "../../selfReports/selfReportTypes";
import { useI18n } from "../../../i18n/useI18n";
import type { MessageKey } from "../../../i18n/messages";
import {
  FloatingPanel,
  type FloatingPanelPosition,
} from "../../../components/floating";
import { TooltipButton } from "../../../components/TooltipButton";
import { LineLever } from "./LineLever";

type SelfReportAxisView = {
  key: SelfReportAxis;
};

type SelfReportMenuProps = {
  externalCloseSignal: number;
  isOpen: boolean;
  values: SelfReportValues;
  onCommit: (values: SelfReportValues) => void;
  onClose: () => void;
};

const axes: SelfReportAxisView[] = [
  { key: "mood" },
  { key: "stress" },
  { key: "energy" },
  { key: "sleep_quality" },
  { key: "function" },
];

const AXIS_COLUMN_WIDTH_REM = 4.75;
const AXIS_GRID_GAP_REM = 0.625;
const MENU_HORIZONTAL_PADDING_REM = 3.5;
const MENU_VIEWPORT_GUTTER_REM = 2;
const SELF_REPORT_DEFAULT_TOP_PX = 96;
const SELF_REPORT_DEFAULT_RIGHT_PX = 80;

const selfReportMenuWidthRem =
  axes.length * AXIS_COLUMN_WIDTH_REM +
  Math.max(0, axes.length - 1) * AXIS_GRID_GAP_REM +
  MENU_HORIZONTAL_PADDING_REM;

const selfReportMenuStyle = {
  "--self-report-axis-column-width": `${AXIS_COLUMN_WIDTH_REM}rem`,
  width: `min(${selfReportMenuWidthRem}rem, calc(100vw - ${MENU_VIEWPORT_GUTTER_REM}rem))`,
} as CSSProperties;

const axisLabelKeys = {
  energy: "editor.selfReport.axis.energy",
  function: "editor.selfReport.axis.function",
  mood: "editor.selfReport.axis.mood",
  sleep_quality: "editor.selfReport.axis.sleep_quality",
  stress: "editor.selfReport.axis.stress",
} satisfies Record<SelfReportAxis, MessageKey>;

export function SelfReportMenu({
  externalCloseSignal,
  isOpen,
  values: savedValues,
  onCommit,
  onClose,
}: SelfReportMenuProps) {
  const { t } = useI18n();
  const lastExternalCloseSignalRef = useRef(externalCloseSignal);
  const [values, setValues] = useState<SelfReportValues>(
    savedValues ?? DEFAULT_SELF_REPORT_VALUES,
  );
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setValues(savedValues);
    setHasInteracted(false);
  }, [isOpen, savedValues]);

  const closePanel = useCallback(() => {
    if (hasInteracted) {
      onCommit(values);
      setHasInteracted(false);
    }

    onClose();
  }, [hasInteracted, onClose, onCommit, values]);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest('[data-floating-panel="self-report"]')
      ) {
        return;
      }

      closePanel();
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [closePanel, isOpen]);

  useEffect(() => {
    if (externalCloseSignal === lastExternalCloseSignalRef.current) return;
    lastExternalCloseSignalRef.current = externalCloseSignal;
    if (isOpen) closePanel();
  }, [closePanel, externalCloseSignal, isOpen]);

  function setAxisValue(axis: SelfReportAxisView, value: number) {
    setHasInteracted(true);
    setValues((current) => ({
      ...current,
      [axis.key]: value,
    }));
  }

  return (
    <FloatingPanel
      aria-label={t("editor.action.selfReport")}
      className="
        max-h-[calc(100vh-4rem)] overflow-y-auto
        rounded-2xl border border-white/20 bg-white/25 backdrop-blur-[2px]
        px-7 pb-4 pt-7 text-zinc-500
      "
      defaultPosition={getSelfReportDefaultPosition()}
      id="self-report"
      isOpen={isOpen}
      occlusion="editor-text"
      onClose={closePanel}
      style={selfReportMenuStyle}
      testId="self-report-menu"
    >
      <TooltipButton
        aria-label={t("common.close")}
        className="
          absolute right-2 top-2 flex h-6 w-6 items-center justify-center
          rounded-full text-sm leading-none text-zinc-300 transition
          hover:bg-zinc-100 hover:text-zinc-700
        "
        onClick={closePanel}
        tooltip={t("common.close")}
        tooltipPlacement="left"
        type="button"
      >
        <span className="translate-y-[-1px]">×</span>
      </TooltipButton>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(var(--self-report-axis-column-width),1fr))] items-end gap-x-2.5 gap-y-5">
        {axes.map((axis) => (
          <label className="grid min-w-0 justify-items-center gap-3" key={axis.key}>
            <LineLever
              label={t(axisLabelKeys[axis.key])}
              testId={`self-report-slider-${axis.key}`}
              value={values[axis.key] ?? 5}
              onChange={(value) => setAxisValue(axis, value)}
            />
            <span className="max-w-[4.75rem] truncate text-center text-[10px] text-zinc-400">
              {t(axisLabelKeys[axis.key])}
            </span>
          </label>
        ))}
      </div>
    </FloatingPanel>
  );
}

function getSelfReportDefaultPosition(): FloatingPanelPosition {
  if (typeof window === "undefined") {
    return {
      x: SELF_REPORT_DEFAULT_RIGHT_PX,
      y: SELF_REPORT_DEFAULT_TOP_PX,
    };
  }

  const rootFontSize = Number.parseFloat(
    window.getComputedStyle(document.documentElement).fontSize,
  );
  const remPx = Number.isFinite(rootFontSize) ? rootFontSize : 16;
  const menuWidthPx = Math.min(
    selfReportMenuWidthRem * remPx,
    window.innerWidth - MENU_VIEWPORT_GUTTER_REM * remPx,
  );

  return {
    x: Math.max(
      MENU_VIEWPORT_GUTTER_REM * remPx,
      window.innerWidth - menuWidthPx - SELF_REPORT_DEFAULT_RIGHT_PX,
    ),
    y: SELF_REPORT_DEFAULT_TOP_PX,
  };
}
