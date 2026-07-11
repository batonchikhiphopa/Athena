/**
 * Snapshot application service. It enforces evidence-day sufficiency, asks the
 * deterministic analytics/Insight V3 layers for content, and persists bounded
 * day/week/month history with retention rules.
 */
import {
  ACTIVE_PROMPT_VERSION,
  ACTIVE_SCHEMA_VERSION,
} from "../config/versions.js";
import type { InsightLayer, InsightSnapshot } from "../core/types.js";
import { withDbWriteTransaction, type AthenaDb } from "../db/sqlite.js";
import {
  countInsightEvidenceDays,
  listVisibleSnapshots,
  softDeleteSnapshot,
  getLatestVisibleSnapshot,
  upsertSnapshot,
} from "../repositories/insight.repository.js";
import { buildAnalyticsV2Summary } from "./analytics-v2.service.js";
import {
  buildInsightV3Input,
  composeInsightV3Text,
  insightV3Topic,
} from "./insight-v3.service.js";

type LayerConfig = {
  layer: InsightLayer;
  days: number;
  minValidDays: number;
  retainDays: number;
};

type PublicInsightSnapshot = InsightSnapshot;

const LAYERS: LayerConfig[] = [
  {
    layer: "day",
    days: 1,
    minValidDays: 1,
    retainDays: 0,
  },
  {
    layer: "week",
    days: 7,
    minValidDays: 3,
    retainDays: 14,
  },
  {
    layer: "month",
    days: 30,
    minValidDays: 14,
    retainDays: 45,
  },
];

export async function getCurrentInsightSnapshots(
  db: AthenaDb,
  { today }: { today?: string },
): Promise<PublicInsightSnapshot[]> {
  const safeToday = isDateOnly(today) ? today : formatDateOnly(new Date());
  const snapshots: PublicInsightSnapshot[] = [];

  for (const config of LAYERS) {
    const periodEnd =
      config.layer === "day" ? addDays(safeToday, -1) : safeToday;
    const periodStart = addDays(periodEnd, -(config.days - 1));
    const evidenceDays = await countInsightEvidenceDays(db, {
      from: periodStart,
      to: periodEnd,
    });

    if (evidenceDays >= config.minValidDays) {
      const snapshot = await createOrRefreshSnapshot(db, {
        ...config,
        periodStart,
        periodEnd,
        today: safeToday,
      });

      if (snapshot) {
        snapshots.push(toPublicSnapshot(snapshot));
      }
      continue;
    }

    if (config.layer === "day") continue;

    const retained = await getLatestVisibleSnapshot(db, {
      layer: config.layer,
      today: safeToday,
    });

    if (retained) {
      snapshots.push(toPublicSnapshot(retained));
    }
  }

  return snapshots;
}

export async function listInsightSnapshots(
  db: AthenaDb,
): Promise<PublicInsightSnapshot[]> {
  const snapshots = await listVisibleSnapshots(db);
  return snapshots.map(toPublicSnapshot);
}

export async function deleteInsightSnapshot(
  db: AthenaDb,
  id: number | string,
): Promise<boolean> {
  if (!Number.isInteger(Number(id))) return false;

  return withDbWriteTransaction(db, (tx) => softDeleteSnapshot(tx, Number(id)));
}

async function createOrRefreshSnapshot(
  db: AthenaDb,
  {
    layer,
    periodStart,
    periodEnd,
    retainDays,
    today,
  }: LayerConfig & {
    periodStart: string;
    periodEnd: string;
    today: string;
  },
): Promise<InsightSnapshot | null | undefined> {
  const analytics = await buildAnalyticsV2Summary(db, {
    from: periodStart,
    kind: layer,
    to: periodEnd,
  });
  if (!analytics.summary) return null;

  const insightInput = buildInsightV3Input(analytics.summary, layer);
  const text = composeInsightV3Text(insightInput);
  if (!text) return null;

  const topic = insightV3Topic(insightInput);
  const generatedAt = new Date().toISOString();
  const expiresAt =
    layer === "day" ? today : addDays(periodEnd, retainDays);

  return withDbWriteTransaction(db, (tx) =>
    upsertSnapshot(tx, {
      layer,
      periodStart,
      periodEnd,
      topic,
      text,
      generatedAt,
      expiresAt,
      schemaVersion: ACTIVE_SCHEMA_VERSION,
      promptVersion: ACTIVE_PROMPT_VERSION,
    }),
  );
}

function toPublicSnapshot(snapshot: InsightSnapshot): PublicInsightSnapshot {
  return {
    id: snapshot.id,
    layer: snapshot.layer,
    period_start: snapshot.period_start,
    period_end: snapshot.period_end,
    topic: snapshot.topic ?? null,
    text: snapshot.text,
    generated_at: snapshot.generated_at,
    expires_at: snapshot.expires_at,
  };
}

function isDateOnly(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function addDays(dateOnly: string, days: number): string {
  const [year, month, day] = dateOnly.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);

  return formatDateOnly(date);
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}
