import { useContext, useMemo } from "react";
import {
  FLOATING_PANEL_BASE_Z_INDEX,
  FloatingLayerContext,
  type FloatingPanelId,
  type FloatingPanelOcclusion,
} from "./FloatingLayerContext";

const FLOATING_PANEL_IDS: FloatingPanelId[] = [
  "activity-event",
  "observations",
  "self-report",
  "settings",
];

export function useFloatingLayer() {
  const context = useContext(FloatingLayerContext);

  if (!context) {
    throw new Error("useFloatingLayer must be used within FloatingLayerProvider");
  }

  return context;
}

export function useFloatingOcclusions(occlusion: FloatingPanelOcclusion) {
  const { panelOcclusions, panelRects } = useFloatingLayer();

  return useMemo(
    () =>
      FLOATING_PANEL_IDS.flatMap((id) => {
        const rect = panelRects[id];

        if (!rect || panelOcclusions[id] !== occlusion) return [];

        return [
          {
            id,
            rect,
          },
        ];
      }),
    [occlusion, panelOcclusions, panelRects],
  );
}

export function useFloatingPanel(id: FloatingPanelId) {
  const { activatePanel, panelRects, panelZIndexes } = useFloatingLayer();

  return useMemo(
    () => ({
      activate: () => activatePanel(id),
      rect: panelRects[id] ?? null,
      zIndex: panelZIndexes[id] ?? FLOATING_PANEL_BASE_Z_INDEX,
    }),
    [activatePanel, id, panelRects, panelZIndexes],
  );
}
