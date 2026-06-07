import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type FocusEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { createPortal } from "react-dom";

type TooltipPlacement = "bottom" | "left" | "right" | "top";

type TooltipPosition = {
  left: number;
  placement: TooltipPlacement;
  top: number;
};

type TooltipButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tooltip: string;
  tooltipPlacement?: TooltipPlacement;
};

const TOOLTIP_LIFETIME_MS = 2800;
const TOOLTIP_SHOW_DELAY_MS = 720;
const EDGE_GAP = 3;
const SIDE_GAP = 3;
const TOP_RAIL = 34;

export function TooltipButton({
  onBlur,
  onClick,
  onFocus,
  onPointerEnter,
  onPointerLeave,
  tooltip,
  tooltipPlacement = "top",
  ...props
}: TooltipButtonProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const showTimerRef = useRef<number | null>(null);
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  const clearShowTimer = useCallback(() => {
    if (showTimerRef.current === null) return;
    window.clearTimeout(showTimerRef.current);
    showTimerRef.current = null;
  }, []);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current === null) return;
    window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = null;
  }, []);

  const hideTooltip = useCallback(() => {
    clearShowTimer();
    clearHideTimer();
    setPosition(null);
  }, [clearHideTimer, clearShowTimer]);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      setPosition(null);
      hideTimerRef.current = null;
    }, TOOLTIP_LIFETIME_MS);
  }, [clearHideTimer]);

  const showTooltipNow = useCallback(() => {
    if (!tooltip) return;
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    setPosition(getTooltipPosition(rect, tooltipPlacement));
    scheduleHide();
  }, [scheduleHide, tooltip, tooltipPlacement]);

  const scheduleShow = useCallback(() => {
    clearShowTimer();
    clearHideTimer();

    showTimerRef.current = window.setTimeout(() => {
      showTimerRef.current = null;
      showTooltipNow();
    }, TOOLTIP_SHOW_DELAY_MS);
  }, [clearHideTimer, clearShowTimer, showTooltipNow]);

  useEffect(() => hideTooltip, [hideTooltip]);

  useEffect(() => {
    if (!position) return;

    window.addEventListener("resize", hideTooltip);
    window.addEventListener("scroll", hideTooltip, true);

    return () => {
      window.removeEventListener("resize", hideTooltip);
      window.removeEventListener("scroll", hideTooltip, true);
    };
  }, [hideTooltip, position]);

  function handlePointerEnter(event: PointerEvent<HTMLButtonElement>) {
    onPointerEnter?.(event);
    scheduleShow();
  }

  function handlePointerLeave(event: PointerEvent<HTMLButtonElement>) {
    onPointerLeave?.(event);
    hideTooltip();
  }

  function handleFocus(event: FocusEvent<HTMLButtonElement>) {
    onFocus?.(event);
    scheduleShow();
  }

  function handleBlur(event: FocusEvent<HTMLButtonElement>) {
    onBlur?.(event);
    hideTooltip();
  }

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);
    hideTooltip();
  }

  return (
    <>
      <button
        {...props}
        ref={buttonRef}
        onBlur={handleBlur}
        onClick={handleClick}
        onFocus={handleFocus}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      />

      {position && typeof document !== "undefined"
        ? createPortal(
            <div
              className="athena-floating-tooltip"
              data-placement={position.placement}
              role="tooltip"
              style={{
                left: position.left,
                top: position.top,
              }}
            >
              {tooltip}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function getTooltipPosition(
  rect: DOMRect,
  placement: TooltipPlacement,
): TooltipPosition {
  const raisedTop = Math.max(TOP_RAIL, rect.top - EDGE_GAP);

  if (placement === "left") {
    return {
      left: rect.left - SIDE_GAP,
      placement,
      top: raisedTop,
    };
  }

  if (placement === "right") {
    return {
      left: rect.right + SIDE_GAP,
      placement,
      top: raisedTop,
    };
  }

  if (placement === "bottom") {
    return {
      left: rect.left + rect.width / 2,
      placement,
      top: rect.bottom + EDGE_GAP,
    };
  }

  return {
    left: rect.left + rect.width / 2,
    placement,
    top: raisedTop,
  };
}
