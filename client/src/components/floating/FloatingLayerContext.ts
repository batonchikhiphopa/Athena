import { createContext } from "react";

export type FloatingPanelId =
  | "activity-event"
  | "observations"
  | "result-settings"
  | "self-report"
  | "settings";

export type FloatingPanelPosition = {
  x: number;
  y: number;
};

export type FloatingPanelRect = FloatingPanelPosition & {
  height: number;
  width: number;
};

export type FloatingPanelOcclusion = "editor-text";

export type FloatingPanelRects = Partial<
  Record<FloatingPanelId, FloatingPanelRect>
>;

export type FloatingPanelOcclusions = Partial<
  Record<FloatingPanelId, FloatingPanelOcclusion>
>;

export type FloatingPanelZIndexes = Partial<Record<FloatingPanelId, number>>;

export type FloatingLayerContextValue = {
  activatePanel: (id: FloatingPanelId) => number;
  panelOcclusions: FloatingPanelOcclusions;
  panelRects: FloatingPanelRects;
  panelZIndexes: FloatingPanelZIndexes;
  setPanelRect: (
    id: FloatingPanelId,
    rect: FloatingPanelRect | null,
    occlusion?: FloatingPanelOcclusion,
  ) => void;
};

export const FLOATING_PANEL_BASE_Z_INDEX = 60;

export const FloatingLayerContext =
  createContext<FloatingLayerContextValue | null>(null);
