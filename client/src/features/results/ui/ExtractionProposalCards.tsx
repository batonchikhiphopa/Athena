import { useState } from "react";
import { ACTIVITY_CONTEXT_EVENTS } from "../../../shared/contracts";
import { useI18n } from "../../../i18n/useI18n";
import { formatLongDate } from "../../../shared/lib/dates";
import { getResultsCorrectionCopy } from "../resultsCorrectionCopy";
import type { ExtractionProposal } from "../resultsCorrections";
import type { CorrectProposalInput } from "../useResultsCustomization";

export function ExtractionProposalCards({
  proposals,
  onAccept,
  onCorrect,
  onReject,
  onRestore,
}: {
  proposals: ExtractionProposal[];
  onAccept: (proposal: ExtractionProposal) => void;
  onCorrect: (
    proposal: ExtractionProposal,
    input: CorrectProposalInput,
  ) => void;
  onReject: (proposal: ExtractionProposal) => void;
  onRestore: (proposal: ExtractionProposal) => void;
}) {
  const { language } = useI18n();
  const copy = getResultsCorrectionCopy(language);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CorrectProposalInput | null>(null);

  if (proposals.length === 0) return null;

  function startCorrection(proposal: ExtractionProposal) {
    setEditingId(proposal.id);
    setDraft({
      event: proposal.proposedEvent,
      kind: proposal.proposedKind,
      label: proposal.proposedLabel,
    });
  }

  function cancelCorrection() {
    setEditingId(null);
    setDraft(null);
  }

  return (
    <section>
      <div className="mb-2 text-sm font-medium text-zinc-500">
        {copy.proposalsTitle}
      </div>
      <p className="mb-3 text-xs leading-5 text-zinc-500">
        {copy.pendingIntro}
      </p>
      <div className="space-y-2">
        {proposals.map((proposal) => {
          const isEditing = editingId === proposal.id && draft;

          return (
            <article
              className="rounded-lg border border-sky-900/10 bg-sky-50/45 p-4 shadow-sm shadow-zinc-900/5"
              data-testid={`extraction-proposal-${proposal.id}`}
              key={proposal.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase text-zinc-400">
                <span>{copy.machineProposal}</span>
                <span className="rounded-full bg-white/65 px-2 py-0.5 font-mono normal-case text-zinc-500">
                  {copy.status[proposal.status]}
                </span>
              </div>

              {isEditing ? (
                <div className="mt-3 grid gap-2">
                  <input
                    aria-label={copy.userVersion}
                    className="rounded-md border border-white/80 bg-white/75 px-3 py-2 text-sm text-zinc-800 outline-none focus:border-zinc-300"
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? { ...current, label: event.target.value }
                          : current,
                      )
                    }
                    value={draft.label}
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <select
                      aria-label={copy.userVersion}
                      className="rounded-md border border-white/80 bg-white/75 px-3 py-2 text-sm text-zinc-700"
                      onChange={(event) =>
                        setDraft((current) =>
                          current
                            ? {
                                ...current,
                                kind: event.target.value as CorrectProposalInput["kind"],
                              }
                            : current,
                        )
                      }
                      value={draft.kind}
                    >
                      <option value="task">{copy.kind.task}</option>
                      <option value="activity">{copy.kind.activity}</option>
                    </select>
                    <select
                      aria-label={copy.event}
                      className="rounded-md border border-white/80 bg-white/75 px-3 py-2 text-sm text-zinc-700"
                      onChange={(event) =>
                        setDraft((current) =>
                          current
                            ? {
                                ...current,
                                event: event.target.value as CorrectProposalInput["event"],
                              }
                            : current,
                        )
                      }
                      value={draft.event}
                    >
                      {ACTIVITY_CONTEXT_EVENTS.map((event) => (
                        <option key={event} value={event}>
                          {copy.eventLabel[event]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-2 text-base font-medium text-zinc-800">
                    {proposal.proposedLabel}
                  </div>
                  <dl className="mt-2 grid gap-1 text-xs text-zinc-500 sm:grid-cols-3">
                    <ProposalField
                      label={copy.event}
                      value={copy.eventLabel[proposal.proposedEvent]}
                    />
                    <ProposalField
                      label={copy.confidence}
                      value={proposal.confidence}
                    />
                    <ProposalField
                      label={copy.sourceEntry}
                      value={formatLongDate(
                        proposal.sourceEntryDate,
                        language,
                      )}
                    />
                  </dl>
                  {proposal.sourceExcerpt && (
                    <p className="mt-3 font-serif text-sm leading-6 text-zinc-700">
                      {proposal.sourceExcerpt}
                    </p>
                  )}
                </>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {isEditing ? (
                  <>
                    <ProposalButton
                      onClick={() => {
                        onCorrect(proposal, draft);
                        cancelCorrection();
                      }}
                    >
                      {copy.save}
                    </ProposalButton>
                    <ProposalButton quiet onClick={cancelCorrection}>
                      {copy.cancel}
                    </ProposalButton>
                  </>
                ) : (
                  <>
                    {proposal.status === "rejected" ? (
                      <ProposalButton onClick={() => onRestore(proposal)}>
                        {copy.restore}
                      </ProposalButton>
                    ) : (
                      <ProposalButton onClick={() => onAccept(proposal)}>
                        {copy.accept}
                      </ProposalButton>
                    )}
                    <ProposalButton
                      quiet
                      onClick={() => startCorrection(proposal)}
                    >
                      {copy.correct}
                    </ProposalButton>
                    {proposal.status !== "rejected" && (
                      <ProposalButton quiet onClick={() => onReject(proposal)}>
                        {copy.reject}
                      </ProposalButton>
                    )}
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ProposalField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-zinc-400">{label}</dt>
      <dd className="mt-0.5 text-zinc-700">{value}</dd>
    </div>
  );
}

function ProposalButton({
  children,
  onClick,
  quiet = false,
}: {
  children: string;
  onClick: () => void;
  quiet?: boolean;
}) {
  return (
    <button
      className={[
        "rounded-full px-3 py-1.5 text-xs transition",
        quiet
          ? "bg-white/55 text-zinc-500 hover:bg-white/85 hover:text-zinc-900"
          : "bg-zinc-800 text-white hover:bg-zinc-950",
      ].join(" ")}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
