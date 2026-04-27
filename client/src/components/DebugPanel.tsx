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
          <DebugRow label="load" value={formatNullable(entry.signals.load)} />
          <DebugRow
            label="fatigue"
            value={formatNullable(entry.signals.fatigue)}
          />
          <DebugRow label="focus" value={formatNullable(entry.signals.focus)} />
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
    <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 text-xs">
      <div className="text-zinc-400">{label}</div>
      <div className="break-words font-mono text-zinc-800">
        {String(value || "-")}
      </div>
    </div>
  );
}

function formatNullable(value: number | null) {
  return value === null ? "null" : value;
}
