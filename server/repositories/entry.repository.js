export async function createEntry(db, entry) {
  const query = `
    INSERT INTO entries (
      client_entry_id,
      entry_date,
      created_at,
      updated_at,
      status,
      tags,
      source_text_hash
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    entry.client_entry_id,
    entry.entry_date,
    entry.created_at,
    entry.updated_at,
    entry.status,
    JSON.stringify(entry.tags),
    entry.source_text_hash,
  ];

  const result = await db.run(query, params);

  return result.lastID;
}

export async function listEntries(db) {
  const rows = await db.all(`
    SELECT
      e.id,
      e.client_entry_id,
      e.entry_date,
      e.created_at,
      e.updated_at,
      e.status,
      e.tags,
      e.source_text_hash,
      s.id AS signal_id,
      s.topics,
      s.activities,
      s.markers,
      s.load,
      s.fatigue,
      s.focus,
      s.signal_quality,
      s.schema_version,
      s.prompt_version,
      s.provider,
      s.model,
      s.error_code,
      s.created_at AS signal_created_at
    FROM entries e
    LEFT JOIN signals s
      ON s.id = (
        SELECT latest.id
        FROM signals latest
        WHERE latest.entry_id = e.id
        ORDER BY latest.created_at DESC, latest.id DESC
        LIMIT 1
      )
    ORDER BY e.entry_date DESC, e.created_at DESC
  `);

  return rows.map(mapEntryRow);
}

export async function getEntryById(db, id) {
  const row = await db.get(
    `
    SELECT
      e.id,
      e.client_entry_id,
      e.entry_date,
      e.created_at,
      e.updated_at,
      e.status,
      e.tags,
      e.source_text_hash,
      s.id AS signal_id,
      s.topics,
      s.activities,
      s.markers,
      s.load,
      s.fatigue,
      s.focus,
      s.signal_quality,
      s.schema_version,
      s.prompt_version,
      s.provider,
      s.model,
      s.error_code,
      s.created_at AS signal_created_at
    FROM entries e
    LEFT JOIN signals s
      ON s.id = (
        SELECT latest.id
        FROM signals latest
        WHERE latest.entry_id = e.id
        ORDER BY latest.created_at DESC, latest.id DESC
        LIMIT 1
      )
    WHERE e.id = ? OR e.client_entry_id = ?
    `,
    [id, id]
  );

  if (!row) return null;

  return mapEntryRow(row);
}

export async function updateEntry(db, entryId, entry) {
  const result = await db.run(
    `
    UPDATE entries
    SET entry_date = ?,
        updated_at = ?,
        status = ?,
        tags = ?,
        source_text_hash = ?
    WHERE id = ?
    `,
    [
      entry.entry_date,
      entry.updated_at,
      entry.status,
      JSON.stringify(entry.tags),
      entry.source_text_hash,
      entryId,
    ],
  );

  return result.changes > 0;
}

export async function deleteEntry(db, entryId) {
  await db.run("DELETE FROM signal_overrides WHERE entry_id = ?", [entryId]);
  await db.run("DELETE FROM signals WHERE entry_id = ?", [entryId]);

  const result = await db.run("DELETE FROM entries WHERE id = ?", [entryId]);

  return result.changes > 0;
}

export async function updateEntryStatus(db, entryId, status) {
  await db.run(
    `
    UPDATE entries
    SET status = ?,
        updated_at = ?
    WHERE id = ?
    `,
    [status, new Date().toISOString(), entryId]
  );
}

export async function markEntryFailed(db, entryId) {
  await updateEntryStatus(db, entryId, "failed");
}

function mapEntryRow(row) {
  const signal = row.signal_id
    ? {
        topics: JSON.parse(row.topics || "[]"),
        activities: JSON.parse(row.activities || "[]"),
        markers: JSON.parse(row.markers || "[]"),
        load: row.load,
        fatigue: row.fatigue,
        focus: row.focus,
        signal_quality: row.signal_quality,
      }
    : null;

  const metadata = row.signal_id
    ? {
        schema_version: row.schema_version,
        prompt_version: row.prompt_version,
        provider: row.provider ?? "ollama",
        model: row.model,
        error_code: row.error_code ?? null,
        created_at: row.signal_created_at,
      }
    : null;

  return {
    id: row.id,
    client_entry_id: row.client_entry_id,
    entry_date: row.entry_date,
    created_at: row.created_at,
    updated_at: row.updated_at,
    status: row.status,
    tags: JSON.parse(row.tags || "[]"),
    source_text_hash: row.source_text_hash,
    signal,
    metadata,
  };
}
