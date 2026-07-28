import type {
  ActivityContext,
  ActivityContextEvent,
  ConfidenceLevel,
} from "../../shared/contracts";
import type { EntryView } from "../entries/entryTypes";
import { normalizeTag } from "../entries/entryFilters";
import { createActivityGroupFromMentions } from "./activityAggregation";
import { cleanActivityLabel, normalizeActivityLabel } from "./activityCatalog";
import type {
  ActivityGroup,
  ActivityIndex,
  ActivityKind,
  ActivityMention,
  ActivityMentionMarker,
} from "./resultsTypes";

export type ExtractionProposalStatus =
  | "pending"
  | "accepted"
  | "corrected"
  | "rejected";

export type ResultsEntity = {
  aliases: string[];
  createdAt: string;
  direction: string | null;
  id: string;
  kind: ActivityKind;
  label: string;
  monitoringTags: string[];
  trackingMode: "standard" | "reduce";
  updatedAt: string;
};

export type ProposalDecision = {
  correctedEvent: ActivityContextEvent | null;
  entityId: string | null;
  proposalId: string;
  status: Exclude<ExtractionProposalStatus, "pending">;
  updatedAt: string;
};

export type ManualResultLink = {
  createdAt: string;
  entityId: string;
  entryId: string;
  event: ActivityContextEvent;
  id: string;
};

export type ResultsCustomization = {
  decisions: ProposalDecision[];
  entities: ResultsEntity[];
  manualLinks: ManualResultLink[];
  version: 1;
};

export type ExtractionProposal = {
  canonicalActivityId: string | null;
  canonicalEvent: ActivityContextEvent;
  canonicalKind: ActivityKind;
  canonicalLabel: string;
  confidence: ConfidenceLevel;
  id: string;
  machineActivityId: string;
  proposedEvent: ActivityContextEvent;
  proposedKind: ActivityKind;
  proposedLabel: string;
  sourceEntryDate: string;
  sourceEntryId: string;
  sourceExcerpt: string;
  status: ExtractionProposalStatus;
};

export const EMPTY_RESULTS_CUSTOMIZATION: ResultsCustomization = {
  decisions: [],
  entities: [],
  manualLinks: [],
  version: 1,
};

export function buildExtractionProposals(
  machineIndex: ActivityIndex,
  customization: ResultsCustomization,
): ExtractionProposal[] {
  if (machineIndex.isDemo) return [];

  const decisionById = new Map(
    customization.decisions.map((decision) => [decision.proposalId, decision]),
  );
  const entityById = new Map(
    customization.entities.map((entity) => [entity.id, entity]),
  );
  const proposals = machineIndex.activities.flatMap((activity) =>
    activity.mentions.flatMap((mention) => {
      if (!mention.entryId) return [];

      const proposalId = createExtractionProposalId(
        mention.entryId,
        activity.id,
        0,
      );
      const decision = decisionById.get(proposalId) ?? null;
      const matchedEntity = findEntityForMachineActivity(
        activity,
        customization.entities,
      );
      const decidedEntity = decision?.entityId
        ? entityById.get(decision.entityId) ?? null
        : null;
      const canonicalEntity = decidedEntity ?? matchedEntity;
      const proposedEvent = getProposedEvent(mention);
      const status = resolveProposalStatus(decision, canonicalEntity);

      return [
        {
          canonicalActivityId:
            status === "accepted" || status === "corrected"
              ? canonicalEntity?.id ?? null
              : null,
          canonicalEvent: decision?.correctedEvent ?? proposedEvent,
          canonicalKind: canonicalEntity?.kind ?? activity.kind,
          canonicalLabel: canonicalEntity?.label ?? activity.label,
          confidence: getProposalConfidence(mention),
          id: proposalId,
          machineActivityId: activity.id,
          proposedEvent,
          proposedKind: activity.kind,
          proposedLabel: activity.label,
          sourceEntryDate: mention.entryDate,
          sourceEntryId: mention.entryId,
          sourceExcerpt: createSourceExcerpt(mention.text),
          status,
        } satisfies ExtractionProposal,
      ];
    }),
  );

  return proposals.sort(compareProposals);
}

export function buildCanonicalActivityIndex({
  customization,
  entries,
  machineIndex,
  proposals,
}: {
  customization: ResultsCustomization;
  entries: EntryView[];
  machineIndex: ActivityIndex;
  proposals: ExtractionProposal[];
}): ActivityIndex {
  if (machineIndex.isDemo) return machineIndex;

  const machineActivityById = new Map(
    machineIndex.activities.map((activity) => [activity.id, activity]),
  );
  const entryById = new Map(entries.map((entry) => [entry.id, entry]));
  const activities = customization.entities
    .flatMap((entity) => {
      const mentionByEntryId = new Map<string, ActivityMention>();

      const monitoredTags = new Set(
        (entity.monitoringTags ?? []).map(normalizeTag).filter(Boolean),
      );
      if (monitoredTags.size > 0) {
        for (const entry of entries) {
          if (!entry.analysisEnabled || entry.textUnavailable) continue;
          const matchedTag = entry.tags.find((tag) =>
            monitoredTags.has(normalizeTag(tag)),
          );
          if (!matchedTag) continue;

          mentionByEntryId.set(
            entry.id,
            createTagMention(entry, entity),
          );
        }
      }

      for (const proposal of proposals) {
        if (
          proposal.canonicalActivityId !== entity.id ||
          (proposal.status !== "accepted" && proposal.status !== "corrected")
        ) {
          continue;
        }

        const machineActivity = machineActivityById.get(
          proposal.machineActivityId,
        );
        const mention = machineActivity?.mentions.find(
          (candidate) => candidate.entryId === proposal.sourceEntryId,
        );
        if (!mention) continue;

        mentionByEntryId.set(
          proposal.sourceEntryId,
          applyCanonicalProposal(mention, proposal, entity),
        );
      }

      for (const link of customization.manualLinks) {
        if (link.entityId !== entity.id) continue;
        const entry = entryById.get(link.entryId);
        if (!entry || !entry.analysisEnabled || entry.textUnavailable) continue;
        mentionByEntryId.set(
          entry.id,
          createManualMention(entry, entity, link.event),
        );
      }

      const mentions = [...mentionByEntryId.values()].sort((left, right) =>
        right.entryDate.localeCompare(left.entryDate),
      );
      if (mentions.length === 0) return [];

      return [
        createActivityGroupFromMentions({
          id: entity.id,
          kind: entity.kind,
          label: entity.label,
          latestEntryDate: mentions[0].entryDate,
          mentions,
        }),
      ];
    })
    .sort(compareCanonicalActivities);

  return { activities, isDemo: false };
}

export function createExtractionProposalId(
  entryId: string,
  machineActivityId: string,
  duplicateIndex = 0,
) {
  return `extraction:${encodeURIComponent(entryId)}:${encodeURIComponent(
    machineActivityId,
  )}:${duplicateIndex}`;
}

export function createResultsEntityId(
  label: string,
  existingEntities: ResultsEntity[],
) {
  const base = normalizeActivityLabel(cleanActivityLabel(label)) || "work-item";
  const existingIds = new Set(existingEntities.map((entity) => entity.id));
  if (!existingIds.has(base)) return base;

  let suffix = 2;
  while (existingIds.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export function normalizeResultsCustomization(
  value: unknown,
): ResultsCustomization {
  if (!isRecord(value) || value.version !== 1) {
    return EMPTY_RESULTS_CUSTOMIZATION;
  }

  return {
    version: 1,
    entities: Array.isArray(value.entities)
      ? value.entities.flatMap(normalizeResultsEntity)
      : [],
    decisions: Array.isArray(value.decisions)
      ? value.decisions.filter(isProposalDecision)
      : [],
    manualLinks: Array.isArray(value.manualLinks)
      ? value.manualLinks.filter(isManualResultLink)
      : [],
  };
}

function findEntityForMachineActivity(
  activity: ActivityGroup,
  entities: ResultsEntity[],
) {
  const machineIds = new Set([
    normalizeActivityLabel(activity.id),
    normalizeActivityLabel(activity.label),
  ]);

  return (
    entities.find((entity) => {
      const entityAliases = [entity.id, entity.label, ...entity.aliases].map(
        normalizeActivityLabel,
      );
      return entityAliases.some((alias) => machineIds.has(alias));
    }) ?? null
  );
}

function resolveProposalStatus(
  decision: ProposalDecision | null,
  entity: ResultsEntity | null,
): ExtractionProposalStatus {
  if (decision?.status === "rejected") return "rejected";
  if (decision && entity) return decision.status;
  return entity ? "accepted" : "pending";
}

function getProposedEvent(mention: ActivityMention): ActivityContextEvent {
  if (mention.context?.event) return mention.context.event;
  if (mention.marker === "result") return "result";
  if (mention.marker === "blocker") return "blocked";
  return "unknown";
}

function getProposalConfidence(mention: ActivityMention): ConfidenceLevel {
  if (mention.context?.confidence) return mention.context.confidence;
  if (mention.sources.includes("activity")) return "medium";
  return "low";
}

function applyCanonicalProposal(
  mention: ActivityMention,
  proposal: ExtractionProposal,
  entity: ResultsEntity,
): ActivityMention {
  const eventWasCorrected = proposal.status === "corrected";
  const context = mention.context
    ? {
        ...mention.context,
        activity: entity.label,
        confidence: eventWasCorrected ? "high" : mention.context.confidence,
        event: proposal.canonicalEvent,
        kind: entity.kind,
      }
    : createCanonicalContext(entity, proposal.canonicalEvent, proposal.confidence);

  return {
    ...mention,
    context,
    marker: eventToMarker(proposal.canonicalEvent),
  };
}

function createManualMention(
  entry: EntryView,
  entity: ResultsEntity,
  event: ActivityContextEvent,
): ActivityMention {
  return {
    context: createCanonicalContext(entity, event, "high"),
    debugSignals: {
      fatigue: entry.signals.fatigue,
      focus: entry.signals.focus,
      load: entry.signals.load,
    },
    entryDate: entry.entryDate,
    entryId: entry.id,
    marker: eventToMarker(event),
    sources: ["text"],
    text: entry.text,
  };
}

function createTagMention(
  entry: EntryView,
  entity: ResultsEntity,
): ActivityMention {
  return {
    ...createManualMention(entry, entity, "unknown"),
    sources: ["tag"],
  };
}

function createCanonicalContext(
  entity: ResultsEntity,
  event: ActivityContextEvent,
  confidence: ConfidenceLevel,
): ActivityContext {
  return {
    activity: entity.label,
    agency: "unknown",
    blockers: [],
    confidence,
    effect: "unclear",
    event,
    kind: entity.kind,
    next_step: "not_mentioned",
    outcome:
      event === "completed" ? "achieved" : event === "result" ? "partial" : "unknown",
    strategy: "unknown",
  };
}

function eventToMarker(event: ActivityContextEvent): ActivityMentionMarker {
  if (event === "blocked") return "blocker";
  if (event === "result" || event === "completed") return "result";
  return null;
}

function createSourceExcerpt(text: string) {
  const normalized = text.replace(/\s+/gu, " ").trim();
  return normalized.length > 180 ? `${normalized.slice(0, 177)}…` : normalized;
}

function compareProposals(left: ExtractionProposal, right: ExtractionProposal) {
  const dateOrder = right.sourceEntryDate.localeCompare(left.sourceEntryDate);
  if (dateOrder !== 0) return dateOrder;
  return left.proposedLabel.localeCompare(right.proposedLabel);
}

function compareCanonicalActivities(left: ActivityGroup, right: ActivityGroup) {
  const mentionOrder = right.mentions.length - left.mentions.length;
  if (mentionOrder !== 0) return mentionOrder;
  const dateOrder = right.latestEntryDate.localeCompare(left.latestEntryDate);
  if (dateOrder !== 0) return dateOrder;
  return left.label.localeCompare(right.label);
}

function normalizeResultsEntity(value: unknown): ResultsEntity[] {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.label !== "string" ||
    (value.kind !== "task" && value.kind !== "activity") ||
    !Array.isArray(value.aliases) ||
    !value.aliases.every((alias) => typeof alias === "string") ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) {
    return [];
  }

  return [
    {
      aliases: value.aliases,
      createdAt: value.createdAt,
      id: value.id,
      kind: value.kind,
      label: value.label,
      direction: cleanDirection(value.direction),
      monitoringTags: Array.isArray(value.monitoringTags)
        ? [...new Map(
            value.monitoringTags
              .filter((tag): tag is string => typeof tag === "string")
              .map((tag) => tag.replace(/^#+/u, "").trim())
              .filter(Boolean)
              .map((tag) => [normalizeTag(tag), tag] as const),
          ).values()]
        : [],
      trackingMode: value.trackingMode === "reduce" ? "reduce" : "standard",
      updatedAt: value.updatedAt,
    },
  ];
}

function cleanDirection(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = cleanActivityLabel(value);
  return cleaned || null;
}

function isProposalDecision(value: unknown): value is ProposalDecision {
  return (
    isRecord(value) &&
    typeof value.proposalId === "string" &&
    (value.status === "accepted" ||
      value.status === "corrected" ||
      value.status === "rejected") &&
    (value.entityId === null || typeof value.entityId === "string") &&
    (value.correctedEvent === null || typeof value.correctedEvent === "string") &&
    typeof value.updatedAt === "string"
  );
}

function isManualResultLink(value: unknown): value is ManualResultLink {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.entityId === "string" &&
    typeof value.entryId === "string" &&
    typeof value.event === "string" &&
    typeof value.createdAt === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
