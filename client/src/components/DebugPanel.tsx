import type { EntryView } from "../types";
import type { ReactNode } from "react";

type DebugPanelProps = {
  entry: EntryView;
};

export function DebugPanel({ entry }: DebugPanelProps) {
  return (
    <section className="mt-5 rounded-lg border border-amber-200 bg-amber-50/70 p-5">
      <div className="mb-4 text-xs font-semibold uppercase text-amber-700">
        debug mode
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DebugBlock title="signals">
          <DebugRow label="quality" value={entry.signals.signal_quality} />
          <DebugRow label="topics" value={entry.signals.topics.join(", ")} />
          <DebugRow
            label="activities"
            value={entry.signals.activities.join(", ")}
          />
          <DebugRow label="markers" value={entry.signals.markers.join(", ")} />
          <DebugRow label="reason" value={entry.signals.quality_reason} />
          <DebugRow label="load" value={formatNullable(entry.signals.load)} />
          <DebugRow
            label="fatigue"
            value={formatNullable(entry.signals.fatigue)}
          />
          <DebugRow label="focus" value={formatNullable(entry.signals.focus)} />
        </DebugBlock>

        <DebugBlock title="state inference">
          {Object.entries(entry.signals.state_inference).length > 0 ? (
            Object.entries(entry.signals.state_inference).map(([axis, value]) => (
              <DebugRow
                key={axis}
                label={axis}
                value={`${value.level}/${value.confidence}${formatBasis(
                  value.basis,
                )}`}
              />
            ))
          ) : (
            <DebugRow label="state" value="-" />
          )}
        </DebugBlock>

        <DebugBlock title="metric confidence">
          <DebugRow label="load" value={entry.signals.metric_confidence.load} />
          <DebugRow
            label="fatigue"
            value={entry.signals.metric_confidence.fatigue}
          />
          <DebugRow
            label="focus"
            value={entry.signals.metric_confidence.focus}
          />
          <DebugRow label="nulls" value={formatNullReasons(entry.signals)} />
        </DebugBlock>

        <DebugBlock title="signal context">
          <DebugRow
            label="intent"
            value={`${entry.signals.entry_intent.intent}/${entry.signals.entry_intent.confidence}${formatBasis(
              entry.signals.entry_intent.basis,
            )}`}
          />
          <DebugRow
            label="density"
            value={entry.signals.structure_signal.density}
          />
          <DebugRow
            label="coherence"
            value={entry.signals.structure_signal.coherence}
          />
          <DebugRow
            label="shape"
            value={`question:${entry.signals.structure_signal.has_question} plan:${entry.signals.structure_signal.has_plan}${formatBasis(
              entry.signals.structure_signal.basis,
            )}`}
          />
          <DebugRow
            label="time"
            value={`${entry.signals.temporal_context.local_date ?? "-"} ${entry.signals.temporal_context.time_bucket}/${entry.signals.temporal_context.source}`}
          />
        </DebugBlock>

        <DebugBlock title="emotion signals">
          {Object.keys(entry.signals.emotion_signals).length > 0 ? (
            <>
              <DebugRow label="mapper" value={entry.signals.quality_reason} />
              {formatEmotionSignals(entry.signals.emotion_signals).map(
                ([label, value]) => (
                  <DebugRow key={label} label={label} value={value} />
                ),
              )}
            </>
          ) : (
            <DebugRow label="emotion" value="-" />
          )}
        </DebugBlock>

        <DebugBlock title="metadata">
          <DebugRow label="server id" value={entry.serverId ?? ""} />
          <DebugRow label="sync" value={entry.syncStatus} />
          <DebugRow label="hash" value={entry.sourceTextHash} />
          <DebugRow label="schema" value={entry.metadata.schema_version} />
          <DebugRow label="prompt" value={entry.metadata.prompt_version} />
          <DebugRow label="provider" value={entry.metadata.provider} />
          <DebugRow label="model" value={entry.metadata.model} />
          <DebugRow label="error" value={entry.metadata.error_code ?? ""} />
          <DebugRow label="created" value={entry.createdAt} />
          <DebugRow label="updated" value={entry.updatedAt} />
        </DebugBlock>
      </div>
    </section>
  );
}

function DebugBlock({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <div className="rounded-md border border-amber-200 bg-white/70 p-4">
      <div className="mb-3 text-sm font-medium text-zinc-950">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DebugRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="grid grid-cols-[minmax(88px,128px)_minmax(0,1fr)] gap-3 text-xs">
      <div className="break-words text-zinc-400">{label}</div>
      <div className="break-words font-mono text-zinc-800">
        {String(value || "-")}
      </div>
    </div>
  );
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

function formatEmotionSignals(signals: Record<string, unknown>) {
  const labels = getRecord(signals.labels);
  const rows: Array<[string, string]> = [];

  if (typeof signals.model === "string") rows.push(["model", signals.model]);
  if (typeof signals.status === "string") rows.push(["status", signals.status]);
  if (typeof signals.top_label === "string") {
    rows.push(["top", `${signals.top_label} ${signals.top_score ?? ""}`]);
  }

  for (const [label, value] of Object.entries(labels).slice(0, 8)) {
    rows.push([label, String(value)]);
  }

  if (rows.length === 0) {
    rows.push(["raw", JSON.stringify(signals).slice(0, 240)]);
  }

  return rows;
}

function getRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
