import { useCallback, useEffect, useRef, useState } from "react";
import type { ActivityContextEvent } from "../../shared/contracts";
import { normalizeTag } from "../entries/entryFilters";
import {
  cleanActivityLabel,
  normalizeActivityLabel,
} from "./activityCatalog";
import {
  EMPTY_RESULTS_CUSTOMIZATION,
  createResultsEntityId,
  type ExtractionProposal,
  type ManualResultLink,
  type ProposalDecision,
  type ResultsCustomization,
  type ResultsEntity,
} from "./resultsCorrections";
import {
  loadResultsCustomization,
  saveResultsCustomization,
} from "./resultsCustomizationStorage";
import type { ActivityKind } from "./resultsTypes";

export type CorrectProposalInput = {
  event: ActivityContextEvent;
  kind: ActivityKind;
  label: string;
};

export type ResultsCustomizationState = {
  acceptProposal: (proposal: ExtractionProposal) => void;
  addAlias: (entityId: string, alias: string) => void;
  addMonitoringTag: (entityId: string, tag: string) => void;
  correctProposal: (
    proposal: ExtractionProposal,
    input: CorrectProposalInput,
  ) => void;
  customization: ResultsCustomization;
  error: Error | null;
  isLoading: boolean;
  linkEntry: (
    entityId: string,
    entryId: string,
    event: ActivityContextEvent,
  ) => void;
  mergeEntities: (sourceEntityId: string, targetEntityId: string) => void;
  rejectProposal: (proposal: ExtractionProposal) => void;
  removeAlias: (entityId: string, alias: string) => void;
  removeMonitoringTag: (entityId: string, tag: string) => void;
  removeManualLink: (linkId: string) => void;
  restoreProposal: (proposal: ExtractionProposal) => void;
  splitProposal: (
    proposal: ExtractionProposal,
    input: Pick<CorrectProposalInput, "kind" | "label">,
  ) => void;
  updateEntity: (
    entityId: string,
    patch: Pick<ResultsEntity, "kind" | "label">,
  ) => void;
};

export function useResultsCustomization(): ResultsCustomizationState {
  const [customization, setCustomization] = useState<ResultsCustomization>(
    EMPTY_RESULTS_CUSTOMIZATION,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const saveChainRef = useRef(Promise.resolve());

  useEffect(() => {
    let cancelled = false;

    void loadResultsCustomization()
      .then((value) => {
        if (!cancelled) setCustomization(value);
      })
      .catch((caughtError) => {
        if (!cancelled) setError(toError(caughtError));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const commit = useCallback(
    (createNext: (current: ResultsCustomization) => ResultsCustomization) => {
      setCustomization((current) => {
        const next = createNext(current);
        if (next === current) return current;

        setError(null);
        saveChainRef.current = saveChainRef.current
          .catch(() => undefined)
          .then(() => saveResultsCustomization(next))
          .catch((caughtError) => {
            setError(toError(caughtError));
          });
        return next;
      });
    },
    [],
  );

  const acceptProposal = useCallback(
    (proposal: ExtractionProposal) => {
      commit((current) => {
        const now = new Date().toISOString();
        const { entities, entity } = ensureProposalEntity(
          current.entities,
          proposal,
          now,
        );

        return {
          ...current,
          entities,
          decisions: upsertDecision(current.decisions, {
            correctedEvent: null,
            entityId: entity.id,
            proposalId: proposal.id,
            status: "accepted",
            updatedAt: now,
          }),
        };
      });
    },
    [commit],
  );

  const correctProposal = useCallback(
    (proposal: ExtractionProposal, input: CorrectProposalInput) => {
      commit((current) => {
        const now = new Date().toISOString();
        const label = cleanActivityLabel(input.label) || proposal.proposedLabel;
        const existingDecision = current.decisions.find(
          (decision) => decision.proposalId === proposal.id,
        );
        const existingEntity = current.entities.find(
          (entity) =>
            entity.id ===
            (proposal.canonicalActivityId ?? existingDecision?.entityId),
        );
        const entity: ResultsEntity = existingEntity
          ? {
              ...existingEntity,
              kind: input.kind,
              label,
              updatedAt: now,
            }
          : {
              aliases: uniqueAliases([
                proposal.machineActivityId,
                proposal.proposedLabel,
              ]),
              createdAt: now,
              id: createResultsEntityId(label, current.entities),
              kind: input.kind,
              label,
              monitoringTags: [],
              updatedAt: now,
            };
        const entities = existingEntity
          ? current.entities.map((candidate) =>
              candidate.id === entity.id ? entity : candidate,
            )
          : [...current.entities, entity];

        return {
          ...current,
          entities,
          decisions: upsertDecision(current.decisions, {
            correctedEvent: input.event,
            entityId: entity.id,
            proposalId: proposal.id,
            status: "corrected",
            updatedAt: now,
          }),
        };
      });
    },
    [commit],
  );

  const rejectProposal = useCallback(
    (proposal: ExtractionProposal) => {
      commit((current) => {
        const previous = current.decisions.find(
          (decision) => decision.proposalId === proposal.id,
        );
        const now = new Date().toISOString();
        return {
          ...current,
          decisions: upsertDecision(current.decisions, {
            correctedEvent: previous?.correctedEvent ?? null,
            entityId:
              proposal.canonicalActivityId ?? previous?.entityId ?? null,
            proposalId: proposal.id,
            status: "rejected",
            updatedAt: now,
          }),
        };
      });
    },
    [commit],
  );

  const restoreProposal = useCallback(
    (proposal: ExtractionProposal) => {
      commit((current) => {
        const previous = current.decisions.find(
          (decision) => decision.proposalId === proposal.id,
        );
        const now = new Date().toISOString();
        const previousEntity = current.entities.find(
          (entity) => entity.id === previous?.entityId,
        );
        const ensured = previousEntity
          ? { entities: current.entities, entity: previousEntity }
          : ensureProposalEntity(current.entities, proposal, now);

        return {
          ...current,
          entities: ensured.entities,
          decisions: upsertDecision(current.decisions, {
            correctedEvent: previous?.correctedEvent ?? null,
            entityId: ensured.entity.id,
            proposalId: proposal.id,
            status: previous?.correctedEvent ? "corrected" : "accepted",
            updatedAt: now,
          }),
        };
      });
    },
    [commit],
  );

  const updateEntity = useCallback(
    (
      entityId: string,
      patch: Pick<ResultsEntity, "kind" | "label">,
    ) => {
      commit((current) => ({
        ...current,
        entities: current.entities.map((entity) =>
          entity.id === entityId
            ? {
                ...entity,
                kind: patch.kind,
                label: cleanActivityLabel(patch.label) || entity.label,
                updatedAt: new Date().toISOString(),
              }
            : entity,
        ),
      }));
    },
    [commit],
  );

  const addAlias = useCallback(
    (entityId: string, alias: string) => {
      const cleaned = cleanActivityLabel(alias);
      if (!cleaned) return;
      commit((current) => ({
        ...current,
        entities: current.entities.map((entity) =>
          entity.id === entityId
            ? {
                ...entity,
                aliases: uniqueAliases([...entity.aliases, cleaned]),
                updatedAt: new Date().toISOString(),
              }
            : entity,
        ),
      }));
    },
    [commit],
  );

  const removeAlias = useCallback(
    (entityId: string, alias: string) => {
      const normalized = normalizeActivityLabel(alias);
      commit((current) => ({
        ...current,
        entities: current.entities.map((entity) =>
          entity.id === entityId
            ? {
                ...entity,
                aliases: entity.aliases.filter(
                  (candidate) =>
                    normalizeActivityLabel(candidate) !== normalized,
                ),
                updatedAt: new Date().toISOString(),
              }
            : entity,
        ),
      }));
    },
    [commit],
  );

  const addMonitoringTag = useCallback(
    (entityId: string, tag: string) => {
      const cleaned = cleanMonitoringTag(tag);
      if (!cleaned) return;
      commit((current) => ({
        ...current,
        entities: current.entities.map((entity) =>
          entity.id === entityId
            ? {
                ...entity,
                monitoringTags: uniqueMonitoringTags([
                  ...(entity.monitoringTags ?? []),
                  cleaned,
                ]),
                updatedAt: new Date().toISOString(),
              }
            : entity,
        ),
      }));
    },
    [commit],
  );

  const removeMonitoringTag = useCallback(
    (entityId: string, tag: string) => {
      const normalized = normalizeTag(tag);
      commit((current) => ({
        ...current,
        entities: current.entities.map((entity) =>
          entity.id === entityId
            ? {
                ...entity,
                monitoringTags: (entity.monitoringTags ?? []).filter(
                  (candidate) => normalizeTag(candidate) !== normalized,
                ),
                updatedAt: new Date().toISOString(),
              }
            : entity,
        ),
      }));
    },
    [commit],
  );

  const mergeEntities = useCallback(
    (sourceEntityId: string, targetEntityId: string) => {
      if (sourceEntityId === targetEntityId) return;
      commit((current) => {
        const source = current.entities.find(
          (entity) => entity.id === sourceEntityId,
        );
        const target = current.entities.find(
          (entity) => entity.id === targetEntityId,
        );
        if (!source || !target) return current;

        const now = new Date().toISOString();
        return {
          ...current,
          entities: current.entities
            .filter((entity) => entity.id !== sourceEntityId)
            .map((entity) =>
              entity.id === targetEntityId
                ? {
                    ...entity,
                    aliases: uniqueAliases([
                      ...entity.aliases,
                      source.id,
                      source.label,
                      ...source.aliases,
                    ]),
                    monitoringTags: uniqueMonitoringTags([
                      ...(entity.monitoringTags ?? []),
                      ...(source.monitoringTags ?? []),
                    ]),
                    updatedAt: now,
                  }
                : entity,
            ),
          decisions: current.decisions.map((decision) =>
            decision.entityId === sourceEntityId
              ? { ...decision, entityId: targetEntityId, updatedAt: now }
              : decision,
          ),
          manualLinks: uniqueManualLinks(
            current.manualLinks.map((link) =>
              link.entityId === sourceEntityId
                ? {
                    ...link,
                    entityId: targetEntityId,
                    id: createManualLinkId(link.entryId, targetEntityId),
                  }
                : link,
            ),
          ),
        };
      });
    },
    [commit],
  );

  const linkEntry = useCallback(
    (entityId: string, entryId: string, event: ActivityContextEvent) => {
      commit((current) => {
        const id = createManualLinkId(entryId, entityId);
        const nextLink: ManualResultLink = {
          createdAt: new Date().toISOString(),
          entityId,
          entryId,
          event,
          id,
        };
        return {
          ...current,
          manualLinks: [
            ...current.manualLinks.filter((link) => link.id !== id),
            nextLink,
          ],
        };
      });
    },
    [commit],
  );

  const removeManualLink = useCallback(
    (linkId: string) => {
      commit((current) => ({
        ...current,
        manualLinks: current.manualLinks.filter((link) => link.id !== linkId),
      }));
    },
    [commit],
  );

  const splitProposal = useCallback(
    (
      proposal: ExtractionProposal,
      input: Pick<CorrectProposalInput, "kind" | "label">,
    ) => {
      commit((current) => {
        const label = cleanActivityLabel(input.label);
        if (!label) return current;
        const now = new Date().toISOString();
        const entity: ResultsEntity = {
          aliases: [],
          createdAt: now,
          id: createResultsEntityId(label, current.entities),
          kind: input.kind,
          label,
          monitoringTags: [],
          updatedAt: now,
        };

        return {
          ...current,
          entities: [...current.entities, entity],
          decisions: upsertDecision(current.decisions, {
            correctedEvent: proposal.canonicalEvent,
            entityId: entity.id,
            proposalId: proposal.id,
            status: "corrected",
            updatedAt: now,
          }),
        };
      });
    },
    [commit],
  );

  return {
    acceptProposal,
    addAlias,
    addMonitoringTag,
    correctProposal,
    customization,
    error,
    isLoading,
    linkEntry,
    mergeEntities,
    rejectProposal,
    removeAlias,
    removeMonitoringTag,
    removeManualLink,
    restoreProposal,
    splitProposal,
    updateEntity,
  };
}

function ensureProposalEntity(
  entities: ResultsEntity[],
  proposal: ExtractionProposal,
  now: string,
) {
  const normalizedIds = new Set([
    normalizeActivityLabel(proposal.machineActivityId),
    normalizeActivityLabel(proposal.proposedLabel),
  ]);
  const existing = entities.find((entity) =>
    [entity.id, entity.label, ...entity.aliases]
      .map(normalizeActivityLabel)
      .some((value) => normalizedIds.has(value)),
  );
  if (existing) return { entities, entity: existing };

  const entity: ResultsEntity = {
    aliases: uniqueAliases([
      proposal.machineActivityId,
      proposal.proposedLabel,
    ]),
    createdAt: now,
    id: createResultsEntityId(proposal.machineActivityId, entities),
    kind: proposal.proposedKind,
    label: proposal.proposedLabel,
    monitoringTags: [],
    updatedAt: now,
  };
  return { entities: [...entities, entity], entity };
}

function upsertDecision(
  decisions: ProposalDecision[],
  nextDecision: ProposalDecision,
) {
  return [
    ...decisions.filter(
      (decision) => decision.proposalId !== nextDecision.proposalId,
    ),
    nextDecision,
  ];
}

function uniqueAliases(values: string[]) {
  const byNormalizedValue = new Map<string, string>();
  for (const value of values) {
    const cleaned = cleanActivityLabel(value);
    const normalized = normalizeActivityLabel(cleaned);
    if (cleaned && normalized && !byNormalizedValue.has(normalized)) {
      byNormalizedValue.set(normalized, cleaned);
    }
  }
  return [...byNormalizedValue.values()];
}

function uniqueMonitoringTags(values: string[]) {
  const byNormalizedValue = new Map<string, string>();
  for (const value of values) {
    const cleaned = cleanMonitoringTag(value);
    const normalized = normalizeTag(cleaned);
    if (cleaned && normalized && !byNormalizedValue.has(normalized)) {
      byNormalizedValue.set(normalized, cleaned);
    }
  }
  return [...byNormalizedValue.values()];
}

function cleanMonitoringTag(value: string) {
  return value.trim().replace(/^#+/u, "").replace(/\s+/gu, " ");
}

function createManualLinkId(entryId: string, entityId: string) {
  return `manual:${encodeURIComponent(entryId)}:${encodeURIComponent(entityId)}`;
}

function uniqueManualLinks(links: ManualResultLink[]) {
  const byId = new Map<string, ManualResultLink>();
  for (const link of links) byId.set(link.id, link);
  return [...byId.values()];
}

function toError(value: unknown) {
  return value instanceof Error ? value : new Error("results_customization_failed");
}
