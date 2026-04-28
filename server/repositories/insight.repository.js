export async function countValidDays(db, { from, to }) {
  const row = await db.get(
    `
    SELECT COUNT(DISTINCT e.entry_date) AS count
    FROM entries e
    JOIN effective_signals es
      ON es.entry_id = e.id
    WHERE e.entry_date BETWEEN ? AND ?
      AND es.signal_quality = 'valid'
    `,
    [from, to],
  );

  return row?.count ?? 0;
}

export async function getTopTopic(db, { from, to }) {
  const rows = await db.all(
    `
    SELECT es.topics
    FROM entries e
    JOIN effective_signals es
      ON es.entry_id = e.id
    WHERE e.entry_date BETWEEN ? AND ?
      AND es.signal_quality = 'valid'
    `,
    [from, to],
  );

  const counts = new Map();

  for (const row of rows) {
    const topics = JSON.parse(row.topics || "[]");
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

export async function getSnapshot(db, { layer, periodStart, periodEnd }) {
  return db.get(
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

export async function getLatestVisibleSnapshot(db, { layer, today }) {
  return db.get(
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
    WHERE layer = ?
      AND expires_at >= ?
      AND deleted_at IS NULL
    ORDER BY period_end DESC, generated_at DESC, id DESC
    LIMIT 1
    `,
    [layer, today],
  );
}

export async function listVisibleSnapshots(db) {
  return db.all(
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

export async function softDeleteSnapshot(db, id) {
  const result = await db.run(
    `
    UPDATE insight_snapshots
    SET deleted_at = ?
    WHERE id = ?
      AND deleted_at IS NULL
    `,
    [new Date().toISOString(), id],
  );

  return result.changes > 0;
}

export async function upsertSnapshot(
  db,
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
  },
) {
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
