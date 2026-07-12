import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
} from "react";

export type DebugTooltipPosition = {
  left: number;
  maxHeight: number;
  top: number;
  width: number;
};

export type DebugTooltipStatus = "idle" | "open" | "waiting";

const DEBUG_TOOLTIP_DELAY_MS = 720;
const DEBUG_TOOLTIP_CLOSE_DELAY_MS = 140;
const DEBUG_TOOLTIP_WIDTH = 380;
const DEBUG_TOOLTIP_MAX_HEIGHT = 420;
const VIEWPORT_GAP = 12;
const ANCHOR_GAP = 10;

export function useEntryDebugTooltip({ enabled }: { enabled: boolean }) {
  const anchorRef = useRef<HTMLElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const openTimerRef = useRef<number | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<DebugTooltipPosition | null>(null);
  const [status, setStatus] = useState<DebugTooltipStatus>("idle");

  const clearOpenTimer = useCallback(() => {
    if (openTimerRef.current === null) return;
    window.clearTimeout(openTimerRef.current);
    openTimerRef.current = null;
  }, []);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current === null) return;
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  }, []);

  const closeNow = useCallback(() => {
    clearOpenTimer();
    clearCloseTimer();
    setPosition(null);
    setStatus("idle");
  }, [clearCloseTimer, clearOpenTimer]);

  const updatePosition = useCallback(() => {
    const nextPosition = getDebugTooltipPosition(anchorRef.current);
    setPosition(nextPosition);
    return nextPosition;
  }, []);

  const openNow = useCallback(() => {
    if (!enabled) return;
    if (!updatePosition()) return;
    setStatus("open");
  }, [enabled, updatePosition]);

  const start = useCallback(() => {
    if (!enabled) return;

    clearCloseTimer();
    if (status === "open" || status === "waiting") return;

    setStatus("waiting");
    openTimerRef.current = window.setTimeout(() => {
      openTimerRef.current = null;
      openNow();
    }, DEBUG_TOOLTIP_DELAY_MS);
  }, [clearCloseTimer, enabled, openNow, status]);

  const closeSoon = useCallback(() => {
    clearOpenTimer();
    if (status === "idle") return;
    if (closeTimerRef.current !== null) return;

    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      closeNow();
    }, DEBUG_TOOLTIP_CLOSE_DELAY_MS);
  }, [clearOpenTimer, closeNow, status]);

  const cancelClose = useCallback(() => {
    clearCloseTimer();
  }, [clearCloseTimer]);

  useEffect(() => closeNow, [closeNow]);

  useEffect(() => {
    if (!enabled) closeNow();
  }, [closeNow, enabled]);

  useEffect(() => {
    if (status !== "open") return;

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [status, updatePosition]);

  function handleAnchorPointerEnter() {
    start();
  }

  function handleAnchorPointerLeave() {
    closeSoon();
  }

  function handleAnchorFocus() {
    start();
  }

  function handleAnchorBlur(event: FocusEvent<HTMLElement>) {
    if (isMovingWithinDebugSurface(event.relatedTarget)) return;
    closeSoon();
  }

  function handleTooltipPointerEnter() {
    cancelClose();
  }

  function handleTooltipPointerLeave() {
    closeSoon();
  }

  function handleTooltipFocus() {
    cancelClose();
  }

  function handleTooltipBlur(event: FocusEvent<HTMLDivElement>) {
    if (isMovingWithinDebugSurface(event.relatedTarget)) return;
    closeSoon();
  }

  function isMovingWithinDebugSurface(target: EventTarget | null) {
    if (!(target instanceof Node)) return false;

    return Boolean(
      anchorRef.current?.contains(target) || tooltipRef.current?.contains(target),
    );
  }

  return {
    anchorRef,
    isWaiting: enabled && status === "waiting",
    onAnchorBlur: handleAnchorBlur,
    onAnchorFocus: handleAnchorFocus,
    onAnchorPointerEnter: handleAnchorPointerEnter,
    onAnchorPointerLeave: handleAnchorPointerLeave,
    onTooltipBlur: handleTooltipBlur,
    onTooltipFocus: handleTooltipFocus,
    onTooltipPointerEnter: handleTooltipPointerEnter,
    onTooltipPointerLeave: handleTooltipPointerLeave,
    position,
    status,
    tooltipRef,
  };
}

function getDebugTooltipPosition(
  anchor: HTMLElement | null,
): DebugTooltipPosition | null {
  if (!anchor || typeof window === "undefined") return null;

  const rect = anchor.getBoundingClientRect();
  const width = Math.min(DEBUG_TOOLTIP_WIDTH, window.innerWidth - VIEWPORT_GAP * 2);
  const maxHeight = Math.min(
    DEBUG_TOOLTIP_MAX_HEIGHT,
    window.innerHeight - VIEWPORT_GAP * 2,
  );
  const preferredRight = rect.right + ANCHOR_GAP;
  const preferredLeft = rect.left - width - ANCHOR_GAP;
  const left =
    preferredRight + width <= window.innerWidth - VIEWPORT_GAP
      ? preferredRight
      : preferredLeft >= VIEWPORT_GAP
        ? preferredLeft
        : window.innerWidth - width - VIEWPORT_GAP;

  return {
    left: clamp(left, VIEWPORT_GAP, window.innerWidth - width - VIEWPORT_GAP),
    maxHeight,
    top: clamp(
      rect.top,
      VIEWPORT_GAP,
      window.innerHeight - maxHeight - VIEWPORT_GAP,
    ),
    width,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
