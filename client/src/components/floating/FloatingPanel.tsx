import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
  type PointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  FLOATING_PANEL_BASE_Z_INDEX,
  type FloatingPanelId,
  type FloatingPanelOcclusion,
  type FloatingPanelPosition,
  type FloatingPanelRect,
} from "./FloatingLayerContext";
import { useFloatingLayer } from "./useFloatingLayer";

type FloatingPanelProps = {
  "aria-label": string;
  children: ReactNode;
  className?: string;
  defaultPosition?: FloatingPanelPosition;
  id: FloatingPanelId;
  isOpen: boolean;
  maxViewportInset?: number;
  occlusion?: FloatingPanelOcclusion;
  onClose?: () => void;
  storageKey?: string;
  style?: CSSProperties;
  testId?: string;
};

type DragState = {
  pointerId: number;
  startPointerX: number;
  startPointerY: number;
  startX: number;
  startY: number;
};

type PanelSize = {
  height: number;
  width: number;
};

const DEFAULT_PANEL_POSITION: FloatingPanelPosition = { x: 96, y: 96 };
const DEFAULT_VIEWPORT_INSET = 8;
const POSITION_STORAGE_PREFIX = "athena:floating-panel:";

const INTERACTIVE_SELECTOR = [
  "a",
  "button",
  "input",
  "label",
  "select",
  "textarea",
  "[contenteditable='true']",
  "[data-no-drag]",
  "[role='button']",
  "[role='checkbox']",
  "[role='combobox']",
  "[role='link']",
  "[role='menuitem']",
  "[role='option']",
  "[role='radio']",
  "[role='searchbox']",
  "[role='slider']",
  "[role='spinbutton']",
  "[role='switch']",
  "[role='textbox']",
].join(",");

export function FloatingPanel({
  "aria-label": ariaLabel,
  children,
  className,
  defaultPosition = DEFAULT_PANEL_POSITION,
  id,
  isOpen,
  maxViewportInset = DEFAULT_VIEWPORT_INSET,
  occlusion,
  onClose,
  storageKey,
  style,
  testId,
}: FloatingPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const rectAnimationFrameRef = useRef<number | null>(null);
  const { activatePanel, panelZIndexes, setPanelRect } = useFloatingLayer();
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<FloatingPanelPosition>(() =>
    getInitialPosition(id, defaultPosition, storageKey),
  );
  const positionRef = useRef(position);

  const resolvedStorageKey = useMemo(
    () => storageKey ?? `${POSITION_STORAGE_PREFIX}${id}`,
    [id, storageKey],
  );

  const defaultPositionX = defaultPosition.x;
  const defaultPositionY = defaultPosition.y;
  const zIndex = panelZIndexes[id] ?? FLOATING_PANEL_BASE_Z_INDEX;

  const setPanelPosition = useCallback((nextPosition: FloatingPanelPosition) => {
    positionRef.current = nextPosition;
    setPosition(nextPosition);
  }, []);

  const updatePanelRect = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const rect = panel.getBoundingClientRect();
    setPanelRect(id, toFloatingPanelRect(rect), occlusion);
  }, [id, occlusion, setPanelRect]);

  const schedulePanelRectUpdate = useCallback(() => {
    if (typeof requestAnimationFrame === "undefined") {
      updatePanelRect();
      return;
    }

    if (rectAnimationFrameRef.current !== null) return;

    rectAnimationFrameRef.current = requestAnimationFrame(() => {
      rectAnimationFrameRef.current = null;
      updatePanelRect();
    });
  }, [updatePanelRect]);

  const clampAndStorePosition = useCallback(
    (nextPosition: FloatingPanelPosition) => {
      const panel = panelRef.current;
      const next = clampPosition(
        nextPosition,
        getPanelSize(panel),
        maxViewportInset,
      );

      setPanelPosition(next);
      writeStoredPosition(resolvedStorageKey, next);
      return next;
    },
    [maxViewportInset, resolvedStorageKey, setPanelPosition],
  );

  useLayoutEffect(() => {
    if (!isOpen) return;

    const nextDefaultPosition = {
      x: defaultPositionX,
      y: defaultPositionY,
    };
    const next = clampPosition(
      getInitialPosition(id, nextDefaultPosition, storageKey),
      getPanelSize(panelRef.current),
      maxViewportInset,
    );
    setPanelPosition(next);
    activatePanel(id);
  }, [
    activatePanel,
    defaultPositionX,
    defaultPositionY,
    id,
    isOpen,
    maxViewportInset,
    setPanelPosition,
    storageKey,
  ]);

  useLayoutEffect(() => {
    return () => {
      cancelPanelRectAnimationFrame(rectAnimationFrameRef);
      setPanelRect(id, null);
    };
  }, [id, setPanelRect]);

  useLayoutEffect(() => {
    if (!isOpen) {
      setPanelRect(id, null);
      return;
    }

    updatePanelRect();
  }, [id, isOpen, position, setPanelRect, updatePanelRect]);

  useEffect(() => {
    if (!isOpen) return;

    function handleResize() {
      clampAndStorePosition(positionRef.current);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      cancelPanelRectAnimationFrame(rectAnimationFrameRef);
      window.removeEventListener("resize", handleResize);
    };
  }, [clampAndStorePosition, isOpen]);

  useEffect(() => {
    if (!isOpen || !onClose) return;

    const closePanel = onClose;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closePanel();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;

    activatePanel(id);

    if (isInteractiveDragTarget(event.target)) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      pointerId: event.pointerId,
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      startX: positionRef.current.x,
      startY: positionRef.current.y,
    };
    setIsDragging(true);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    const nextPosition = clampPosition(
      {
        x: dragState.startX + event.clientX - dragState.startPointerX,
        y: dragState.startY + event.clientY - dragState.startPointerY,
      },
      getPanelSize(panelRef.current),
      maxViewportInset,
    );

    setPanelPosition(nextPosition);
    schedulePanelRectUpdate();
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    dragStateRef.current = null;
    setIsDragging(false);
    releasePointerCapture(event.currentTarget, event.pointerId);
    clampAndStorePosition(positionRef.current);
  }

  function handlePointerCancel(event: PointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    dragStateRef.current = null;
    setIsDragging(false);
    releasePointerCapture(event.currentTarget, event.pointerId);
    clampAndStorePosition(positionRef.current);
  }

  return createPortal(
    <div
      aria-label={ariaLabel}
      aria-modal="false"
      className={className}
      data-floating-panel={id}
      data-floating-panel-dragging={isDragging ? "true" : undefined}
      data-floating-panel-occlusion={occlusion}
      data-testid={testId}
      onPointerCancel={handlePointerCancel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      ref={panelRef}
      role="dialog"
      style={{
        ...style,
        left: 0,
        position: "fixed",
        top: 0,
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        touchAction: isDragging ? "none" : style?.touchAction,
        userSelect: isDragging ? "none" : style?.userSelect,
        zIndex,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

function getInitialPosition(
  id: FloatingPanelId,
  defaultPosition: FloatingPanelPosition,
  storageKey?: string,
) {
  return (
    readStoredPosition(storageKey ?? `${POSITION_STORAGE_PREFIX}${id}`) ??
    defaultPosition
  );
}

function isInteractiveDragTarget(target: EventTarget) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest(INTERACTIVE_SELECTOR));
}

function getPanelSize(panel: HTMLDivElement | null): PanelSize {
  if (!panel) return { height: 0, width: 0 };

  const rect = panel.getBoundingClientRect();
  return {
    height: rect.height,
    width: rect.width,
  };
}

function clampPosition(
  position: FloatingPanelPosition,
  panelSize: PanelSize,
  viewportInset: number,
): FloatingPanelPosition {
  if (typeof window === "undefined") return position;

  const maxX = Math.max(
    viewportInset,
    window.innerWidth - panelSize.width - viewportInset,
  );
  const maxY = Math.max(
    viewportInset,
    window.innerHeight - panelSize.height - viewportInset,
  );

  return {
    x: clamp(position.x, viewportInset, maxX),
    y: clamp(position.y, viewportInset, maxY),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function releasePointerCapture(element: HTMLDivElement, pointerId: number) {
  if (element.hasPointerCapture(pointerId)) {
    element.releasePointerCapture(pointerId);
  }
}

function cancelPanelRectAnimationFrame(
  animationFrameRef: MutableRefObject<number | null>,
) {
  if (animationFrameRef.current === null) return;

  cancelAnimationFrame(animationFrameRef.current);
  animationFrameRef.current = null;
}

function readStoredPosition(storageKey: string) {
  if (typeof localStorage === "undefined") return null;

  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<FloatingPanelPosition>;
    if (typeof parsed.x !== "number" || typeof parsed.y !== "number") {
      return null;
    }

    return {
      x: parsed.x,
      y: parsed.y,
    };
  } catch {
    return null;
  }
}

function writeStoredPosition(
  storageKey: string,
  position: FloatingPanelPosition,
) {
  if (typeof localStorage === "undefined") return;

  try {
    localStorage.setItem(storageKey, JSON.stringify(position));
  } catch {
    // Position persistence is only a convenience; storage failures should not
    // block the window from moving.
  }
}

function toFloatingPanelRect(rect: DOMRect): FloatingPanelRect {
  return {
    height: rect.height,
    width: rect.width,
    x: rect.left,
    y: rect.top,
  };
}
