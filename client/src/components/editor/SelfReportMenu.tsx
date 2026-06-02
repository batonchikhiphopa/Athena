import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_SELF_REPORT_VALUES,
  type SelfReportAxis,
  type SelfReportValues,
} from "../../features/selfReports/selfReportTypes";
import { useI18n } from "../../i18n/useI18n";
import type { MessageKey } from "../../i18n/messages";
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
  const menuRef = useRef<HTMLDivElement | null>(null);
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
      const menu = menuRef.current;
      if (!menu || menu.contains(event.target as Node)) return;
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

  if (!isOpen) return null;

  function setAxisValue(axis: SelfReportAxisView, value: number) {
    setHasInteracted(true);
    setValues((current) => ({
      ...current,
      [axis.key]: value,
    }));
  }

  return (
    <div
      ref={menuRef}
      className="
        absolute top-9 right-2 z-40
        w-[min(31rem,calc(100vw-2rem))]
        border border-zinc-200 bg-white px-7 pb-4 pt-7
        text-zinc-500 shadow-xl shadow-zinc-900/8
      "
    >
      <button
        aria-label={t("common.close")}
        className="
          absolute right-2 top-2 flex h-6 w-6 items-center justify-center
          rounded-full text-sm leading-none text-zinc-300 transition
          hover:bg-zinc-100 hover:text-zinc-700
        "
        onClick={closePanel}
        type="button"
      >
        <span className="translate-y-[-1px]">×</span>
      </button>

      <div className="grid grid-cols-5 items-end gap-2.5">
        {axes.map((axis) => (
          <label className="grid min-w-0 justify-items-center gap-3" key={axis.key}>
            <LineLever
              label={t(axisLabelKeys[axis.key])}
              value={values[axis.key]}
              onChange={(value) => setAxisValue(axis, value)}
            />
            <span className="max-w-[4.75rem] truncate text-center text-[10px] text-zinc-400">
              {t(axisLabelKeys[axis.key])}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
