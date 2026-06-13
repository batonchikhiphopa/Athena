import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  FLOATING_PANEL_BASE_Z_INDEX,
  FloatingLayerContext,
  type FloatingPanelId,
  type FloatingPanelOcclusion,
  type FloatingPanelOcclusions,
  type FloatingPanelRect,
  type FloatingPanelRects,
  type FloatingPanelZIndexes,
} from "./FloatingLayerContext";

type FloatingLayerProviderProps = {
  children: ReactNode;
};

export function FloatingLayerProvider({
  children,
}: FloatingLayerProviderProps) {
  const topZIndexRef = useRef(FLOATING_PANEL_BASE_Z_INDEX);
  const [panelOcclusions, setPanelOcclusions] =
    useState<FloatingPanelOcclusions>({});
  const [panelRects, setPanelRects] = useState<FloatingPanelRects>({});
  const [panelZIndexes, setPanelZIndexes] = useState<FloatingPanelZIndexes>(
    {},
  );

  const activatePanel = useCallback((id: FloatingPanelId) => {
    topZIndexRef.current += 1;
    const nextZIndex = topZIndexRef.current;

    setPanelZIndexes((current) => ({
      ...current,
      [id]: nextZIndex,
    }));

    return nextZIndex;
  }, []);

  const setPanelRect = useCallback(
    (
      id: FloatingPanelId,
      rect: FloatingPanelRect | null,
      occlusion?: FloatingPanelOcclusion,
    ) => {
      setPanelRects((current) => {
        if (!rect) {
          const next = { ...current };
          delete next[id];
          return next;
        }

        return {
          ...current,
          [id]: rect,
        };
      });

      setPanelOcclusions((current) => {
        if (!rect || !occlusion) {
          const next = { ...current };
          delete next[id];
          return next;
        }

        return {
          ...current,
          [id]: occlusion,
        };
      });
    },
    [],
  );

  const value = useMemo(
    () => ({
      activatePanel,
      panelOcclusions,
      panelRects,
      panelZIndexes,
      setPanelRect,
    }),
    [activatePanel, panelOcclusions, panelRects, panelZIndexes, setPanelRect],
  );

  return (
    <FloatingLayerContext.Provider value={value}>
      {children}
    </FloatingLayerContext.Provider>
  );
}
