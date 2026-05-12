import type { InsightLayer, InsightSnapshot } from "../core/types.js";
import type { AthenaDb } from "../db/sqlite.js";

type DateRange = {
  from: string;
  to: string;
};

type SnapshotLookup = {
  layer: InsightLayer;
  periodStart: string;
  periodEnd: string;
};

type LatestSnapshotLookup = {
  layer: InsightLayer;
  today: string;
};

type InsightSnapshotRow = InsightSnapshot & {
  deleted_at?: string | null;
};

type UpsertSnapshotParams = SnapshotLookup & {
  text: string;
  topic: string | null;
  generatedAt: string;
  expiresAt: string;
  schemaVersion: string;
  promptVersion: string;
};

type CountRow = {
  count: number;
};

type TopicRow = {
  topics: string | null;
};

export async function countValidDays(
  db: AthenaDb,
  { from, to }: DateRange,
): Promise<number> {
  const row = await db.get<CountRow>(
    `
    SELECT COUNT(DISTINCT e.entry_date) AS count
    FROM entries e
    JOIN signals s
      ON s.id = (
        SELECT latest.id
        FROM signals latest
        WHERE latest.entry_id = e.id
        ORDER BY latest.created_at DESC, latest.id DESC
        LIMIT 1
      )
    WHERE e.entry_date BETWEEN ? AND ?
      AND s.signal_quality = 'valid'
    `,
    [from, to],
  );

  return row?.count ?? 0;
}

export async function getTopTopic(
  db: AthenaDb,
  { from, to }: DateRange,
): Promise<string | null> {
  const rows = await db.all<TopicRow[]>(
    `
    SELECT s.topics
    FROM entries e
    JOIN signals s
      ON s.id = (
        SELECT latest.id
        FROM signals latest
        WHERE latest.entry_id = e.id
        ORDER BY latest.created_at DESC, latest.id DESC
        LIMIT 1
      )
    WHERE e.entry_date BETWEEN ? AND ?
      AND s.signal_quality = 'valid'
    `,
    [from, to],
  );

  const counts = new Map<string, number>();

  for (const row of rows) {
    const topics = parseStringArray(row.topics);
    const uniqueTopics = new Set(topics);

    for (const topic of uniqueTopics) {
      counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .sort(([leftName, leftCount], [rightName, rightCount]) =>
      rightCount - leftCount || leftName.localeCompare(rightName),
    )
    .at(0)?.[0] ?? null;
}

export async function getSnapshot(
  db: AthenaDb,
  { layer, periodStart, periodEnd }: SnapshotLookup,
): Promise<InsightSnapshotRow | undefined> {
  return db.get<InsightSnapshotRow>(
    `
    SELECT
      id,
      layer,
      period_start,
      period_end,
      topic,
      text,
      generated_at,
      expires_at,
      deleted_at
    FROM insight_snapshots
    WHERE layer = ?
      AND period_start = ?
      AND period_end = ?
    LIMIT 1
    `,
    [layer, periodStart, periodEnd],
  );
}

export async function getLatestVisibleSnapshot(
  db: AthenaDb,
  { layer, today }: LatestSnapshotLookup,
): Promise<InsightSnapshot | undefined> {
  return db.get<InsightSnapshot>(
    `
    SELECT
      id,
      layer,
      period_start,
      period_end,
      topic,
      text,
      generated_at,
      expires_at
    FROM insight_snapshots INDEXED BY idx_insight_snapshots_visible_latest
    WHERE layer = ?
      AND expires_at >= ?
      AND deleted_at IS NULL
    ORDER BY period_end DESC, generated_at DESC, id DESC
    LIMIT 1
    `,
    [layer, today],
  );
}

export async function listVisibleSnapshots(
  db: AthenaDb,
): Promise<InsightSnapshot[]> {
  return db.all<InsightSnapshot[]>(
    `
    SELECT
      id,
      layer,
      period_start,
      period_end,
      topic,
      text,
      generated_at,
      expires_at
    FROM insight_snapshots
    WHERE deleted_at IS NULL
    ORDER BY
      period_end DESC,
      CASE layer
        WHEN 'day' THEN 0
        WHEN 'week' THEN 1
        ELSE 2
      END ASC,
      generated_at DESC,
      id DESC
    `,
  );
}

export async function softDeleteSnapshot(
  db: AthenaDb,
  id: number,
): Promise<boolean> {
  const result = await db.run(
    `
    UPDATE insight_snapshots
    SET deleted_at = ?
    WHERE id = ?
      AND deleted_at IS NULL
    `,
    [new Date().toISOString(), id],
  );

  return (result.changes ?? 0) > 0;
}

export async function upsertSnapshot(
  db: AthenaDb,
  {
    layer,
    periodStart,
    periodEnd,
    text,
    topic,
    generatedAt,
    expiresAt,
    schemaVersion,
    promptVersion,
  }: UpsertSnapshotParams,
): Promise<InsightSnapshotRow | null | undefined> {
  const existing = await getSnapshot(db, { layer, periodStart, periodEnd });

  if (existing?.deleted_at) {
    return null;
  }

  if (existing) {
    await db.run(
      `
      UPDATE insight_snapshots
      SET
        text = ?,
        topic = ?,
        generated_at = ?,
        expires_at = ?,
        schema_version = ?,
        prompt_version = ?
      WHERE id = ?
      `,
      [
        text,
        topic,
        generatedAt,
        expiresAt,
        schemaVersion,
        promptVersion,
        existing.id,
      ],
    );
  } else {
    await db.run(
      `
      INSERT INTO insight_snapshots (
        layer,
        period_start,
        period_end,
        topic,
        text,
        generated_at,
        expires_at,
        schema_version,
        prompt_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        layer,
        periodStart,
        periodEnd,
        topic,
        text,
        generatedAt,
        expiresAt,
        schemaVersion,
        promptVersion,
      ],
    );
  }

  return getSnapshot(db, { layer, periodStart, periodEnd });
}

function parseStringArray(value: string | null): string[] {
  const parsed: unknown = JSON.parse(value || "[]");
  return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
}
