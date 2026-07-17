import type { EntryView } from "../entryTypes";
import { SELF_REPORT_AXES } from "../../selfReports/selfReportTypes";

export type DebugBlock = {
  rows: DebugRow[];
  title: string;
};

export type DebugRow = {
  label: string;
  value: number | string;
};

export function getEntryDebugBlocks(entry: EntryView): DebugBlock[] {
  return [
    {
      title: "signals",
      rows: [
        { label: "quality", value: entry.signals.signal_quality },
        { label: "topics", value: entry.signals.topics.join(", ") },
        { label: "activities", value: entry.signals.activities.join(", ") },
        { label: "markers", value: entry.signals.markers.join(", ") },
        { label: "reason", value: entry.signals.quality_reason },
        { label: "load", value: formatNullable(entry.signals.load) },
        { label: "fatigue", value: formatNullable(entry.signals.fatigue) },
        { label: "focus", value: formatNullable(entry.signals.focus) },
      ],
    },
    {
      title: "state inference",
      rows:
        Object.entries(entry.signals.state_inference).length > 0
          ? Object.entries(entry.signals.state_inference).map(([axis, value]) => ({
              label: axis,
              value: `${value.level}/${value.confidence}${formatBasis(
                value.basis,
              )}`,
            }))
          : [{ label: "state", value: "-" }],
    },
    {
      title: "metric confidence",
      rows: [
        { label: "load", value: entry.signals.metric_confidence.load },
        { label: "fatigue", value: entry.signals.metric_confidence.fatigue },
        { label: "focus", value: entry.signals.metric_confidence.focus },
        { label: "nulls", value: formatNullReasons(entry.signals) },
      ],
    },
    {
      title: "signal context",
      rows: [
        {
          label: "intent",
          value: `${entry.signals.entry_intent.intent}/${entry.signals.entry_intent.confidence}${formatBasis(
            entry.signals.entry_intent.basis,
          )}`,
        },
        { label: "density", value: entry.signals.structure_signal.density },
        { label: "coherence", value: entry.signals.structure_signal.coherence },
        {
          label: "shape",
          value: `question:${entry.signals.structure_signal.has_question} plan:${entry.signals.structure_signal.has_plan}${formatBasis(
            entry.signals.structure_signal.basis,
          )}`,
        },
        {
          label: "time",
          value: `${entry.signals.temporal_context.local_date ?? "-"} ${entry.signals.temporal_context.time_bucket}/${entry.signals.temporal_context.source}`,
        },
      ],
    },
    {
      title: "self report",
      rows: entry.selfReport
        ? [
            ...SELF_REPORT_AXES.map((axis) => ({
              label: axis,
              value: formatNullable(entry.selfReport?.values[axis] ?? null),
            })),
            { label: "local day", value: entry.selfReport.local_day },
            { label: "sync", value: entry.selfReport.sync_status },
            { label: "updated", value: entry.selfReport.updated_at },
          ]
        : [{ label: "values", value: "-" }],
    },
    {
      title: "metadata",
      rows: [
        { label: "server id", value: entry.serverId ?? "" },
        { label: "sync", value: entry.syncStatus },
        { label: "hash", value: entry.sourceTextHash },
        { label: "schema", value: entry.metadata.schema_version },
        { label: "prompt", value: entry.metadata.prompt_version },
        { label: "provider", value: entry.metadata.provider },
        { label: "model", value: entry.metadata.model },
        { label: "error", value: entry.metadata.error_code ?? "" },
        { label: "created", value: entry.createdAt },
        { label: "updated", value: entry.updatedAt },
      ],
    },
  ];
}

export function formatDebugValue(value: number | string) {
  if (value === "" || value === null || value === undefined) return "-";
  return String(value);
}

export function formatEntryDebugText(blocks: DebugBlock[]) {
  return blocks
    .flatMap((block) => [
      block.title,
      ...block.rows.map(
        (row) => `${row.label}: ${formatDebugValue(row.value)}`,
      ),
      "",
    ])
    .join("\n")
    .trim();
}

function formatNullable(value: number | null) {
  return value === null ? "null" : value;
}

function formatBasis(basis: string[]) {
  return basis.length > 0 ? `: ${basis.join("; ")}` : "";
}

function formatNullReasons(signals: EntryView["signals"]) {
  const nullMetrics = (["load", "fatigue", "focus"] as const).filter(
    (metric) => signals[metric] === null,
  );

  if (nullMetrics.length === 0) return "-";

  return nullMetrics
    .map((metric) => `${metric}: no relevant state evidence`)
    .join("; ");
}
