import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ACTIVITY_CONTEXT_EVENTS } from "../../../shared/contracts";
import { useI18n } from "../../../i18n/useI18n";
import { formatLongDate } from "../../../shared/lib/dates";
import type { EntryView } from "../../entries/entryTypes";
import { getAvailableTags, normalizeTag } from "../../entries/entryFilters";
import { normalizeActivityLabel } from "../activityCatalog";
import { getResultsCorrectionCopy } from "../resultsCorrectionCopy";
import type { ExtractionProposal, ResultsEntity } from "../resultsCorrections";
import type { ActivityKind } from "../resultsTypes";
import type { ResultsCustomizationState } from "../useResultsCustomization";

export function ResultsItemSettings({
  entries,
  entityId,
  proposals,
  state,
  onClose,
}: {
  entries: EntryView[];
  entityId: string | null;
  proposals: ExtractionProposal[];
  state: ResultsCustomizationState;
  onClose: () => void;
}) {
  const { language, t } = useI18n();
  const copy = getResultsCorrectionCopy(language);
  const entity = state.customization.entities.find(
    (candidate) => candidate.id === entityId,
  );
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<ActivityKind>("task");
  const [direction, setDirection] = useState("");
  const [trackingMode, setTrackingMode] =
    useState<ResultsEntity["trackingMode"]>("standard");
  const [alias, setAlias] = useState("");
  const [monitoringTag, setMonitoringTag] = useState("");
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [manualEntryId, setManualEntryId] = useState("");
  const [manualEvent, setManualEvent] = useState(
    "unknown" as (typeof ACTIVITY_CONTEXT_EVENTS)[number],
  );
  const [splitProposalId, setSplitProposalId] = useState<string | null>(null);
  const [splitLabel, setSplitLabel] = useState("");
  const [splitKind, setSplitKind] = useState<ActivityKind>("task");
  const [proposalEvents, setProposalEvents] = useState<
    Record<string, (typeof ACTIVITY_CONTEXT_EVENTS)[number]>
  >({});

  useEffect(() => {
    if (!entity) return;
    setLabel(entity.label);
    setKind(entity.kind);
    setDirection(entity.direction ?? "");
    setTrackingMode(entity.trackingMode);
    setAlias("");
    setMonitoringTag("");
    setMergeTargetId("");
    setManualEntryId("");
    setSplitProposalId(null);
    setSplitLabel("");
    setSplitKind(entity.kind);
    setProposalEvents({});
  }, [entity]);

  const decisionByProposalId = useMemo(
    () =>
      new Map(
        state.customization.decisions.map((decision) => [
          decision.proposalId,
          decision,
        ]),
      ),
    [state.customization.decisions],
  );
  const relevantProposals = useMemo(() => {
    if (!entity) return [];
    const aliases = new Set(
      [entity.id, entity.label, ...entity.aliases].map(normalizeActivityLabel),
    );
    return proposals.filter((proposal) => {
      const decision = decisionByProposalId.get(proposal.id);
      return (
        proposal.canonicalActivityId === entity.id ||
        decision?.entityId === entity.id ||
        aliases.has(normalizeActivityLabel(proposal.machineActivityId))
      );
    });
  }, [decisionByProposalId, entity, proposals]);
  const manualLinks = state.customization.manualLinks.filter(
    (link) => link.entityId === entity?.id,
  );
  const entryById = new Map(entries.map((entry) => [entry.id, entry]));
  const availableTags = useMemo(() => getAvailableTags(entries), [entries]);
  const tagLinkedEntries = useMemo(() => {
    if (!entity) return [];
    const monitoredTags = new Set(
      (entity.monitoringTags ?? []).map(normalizeTag).filter(Boolean),
    );
    if (monitoredTags.size === 0) return [];

    return entries.flatMap((entry) => {
      if (!entry.analysisEnabled || entry.textUnavailable) return [];
      const matchedTag = entry.tags.find((tag) =>
        monitoredTags.has(normalizeTag(tag)),
      );
      return matchedTag ? [{ entry, matchedTag }] : [];
    });
  }, [entity, entries]);

  if (!entity) {
    return (
      <section className="flex h-full flex-col text-zinc-800">
        <PanelHeader
          closeLabel={t("common.close")}
          title={copy.manageTitle}
          onClose={onClose}
        />
        <p className="p-5 text-sm text-zinc-400">{copy.emptySources}</p>
      </section>
    );
  }

  function saveEntity() {
    state.updateEntity(entity!.id, { direction, kind, label, trackingMode });
  }

  function addAlias() {
    state.addAlias(entity!.id, alias);
    setAlias("");
  }

  function addMonitoringTag() {
    state.addMonitoringTag(entity!.id, monitoringTag);
    setMonitoringTag("");
  }

  function linkEntry() {
    if (!manualEntryId) return;
    state.linkEntry(entity!.id, manualEntryId, manualEvent);
    setManualEntryId("");
  }

  function mergeEntity() {
    if (!mergeTargetId) return;
    state.mergeEntities(entity!.id, mergeTargetId);
    onClose();
  }

  return (
    <section className="flex h-full min-h-0 flex-col text-zinc-800">
      <PanelHeader
        closeLabel={t("common.close")}
        title={copy.manageTitle}
        onClose={onClose}
      />

      <div className="entries-feed-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5" data-no-drag>
        <div className="space-y-6">
          <SettingsSection title={copy.userVersion}>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_12rem_auto]">
              <input
                className={inputClassName}
                onChange={(event) => setLabel(event.target.value)}
                value={label}
              />
              <select
                className={inputClassName}
                onChange={(event) =>
                  setKind(event.target.value as ActivityKind)
                }
                value={kind}
              >
                <option value="task">{copy.kind.task}</option>
                <option value="activity">{copy.kind.activity}</option>
              </select>
              <ActionButton onClick={saveEntity}>{copy.save}</ActionButton>
            </div>
          </SettingsSection>

          <SettingsSection
            description={copy.directionDescription}
            title={copy.organization}
          >
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_12rem_auto]">
              <input
                className={inputClassName}
                list="results-directions"
                onChange={(event) => setDirection(event.target.value)}
                placeholder={copy.direction}
                value={direction}
              />
              <select
                className={inputClassName}
                onChange={(event) =>
                  setTrackingMode(
                    event.target.value as ResultsEntity["trackingMode"],
                  )
                }
                value={trackingMode}
              >
                <option value="standard">{copy.trackingModeLabel.standard}</option>
                <option value="reduce">{copy.trackingModeLabel.reduce}</option>
              </select>
              <ActionButton onClick={saveEntity}>{copy.save}</ActionButton>
            </div>
            <datalist id="results-directions">
              {[...new Set(
                state.customization.entities.flatMap((candidate) =>
                  candidate.direction ? [candidate.direction] : [],
                ),
              )].map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          </SettingsSection>

          <SettingsSection
            description={copy.monitoringTagsDescription}
            title={copy.monitoringTags}
          >
            <div className="flex flex-wrap gap-2">
              {(entity.monitoringTags ?? []).map((value) => (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-white/55 px-2.5 py-1 text-xs text-zinc-600"
                  key={value}
                >
                  #{value}
                  <button
                    aria-label={`${copy.remove}: ${value}`}
                    className="text-zinc-300 hover:text-red-600"
                    onClick={() => state.removeMonitoringTag(entity.id, value)}
                    type="button"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                className={inputClassName}
                list="results-monitoring-tags"
                onChange={(event) => setMonitoringTag(event.target.value)}
                placeholder={copy.addMonitoringTag}
                value={monitoringTag}
              />
              <datalist id="results-monitoring-tags">
                {availableTags.map(({ tag }) => (
                  <option key={tag} value={tag} />
                ))}
              </datalist>
              <ActionButton
                disabled={!normalizeTag(monitoringTag)}
                onClick={addMonitoringTag}
              >
                {copy.add}
              </ActionButton>
            </div>
          </SettingsSection>

          <SettingsSection
            description={copy.monitoringAliases}
            title={copy.aliases}
          >
            <div className="flex flex-wrap gap-2">
              {entity.aliases.map((value) => (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-white/55 px-2.5 py-1 text-xs text-zinc-600"
                  key={value}
                >
                  {value}
                  <button
                    aria-label={`${copy.remove}: ${value}`}
                    className="text-zinc-300 hover:text-red-600"
                    onClick={() => state.removeAlias(entity.id, value)}
                    type="button"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                className={inputClassName}
                onChange={(event) => setAlias(event.target.value)}
                placeholder={copy.addAlias}
                value={alias}
              />
              <ActionButton disabled={!alias.trim()} onClick={addAlias}>
                {copy.add}
              </ActionButton>
            </div>
          </SettingsSection>

          <SettingsSection
            description={copy.manualLinkDescription}
            title={copy.manualLink}
          >
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_12rem_auto]">
              <select
                className={inputClassName}
                onChange={(event) => setManualEntryId(event.target.value)}
                value={manualEntryId}
              >
                <option value="">—</option>
                {entries
                  .filter(
                    (entry) => entry.analysisEnabled && !entry.textUnavailable,
                  )
                  .map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.entryDate} · {createEntryLabel(entry.text)}
                    </option>
                  ))}
              </select>
              <select
                className={inputClassName}
                onChange={(event) =>
                  setManualEvent(
                    event.target.value as typeof manualEvent,
                  )
                }
                value={manualEvent}
              >
                {ACTIVITY_CONTEXT_EVENTS.map((event) => (
                  <option key={event} value={event}>
                    {copy.eventLabel[event]}
                  </option>
                ))}
              </select>
              <ActionButton disabled={!manualEntryId} onClick={linkEntry}>
                {copy.add}
              </ActionButton>
            </div>
          </SettingsSection>

          <SettingsSection title={copy.sources}>
            {relevantProposals.length === 0 &&
            manualLinks.length === 0 &&
            tagLinkedEntries.length === 0 ? (
              <p className="text-sm text-zinc-400">{copy.emptySources}</p>
            ) : (
              <div className="space-y-2">
                {relevantProposals.map((proposal) => (
                  <article
                    className="rounded-lg border border-white/40 bg-white/35 p-3"
                    key={proposal.id}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="text-xs text-zinc-400">
                          {formatLongDate(proposal.sourceEntryDate, language)} · {copy.machineProposal}
                        </div>
                        <div className="mt-1 text-sm text-zinc-700">
                          {proposal.proposedLabel} · {copy.eventLabel[proposal.proposedEvent]} · {proposal.confidence}
                        </div>
                      </div>
                      <span className="rounded-full bg-white/65 px-2 py-0.5 font-mono text-[10px] text-zinc-500">
                        {copy.status[proposal.status]}
                      </span>
                    </div>
                    {proposal.sourceExcerpt && (
                      <p className="mt-2 font-serif text-xs leading-5 text-zinc-600">
                        {proposal.sourceExcerpt}
                      </p>
                    )}

                    {splitProposalId === proposal.id ? (
                      <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_auto_auto]">
                        <input
                          className={inputClassName}
                          onChange={(event) => setSplitLabel(event.target.value)}
                          placeholder={copy.moveToNew}
                          value={splitLabel}
                        />
                        <select
                          className={inputClassName}
                          onChange={(event) =>
                            setSplitKind(event.target.value as ActivityKind)
                          }
                          value={splitKind}
                        >
                          <option value="task">{copy.kind.task}</option>
                          <option value="activity">{copy.kind.activity}</option>
                        </select>
                        <ActionButton
                          disabled={!splitLabel.trim()}
                          onClick={() => {
                            state.splitProposal(proposal, {
                              kind: splitKind,
                              label: splitLabel,
                            });
                            setSplitProposalId(null);
                            setSplitLabel("");
                          }}
                        >
                          {copy.save}
                        </ActionButton>
                        <ActionButton
                          quiet
                          onClick={() => setSplitProposalId(null)}
                        >
                          {copy.cancel}
                        </ActionButton>
                      </div>
                    ) : (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <select
                          aria-label={copy.event}
                          className={inputClassName}
                          onChange={(event) =>
                            setProposalEvents((current) => ({
                              ...current,
                              [proposal.id]: event.target
                                .value as (typeof ACTIVITY_CONTEXT_EVENTS)[number],
                            }))
                          }
                          value={
                            proposalEvents[proposal.id] ??
                            proposal.canonicalEvent
                          }
                        >
                          {ACTIVITY_CONTEXT_EVENTS.map((event) => (
                            <option key={event} value={event}>
                              {copy.eventLabel[event]}
                            </option>
                          ))}
                        </select>
                        <ActionButton
                          quiet
                          onClick={() =>
                            state.correctProposal(proposal, {
                              event:
                                proposalEvents[proposal.id] ??
                                proposal.canonicalEvent,
                              kind: entity.kind,
                              label: entity.label,
                            })
                          }
                        >
                          {copy.correct}
                        </ActionButton>
                        {proposal.status === "rejected" ? (
                          <ActionButton
                            quiet
                            onClick={() => state.restoreProposal(proposal)}
                          >
                            {copy.restore}
                          </ActionButton>
                        ) : (
                          <ActionButton
                            quiet
                            onClick={() => state.rejectProposal(proposal)}
                          >
                            {copy.reject}
                          </ActionButton>
                        )}
                        <ActionButton
                          quiet
                          onClick={() => {
                            setSplitProposalId(proposal.id);
                            setSplitLabel("");
                            setSplitKind(entity.kind);
                          }}
                        >
                          {copy.split}
                        </ActionButton>
                      </div>
                    )}
                  </article>
                ))}

                {manualLinks.map((link) => {
                  const entry = entryById.get(link.entryId);
                  if (!entry) return null;
                  return (
                    <article
                      className="rounded-lg border border-emerald-900/10 bg-emerald-50/30 p-3"
                      key={link.id}
                    >
                      <div className="text-xs text-zinc-400">
                        {formatLongDate(entry.entryDate, language)} · {copy.userVersion}
                      </div>
                      <p className="mt-1 text-sm text-zinc-700">
                        {createEntryLabel(entry.text)} · {copy.eventLabel[link.event]}
                      </p>
                      <div className="mt-3">
                        <ActionButton
                          quiet
                          onClick={() => state.removeManualLink(link.id)}
                        >
                          {copy.remove}
                        </ActionButton>
                      </div>
                    </article>
                  );
                })}

                {tagLinkedEntries.map(({ entry, matchedTag }) => (
                  <article
                    className="rounded-lg border border-sky-900/10 bg-sky-50/30 p-3"
                    key={`tag:${entity.id}:${entry.id}`}
                  >
                    <div className="text-xs text-zinc-400">
                      {formatLongDate(entry.entryDate, language)} · {copy.tagRule}
                    </div>
                    <p className="mt-1 text-sm text-zinc-700">
                      {createEntryLabel(entry.text)} · #{matchedTag}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </SettingsSection>

          <SettingsSection
            description={copy.mergeDescription}
            title={copy.merge}
          >
            <div className="flex gap-2">
              <select
                className={inputClassName}
                onChange={(event) => setMergeTargetId(event.target.value)}
                value={mergeTargetId}
              >
                <option value="">—</option>
                {state.customization.entities
                  .filter((candidate) => candidate.id !== entity.id)
                  .map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.label}
                    </option>
                  ))}
              </select>
              <ActionButton disabled={!mergeTargetId} onClick={mergeEntity}>
                {copy.merge}
              </ActionButton>
            </div>
          </SettingsSection>
        </div>
      </div>
    </section>
  );
}

const inputClassName =
  "min-w-0 rounded-md border border-white/70 bg-white/60 px-3 py-2 text-sm text-zinc-700 outline-none focus:border-zinc-300";

function PanelHeader({
  closeLabel,
  title,
  onClose,
}: {
  closeLabel: string;
  title: string;
  onClose: () => void;
}) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-black/5 px-5 py-3">
      <h2 className="truncate text-base font-medium text-zinc-900">{title}</h2>
      <button
        aria-label={closeLabel}
        className="grid h-8 w-8 place-items-center rounded-full text-zinc-300 transition hover:bg-white/45 hover:text-zinc-700"
        onClick={onClose}
        type="button"
      >
        ×
      </button>
    </header>
  );
}

function SettingsSection({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <section>
      <h3 className="text-sm font-medium text-zinc-700">{title}</h3>
      {description && (
        <p className="mt-1 text-xs leading-5 text-zinc-400">{description}</p>
      )}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function ActionButton({
  children,
  disabled = false,
  onClick,
  quiet = false,
}: {
  children: string;
  disabled?: boolean;
  onClick: () => void;
  quiet?: boolean;
}) {
  return (
    <button
      className={[
        "shrink-0 rounded-md px-3 py-2 text-xs transition disabled:cursor-not-allowed disabled:opacity-45",
        quiet
          ? "bg-white/50 text-zinc-500 hover:bg-white/80 hover:text-zinc-900"
          : "bg-zinc-800 text-white hover:bg-zinc-950",
      ].join(" ")}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function createEntryLabel(text: string) {
  const normalized = text.replace(/\s+/gu, " ").trim();
  return normalized.length > 72 ? `${normalized.slice(0, 69)}…` : normalized;
}
