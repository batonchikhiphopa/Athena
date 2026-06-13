import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
  type UIEvent,
} from "react";
import type { FloatingPanelRect } from "./FloatingLayerContext";
import { useFloatingOcclusions } from "./useFloatingLayer";

type FloatingTextOcclusionZone = {
  blurPx: number;
  insetPx: number;
  opacity: number;
  thicknessPx: number;
};

const TEXT_OCCLUSION_BLUR_ZONES: FloatingTextOcclusionZone[] = [
  { blurPx: 0.8, insetPx: 0, opacity: 0.3, thicknessPx: 22 },
  { blurPx: 1.8, insetPx: 20, opacity: 0.2, thicknessPx: 24 },
  { blurPx: 3.2, insetPx: 42, opacity: 0.12, thicknessPx: 28 },
  { blurPx: 5, insetPx: 68, opacity: 0.06, thicknessPx: 24 },
];

export function useFloatingTextOcclusion(
  targetRef: RefObject<HTMLTextAreaElement | null>,
) {
  const occlusions = useFloatingOcclusions("editor-text");
  const blurMirrorRefs = useRef<Array<HTMLTextAreaElement | null>>([]);
  const [targetRect, setTargetRect] = useState<FloatingPanelRect | null>(null);
  const [targetScrollTop, setTargetScrollTop] = useState(0);

  const occlusionRects = useMemo(
    () => occlusions.map((occlusion) => occlusion.rect),
    [occlusions],
  );

  const syncTargetRect = useCallback(() => {
    const target = targetRef.current;

    if (!target) {
      setTargetRect(null);
      return;
    }

    const nextRect = toFloatingPanelRect(target.getBoundingClientRect());
    setTargetScrollTop(target.scrollTop);
    setTargetRect((current) =>
      areSameFloatingPanelRect(current, nextRect) ? current : nextRect,
    );
  }, [targetRef]);

  useLayoutEffect(() => {
    syncTargetRect();
  }, [occlusionRects, syncTargetRect]);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    syncTargetRect();

    const handleViewportChange = () => {
      syncTargetRect();
    };

    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(handleViewportChange);

    observer?.observe(target);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [syncTargetRect, targetRef]);

  const textStyle = useMemo(
    () => getTextOcclusionStyle(targetRect, occlusionRects),
    [occlusionRects, targetRect],
  );
  const blurMirrorStyles = useMemo(
    () => getTextBlurMirrorStyles(targetRect, occlusionRects),
    [occlusionRects, targetRect],
  );

  useLayoutEffect(() => {
    for (const blurMirror of blurMirrorRefs.current) {
      if (blurMirror) {
        blurMirror.scrollTop = targetScrollTop;
      }
    }
  }, [targetScrollTop, blurMirrorStyles]);

  const handleTargetScroll = useCallback(
    (event: UIEvent<HTMLTextAreaElement>) => {
      setTargetScrollTop(event.currentTarget.scrollTop);
    },
    [],
  );

  const registerBlurMirror = useCallback(
    (index: number) => (node: HTMLTextAreaElement | null) => {
      blurMirrorRefs.current[index] = node;
    },
    [],
  );

  return {
    blurMirrorStyles,
    handleTargetScroll,
    registerBlurMirror,
    textStyle,
  };
}

function getTextOcclusionStyle(
  targetRect: FloatingPanelRect | null,
  occlusionRects: FloatingPanelRect[],
): CSSProperties | undefined {
  const intersections = getIntersectionRects(targetRect, occlusionRects);
  if (intersections.length === 0 || !targetRect) return undefined;

  const maskImage = [
    "linear-gradient(#000 0 0)",
    ...intersections.map(() => "linear-gradient(#000 0 0)"),
  ].join(", ");
  const maskPosition = [
    "0 0",
    ...intersections.map(
      (intersection) =>
        `${intersection.x - targetRect.x}px ${intersection.y - targetRect.y}px`,
    ),
  ].join(", ");
  const maskRepeat = ["no-repeat", ...intersections.map(() => "no-repeat")].join(
    ", ",
  );
  const maskSize = [
    "100% 100%",
    ...intersections.map(
      (intersection) => `${intersection.width}px ${intersection.height}px`,
    ),
  ].join(", ");
  const maskComposite = intersections.map(() => "exclude").join(", ");
  const webkitMaskComposite = intersections.map(() => "xor").join(", ");

  return {
    WebkitMaskComposite: webkitMaskComposite,
    WebkitMaskImage: maskImage,
    WebkitMaskPosition: maskPosition,
    WebkitMaskRepeat: maskRepeat,
    WebkitMaskSize: maskSize,
    maskComposite,
    maskImage,
    maskPosition,
    maskRepeat,
    maskSize,
  } as CSSProperties;
}

function getTextBlurMirrorStyles(
  targetRect: FloatingPanelRect | null,
  occlusionRects: FloatingPanelRect[],
): CSSProperties[] {
  const intersections = getIntersectionRects(targetRect, occlusionRects);
  if (!targetRect) return [];

  return intersections.flatMap((intersection) =>
    TEXT_OCCLUSION_BLUR_ZONES.flatMap((zone) => {
      const outerRect = getInsetRect(intersection, zone.insetPx);
      if (!outerRect) return [];

      const thickness = Math.min(
        zone.thicknessPx,
        outerRect.width / 2,
        outerRect.height / 2,
      );
      if (thickness <= 0) return [];

      return [
        getTextBlurMirrorZoneStyle({
          blurPx: zone.blurPx,
          opacity: zone.opacity,
          outerRect,
          targetRect,
          thickness,
        }),
      ];
    }),
  );
}

function getTextBlurMirrorZoneStyle({
  blurPx,
  opacity,
  outerRect,
  targetRect,
  thickness,
}: {
  blurPx: number;
  opacity: number;
  outerRect: FloatingPanelRect;
  targetRect: FloatingPanelRect;
  thickness: number;
}): CSSProperties {
  const x = outerRect.x - targetRect.x;
  const y = outerRect.y - targetRect.y;
  const rightX = x + outerRect.width - thickness;
  const bottomY = y + outerRect.height - thickness;
  const maskImage = [
    "linear-gradient(to bottom, #000, transparent)",
    "linear-gradient(to top, #000, transparent)",
    "linear-gradient(to right, #000, transparent)",
    "linear-gradient(to left, #000, transparent)",
  ].join(", ");
  const maskPosition = [
    `${x}px ${y}px`,
    `${x}px ${bottomY}px`,
    `${x}px ${y}px`,
    `${rightX}px ${y}px`,
  ].join(", ");
  const maskSize = [
    `${outerRect.width}px ${thickness}px`,
    `${outerRect.width}px ${thickness}px`,
    `${thickness}px ${outerRect.height}px`,
    `${thickness}px ${outerRect.height}px`,
  ].join(", ");

  return {
    color: `rgb(39 39 42 / ${opacity})`,
    filter: `blur(${blurPx}px)`,
    WebkitMaskImage: maskImage,
    WebkitMaskPosition: maskPosition,
    WebkitMaskRepeat: "no-repeat, no-repeat, no-repeat, no-repeat",
    WebkitMaskSize: maskSize,
    maskImage,
    maskPosition,
    maskRepeat: "no-repeat, no-repeat, no-repeat, no-repeat",
    maskSize,
  } as CSSProperties;
}

function getIntersectionRects(
  targetRect: FloatingPanelRect | null,
  occlusionRects: FloatingPanelRect[],
) {
  if (!targetRect) return [];

  return occlusionRects.flatMap((occlusionRect) => {
    const intersection = getIntersectionRect(targetRect, occlusionRect);
    return intersection ? [intersection] : [];
  });
}

function getIntersectionRect(
  first: FloatingPanelRect,
  second: FloatingPanelRect,
): FloatingPanelRect | null {
  const x = Math.max(first.x, second.x);
  const y = Math.max(first.y, second.y);
  const right = Math.min(first.x + first.width, second.x + second.width);
  const bottom = Math.min(first.y + first.height, second.y + second.height);
  const width = right - x;
  const height = bottom - y;

  if (width <= 0 || height <= 0) return null;

  return {
    height,
    width,
    x,
    y,
  };
}

function getInsetRect(
  rect: FloatingPanelRect,
  inset: number,
): FloatingPanelRect | null {
  const width = rect.width - inset * 2;
  const height = rect.height - inset * 2;

  if (width <= 0 || height <= 0) return null;

  return {
    height,
    width,
    x: rect.x + inset,
    y: rect.y + inset,
  };
}

function toFloatingPanelRect(rect: DOMRect): FloatingPanelRect {
  return {
    height: rect.height,
    width: rect.width,
    x: rect.left,
    y: rect.top,
  };
}

function areSameFloatingPanelRect(
  first: FloatingPanelRect | null,
  second: FloatingPanelRect,
) {
  if (!first) return false;

  return (
    first.height === second.height &&
    first.width === second.width &&
    first.x === second.x &&
    first.y === second.y
  );
}
