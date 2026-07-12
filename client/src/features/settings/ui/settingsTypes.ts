import type { MessageKey } from "../../../i18n/messages";

export type SettingsTab = "interface" | "access" | "records" | "data";

export const settingsTabs: { id: SettingsTab; label: MessageKey }[] = [
  { id: "interface", label: "settings.tab.interface" },
  { id: "access", label: "settings.tab.access" },
  { id: "records", label: "settings.tab.records" },
  { id: "data", label: "settings.tab.data" },
];

export type RunStatus = "idle" | "running" | "done" | "error";

export type StatusMessageState = {
  tone: "idle" | "ok" | "error";
  text: string;
};